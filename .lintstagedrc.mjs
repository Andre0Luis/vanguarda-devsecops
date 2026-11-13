/**
 * lint-staged - Projeto Vanguarda
 *
 * Roda apenas nos arquivos staged (feedback em segundos, antes do push).
 * O pipeline de CI repete as mesmas verificações sobre o repositório inteiro:
 * o hook local é conveniência e shift-left, o CI é o controle obrigatório.
 *
 * Formato de função para:
 *  - usar o ESLint e o flat config de cada workspace (services/api, apps/mobile);
 *  - pular com elegância ferramentas que não estão instaladas na máquina (Semgrep).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const has = (bin) => spawnSync(bin, ['--version'], { stdio: 'ignore' }).status === 0;
const quote = (files) => files.map((f) => JSON.stringify(f)).join(' ');

const SEMGREP_AVAILABLE = has('semgrep');
const SEMGREP_RULES = 'security/semgrep/vanguarda-rules.yml';

/** ESLint com o binário e o config do próprio workspace. */
const eslintFor = (workspace, { fix }) => (files) => {
  const bin = `${workspace}/node_modules/.bin/eslint`;
  const config = ['eslint.config.mjs', 'eslint.config.js', 'eslint.config.cjs']
    .map((c) => `${workspace}/${c}`)
    .find((c) => existsSync(c));

  if (!config || !existsSync(bin)) {
    console.warn(`⚠️  [lint-staged] ESLint não configurado/instalado em ${workspace} — rode "npm ci" no workspace. Pulando.`);
    return [];
  }
  return `${bin} --config ${config} --no-warn-ignored --max-warnings=0 ${fix ? '--fix ' : ''}${quote(files)}`;
};

/** Semgrep com as regras customizadas do Vanguarda; --error faz achados bloquearem o commit. */
const semgrep = (files) => {
  if (!SEMGREP_AVAILABLE) {
    console.warn('⚠️  [lint-staged] Semgrep não instalado (pipx install semgrep). O job "🔐 SAST · Semgrep" do CI vai cobrir. Pulando.');
    return [];
  }
  return `semgrep scan --config ${SEMGREP_RULES} --error --quiet --metrics=off ${quote(files)}`;
};

export default {
  'services/api/**/*.ts': (files) => [eslintFor('services/api', { fix: true })(files), semgrep(files)].flat(),
  'apps/mobile/**/*.{ts,tsx}': (files) => [eslintFor('apps/mobile', { fix: false })(files), semgrep(files)].flat(),
  '*.{yml,yaml}': (files) => `node scripts/check-yaml.mjs ${quote(files)}`,
};
