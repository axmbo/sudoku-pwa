# ADR 0001: Stack e ferramentas

- **Status:** Proposto
- **Data:** 22/11/2026
- **Autor:** agente `arquiteto`

## Contexto

PWA estática (Vite), repositório público MIT, Node 26.13.1 fixado (`.nvmrc`; a página de releases do Node lista a 26 como LTS, 26.13.1 a mais recente). Dispositivo de referência: Android modesto (classe Moto G, 4G lento). Sem coleta de dados nem scripts de terceiros. Este ADR confirma a stack do BOOTSTRAP 4 e 5 com versões de 22/11/2026 e fixa o orçamento de performance. UI e persistência ficam nos ADRs 0003 e 0004; Worker e gerador, no 0005.

## Opções consideradas

| Tema | Opção adotada | Alternativa descartada |
|---|---|---|
| Testes unitários | Vitest | Jest (config extra para ESM/TS) |
| Mutation | Stryker só em `src/domain/` | Stryker no repo todo (custo de CI) |
| BDD | CA em Dado/Quando/Então, sem runner | Cucumber (camada extra sem leitor não técnico) |
| Lint/format | ESLint flat config + Prettier | Biome (menos regras de a11y/TS; não avaliado a fundo) |
| PWA | `vite-plugin-pwa` (Workbox) | SW manual (mais código para manter) |

## Decisão

Confirmar integralmente a stack do BOOTSTRAP, com dois ajustes:

1. **TypeScript fixado em 6.0.x (6.0.3).** A tag `latest` do npm é 7.0.2, mas `typescript-eslint` 8.73.0 declara peer `typescript >=4.8.4 <6.1.0`. Migrar para 7 só quando o peer permitir (revisão a cada Renovate de `typescript-eslint`).
2. **Lighthouse CI com perf, a11y e best-practices.** PWA vira checagem própria (manifest válido, SW registrado, E2E de offline/instalação/atualização). A documentação do Chrome consultada diz apenas "PWA testing in Lighthouse is deprecated"; a remoção exata na v12 não foi confirmada nela (consta no plano da Fase 0).

BDD fica sem Cucumber, como no BOOTSTRAP 5B. Strict completo (`strict`, `noUncheckedIndexedAccess`) vale para todo o código.

**Versões (npm, 22/11/2026):** typescript 6.0.3 (latest do pacote: 7.0.2), vite 8.3.8, vite-plugin-pwa 2.0.0 (workbox-build 7.4.1), vitest 5.1.1 (+ `@vitest/coverage-v8` 5.1.1), fast-check 4.11.0, `@testing-library/dom` 10.4.2, `@testing-library/preact` 3.2.6, `@playwright/test` 1.65.1, `@axe-core/playwright` 4.14.0, `@lhci/cli` 0.16.1 (Lighthouse 13.6.0), `@stryker-mutator/core` e `vitest-runner` 10.1.1, eslint 10.15.0, typescript-eslint 8.73.0, prettier 3.10.1, `@commitlint/cli` 21.2.4.

**Node 26:** os campos `engines` declaram compatibilidade para vite (`^20.19.0||>=22.12.0`), vitest (`>=26.0.0` incluído), eslint (`>=24`), commitlint (`>=22.12.0`), `@lhci/cli` (`>=22.19.0`), stryker (`>=22.0.0`), playwright (`>=20`), vite-plugin-pwa (`>=20.19.0`). Declaração de `engines` não prova que funciona: o `npm run check` da Fase 0 é o teste real.

### Orçamento de performance (dispositivo de referência)

Metas **propostas**; só LCP e TBT têm limiar publicado (web.dev). Os demais valores são hipóteses a calibrar com medição na Fase 1.

| Métrica | Orçamento | Base |
|---|---|---|
| JS inicial (gzip, todos os chunks da primeira tela) | ≤ 60 kB | proposta; Preact 11 tem ~4,9 kB gzip (bundlephobia) |
| CSS inicial (gzip) | ≤ 10 kB | proposta |
| LCP (Lighthouse mobile) | ≤ 2,5 s | "bom" segundo web.dev |
| TBT (Lighthouse mobile) | ≤ 200 ms | "bom" em mobile segundo web.dev |
| Lighthouse perf / a11y / best-practices | ≥ 90 / 100 / ≥ 95 | proposta |
| Geração de puzzle no Worker, p95, CPU 4x | fácil/médio ≤ 400 ms; difícil ≤ 1 s; especialista ≤ 2 s | proposta, **não confirmado** (sem benchmark ainda) |

O Lighthouse mobile usa por padrão CPU 4x mais lenta e rede simulada de 150 ms de RTT e 1.638,4 Kbps (docs do Lighthouse); a documentação não nomeia o aparelho emulado. Estourar o orçamento de JS ou de geração falha o gate de PR; LCP, TBT e notas rodam no job agendado/`full-ci`.

## Consequências

- Positivas: ferramentas atuais, todas com `engines` compatíveis com Node 26; gates objetivos de performance.
- Negativas: TypeScript 6 fixado atrasa o compilador nativo; vite 8, vitest 5 e vite-plugin-pwa 2 são majors recentes (risco de bugs). Stryker + Vitest 5 não foi verificado na prática (peer do runner é `vitest >=2.0.0`).
- Orçamentos de geração são chute informado e podem mudar por ADR superveniente.

## Fontes (consultadas em 22/11/2026)

- `npm view <pacote> version|engines|peerDependencies` (registry npm)
- https://nodejs.org/en/about/previous-releases
- https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
- https://web.dev/articles/lcp e https://web.dev/articles/tbt
- https://developer.chrome.com/docs/lighthouse/pwa/
- https://bundlephobia.com/package/preact@latest
