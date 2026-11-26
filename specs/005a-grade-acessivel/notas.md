# Notas da 005a

## T01 (26/11/2026)
- Puzzle fixo: exemplo clássico do artigo "Sudoku" da Wikipédia (30 pistas). A solução foi digitada de memória pelo dev e validada por `createGame` e pelo teste de unicidade (força bruta, só no teste).
- Manifesto da T01 era pobre: 3 leituras fora na eng-testes (`vitest.config.ts`, assinaturas de `gamePlace`/`findConflicts` além de L1-60, `PROCESSO.md` §6 "Motivo do vermelho"). Sugestão: manifestos de UI trazerem assinaturas dos exports de domínio usados e a seção §6 quando houver RED.
