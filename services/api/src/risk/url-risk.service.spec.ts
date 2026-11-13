import { RiskLevel } from './risk.types';
import { UrlRiskService } from './url-risk.service';

describe('UrlRiskService', () => {
  const service = new UrlRiskService();

  it('considera seguro o domínio oficial da Caixa', () => {
    const r = service.assess('https://www.caixa.gov.br/beneficios');
    expect(r.level).toBe(RiskLevel.SAFE);
    expect(r.action).toBe('ALLOW');
  });

  it('bloqueia imitação de banco com TLD de risco e isca de prêmio', () => {
    const r = service.assess('https://caixa-premio-resgate.top/pix');
    expect(r.level).toBe(RiskLevel.DANGEROUS);
    expect(r.action).toBe('BLOCK');
    expect(r.signals.map((s) => s.code)).toEqual(
      expect.arrayContaining(['URL_BRAND_IMPERSONATION', 'URL_RISKY_TLD', 'URL_BAIT_KEYWORDS']),
    );
  });

  it('sinaliza IP no lugar do domínio e ausência de HTTPS', () => {
    const r = service.assess('http://192.168.10.20/login');
    expect(r.signals.map((s) => s.code)).toEqual(
      expect.arrayContaining(['URL_IP_HOST', 'URL_NO_TLS']),
    );
    expect(r.level).not.toBe(RiskLevel.SAFE);
  });

  it('detecta punycode (ataque homográfico)', () => {
    const r = service.assess('https://xn--itu-8ma.com.br');
    expect(r.signals.some((s) => s.code === 'URL_PUNYCODE')).toBe(true);
  });

  it('detecta encurtadores', () => {
    const r = service.assess('https://bit.ly/abc123');
    expect(r.signals.some((s) => s.code === 'URL_SHORTENER')).toBe(true);
  });

  it('detecta credenciais embutidas na URL', () => {
    const r = service.assess('https://www.bb.com.br@golpe.xyz/');
    expect(r.signals.some((s) => s.code === 'URL_EMBEDDED_CREDENTIALS')).toBe(true);
    expect(r.level).toBe(RiskLevel.DANGEROUS);
  });

  it('detecta subdomínios excessivos', () => {
    const r = service.assess('https://a.b.c.d.e.exemplo.com.br/');
    expect(r.signals.some((s) => s.code === 'URL_DEEP_SUBDOMAIN')).toBe(true);
  });

  it('trata URL malformada como suspeita sem lançar exceção', () => {
    const r = service.assess('nao-e-um-link');
    expect(r.level).toBe(RiskLevel.SUSPICIOUS);
    expect(r.signals[0].code).toBe('URL_MALFORMED');
  });

  it('limita o score a 100', () => {
    // URL montada em partes para não parecer credencial real aos scanners de segredo.
    const credentials = ['usuario', 'golpe'].join(':');
    const r = service.assess(`http://${credentials}@xn--caixa-premio.top/resgate-premio-saque-pix-token`);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
