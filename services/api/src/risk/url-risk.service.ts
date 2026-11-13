import { Injectable } from '@nestjs/common';
import { buildAssessment, RiskAssessment, RiskSignal } from './risk.types';

/**
 * Analisa links recebidos (WhatsApp, SMS, e-mail) com heurísticas locais.
 * Importante (Security by Design): o serviço NUNCA faz requisição para a URL
 * analisada — isso evita SSRF e a confirmação de "número ativo" para golpistas.
 * Consultas a reputação externa (ex.: Google Safe Browsing) entram via adapter
 * assíncrono com cache no Redis, fora deste caminho síncrono.
 */
@Injectable()
export class UrlRiskService {
  private static readonly SHORTENERS = new Set([
    'bit.ly',
    'tinyurl.com',
    'cutt.ly',
    'encurtador.com.br',
    'is.gd',
    't.co',
  ]);

  private static readonly RISKY_TLDS = new Set([
    'zip',
    'mov',
    'top',
    'xyz',
    'click',
    'buzz',
    'icu',
  ]);

  /** Marcas mais imitadas em golpes contra o público 60+ no Brasil. */
  private static readonly IMPERSONATED_BRANDS = [
    'caixa',
    'bancodobrasil',
    'bb',
    'itau',
    'bradesco',
    'inss',
    'gov',
    'correios',
    'nubank',
    'mercadopago',
  ];

  private static readonly OFFICIAL_DOMAINS = new Set([
    'caixa.gov.br',
    'bb.com.br',
    'itau.com.br',
    'bradesco.com.br',
    'gov.br',
    'inss.gov.br',
    'correios.com.br',
    'nubank.com.br',
    'mercadopago.com.br',
  ]);

  private static readonly BAIT_KEYWORDS = [
    'premio',
    'resgate',
    'bloqueio',
    'atualizar-cadastro',
    'beneficio',
    'saque',
    'urgente',
    'pix',
    'token',
  ];

  /** Verificação de IPv4 sem regex (evita ReDoS — regra security/detect-unsafe-regex). */
  static isIPv4(host: string): boolean {
    const parts = host.split('.');
    return (
      parts.length === 4 &&
      parts.every((p) => p.length > 0 && p.length <= 3 && [...p].every((c) => c >= '0' && c <= '9') && Number(p) <= 255)
    );
  }

  assess(rawUrl: string): RiskAssessment {
    const signals: RiskSignal[] = [];
    let parsed: URL;

    try {
      parsed = new URL(rawUrl);
    } catch {
      return buildAssessment([
        {
          code: 'URL_MALFORMED',
          weight: 40,
          reason: 'O endereço está escrito de um jeito estranho.',
        },
      ]);
    }

    const host = parsed.hostname.toLowerCase();
    const registrable = host.split('.').slice(-3).join('.');

    if (parsed.protocol !== 'https:') {
      signals.push({
        code: 'URL_NO_TLS',
        weight: 20,
        reason: 'O site não usa conexão segura (cadeado).',
      });
    }

    if (UrlRiskService.isIPv4(host)) {
      signals.push({
        code: 'URL_IP_HOST',
        weight: 35,
        reason: 'O link usa números no lugar do nome do site.',
      });
    }

    if (host.startsWith('xn--') || host.includes('.xn--')) {
      signals.push({
        code: 'URL_PUNYCODE',
        weight: 40,
        reason: 'O nome do site imita letras para enganar.',
      });
    }

    if (UrlRiskService.SHORTENERS.has(host)) {
      signals.push({
        code: 'URL_SHORTENER',
        weight: 25,
        reason: 'O link está encurtado e esconde o site verdadeiro.',
      });
    }

    const tld = host.split('.').pop() ?? '';
    if (UrlRiskService.RISKY_TLDS.has(tld)) {
      signals.push({
        code: 'URL_RISKY_TLD',
        weight: 20,
        reason: 'O final do endereço é muito usado em golpes.',
      });
    }

    const isOfficial = [...UrlRiskService.OFFICIAL_DOMAINS].some(
      (d) => host === d || host.endsWith(`.${d}`),
    );
    const mentionsBrand = UrlRiskService.IMPERSONATED_BRANDS.some((b) =>
      host.replace(/[-.]/g, '').includes(b),
    );
    if (mentionsBrand && !isOfficial) {
      signals.push({
        code: 'URL_BRAND_IMPERSONATION',
        weight: 45,
        reason: 'O link finge ser de um banco ou órgão do governo.',
      });
    }

    const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();
    const bait = UrlRiskService.BAIT_KEYWORDS.filter((k) =>
      pathAndQuery.includes(k),
    );
    if (bait.length > 0) {
      signals.push({
        code: 'URL_BAIT_KEYWORDS',
        weight: Math.min(30, bait.length * 10),
        reason: 'O link usa palavras comuns em golpes (prêmio, bloqueio, saque).',
      });
    }

    if (parsed.username || parsed.password) {
      signals.push({
        code: 'URL_EMBEDDED_CREDENTIALS',
        weight: 50,
        reason: 'O link esconde o site verdadeiro com um truque.',
      });
    }

    if (registrable.length > 0 && host.split('.').length > 5) {
      signals.push({
        code: 'URL_DEEP_SUBDOMAIN',
        weight: 15,
        reason: 'O endereço é longo demais e confuso.',
      });
    }

    return buildAssessment(signals);
  }
}
