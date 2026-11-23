# Fase 0, passo 5: tarefas do esqueleto

Equivalente ao `tasks.md` para o passo 5 do [plano da Fase 0](plano-fase-0.md), que não tem spec. Isenções da lista fechada de `PROCESSO.md` §6. Testes sem CA usam o prefixo `INV:`.

| ID | Tarefa | Quem | TDD | Arquivos |
|---|---|---|---|---|
| T1 | Config base: dependências exatas (ADR 0001/0003), TS strict, Vite + Preact, Vitest, ESLint, Prettier, Stryker, Playwright, scripts `npm run` | Orquestrador | isento — configuração de build | `package.json`, `package-lock.json`, `tsconfig*.json`, `*.config.*`, `index.html`, `src/main.tsx`, `.gitignore` |
| T2 | INV: o repositório tem um único `README.md`, na raiz | `eng-testes` | o teste é o entregável; o vermelho é provado uma vez criando um `README.md` extra | `tests/repo/readme-unico.test.ts` |
| T3 | INV: o Node em execução é o do `.nvmrc`, e o `engines` do `package.json` concorda | `eng-testes` | idem T2 | `tests/repo/versao-node.test.ts` |
| T4 | INV: teste trivial do domínio (dígito válido de 1 a 9) | `eng-testes` → `dev` | sim | `src/domain/digit.ts`, `src/domain/digit.test.ts` |
| T5 | Hook do `dev` como script Node que falha fechado (bloqueia `*.test.*`, `*.spec.*`, `e2e/`; entrada ilegível bloqueia) | `eng-testes` → `dev`; o Orquestrador liga o script em `.claude/agents/dev.md` | sim | `scripts/hooks/guard-test-files.mjs`, `scripts/hooks/guard-test-files.test.ts` |
| T6 | E2E de fumaça: a página abre e o axe não acusa violação séria ou crítica | `eng-testes` | o teste é o entregável (a casca da T1 já o satisfaz) | `e2e/fumaca.spec.ts` |
| T7 | commitlint + hook `pre-commit` versionado (`core.hooksPath`) | Orquestrador | isento — configuração de build | `commitlint.config.mjs`, `.githooks/*`, `scripts/hooks/pre-commit.sh` |
| T8 | Workflows do GitHub: `check` no push, PR com E2E + axe + CodeQL, mutation agendado; filtros de caminho, `concurrency`, cache | `devsecops` | isento — configuração de CI | `.github/workflows/*`, `scripts/ci/*` |

Fora deste passo (pendente, registrar no estado): script de ordem TDD no CI (depende de `tasks.md` de spec), cobertura do diff, orçamento de bundle e do Worker, Lighthouse CI, release por tag.

Saída: `npm run check` verde e revisão do diff pelo `revisor` dentro do critério de `PROCESSO.md` §5.
