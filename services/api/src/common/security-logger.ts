/**
 * Logger estruturado de eventos de segurança.
 *
 * - Formato JSON de linha única → CloudWatch Logs Insights + Metric Filters.
 * - Campo fixo `event_type = SECURITY_EVENT` é a âncora do Metric Filter
 *   definido no serverless.yml (Blue Team).
 * - Allowlist de campos: qualquer chave fora da lista é descartada para
 *   impedir vazamento acidental de PII (CPF, telefone, texto do SMS, chave Pix).
 */
const ALLOWED_FIELDS = new Set([
  'channel',
  'level',
  'score',
  'signals',
  'route',
  'status',
  'reason',
  'requestId',
]);

export type SecurityEventName =
  | 'RISK_DETECTED'
  | 'VALIDATION_REJECTED'
  | 'RATE_LIMITED'
  | 'AUTH_FAILED';

export function sanitize(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_FIELDS.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

export function securityEvent(
  name: SecurityEventName,
  fields: Record<string, unknown> = {},
  sink: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
): void {
  sink(
    JSON.stringify({
      event_type: 'SECURITY_EVENT',
      event: name,
      ts: new Date().toISOString(),
      ...sanitize(fields),
    }),
  );
}
