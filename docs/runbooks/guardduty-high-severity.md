# Runbook — Finding do GuardDuty com severidade alta (≥ 7)

Origem: regra EventBridge `GuardDutyHighSeverityRule` → SNS `vanguarda-security-alerts-<stage>` (ver [`serverless.yml`](../../services/api/serverless.yml)).

> Finding de severidade alta é tratado como **SEV1 até prova em contrário**.

## 1. Triagem (até 15 min)

1. Abrir o finding no console do GuardDuty e anotar: **tipo**, recurso afetado, IP/ASN remoto, primeira e última ocorrência.
2. Classificar pelo tipo:

| Família do finding | Exemplo | Significado provável |
|---|---|---|
| `UnauthorizedAccess:IAMUser/*` / `InstanceCredentialExfiltration` | credenciais usadas de fora da AWS | **Credencial comprometida** |
| `Recon:IAMUser/*` | enumeração de permissões | Alguém testando uma credencial |
| `Backdoor:Lambda/*` / `CryptoCurrency:Lambda/*` | Lambda falando com C&C ou pool de mineração | **Função comprometida** (dependência maliciosa?) |
| `CredentialAccess:RDS/*` | login anômalo/força bruta no RDS | Ataque ao banco |
| `Policy:IAMUser/RootCredentialUsage` | uso da conta root | Uso indevido/acidental da root |

## 2. Contenção

**Credencial IAM comprometida**
1. Desativar a access key (IAM → usuário → Security credentials → *Make inactive*).
2. Se for a role de deploy do GitHub (OIDC): restringir a trust policy ao repositório/branch e revogar sessões ativas (*Revoke active sessions*).
3. Revisar o CloudTrail das últimas 24h dessa identidade: o que foi criado, alterado ou lido.

**Lambda comprometida**
1. Zerar a concorrência para parar a execução: `aws lambda put-function-concurrency --function-name vanguarda-risk-api-prd-riskApi --reserved-concurrent-executions 0`.
2. Preservar evidências: baixar o pacote da versão atual e os logs.
3. Investigar dependências: comparar o SBOM (artefato `sbom-api.cdx.json` do pipeline) com o deploy anterior; checar alertas do Dependabot.

**RDS**
1. Restringir o security group do RDS apenas às Lambdas.
2. Rotacionar a senha no Secrets Manager (rotação automática) e verificar logins.

## 3. Erradicação e recuperação

- Corrigir a causa raiz (dependência maliciosa removida, permissão reduzida, chave rotacionada).
- Redeploy **pelo pipeline** (nunca manual), passando por todos os gates.
- Monitorar o GuardDuty e os alarmes por 48h.

## 4. Comunicação

- Avaliar com PO e DPO se houve acesso a dados pessoais → comunicação à ANPD e aos titulares em até 3 dias úteis, se aplicável (ver [README](README.md)).
- Atualizar o status no canal do incidente a cada 1h enquanto SEV1.

## 5. Lições aprendidas

- Postmortem blameless.
- O que o Red Team automatizado poderia ter simulado? → novo template Nuclei ou teste.
- O alarme chegou a tempo? → ajuste na retrospectiva de Purple Team.
