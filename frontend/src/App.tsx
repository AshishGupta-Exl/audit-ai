import { useEffect, useMemo, useState } from "react";
import { getHealth, runAudit } from "./api";
import { SAMPLES } from "./samples";
import type { AuditResult, Finding, RiskLevel } from "./types";

const RISK_COPY: Record<RiskLevel, string> = {
  clean: "No risk signals detected",
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  critical: "Critical risk",
};

function ScoreGauge({ result }: { result: AuditResult }) {
  const { risk_score, risk_level } = result;
  return (
    <div className={`gauge gauge--${risk_level}`}>
      <div className="gauge__score">{risk_score}</div>
      <div className="gauge__label">{RISK_COPY[risk_level]}</div>
      <div className="gauge__sub">risk score / 100</div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <li className={`finding finding--${finding.severity}`}>
      <div className="finding__head">
        <span className={`badge badge--${finding.severity}`}>{finding.severity}</span>
        <span className="finding__title">{finding.title}</span>
        <span className="finding__loc">
          line {finding.line}:{finding.column}
        </span>
      </div>
      <code className="finding__snippet">{finding.snippet}</code>
      <p className="finding__rec">{finding.recommendation}</p>
      <span className="finding__rule">{finding.rule_id}</span>
    </li>
  );
}

export default function App() {
  const [content, setContent] = useState(SAMPLES[0].content);
  const [filename, setFilename] = useState(SAMPLES[0].filename);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then((h) => setVersion(h.version))
      .catch(() => setVersion(null));
  }, []);

  const sortedFindings = useMemo(() => {
    if (!result) return [];
    const order = { critical: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
    return [...result.findings].sort(
      (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9),
    );
  }, [result]);

  async function handleAudit() {
    setLoading(true);
    setError(null);
    try {
      const res = await runAudit(content, filename);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function loadSample(index: number) {
    setContent(SAMPLES[index].content);
    setFilename(SAMPLES[index].filename);
    setResult(null);
    setError(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand__mark">◆</span>
          <div>
            <h1>audit-ai</h1>
            <p>AI-assisted risk &amp; compliance auditing</p>
          </div>
        </div>
        <span className={`status ${version ? "status--ok" : "status--down"}`}>
          {version ? `API v${version}` : "API offline"}
        </span>
      </header>

      <main className="grid">
        <section className="panel">
          <div className="panel__head">
            <h2>Content to audit</h2>
            <input
              className="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="filename (optional)"
            />
          </div>

          <div className="samples">
            {SAMPLES.map((s, i) => (
              <button key={s.label} className="chip" onClick={() => loadSample(i)}>
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            className="editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder="Paste a document, source file, or config to scan for secrets, PII, and compliance risks…"
          />

          <button className="run" onClick={handleAudit} disabled={loading || !content.trim()}>
            {loading ? "Auditing…" : "Run audit"}
          </button>
          {error && <p className="error">{error}</p>}
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Audit results</h2>
          </div>

          {!result && !error && (
            <div className="placeholder">
              Run an audit to see findings, severity, and remediation guidance.
            </div>
          )}

          {result && (
            <div className="results">
              <div className="results__top">
                <ScoreGauge result={result} />
                <div className="results__summary">
                  <p>{result.summary}</p>
                  {result.llm_summary && (
                    <p className="llm">
                      <strong>AI summary:</strong> {result.llm_summary}
                    </p>
                  )}
                  <div className="counts">
                    {Object.entries(result.counts).map(([sev, n]) => (
                      <span key={sev} className={`badge badge--${sev}`}>
                        {n} {sev}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {sortedFindings.length > 0 ? (
                <ul className="findings">
                  {sortedFindings.map((f, i) => (
                    <FindingCard key={`${f.rule_id}-${i}`} finding={f} />
                  ))}
                </ul>
              ) : (
                <div className="clean">✓ No issues found. This content looks clean.</div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        audit-ai scans for secrets, PII, and compliance risks locally — no data leaves this
        environment.
      </footer>
    </div>
  );
}
