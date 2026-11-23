---
name: retomar
description: Retoma o trabalho do Sudoku PWA depois de /clear ou de uma sessão nova, só a partir dos arquivos (L0 + L1).
disable-model-invocation: true
---

# /retomar

1. Leia `docs/estado.md` (se o hook `SessionStart` já o injetou, não releia) e `docs/constituicao.md`. O `CLAUDE.md` já está carregado.
2. Se o estado apontar uma spec ativa, leia só o cabeçalho e os CA de `specs/NNN-*/spec.md` e a tarefa atual em `tasks.md`; nada além do manifesto dela.
3. Confira `git status` e `git log --oneline -5` para ver se o repositório bate com o estado. Divergência: relate antes de agir.
4. Responda ao Diretor, em até 10 linhas:
   - onde estamos (fase/ciclo, spec, tarefa);
   - próximo passo concreto;
   - critério de saída da revisão e orçamento de contexto vigentes;
   - pendências do Diretor (numeradas, com as de antes marcadas).
5. Espere confirmação antes de executar algo caro ou difícil de desfazer.
