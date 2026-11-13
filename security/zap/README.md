# OWASP ZAP (DAST)

- **Modo pipeline (a cada deploy em HML):** `zap-api-scan.py` importando o contrato OpenAPI (`/docs-json`) gerado pelo NestJS. Ataca todos os endpoints documentados com payloads de injeção, XSS, SSRF, command injection etc.
- **Modo semanal (Purple Team):** varredura completa (`-a` regras alfa + `-j` AJAX spider desligado por ser API) disparada por `purple-team-weekly.yml`.
- **Política:** `rules.tsv` define o que quebra o build (`FAIL`), o que só reporta (`WARN`) e falsos positivos aceitos em retrospectiva (`IGNORE`, sempre com justificativa).
- **Relatórios:** HTML + JSON + Markdown publicados como artefato da execução e resumidos no *Job Summary*.
