export type Severity = "low" | "medium" | "high" | "critical";
export type RiskLevel = Severity | "clean";

export interface Finding {
  rule_id: string;
  title: string;
  category: string;
  severity: Severity;
  line: number;
  column: number;
  snippet: string;
  recommendation: string;
}

export interface AuditResult {
  filename: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  summary: string;
  counts: Record<string, number>;
  findings: Finding[];
  llm_summary: string | null;
}
