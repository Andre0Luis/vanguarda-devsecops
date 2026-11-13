# Runbook — Alarmes de segurança do CloudWatch

Alarmes definidos em [`services/api/serverless.yml`](../../services/api/serverless.yml). Todos publicam no SNS `vanguarda-security-alerts-<stage>`.

## 0. Primeiros 5 minutos (qualquer alarme)

1. **Reconhecer** o alerta no canal (quem pegou, horário).
2. Abrir o **CloudWatch → Alarms** e confirmar se o alarme continua em `ALARM`.
3. Rodar a consulta base no **Logs Insights** (log group `/aws/lambda/vanguarda-risk-api-<stage>-riskApi`):

```sql
fields @timestamp, event, channel, level, status
| filter event_type = "SECURITY_EVENT"
| stats count(*) as total by event, bin(5m)
| sort bin(5m) desc
```

4. Classificar a severidade (SEV1/2/3, ver [README](README.md)).

## 1. `validation-rejected-spike` (pico de payloads inválidos)

**Hipótese principal:** scanner/fuzzer ativo contra a API (pode ser o nosso próprio DAST em HML!).

1. Confirmar se o pico coincide com uma execução do pipeline (`DevSecOps Pipeline` / `Purple Team`). Se sim → falso positivo de HML, registrar e encerrar.
2. Identificar as origens nos logs de acesso do API Gateway:
   ```sql
   fields ip, route, status, ua
   | filter status = "400"
   | stats count(*) as n by ip, ua | sort n desc | limit 20
   ```
3. **Conter:** se um IP/UA concentra o tráfego, reduzir temporariamente o throttling do stage ou bloquear na borda (WAF, se habilitado).
4. Verificar se algum payload passou (respostas 200 do mesmo IP nas mesmas rotas).
5. Abrir item para a retro de Purple Team: novo template Nuclei com o padrão de ataque observado.

## 2. `rate-limited` (clientes batendo no rate limit)

**Hipóteses:** bot, abuso da rota de Pix, cliente legítimo com bug (loop de retry no app).

1. Ver a distribuição por rota (`route`) e versão do app (`ua`).
2. Se for **uma versão do app** → bug de retry: abrir correção, considerar OTA via `eas update`.
3. Se for **um conjunto pequeno de IPs** → abuso: manter o throttling, avaliar bloqueio.
4. Se for **distribuído e crescente** → tratar como `api-traffic-anomaly`.

## 3. `api-traffic-anomaly` (fora da banda de detecção de anomalia)

1. Comparar com eventos de negócio (campanha de marketing, matéria na TV, golpe viral no WhatsApp gerando procura legítima).
2. Se legítimo → acompanhar custo e latência; ajustar a banda na retro se for recorrente.
3. Se ilegítimo → seguir os passos de contenção do item 1; considerar baixar `ThrottlingRateLimit` e `reservedConcurrency` temporariamente (deploy via pipeline, com aprovação).

## 4. `lambda-errors` / `api-5xx` / `api-latency-p99`

1. Verificar o **último deploy** (GitHub → Deployments). Correlação com deploy recente → **rollback**:
   ```bash
   npx serverless deploy list --stage prd
   npx serverless rollback --stage prd --timestamp <timestamp-anterior>
   ```
2. Verificar dependências: RDS (conexões), ElastiCache, gateway de reputação externo.
3. Checar DLQ `vanguarda-risk-api-dlq-<stage>` para eventos com falha.
4. Se o motor de risco estiver indisponível, o app deve **falhar de forma segura** (mostrar "não foi possível verificar, não prossiga sem confirmar com alguém de confiança"), nunca dizer "seguro".

## 5. Encerramento

- Registrar a linha do tempo no issue do incidente (template "Incidente").
- SEV1/SEV2 → **postmortem blameless** em até 5 dias úteis.
- Toda lição vira automação: regra Semgrep, template Nuclei, ajuste de alarme ou item no threat model.
