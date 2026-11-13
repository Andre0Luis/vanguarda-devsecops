#!/usr/bin/env bash
# Registra os padrões do git-secrets usados pelo pre-commit (idempotente).
set -euo pipefail
command -v git-secrets >/dev/null || { echo "Instale o git-secrets: brew install git-secrets"; exit 1; }
git secrets --register-aws || true
add() { git config --get-all secrets.patterns | grep -qxF -- "$1" || git secrets --add -- "$1"; }
allow() { git config --get-all secrets.allowed | grep -qxF -- "$1" || git secrets --add --allowed -- "$1"; }
add 'sk_live_[0-9A-Za-z]{16,}'                       # Stripe/gateway de pagamento (plano Premium)
add 'EXPO_TOKEN\s*[:=]\s*[A-Za-z0-9_-]{20,}'          # Token do Expo/EAS
add '-----BEGIN ([A-Z]+ )?PRIVATE KEY-----'           # Chaves privadas
add 'postgres(ql)?://[^:/@ ]+:[^@ ]+@'               # Connection string com senha (RDS)
allow 'AKIAIOSFODNN7EXAMPLE'
allow '000000000000'
echo "✅ git-secrets configurado com os padrões do Vanguarda."
