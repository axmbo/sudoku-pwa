# Revisão r2 — Fase 0, passo 5 (esqueleto) — 22/11/2026
Base: 784c61f · Head: 3701f0e · check: verde (rodado: lint, prettier, 100 testes, cobertura 100%)
Veredito: **sai** — 0 blocker, 0 major, 2 minor, 3 nit.

## Achados da r1: situação
| r1 | Situação | Evidência |
|---|---|---|
| 1 major (hook fail-open) | resolvido | `.claude/agents/dev.md:15` com `\|\| exit 2`; `tests/repo/hook-dev.test.ts:33-45` cobre wrapper, script ausente (exit 2) e caminhos de produção/teste. Vermelho confirmado em worktree em `8b70d95` (2 falhas), verde após `b93c335`. |
| 2 major (lint do domínio) | resolvido | `eslint.config.mjs:22-88`; `tests/repo/lint-dominio.test.ts` cobre 19 expressões e 3 imports em `.ts` e `.tsx`, mais 2 aceites e 1 escopo. Vermelho em `8a633e6` (39 falhas), verde após `bd3143d`. `globals: {}` inócuo removido. |
| 3 minor (isenções) | resolvido | Isenção na lista fechada (`PROCESSO.md:114`), CHANGELOG v0.2, T2/T3/T6 reclassificadas e `main.tsx` registrado como casca (`passo-5-tarefas.md:7-12`). Ver minor 1 abaixo. |
| 4 minor (doc × hook) | resolvido | `PROCESSO.md` §6 guardrail 2 e T5 listam `*.snap`, `tests/`, `__arbitraries__/`, `__snapshots__/`; `guard-test-files.mjs:7-18` e teste (`.test.ts:60-61`) batem. Vermelho em `de73ff8`, verde após `fa20345`. |
| 5 minor (audit) | resolvido | job `audit` no PR (`ci.yml:41-54`, SHAs iguais aos já conferidos); secret scanning nativo citado. |
| 6, 8 (nit) | débito registrado | `docs/estado.md:32-34`. |
| 7 (nit, cobertura) | resolvido | `npm test` agora roda `--coverage` (`package.json:19`), logo o threshold de 90% de branches vale no `check` e no CI. |

Ordem TDD no delta: `8b70d95 test` → `b93c335 fix`; `de73ff8 test` → `fa20345 feat`; `8a633e6 test` → `bd3143d fix`. Conforme. `1d2c692 fix(hooks)` é script de pre-commit (T7, isento: configuração de build).

## Achados novos
| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| 1 | minor | `eslint.config.mjs:35-77` | Falsos negativos que passam no domínio (rodei `eslint --stdin`): alias `const a = Date; a.now()`, `globalThis.setTimeout(...)`, `import('../ui/a')` dinâmico, `crypto.randomUUID()`, `requestAnimationFrame`, `new Date(undefined)`. O caso comum (`new Date()`, `Date.now`, `Math.random`, imports estáticos de ui/worker/preact, destructuring de `Date`) está coberto. Sem falso positivo achado (parâmetro chamado `self`, `new Date(0)`, `./uiutil` passam). | Débito: acrescentar `crypto.randomUUID`, `globalThis.setTimeout/setInterval`, `requestAnimationFrame`, `ImportExpression` com padrão ui/worker. Alias é inevitável em lint; o `revisor` cobre. |
| 2 | minor | commits `557a535` e os de T2/T3 | A nova isenção exige o vermelho "descrito no corpo do commit". Os commits de T2, T3 e T6 (anteriores à regra) não têm corpo; a evidência do vermelho está só em `passo-5-tarefas.md:8,9,12`. Histórico não se reescreve. | Aceitar como débito/ressalva única do passo 5; vale a regra daqui em diante. |
| 3 | nit | `scripts/hooks/pre-commit.sh:16` | O filtro de "só teste" repete a lista de `guard-test-files.mjs` e omite `__snapshots__` (inócuo: `.snap` não entra em `$code`). Commit só de teste pula os testes mesmo que não seja RED (CI cobre). Brecha de commit misto não existe: com qualquer arquivo de produção, `vitest related` roda. | Opcional: uma fonte única da lista de caminhos de teste. |
| 4 | nit | `scripts/hooks/pre-commit.sh:15-21` | O `fix(hooks)` mudou o comportamento do pre-commit sem teste; coberto só pela isenção de configuração. | Nenhuma ação. |
| 5 | nit | `docs/estado.md:15` | Ressalva já registrada: a sessão atual usa a definição antiga do agente `dev`; a prova do script novo é na próxima sessão. Correto, mas é o único item de aceite ainda aberto do hook. | Fazer a prova na sessão seguinte, antes do passo 6. |

Verificado sem achado: `|| exit 2` não mascara exit 2 do script e converte exit 1/127; com `CLAUDE_PROJECT_DIR` vazio o caminho não existe e dá exit 2 (teste cobre projeto inexistente); `estado.md` com 35 linhas (≤ 40); `git status` limpo; nenhum segredo no diff.

Rastreabilidade: passo sem spec; testes novos (`hook-dev`, `lint-dominio`, casos de snapshot) usam o prefixo `INV:`. Órfãos: nenhum.
