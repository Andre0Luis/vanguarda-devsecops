import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../bootstrap';

/**
 * Testes de contrato/segurança da camada HTTP (rodam no job de unit tests).
 * Validam controles que o DAST também verifica, mas com feedback em segundos.
 */
describe('RiskController (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.RATE_LIMIT_PER_MIN = '1000';
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/risk/url devolve avaliação', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/risk/url')
      .send({ url: 'https://caixa-premio-resgate.top/pix' })
      .expect(200);
    expect(res.body.level).toBe('DANGEROUS');
  });

  it('POST /v1/risk/sms devolve avaliação', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/risk/sms')
      .send({ text: 'Bom dia!' })
      .expect(200);
    expect(res.body.level).toBe('SAFE');
  });

  it('POST /v1/risk/pix devolve avaliação', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/risk/pix')
      .send({
        keyType: 'CPF',
        amountInCents: 1000,
        firstTimeRecipient: false,
        localHour: 10,
        originatedFromMessage: false,
        reportedCount: 0,
      })
      .expect(200);
    expect(res.body.action).toBe('ALLOW');
  });

  it('rejeita campos não permitidos (mass assignment) sem vazar detalhes', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/risk/url')
      .send({ url: 'https://exemplo.com', isAdmin: true })
      .expect(400);
    expect(res.body).toEqual({ statusCode: 400, message: 'Requisição inválida.' });
  });

  it('não expõe stack trace em JSON malformado', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/risk/url')
      .set('Content-Type', 'application/json')
      .send('{"url": ')
      .expect(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at \w+|SyntaxError|node_modules/);
  });

  it('aplica cabeçalhos de segurança e esconde X-Powered-By', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });
});
