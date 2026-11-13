import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { securityEvent } from '../common/security-logger';
import { PixRiskService } from './pix-risk.service';
import { PixCheckDto, SmsCheckDto, UrlCheckDto } from './risk.dto';
import { RiskAssessment, RiskLevel } from './risk.types';
import { SmsRiskService } from './sms-risk.service';
import { UrlRiskService } from './url-risk.service';

@ApiTags('risk')
@Controller('v1/risk')
export class RiskController {
  constructor(
    private readonly urlRisk: UrlRiskService,
    private readonly pixRisk: PixRiskService,
    private readonly smsRisk: SmsRiskService,
  ) {}

  @Post('url')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Avaliação de risco de um link' })
  checkUrl(@Body() dto: UrlCheckDto): RiskAssessment {
    return this.track('url', this.urlRisk.assess(dto.url));
  }

  @Post('sms')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Avaliação de risco de uma mensagem (SMS/WhatsApp)' })
  checkSms(@Body() dto: SmsCheckDto): RiskAssessment {
    return this.track('sms', this.smsRisk.assess(dto.text));
  }

  @Post('pix')
  @HttpCode(200)
  // Pix é a rota mais sensível: limite mais agressivo por cliente.
  @Throttle({ default: { limit: () => Number(process.env.PIX_RATE_LIMIT_PER_MIN ?? 20), ttl: 60_000 } })
  @ApiOkResponse({ description: 'Avaliação de risco de uma transferência Pix' })
  checkPix(@Body() dto: PixCheckDto): RiskAssessment {
    return this.track('pix', this.pixRisk.assess(dto));
  }

  /** Emite evento estruturado (sem PII) para métricas de negócio e Blue Team. */
  private track(channel: string, result: RiskAssessment): RiskAssessment {
    if (result.level !== RiskLevel.SAFE) {
      securityEvent('RISK_DETECTED', {
        channel,
        level: result.level,
        score: result.score,
        signals: result.signals.map((s) => s.code),
      });
    }
    return result;
  }
}
