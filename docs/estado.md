# Estado do projeto

> Snapshot vivo para retomada. Máximo de 40 linhas. Ao retomar, leia este arquivo e o plano abaixo.

- **Fase:** 0 (bootstrap do processo), na branch `chore/fase-0`.
- **Plano aprovado:** [docs/process/plano-fase-0.md](process/plano-fase-0.md). No passo 4, o conteúdo passa para `PROCESSO.md`/ADRs.
- **Passo atual:** 0 concluído. Próximo: passo 1 (Node 26.13.1 via nvm, guiado).

## Decisões do Diretor (22/11/2026)

1. MVP: níveis, conflitos, anotações + undo/redo, timer + estatísticas, desafio diário. Dicas ficam para o pós-MVP.
2. UI e (5) persistência: o arquiteto decide em ADR.
3. Licença MIT.
4. nvm + `.nvmrc` com a versão exata; o CI usa `node-version-file`.
6. Referência de dispositivo: Android modesto.
7. Subagentes em sonnet por padrão; opus só com justificativa.
8. Código em inglês; UI e documentação em pt-BR.

## Regras da execução da Fase 0

- Ao fim de cada passo: commit, depois entregar hash, resumo de ≤ 5 linhas e o que conferir no diff; pedir `/cost`.
- Todo Bash proposto diz em uma linha o que faz e se mexe fora do repositório.
- Depois dos passos 3, 5 e 7: sugerir `/clear` + retomada.
- Tokens conforme `docs/process/metricas.md`.

## Pendências

- Real do passo 0: aguardando o `/cost` do Diretor.
