# Threat Modeling no Projeto Vanguarda

> Antes de escrever a primeira linha de uma feature crítica, o time pergunta: **"como isso pode ser abusado?"**

## Quando é obrigatório

| Gatilho | Exemplos |
|---|---|
| Autenticação e sessão | login, recuperação de conta, tokens |
| **Pagamentos** | assinatura do plano Premium, webhooks do gateway |
| Dados pessoais (LGPD) | contatos de confiança, histórico de alertas, telefone |
| Integrações externas | APIs de reputação de links, lojas de apps, gateway de pagamento |
| Mudança de fronteira de confiança | novo endpoint público, nova fila, novo bucket |

Features de risco baixo (texto, UI) não precisam de threat model formal: basta o checklist do PR.

## Como fazemos (60 a 90 minutos, no refinamento)

1. **Escopo:** qual fluxo, quais ativos (dados, dinheiro, reputação), quem são os atores.
2. **Diagrama de fluxo de dados (DFD):** em Mermaid neste diretório ou no [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/) (Apache-2.0, gratuito). Marcar as **fronteiras de confiança**.
3. **STRIDE por elemento do diagrama:** Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.
4. **Pontuação de risco:** probabilidade (1–3) × impacto (1–3). Risco ≥ 6 bloqueia o início do desenvolvimento até haver mitigação definida.
5. **Mitigações → backlog:** cada mitigação vira **critério de aceite** da história e, quando possível, um teste automatizado, uma regra Semgrep ou um template Nuclei.
6. **Registro:** o arquivo `.md` fica neste diretório e é linkado no PR (o template de PR exige o link para risco Alto/Crítico).
7. **Revisão:** o threat model é revisitado quando o fluxo muda ou na retrospectiva de Purple Team, se um ataque passar.

**Participantes:** Tech Lead/Platform Engineer (facilita), dev responsável pela feature, QA e PO. Com 6 pessoas, quase todo o squad participa, e isso é proposital: é treino de cultura de segurança.

## Template

```markdown
# Threat Model — <feature>
- Data / versão:
- Participantes:
- Escopo (dentro / fora):

## Ativos
| Ativo | Por que importa | Classificação |

## Atores
| Ator | Confiável? | Motivação |

## Diagrama (DFD + fronteiras de confiança)
(mermaid)

## Ameaças (STRIDE)
| ID | STRIDE | Elemento | Ameaça | P | I | Risco | Mitigação | Verificação automática |

## Backlog gerado
- [ ] História / critério de aceite

## Riscos residuais aceitos
| Risco | Justificativa | Dono | Revisar em |
```

## Threat models existentes

| Feature | Arquivo | Status |
|---|---|---|
| Assinatura Premium e pagamentos | [premium-payments-stride.md](premium-payments-stride.md) | Aprovado (Sprint 4) |
