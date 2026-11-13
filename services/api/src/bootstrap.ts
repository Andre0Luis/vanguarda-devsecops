import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SafeExceptionFilter } from './common/http-exception.filter';

/**
 * Configuração única de segurança, compartilhada entre:
 *  - main.ts   (execução local / HML simulado no pipeline para o DAST)
 *  - lambda.ts (AWS Lambda atrás do API Gateway)
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    }),
  );

  // Desabilita a assinatura do framework (fingerprinting).
  (app.getHttpAdapter().getInstance() as { disable: (s: string) => void }).disable('x-powered-by');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.STAGE === 'prd',
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());

  // Mobile nativo não precisa de CORS; mantemos fechado por padrão.
  app.enableCors({ origin: false });

  // Contrato OpenAPI exposto somente fora de produção (usado pelo OWASP ZAP).
  if (process.env.STAGE !== 'prd') {
    const config = new DocumentBuilder()
      .setTitle('Vanguarda Risk API')
      .setDescription('Motor de risco: links, SMS e Pix suspeitos')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json' });
  }

  return app;
}
