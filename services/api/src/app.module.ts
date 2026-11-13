import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { PixRiskService } from './risk/pix-risk.service';
import { RiskController } from './risk/risk.controller';
import { SmsRiskService } from './risk/sms-risk.service';
import { UrlRiskService } from './risk/url-risk.service';

/**
 * Rate limiting em DUAS camadas (defesa em profundidade):
 *  1. API Gateway (throttling por stage, definido no serverless.yml) — barra volumetria.
 *  2. ThrottlerGuard na aplicação — limite por cliente e por rota sensível (Pix).
 * Em produção o storage do Throttler aponta para o Redis (ElastiCache) para ser
 * consistente entre execuções Lambda; aqui usamos memória para o MVP/HML.
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: Number(process.env.RATE_LIMIT_PER_MIN ?? 60) },
    ]),
  ],
  controllers: [HealthController, RiskController],
  providers: [
    UrlRiskService,
    PixRiskService,
    SmsRiskService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
