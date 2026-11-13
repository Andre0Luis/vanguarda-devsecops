## O que muda?
<!-- descreva a mudança e o motivo -->

## Classificação de risco
- [ ] 🟢 Baixo — UI/texto, sem dados ou segurança envolvidos (1 aprovação)
- [ ] 🟡 Médio — nova regra do motor de risco, nova dependência (1 aprovação + checklist)
- [ ] 🔴 Alto/Crítico — autenticação, pagamentos Premium, dados pessoais, IaC, pipeline (2 aprovações incl. CODEOWNER + Threat Model)

## Checklist de segurança (obrigatório)
- [ ] Entradas validadas (DTO com class-validator, limites de tamanho)
- [ ] Nenhum dado pessoal (CPF, telefone, chave Pix, texto do SMS) em logs
- [ ] Nenhum segredo no código (git-secrets local + TruffleHog no CI)
- [ ] Nova dependência justificada e sem CVE alta (Dependabot / npm audit)
- [ ] Mudou IaC? Checkov verde e menor privilégio no IAM
- [ ] Código gerado por IA (Claude Code / Lovable) revisado linha a linha
- [ ] Risco Alto/Crítico: link do Threat Model: ___

## Evidências de teste
<!-- prints, logs, cobertura -->

## Plano de rollback
<!-- ex.: serverless rollback / eas update --branch anterior -->
