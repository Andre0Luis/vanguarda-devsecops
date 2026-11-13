import { PixContext, PixRiskService } from './pix-risk.service';
import { RiskLevel } from './risk.types';

const base: PixContext = {
  keyType: 'CPF',
  amountInCents: 5_000,
  firstTimeRecipient: false,
  localHour: 14,
  originatedFromMessage: false,
  reportedCount: 0,
};

describe('PixRiskService', () => {
  const service = new PixRiskService();

  it('permite Pix comum para contato conhecido', () => {
    expect(service.assess(base).level).toBe(RiskLevel.SAFE);
  });

  it('bloqueia chave denunciada várias vezes', () => {
    const r = service.assess({ ...base, reportedCount: 5 });
    expect(r.level).toBe(RiskLevel.DANGEROUS);
    expect(r.action).toBe('BLOCK');
  });

  it('alerta chave com poucas denúncias', () => {
    const r = service.assess({ ...base, reportedCount: 1 });
    expect(r.level).toBe(RiskLevel.SUSPICIOUS);
  });

  it('bloqueia o golpe do falso parente: valor alto, destinatário novo, pedido por mensagem, de madrugada', () => {
    const r = service.assess({
      ...base,
      keyType: 'EVP',
      amountInCents: 250_000,
      firstTimeRecipient: true,
      originatedFromMessage: true,
      localHour: 23,
    });
    expect(r.level).toBe(RiskLevel.DANGEROUS);
    expect(r.signals.map((s) => s.code)).toEqual(
      expect.arrayContaining([
        'PIX_HIGH_AMOUNT_NEW_RECIPIENT',
        'PIX_FROM_MESSAGE',
        'PIX_NIGHT_TIME',
        'PIX_RANDOM_KEY_NEW_RECIPIENT',
      ]),
    );
  });

  it('considera madrugada (antes das 6h) como sinal', () => {
    const r = service.assess({ ...base, localHour: 3 });
    expect(r.signals.some((s) => s.code === 'PIX_NIGHT_TIME')).toBe(true);
  });
});
