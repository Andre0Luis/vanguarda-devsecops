import 'reflect-metadata';
import serverlessExpress from '@codegenie/serverless-express';
import type { Callback, Context, Handler } from 'aws-lambda';
import { createApp } from './bootstrap';

/**
 * Handler AWS Lambda. A instância Nest é reaproveitada entre invocações
 * (warm start) para reduzir latência e custo — essencial no modelo OPEX.
 */
let cachedHandler: Handler | undefined;

async function bootstrap(): Promise<Handler> {
  const app = await createApp();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: unknown, context: Context, callback: Callback) => {
  cachedHandler = cachedHandler ?? (await bootstrap());
  return cachedHandler(event, context, callback);
};
