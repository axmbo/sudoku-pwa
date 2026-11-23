# Sudoku PWA — regras de ouro e mapa (L0)

Carregado em toda sessão e em todo subagente próprio. Limite: 80 linhas. Detalhe mora em [PROCESSO.md](PROCESSO.md) (fonte única), nas skills e nos agentes; aqui só regra de ouro e ponteiro.

## Ao começar

1. Leia `docs/estado.md` (o hook `SessionStart` já o injeta) e `docs/constituicao.md`.
2. Leia só o que a tarefa pede (manifesto). Fora dele, justifique no retorno.
3. Retomada completa: `/retomar`.

## Regras de ouro

1. **Gates baratos antes de caros.** Nada vai para revisão por LLM antes de `npm run check` verde.
2. **Ponteiros, não conteúdo.** Ao delegar, passe caminhos e seções, nunca arquivos colados.
3. **Saída em arquivo, retorno curto.** Subagente grava em arquivo e devolve ≤ 15 linhas: o que fez, onde gravou, pendências, tokens/tempo se houver.
4. **Revisão só do diff.**
5. **Modelo certo.** `sonnet` por padrão; `opus` só com justificativa escrita; `haiku` para o mecânico.
6. **Um item de backlog por ciclo**, com commit ao final.
7. **Nunca invente métricas.** Sem número real, `n/d` (ver `docs/process/metricas.md`).
8. **Pare e pergunte** quando a decisão for cara de desfazer e puder ir para mais de um lado.
9. **Spec antes de código.** Sem `spec.md` aprovada e `tasks.md` derivada, não há código.
10. **Contexto é orçamento.** 15 mil tokens de contexto inicial por subagente; limpar entre tarefas e retomar por `estado.md`.
11. **TDD por padrão.** Isenção só da lista fechada de `PROCESSO.md` §6, declarada em `tasks.md`.
12. **Sem duplicação.** Um único `README.md` (na raiz); regra tem um dono e os outros apontam.
13. **Confira o formato do Claude Code instalado** antes de criar agente, skill ou hook (`docs/process/conferencia-claude-code.md`).

## Segurança e Bash

- Nenhum agente lê, copia, gera ou move chave privada, nem pede passphrase. Comandos com chave privada são do Diretor.
- Toda descrição de comando Bash começa com uma etiqueta de risco:
  - `[LEITURA]`: só consulta;
  - `[REPO]`: escreve dentro do repositório;
  - `[FORA]`: escreve fora do repositório ou instala algo;
  - `[CRÍTICO]`: apaga, faz push, mexe em chaves ou credenciais.

  Em `[FORA]` e `[CRÍTICO]`, uma linha diz o que muda e como desfazer.
- Comandos de Node no projeto: prefixe `. ~/.nvm/nvm.sh && nvm use` (o shell da ferramenta não troca de versão sozinho).

## Git

- Nunca commitar em `main`. Branch `<tipo>/NNN-slug` (com issue/spec) ou `<tipo>/slug`.
- Conventional Commits: tipo em inglês, descrição em português, trailer `Co-Authored-By` nos commits da IA.
- O merge é sempre do Diretor (rebase merge). Detalhe: skill `git-fluxo`.

## Idioma

Código e identificadores em inglês; UI, documentação, commits e chat em pt-BR. Glossário: skill `dominio-sudoku`.

## Mapa

| O quê | Onde |
|---|---|
| Processo (papéis, SDD, ciclo, gates, TDD, Git, CI, PDCA) | `PROCESSO.md` |
| Princípios imutáveis | `docs/constituicao.md` |
| Estado vivo | `docs/estado.md` |
| Produto | `docs/produto/visao.md`, `docs/produto/backlog.md` |
| Decisões | `docs/adr/` |
| Specs e templates | `specs/`, `specs/_templates/` |
| Agentes / skills | `.claude/agents/`, `.claude/skills/` |
| Métricas e melhorias | `docs/process/` |
