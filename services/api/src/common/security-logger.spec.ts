import { sanitize, securityEvent } from './security-logger';

describe('security-logger', () => {
  it('remove campos fora da allowlist (proteção contra vazamento de PII)', () => {
    const out = sanitize({ level: 'DANGEROUS', cpf: '123.456.789-00', text: 'senha 1234' });
    expect(out).toEqual({ level: 'DANGEROUS' });
  });

  it('emite JSON com event_type fixo para o Metric Filter do CloudWatch', () => {
    const lines: string[] = [];
    securityEvent('RISK_DETECTED', { channel: 'pix', phone: '11999999999' }, (l) => lines.push(l));
    const parsed = JSON.parse(lines[0]);
    expect(parsed.event_type).toBe('SECURITY_EVENT');
    expect(parsed.event).toBe('RISK_DETECTED');
    expect(parsed.channel).toBe('pix');
    expect(parsed.phone).toBeUndefined();
  });
});
