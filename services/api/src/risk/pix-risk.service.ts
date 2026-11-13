import { Injectable } from '@nestjs/common';
import { buildAssessment, RiskAssessment, RiskSignal } from './risk.types';

export interface PixContext {
  /** Chave Pix de destino já mascarada no app (LGPD: minimização). */
  keyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
  amountInCents: number;
  /** Primeira transferência para este destinatário? */
  firstTimeRecipient: boolean;
  /** Hora local do dispositivo (0-23). */
  localHour: number;
  /** A transferência foi iniciada a partir de um link/QR recebido por mensagem? */
  originatedFromMessage: boolean;
  /** Quantidade de denúncias da chave na base colaborativa (cache Redis). */
  reportedCount: number;
}

/**
 * Regras de Pix suspeito inspiradas nos golpes mais comuns contra idosos
 * (falso parente, falso funcionário do banco, falsa central de prêmios).
 */
@Injectable()
export class PixRiskService {
  static readonly HIGH_AMOUNT_CENTS = 100_000; // R$ 1.000,00

  assess(ctx: PixContext): RiskAssessment {
    const signals: RiskSignal[] = [];

    if (ctx.reportedCount >= 3) {
      signals.push({
        code: 'PIX_KEY_REPORTED',
        weight: 70,
        reason: 'Esta chave Pix já foi denunciada por outras pessoas.',
      });
    } else if (ctx.reportedCount > 0) {
      signals.push({
        code: 'PIX_KEY_FEW_REPORTS',
        weight: 30,
        reason: 'Esta chave Pix tem denúncias recentes.',
      });
    }

    if (ctx.firstTimeRecipient && ctx.amountInCents >= PixRiskService.HIGH_AMOUNT_CENTS) {
      signals.push({
        code: 'PIX_HIGH_AMOUNT_NEW_RECIPIENT',
        weight: 35,
        reason: 'É um valor alto para alguém que você nunca pagou antes.',
      });
    }

    if (ctx.localHour >= 22 || ctx.localHour < 6) {
      signals.push({
        code: 'PIX_NIGHT_TIME',
        weight: 15,
        reason: 'Transferências de madrugada são comuns em golpes.',
      });
    }

    if (ctx.originatedFromMessage) {
      signals.push({
        code: 'PIX_FROM_MESSAGE',
        weight: 25,
        reason: 'O pedido de Pix chegou por mensagem. Confirme por telefone.',
      });
    }

    if (ctx.keyType === 'EVP' && ctx.firstTimeRecipient) {
      signals.push({
        code: 'PIX_RANDOM_KEY_NEW_RECIPIENT',
        weight: 10,
        reason: 'A chave é aleatória e não mostra quem vai receber.',
      });
    }

    return buildAssessment(signals);
  }
}
