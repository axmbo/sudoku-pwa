# Política de segurança

## Versões suportadas

Só a versão mais recente publicada (a última tag de release) recebe correções. Como é uma PWA, a atualização chega ao jogador pelo service worker.

## Como reportar uma vulnerabilidade

**Não abra issue pública.** Use o [reporte privado de vulnerabilidade do GitHub](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) (aba *Security* → *Report a vulnerability*) deste repositório.

Inclua: versão (ou commit), navegador e sistema, passos para reproduzir e o impacto esperado. Meta de resposta inicial: 7 dias. Projeto mantido por uma pessoa, sem programa de recompensa.

## Superfície de ataque da PWA

| Área | Como é tratada |
|---|---|
| Código de terceiros no navegador | Nenhum script, fonte, analytics ou requisição de terceiros. CSP restritiva (`default-src 'self'`, sem `unsafe-inline` em script). |
| Dados do jogador | Nenhum dado pessoal coletado; o jogo salvo, as estatísticas e as configurações ficam só no dispositivo (IndexedDB). Nada sai do aparelho. |
| Service worker | Pré-cache só de assets estáticos do próprio site; não toca nos dados salvos; atualização só com confirmação do jogador. |
| Entrada do usuário | Apenas números e comandos de jogo; dados importados (exportação JSON) são validados por schema antes do uso. |
| Cadeia de suprimentos | Dependências mínimas e fixadas por lockfile; Renovate para atualizações; alertas do Dependabot; CodeQL, secret scanning e push protection do GitHub; ações de CI fixadas por SHA. |
| Build e release | Tags de release assinadas com chave em hardware do mantenedor; o pipeline recusa tag não assinada; atestado de proveniência do build (GitHub Artifact Attestations), verificável com `gh attestation verify`. |

Assinatura de commit atesta a origem do commit, não que ele passou por revisão humana; a revisão humana é o merge do PR.

Decisões relacionadas: [ADR 0004](docs/adr/0004-persistencia-local.md) (persistência) e [ADR 0006](docs/adr/0006-plataforma-versionamento-ci.md) (plataforma).
