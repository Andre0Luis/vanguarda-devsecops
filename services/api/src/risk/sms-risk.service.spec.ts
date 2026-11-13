import { RiskLevel } from './risk.types';
import { SmsRiskService } from './sms-risk.service';
import { UrlRiskService } from './url-risk.service';

describe('SmsRiskService', () => {
  const service = new SmsRiskService(new UrlRiskService());

  it('não alerta mensagem comum', () => {
    const r = service.assess('Bom dia! O almoço de domingo está confirmado.');
    expect(r.level).toBe(RiskLevel.SAFE);
  });

  it('bloqueia golpe do parente com número novo pedindo Pix urgente', () => {
    const r = service.assess('Oi mãe, troquei de número. Faz um pix urgente pra mim?');
    expect(r.level).toBe(RiskLevel.DANGEROUS);
    expect(r.signals.map((s) => s.code)).toEqual(
      expect.arrayContaining(['SMS_FAKE_RELATIVE', 'SMS_URGENCY', 'SMS_PIX_REQUEST']),
    );
  });

  it('bloqueia smishing de banco com link falso e pedido de token', () => {
    const r = service.assess(
      'BRADESCO: sua conta será bloqueada hoje. Informe o token em https://bradesco-seguranca.xyz/atualizar-cadastro',
    );
    expect(r.level).toBe(RiskLevel.DANGEROUS);
    expect(r.signals.some((s) => s.code === 'SMS_RISKY_LINK')).toBe(true);
  });

  it('alerta promessa de prêmio', () => {
    const r = service.assess('Parabéns, você foi sorteado! Seu prêmio aguarda.');
    expect(r.level).not.toBe(RiskLevel.SAFE);
  });
});
