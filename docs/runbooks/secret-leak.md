# Runbook — Vazamento de segredo

Gatilhos: job **🔑 Secret Scanning · TruffleHog** falhou, `git-secrets` bloqueou um commit que já tinha ido para outro branch, alerta de *secret scanning* do GitHub, ou alguém colou um segredo em chat/issue.

> **Regra de ouro:** segredo que chegou ao Git (ou a qualquer lugar compartilhado) está **comprometido**. Apagar o commit não resolve: **rotacione primeiro**, limpe depois.

## Passos

1. **Identificar** o segredo (tipo, ambiente, dono) pelo relatório do TruffleHog. O TruffleHog indica se ele foi **verificado** (ativo).
2. **Rotacionar imediatamente** no provedor:
   | Tipo | Onde rotacionar |
   |---|---|
   | AWS access key | IAM → desativar e criar nova (ou, melhor, migrar para OIDC/role) |
   | Senha do RDS | Secrets Manager → *Rotate secret* |
   | Chave do gateway de pagamento | Painel do gateway → revogar e gerar nova |
   | Token Expo (EAS) | expo.dev → Access tokens → revogar |
   | Segredo HMAC de webhook | Gerar novo no gateway e atualizar no Secrets Manager |
3. **Verificar uso indevido** no período de exposição (CloudTrail, logs do gateway, histórico de builds EAS).
4. **Limpar o histórico** (opcional, depois da rotação): `git filter-repo` no branch afetado + force push coordenado com o time.
5. **Prevenir recorrência:** adicionar o padrão ao `scripts/setup-git-secrets.sh` e, se fizer sentido, uma regra Semgrep.
6. Registrar no issue do incidente e levar à retrospectiva.
