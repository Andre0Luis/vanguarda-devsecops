import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @SkipThrottle()
  check(): { status: string; version: string } {
    return {
      status: 'ok',
      version: process.env.APP_VERSION ?? 'dev',
    };
  }
}
