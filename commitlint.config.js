/**
 * Commitlint - Conventional Commits (https://www.conventionalcommits.org/pt-br)
 *
 * Por que importa para DevSecOps:
 *  - Histórico legível = auditoria e post-mortem mais rápidos.
 *  - `fix(security): ...` e `chore(deps): ...` ficam rastreáveis (métrica de MTTR).
 *  - Habilita changelog/versionamento automático (release por tag, ver ADR-0002).
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert', 'security'],
    ],
    // Escopos alinhados aos bounded contexts e às áreas do CODEOWNERS.
    'scope-enum': [
      1,
      'always',
      ['api', 'mobile', 'risk', 'payments', 'auth', 'infra', 'ci', 'security', 'deps', 'docs', 'purple-team', 'release'],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 120],
  },
};
