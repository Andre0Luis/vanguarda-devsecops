# Purple Team na Sprint Retrospective

Squad de 6 pessoas, sem time de segurança dedicado: **o Purple Team é um bloco de 30 minutos na retrospectiva quinzenal.**

## Papéis (rotativos a cada Sprint)

- **Red Champion:** traz o que os ataques automatizados acharam (ZAP, Nuclei, teste de abuso) e golpes novos vistos no noticiário.
- **Blue Champion:** traz o que a defesa viu (alarmes do CloudWatch, findings do GuardDuty, rate limit) e o que **deixou de ver**.

## Entradas

| Fonte | Onde está |
|---|---|
| Relatórios ZAP/Nuclei do pipeline | Artefatos das execuções do `DevSecOps Pipeline` |
| Varredura profunda semanal | Workflow `Purple Team (semanal)`, Job Summary |
| Achados de SAST/IaC | Aba *Security → Code scanning* |
| Alarmes e findings | CloudWatch / GuardDuty (canal de alertas) |
| Exceções vigentes | `services/api/.checkov.yaml`, `security/zap/rules.tsv` |

## Pauta (30 min)

1. **5 min:** números da Sprint (métricas abaixo).
2. **10 min:** o que o Red Team achou; algum ataque passou?
3. **10 min:** a defesa detectou? Em quanto tempo? Falso positivo?
4. **5 min:** decidir as ações e os donos.

## Saídas possíveis

- Nova regra em `security/semgrep/vanguarda-rules.yml`.
- Novo template em `security/nuclei/`.
- Ajuste de limiar/Metric Filter no `serverless.yml`.
- Exceção justificada (ou removida) no `rules.tsv` / `.checkov.yaml`.
- Atualização de threat model em `docs/threat-model/`.

## Métricas

| Métrica | Definição |
|---|---|
| MTTD | Tempo do início do ataque/achado até a detecção |
| MTTR | Tempo da detecção até a correção em produção |
| % detecção automática | Achados encontrados pelo pipeline / total de achados |
| Taxa de falso positivo | Alertas descartados / alertas totais |
| Vulnerabilidades abertas | Por severidade, com idade versus SLA |

## Registro — Sprint 1 (real)

| # | Fonte | Achado | Ação | Status |
|---|---|---|---|---|
| 1 | TruffleHog (CI) | URL com `usuario:senha` em fixture de teste | Fixture montada em partes; padrão mantido no scanner | ✅ Corrigido |
| 2 | Checkov `CKV_AWS_41` | SHA do commit em variável de ambiente parecia credencial | Versão via `APP_VERSION` | ✅ Corrigido |
| 3 | Semgrep `run-shell-injection` | Input do workflow de produção interpolado no shell | Input via `env` + validação semver | ✅ Corrigido (PR #11) |
| 4 | Semgrep `mutable-action-tag` | Actions por tag mutável (risco de supply chain) | Pin por SHA de commit + Dependabot | ✅ Corrigido (PR #11) |
| 5 | ZAP `HTTP Only Site` | HML simulado em HTTP | Aceito só para HML simulado (API Gateway real é HTTPS) | ✅ Exceção justificada |
| 6 | Dependency Review | Falhava por falta do Dependency graph | Dependency graph + Dependabot alerts habilitados | ✅ Corrigido |

## Template para as próximas Sprints

```markdown
## Sprint N — Purple Team
- Red Champion: @ | Blue Champion: @
- Métricas: MTTD __ | MTTR __ | % automático __ | FP __
| # | Fonte | Achado | Detectado pela defesa? | Ação | Dono | Status |
```
