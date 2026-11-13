import 'reflect-metadata';
import { createApp } from './bootstrap';

async function main(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  process.stdout.write(`Vanguarda API listening on :${port} (stage=${process.env.STAGE ?? 'local'})\n`);
}

void main();
