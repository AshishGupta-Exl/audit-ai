"""Rule-based audit engine for audit-ai.

The engine scans arbitrary text (documents, source code, configuration, logs)
for common risk signals: leaked secrets, personally identifiable information
(PII), and risky/compliance-sensitive language. It is fully self-contained and
requires no external services, which keeps local development and CI hermetic.

Optional LLM enrichment can be layered on top via ``enrich_with_llm`` when an
API key is configured, but the core audit never depends on it.
"""

from __future__ import annotations

import math
import re
from dataclasses import asdict, dataclass, field
from enum import Enum


class Severity(str, Enum):
    """Ordered severity levels. Higher weight means higher risk."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def weight(self) -> int:
        return _SEVERITY_WEIGHTS[self]


_SEVERITY_WEIGHTS: dict[Severity, int] = {
    Severity.LOW: 1,
    Severity.MEDIUM: 3,
    Severity.HIGH: 7,
    Severity.CRITICAL: 12,
}


@dataclass(frozen=True)
class Rule:
    """A single detection rule."""

    id: str
    title: str
    category: str
    severity: Severity
    pattern: re.Pattern[str]
    recommendation: str

    def as_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "severity": self.severity.value,
            "recommendation": self.recommendation,
        }


@dataclass
class Finding:
    """A single rule match within the audited content."""

    rule_id: str
    title: str
    category: str
    severity: str
    line: int
    column: int
    snippet: str
    recommendation: str

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass
class AuditResult:
    """The full result of an audit run."""

    filename: str | None
    risk_score: int
    risk_level: str
    summary: str
    counts: dict[str, int]
    findings: list[Finding] = field(default_factory=list)
    llm_summary: str | None = None

    def as_dict(self) -> dict:
        data = asdict(self)
        return data


def _compile(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE)


# The rule set. Kept intentionally readable so new rules are easy to add.
RULES: list[Rule] = [
    Rule(
        id="secret.aws_access_key",
        title="AWS access key ID",
        category="secret",
        severity=Severity.CRITICAL,
        pattern=re.compile(r"\b(AKIA|ASIA)[0-9A-Z]{16}\b"),
        recommendation="Revoke the key and load credentials from a secret manager instead.",
    ),
    Rule(
        id="secret.private_key",
        title="Private key block",
        category="secret",
        severity=Severity.CRITICAL,
        pattern=_compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----"),
        recommendation="Remove the private key from source and rotate it immediately.",
    ),
    Rule(
        id="secret.generic_api_key",
        title="Hard-coded API key or token",
        category="secret",
        severity=Severity.HIGH,
        pattern=_compile(
            r"\b(?:api[_-]?key|secret|token|passwd|password)\b\s*[:=]\s*['\"][^'\"]{8,}['\"]"
        ),
        recommendation="Move the value to an environment variable or secret store.",
    ),
    Rule(
        id="pii.email",
        title="Email address",
        category="pii",
        severity=Severity.LOW,
        pattern=_compile(r"\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b"),
        recommendation="Confirm consent to store the address and mask it where possible.",
    ),
    Rule(
        id="pii.credit_card",
        title="Possible credit card number",
        category="pii",
        severity=Severity.HIGH,
        pattern=re.compile(r"\b(?:\d[ -]*?){13,16}\b"),
        recommendation="Do not store raw PANs. Tokenize or use a PCI-compliant vault.",
    ),
    Rule(
        id="pii.ssn",
        title="US Social Security Number",
        category="pii",
        severity=Severity.HIGH,
        pattern=re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        recommendation="Encrypt SSNs at rest and restrict access on a need-to-know basis.",
    ),
    Rule(
        id="compliance.guarantee",
        title="Absolute guarantee language",
        category="compliance",
        severity=Severity.MEDIUM,
        pattern=_compile(r"\b(guarantee[sd]?|100%\s+secure|risk[- ]?free|never\s+fails?)\b"),
        recommendation="Avoid absolute claims; use qualified language reviewed by legal.",
    ),
    Rule(
        id="compliance.confidential",
        title="Confidential data marker",
        category="compliance",
        severity=Severity.MEDIUM,
        pattern=_compile(r"\b(confidential|do not distribute|internal only|proprietary)\b"),
        recommendation="Ensure the document handling matches its confidentiality classification.",
    ),
    Rule(
        id="security.insecure_url",
        title="Insecure HTTP URL",
        category="security",
        severity=Severity.LOW,
        pattern=_compile(r"http://[^\s'\"]+"),
        recommendation="Use HTTPS to protect data in transit.",
    ),
]


# The credit-card regex is broad; validate candidates with the Luhn checksum to
# cut down on false positives from ordinary long digit strings.
def _luhn_valid(number: str) -> bool:
    digits = [int(c) for c in re.sub(r"\D", "", number)]
    if len(digits) < 13:
        return False
    checksum = 0
    parity = len(digits) % 2
    for i, digit in enumerate(digits):
        if i % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def _risk_level(findings: list[Finding]) -> str:
    """Risk level reflects the single worst finding present."""

    max_weight = max((Severity(f.severity).weight for f in findings), default=0)
    if max_weight >= Severity.CRITICAL.weight:
        return "critical"
    if max_weight >= Severity.HIGH.weight:
        return "high"
    if max_weight >= Severity.MEDIUM.weight:
        return "medium"
    if max_weight > 0:
        return "low"
    return "clean"


def audit_text(content: str, filename: str | None = None) -> AuditResult:
    """Run all rules against ``content`` and return an :class:`AuditResult`."""

    findings: list[Finding] = []
    lines = content.splitlines() or [""]

    for line_no, line in enumerate(lines, start=1):
        for rule in RULES:
            for match in rule.pattern.finditer(line):
                matched = match.group(0)
                if rule.id == "pii.credit_card" and not _luhn_valid(matched):
                    continue
                findings.append(
                    Finding(
                        rule_id=rule.id,
                        title=rule.title,
                        category=rule.category,
                        severity=rule.severity.value,
                        line=line_no,
                        column=match.start() + 1,
                        snippet=_redact(matched, rule.category),
                        recommendation=rule.recommendation,
                    )
                )

    raw_score = sum(Severity(f.severity).weight for f in findings)
    # Compress the score onto a 0-100 scale so the UI stays readable even for
    # very large inputs, while still being monotonic in the raw risk.
    risk_score = min(100, round(100 * (1 - math.exp(-raw_score / 30))))

    counts: dict[str, int] = {}
    for f in findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1

    summary = _build_summary(findings, counts)

    return AuditResult(
        filename=filename,
        risk_score=risk_score,
        risk_level=_risk_level(findings),
        summary=summary,
        counts=counts,
        findings=findings,
    )


def _redact(value: str, category: str) -> str:
    """Mask the middle of sensitive values so results are safe to display."""

    if category not in {"secret", "pii"}:
        return value
    stripped = value.strip()
    if len(stripped) <= 8:
        return stripped[0] + "*" * (len(stripped) - 1) if stripped else stripped
    return f"{stripped[:4]}{'*' * (len(stripped) - 8)}{stripped[-4:]}"


def _build_summary(findings: list[Finding], counts: dict[str, int]) -> str:
    if not findings:
        return "No risk signals detected. The content looks clean against the current rule set."
    parts = [f"{count} {severity}" for severity, count in sorted(counts.items())]
    return f"Detected {len(findings)} issue(s): " + ", ".join(parts) + "."


def enrich_with_llm(result: AuditResult, content: str) -> AuditResult:
    """Optionally add an LLM-generated narrative summary.

    This is a no-op unless ``OPENAI_API_KEY`` is configured, keeping the audit
    fully functional offline. The import is deferred so the dependency is only
    required when the feature is actually used.
    """

    import os

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return result

    try:  # pragma: no cover - exercised only when a real key is present
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        prompt = (
            "You are a compliance auditor. Summarize the following findings in "
            "two sentences and suggest the single most important next step.\n\n"
            f"Findings: {[f.as_dict() for f in result.findings]}"
        )
        response = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        result.llm_summary = response.choices[0].message.content
    except Exception as exc:  # pragma: no cover - defensive
        result.llm_summary = f"LLM enrichment unavailable: {exc}"
    return result


def list_rules() -> list[dict]:
    """Return the active rule set as serializable dictionaries."""

    return [rule.as_dict() for rule in RULES]
