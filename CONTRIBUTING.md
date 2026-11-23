# Como contribuir

Obrigado pelo interesse. Este projeto tem um processo de engenharia explícito; a fonte única dele é o [PROCESSO.md](PROCESSO.md). Aqui fica só o resumo do caminho, para pessoas e para agentes de IA.

## Fluxo em uma tela

1. **Comece por uma issue.** Bug, feature ou débito técnico, pelos templates. Feature nova vira uma spec em `specs/NNN-<slug>/` antes de qualquer código.
2. **Spec antes de código.** `spec.md` (o quê e por quê, critérios de aceite `CA-NNN-XX` em Dado/Quando/Então) → `plan.md` → `tasks.md`. Templates em [specs/_templates/](specs/_templates/).
3. **Branch** `<tipo>/NNN-<slug>` (ex.: `feat/001-tabuleiro`), a partir da `main` atualizada.
4. **TDD.** Commit `test(...)` com o teste falhando, depois `feat(...)`/`fix(...)` com ele passando. Isenções só da lista fechada do `PROCESSO.md` §6.
5. **Gate local.** `npm run check` verde antes de abrir o PR.
6. **PR** fechando a issue e apontando para a spec. O merge é do mantenedor, por **rebase merge** (histórico linear, sem squash).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `<tipo>(<escopo>): <descrição>`, tipo e escopo em inglês, descrição em português. O commitlint valida no hook local e no CI.

## Assinatura

- Commits **podem** ser assinados (recomendado: chave SSH dedicada à assinatura). A `main` não exige assinatura, para não travar contribuições.
- A assinatura de commit atesta a **origem**, não uma revisão humana. A revisão humana é o merge do PR pelo mantenedor.
- Releases são tags assinadas pelo mantenedor com chave em hardware; o pipeline recusa tag não assinada.
- Passo a passo de configuração: [docs/runbooks/assinatura.md](docs/runbooks/assinatura.md).

## Idioma

Código e identificadores em inglês; interface, documentação, issues e commits em português do Brasil.

## Contribuições de agentes de IA

Agentes seguem o [CLAUDE.md](CLAUDE.md) e os papéis de `.claude/agents/`. Commits feitos por IA levam o trailer `Co-Authored-By`. Nenhum agente lê ou manipula chaves privadas.

## Segurança

Vulnerabilidade não vai em issue pública: veja o [SECURITY.md](SECURITY.md).
