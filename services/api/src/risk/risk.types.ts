/**
 * Linguagem ubíqua do Core Domain "Motor de Risco".
 * O nível de risco é o contrato central entre backend e app mobile:
 * o app traduz cada nível em mensagens simples para o público 60+.
 */
export enum RiskLevel {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  DANGEROUS = 'DANGEROUS',
}

export interface RiskSignal {
  /** Código estável do sinal (usado em métricas e na afinação Purple Team). */
  code: string;
  /** Peso do sinal no score (0-100). */
  weight: number;
  /** Explicação em linguagem simples, exibida ao usuário. */
  reason: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  signals: RiskSignal[];
  /** Mensagem pronta para o usuário 60+ (frases curtas, sem jargão). */
  userMessage: string;
  /** Ação recomendada pelo app (bloquear, alertar ou permitir). */
  action: 'BLOCK' | 'WARN' | 'ALLOW';
}

export const SCORE_THRESHOLDS = {
  suspicious: 30,
  dangerous: 60,
} as const;

export function buildAssessment(signals: RiskSignal[]): RiskAssessment {
  const score = Math.min(
    100,
    signals.reduce((acc, s) => acc + s.weight, 0),
  );

  if (score >= SCORE_THRESHOLDS.dangerous) {
    return {
      level: RiskLevel.DANGEROUS,
      score,
      signals,
      action: 'BLOCK',
      userMessage:
        'Pare! Isto parece um golpe. Não clique, não pague e não informe seus dados.',
    };
  }

  if (score >= SCORE_THRESHOLDS.suspicious) {
    return {
      level: RiskLevel.SUSPICIOUS,
      score,
      signals,
      action: 'WARN',
      userMessage:
        'Atenção: encontramos sinais estranhos. Confirme com alguém de confiança antes de continuar.',
    };
  }

  return {
    level: RiskLevel.SAFE,
    score,
    signals,
    action: 'ALLOW',
    userMessage: 'Tudo certo. Não encontramos sinais de golpe.',
  };
}
