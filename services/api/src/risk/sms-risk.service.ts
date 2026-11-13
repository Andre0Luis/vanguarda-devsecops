import { Injectable } from '@nestjs/common';
import { buildAssessment, RiskAssessment, RiskSignal } from './risk.types';
import { UrlRiskService } from './url-risk.service';

/**
 * Detecta phishing via SMS/WhatsApp (smishing). O texto é processado
 * em memória e descartado: nunca é logado nem persistido (Privacy by Default).
 */
@Injectable()
export class SmsRiskService {
  private static readonly URL_REGEX = /https?:\/\/[^\s]+/gi;

  private static readonly PATTERNS: Array<{ code: string; regex: RegExp; weight: number; reason: string }> = [
    {
      code: 'SMS_URGENCY',
      regex: /(?<!\p{L})(urgente|imediatamente|hoje|últim[oa]s? (dia|hora)s?|será bloquead[oa])(?!\p{L})/iu,
      weight: 20,
      reason: 'A mensagem tenta apressar você.',
    },
    {
      code: 'SMS_FAKE_RELATIVE',
      regex: /(?<!\p{L})(m[ãa]e|pai|v[óo]|troquei de n[úu]mero|meu celular quebrou)(?!\p{L})/iu,
      weight: 30,
      reason: 'Parece o golpe do "parente com número novo".',
    },
    {
      code: 'SMS_PRIZE',
      regex: /(?<!\p{L})(pr[êe]mio|sorteado|ganhou|resgate)(?!\p{L})/iu,
      weight: 30,
      reason: 'Promete prêmio ou dinheiro fácil.',
    },
    {
      code: 'SMS_CREDENTIALS_REQUEST',
      regex: /(?<!\p{L})(senha|token|c[óo]digo de (seguran[çc]a|verifica[çc][ãa]o)|cart[ãa]o)(?!\p{L})/iu,
      weight: 35,
      reason: 'Pede senha, código ou dados do cartão. Bancos nunca pedem isso.',
    },
    {
      code: 'SMS_PIX_REQUEST',
      regex: /(?<!\p{L})(fa[zç]a? um pix|manda(r)? um pix|chave pix)(?!\p{L})/iu,
      weight: 25,
      reason: 'Pede uma transferência Pix.',
    },
  ];

  constructor(private readonly urlRisk: UrlRiskService) {}

  assess(text: string): RiskAssessment {
    const signals: RiskSignal[] = [];

    for (const p of SmsRiskService.PATTERNS) {
      if (p.regex.test(text)) {
        signals.push({ code: p.code, weight: p.weight, reason: p.reason });
      }
    }

    const urls = text.match(SmsRiskService.URL_REGEX) ?? [];
    for (const url of urls.slice(0, 5)) {
      const urlAssessment = this.urlRisk.assess(url);
      if (urlAssessment.score > 0) {
        signals.push({
          code: 'SMS_RISKY_LINK',
          weight: Math.round(urlAssessment.score * 0.6),
          reason: 'A mensagem contém um link perigoso.',
        });
      }
    }

    return buildAssessment(signals);
  }
}
