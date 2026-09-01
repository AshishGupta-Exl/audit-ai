import type { AuditResult } from "./types";

export async function runAudit(content: string, filename?: string): Promise<AuditResult> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, filename: filename || null }),
  });
  if (!response.ok) {
    throw new Error(`Audit failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}
