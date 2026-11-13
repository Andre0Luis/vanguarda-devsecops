# Runbooks de segurança

Runbooks são roteiros curtos para quem estiver de plantão agir rápido, sem depender de lembrar de tudo às 3h da manhã.

| Runbook | Gatilho |
|---|---|
| [security-alarm-response.md](security-alarm-response.md) | Alarmes do CloudWatch (`validation-rejected-spike`, `rate-limited`, `api-traffic-anomaly`, `lambda-errors`, `api-5xx`, `api-latency-p99`) |
| [guardduty-high-severity.md](guardduty-high-severity.md) | Finding do GuardDuty com severidade ≥ 7 (via EventBridge → SNS) |
| [secret-leak.md](secret-leak.md) | Segredo detectado (TruffleHog, git-secrets, GitHub secret scanning) ou suspeita de vazamento |

## Papéis no squad de 6 pessoas (RACI simplificado)

| Atividade | Tech Lead / Platform | Dev de plantão | Devs | QA | PO |
|---|---|---|---|---|---|
| Triagem do alerta | A | **R** | I | I | I |
| Contenção técnica | A / **R** | **R** | C | I | I |
| Decisão de comunicar usuários / ANPD | C | I | I | I | **A / R** (com jurídico/DPO) |
| Correção definitiva | A | R | **R** | C | I |
| Postmortem (blameless) | **R** | R | C | C | C |

**Plantão:** rotação semanal entre Tech Lead e os devs backend; os alertas chegam por e-mail/Slack via tópico SNS `vanguarda-security-alerts-<stage>`.

## Severidade e tempos-alvo

| Severidade | Exemplo | Reconhecer | Conter |
|---|---|---|---|
| SEV1 | Credencial de produção comprometida, vazamento de dados pessoais | 15 min | 1 h |
| SEV2 | Ataque ativo contido pelos controles, degradação relevante | 1 h | 4 h |
| SEV3 | Anomalia sem impacto confirmado | Próximo dia útil | Próxima Sprint |

## LGPD: incidente com dados pessoais

Se houver **risco ou dano relevante aos titulares**, o controlador deve comunicar a ANPD e os titulares. O Regulamento de Comunicação de Incidente de Segurança (Resolução CD/ANPD nº 15/2024) fixa prazo de **3 dias úteis** a partir do conhecimento do incidente. A decisão é do PO com o encarregado (DPO); o time técnico fornece a linha do tempo, os dados afetados e as medidas tomadas.
