from app.audit_engine import audit_text, list_rules


def test_clean_content_has_no_findings():
    result = audit_text("The quick brown fox jumps over the lazy dog.")
    assert result.findings == []
    assert result.risk_level == "clean"
    assert result.risk_score == 0


def test_detects_aws_access_key():
    result = audit_text("aws_key = AKIAIOSFODNN7EXAMPLE")
    rule_ids = {f.rule_id for f in result.findings}
    assert "secret.aws_access_key" in rule_ids
    assert result.risk_level in {"high", "critical"}


def test_detects_private_key_block():
    content = "-----BEGIN RSA PRIVATE KEY-----\nMIIabc\n-----END RSA PRIVATE KEY-----"
    result = audit_text(content)
    assert any(f.rule_id == "secret.private_key" for f in result.findings)


def test_detects_email_and_redacts():
    result = audit_text("Contact: alice.smith@example.com")
    email_findings = [f for f in result.findings if f.rule_id == "pii.email"]
    assert email_findings
    # The snippet must be masked, not the raw address.
    assert "@" in email_findings[0].snippet or "*" in email_findings[0].snippet
    assert email_findings[0].snippet != "alice.smith@example.com"


def test_credit_card_luhn_filtering():
    valid = audit_text("card 4111 1111 1111 1111")
    assert any(f.rule_id == "pii.credit_card" for f in valid.findings)

    invalid = audit_text("ticket number 1234 5678 9012 3456 0000")
    assert not any(f.rule_id == "pii.credit_card" for f in invalid.findings)


def test_line_and_column_reported():
    content = "line one is fine\nsecret = 'supersecretvalue123'"
    result = audit_text(content)
    secret = next(f for f in result.findings if f.rule_id == "secret.generic_api_key")
    assert secret.line == 2
    assert secret.column >= 1


def test_risk_score_is_bounded():
    content = "\n".join(["AKIAIOSFODNN7EXAMPLE"] * 200)
    result = audit_text(content)
    assert 0 <= result.risk_score <= 100


def test_list_rules_serializable():
    rules = list_rules()
    assert rules
    assert all({"id", "title", "severity", "category"} <= set(r) for r in rules)
