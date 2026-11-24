# Resumo 001 — Tabuleiro e validação de conflitos

- **Entregou:** o domínio puro do tabuleiro: criar tabuleiro com pistas, detectar conflitos (linha, coluna, bloco), colocar e apagar valores com recusa tipada, imutável e sem I/O. Ainda sem UI.
- **CA:** 25 critérios (CA-001-01 a 25), todos citados em testes; [PR #2](https://github.com/axmbo/sudoku-pwa/pull/2); merge em 24/11/2026.
- **Decisões que ficam:** [ADR 0007](../../../docs/adr/0007-convencoes-do-dominio.md); `PlaceRefusal`/`EraseRefusal` separados (R1-02); exceção pontual de TDD do R1-01 (M-005, decidir); `tsc-red-filter` no pre-commit (v0.4); M-004 promovida (v0.5).
- **Números:** tokens est./real 900k/836,9k de subagentes nas 7 tarefas (0,93×; 500k originais); com extra do pre-commit (63k) e revisão (281k) subagentes somam 1,21M; orquestrador (opus) n/d nas tarefas e 127k parcial na revisão · minutos: 59 min de subagentes nas tarefas (min_real), relógio total n/d · rodadas de revisão 2 (r1: 1 major, 2 minor, 1 nit; r2 sai) + 5 achados no PR · cobertura 100% · mutation 100% (equivalentes marcados com `Stryker disable`) · 390 testes.
- **Dívidas abertas:** [#3](https://github.com/axmbo/sudoku-pwa/issues/3) (congelar `ALL_UNITS`, `unitCells`, `CellConflict`) e [#4](https://github.com/axmbo/sudoku-pwa/issues/4) (texto da `tasks.md`: `test:mut`, regra 9, T02, N6).
- **Onde está o detalhe:** `specs/_arquivo/001-tabuleiro-conflitos/` (`notas.md`, `revisao-r1.md`, `revisao-r2.md`).
