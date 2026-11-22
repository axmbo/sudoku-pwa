# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Ao retomar, leia este arquivo e o plano abaixo.

- **Fase:** 0 (bootstrap do processo), na branch `chore/fase-0`.
- **Plano aprovado:** [docs/process/plano-fase-0.md](process/plano-fase-0.md). No passo 4, o conteúdo passa para `PROCESSO.md`/ADRs.
- **Passo atual:** 1 concluído.
  - nvm 0.41.0 e Node 26.13.1 (npm 11.20.0) instalados; o default global continua 22.17.1.
  - O `.nvmrc` fixa 26.13.1. Nos comandos Bash do projeto, prefixar `. ~/.nvm/nvm.sh && nvm use`.
  - Passo 1.3 (`cdnvm` no `~/.bashrc`): comando entregue ao Diretor, aguardando execução.
- **Passo 2 concluído:** resultado e decisões derivadas em [conferencia-claude-code.md](process/conferencia-claude-code.md).
- **Próximo:** passo 3, ADR da plataforma (devsecops, pesquisa nas docs atuais), com pausa para o Diretor aprovar.

## Decisões do Diretor (22/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas ficam para o pós-MVP.
2. UI e (5) persistência: o arquiteto decide em ADR.
3. Licença MIT.
4. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`.
6. Referência de dispositivo: Android modesto.
7. Subagentes em sonnet por padrão; opus só com justificativa.
8. Código em inglês; UI e documentação em pt-BR.

## Regras da execução da Fase 0

- Ao fim de cada passo: commit, depois entregar hash, resumo de ≤ 5 linhas e o que conferir no diff. O real de tokens sai do log jsonl da sessão (ver `metricas.md`); a extensão não tem `/cost`.
- Todo Bash proposto começa a descrição com uma etiqueta de risco:
  - `[LEITURA]`: só consulta;
  - `[REPO]`: escreve dentro do repositório;
  - `[FORA]`: escreve fora do repositório ou instala algo;
  - `[CRÍTICO]`: apaga, faz push, mexe em chaves ou credenciais.

  Em `[FORA]` e `[CRÍTICO]`, uma linha diz o que muda e como desfazer. No passo 4 esta regra vai para o `CLAUDE.md`.
- Depois dos passos 3, 5 e 7: sugerir `/clear` + retomada.
- Tokens conforme `docs/process/metricas.md`.

## Pendências

- Nenhuma.
