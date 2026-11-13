#!/usr/bin/env node
/**
 * Validação sintática de YAML para o lint-staged.
 *
 * - Aceita tags intrínsecas do CloudFormation (!Ref, !GetAtt, !Sub...) usadas
 *   no serverless.yml, tratando qualquer tag desconhecida como valor genérico.
 * - Falha (exit 1) em erro de sintaxe, chave duplicada ou indentação inválida —
 *   o tipo de erro que quebra um workflow do GitHub Actions ou um deploy.
 */
import { readFileSync } from 'node:fs';
import { parseAllDocuments } from 'yaml';

const files = process.argv.slice(2);
let failed = false;

for (const file of files) {
  const docs = parseAllDocuments(readFileSync(file, 'utf8'), { uniqueKeys: true, prettyErrors: true });
  const list = Array.isArray(docs) ? docs : [docs];
  for (const doc of list) {
    for (const err of doc.errors ?? []) {
      failed = true;
      process.stderr.write(`❌ ${file}: ${err.message}\n`);
    }
    // Avisos de tag não resolvida (!Ref, !GetAtt) são esperados em templates CloudFormation.
    for (const warn of doc.warnings ?? []) {
      if (warn.code !== 'TAG_RESOLVE_FAILED') {
        process.stderr.write(`⚠️  ${file}: ${warn.message}\n`);
      }
    }
  }
}

if (failed) {
  process.exit(1);
}
process.stdout.write(`✅ YAML válido (${files.length} arquivo(s))\n`);
