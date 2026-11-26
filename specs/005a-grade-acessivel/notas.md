# Notas da 005a

## T01 (26/11/2026)
- Puzzle fixo: exemplo clássico do artigo "Sudoku" da Wikipédia (30 pistas). A solução foi digitada de memória pelo dev e validada por `createGame` e pelo teste de unicidade (força bruta, só no teste).
- Manifesto da T01 era pobre: 3 leituras fora na eng-testes (`vitest.config.ts`, assinaturas de `gamePlace`/`findConflicts` além de L1-60, `PROCESSO.md` §6 "Motivo do vermelho"). Sugestão: manifestos de UI trazerem assinaturas dos exports de domínio usados e a seção §6 quando houver RED.

## T02 (26/11/2026)
- `moveSelection` (navegação, CA-005-07 a 09): RED `c60ecaf` (27 testes: 21 exemplos + 6 propriedades), GREEN `7e33c60`, REFACTOR pulado. `npm run check` verde, 706 testes, cobertura 100%.
- Real: eng-testes 43,0k (87,3 s, 3 leituras fora do manifesto: `tasks.md` seção T02, `vitest.config.ts`, grep da convenção de seed em `src/domain/*.prop.test.ts`); dev 30,9k (42,0 s, 0 leituras fora). Total 73,9k contra 60k prováveis (1,23x). Orquestrador n/d.
- Reancoragem após T01+T02: real 145,5k contra 140k (1,04x), T03-T08 mantidos no provável; âncora nova 1,74M (faixa 1,25M a 2,76M), detalhe na linha `ciclo-completo` de `docs/process/metrics.csv`. Próxima: após T05.
- Sugestão (manifesto): a convenção de seed das propriedades e o projeto `ui` do `vitest.config.ts` poderiam entrar nos manifestos de teste de UI (leituras repetidas em T01 e T02).
- **Descoberta, teste instável por tempo:** na 1ª rodada do `npm run check` com a suíte inteira em paralelo (load average ~3,6), `src/domain/game.prop.test.ts` > "CA-004-22: won se e só se..." estourou o timeout de 5000 ms (5167 ms). Isolado roda em ~1,2 s (3 de 3 verdes) e a 2ª rodada do gate passou. Pré-existente da 004, não da T02. Proposta: issue `débito` no GitHub (a cargo do Diretor; não criada) e/ou candidata M-016 em `docs/process/melhorias.md` (já registrada); correção possível: reduzir `numRuns` ou `timeout` explícito no teste, via item de backlog próprio.

## T03 (26/11/2026)
- `messages.ts` (textos e nomes acessíveis): RED `1b211b9` (21 testes: CA-005-02, 03, 15, 19, 20, 21, 29, 30, 36), GREEN `85d8e9b`, REFACTOR pulado (código limpo). Textos aprovados pelo Diretor, fixados em `b4434ba`: `won` = "Parabéns, você venceu!", `fullWithErrors` = "Grade completa, mas há erros. Corrija para vencer.".
- Real: eng-testes 43,3k (98,8 s), dev 36,3k (129,3 s); total 79,5k contra 60k prováveis (1,33x). Orquestrador n/d.
- Leituras fora do manifesto: eng-testes leu `spec.md` CA-005-15, 21, 29 e 30 (texto de `givenImmutable`, `noConflicts`, `won`, `fullWithErrors`); dev leu `package.json` (scripts) e fez grep em `docs/estado.md`.
- **Descoberta (manifesto):** o manifesto da T03 não listava os CA das constantes; manifestos de tarefas com textos fixos devem trazer os CA correspondentes. A T04 lê `messages.ts` (o manifesto já prevê).
- **Débito #23 corrigido:** `game.prop.test.ts` CA-004-22 falhou o gate 4 de 4 na suíte completa (5,6 s > 5 s), inclusive sem carga paralela; isolada ~1,2 s; na suíte 2654 ms com `--testTimeout=60000`. Fix `55c4efa` (timeout próprio de 30 s; rodadas e seeds intactas), feito pelo orquestrador (tokens n/d); `npm run check` verde, 34 arquivos, 725 testes. A issue #23 fecha com o PR da 005a (`Refs #23`).

## T04 (26/11/2026)
- `reducer.ts` (reducer da UI e política de anúncio, 11 CA): RED `ef81d89` (42 testes: 34 unitários + 8 propriedades), ajuste do RED `9dbd375` (timeout de 30 s nas propriedades), GREEN `6b5b718`, REFACTOR pulado. `npm run check` verde (orquestrador): 36 arquivos, 767 testes, cobertura 100% (branches 243/243).
- Real (log jsonl, dedup por `message.id`): eng-testes 120,3k (2 rodadas no mesmo contexto; notificações diziam 85.772 e 90.783), dev 55,5k (2 rodadas; notificações 51.265 e 52.903); total 175,8k contra 130k prováveis (1,35x). Minutos pelas notificações: 8,2 e 5,5. Orquestrador n/d. T01-T04: 400,8k contra 330k (1,21x).
- Leituras fora do manifesto: eng-testes 1 (`navigation.prop.test.ts`, estilo das propriedades); dev 2 (`src/domain/game.ts#L130-186`, que se sobrepõe ao manifesto, e `git show 55c4efa`, o precedente do timeout).
- **Divergência do plano (decisão 2, "`id` nunca decresce e não avança sem anúncio novo"):** o `UiState` do plano não tem contador. O `dev` adotou `id = (anúncio anterior?.id ?? 0) + 1`, então o `id` volta a 1 depois de uma ação sem anúncio. Para o `Announcer` não muda nada (o `null` intermediário desmonta o nó). Diretor (26/11/2026, decisão 18): aceito pela (a); só o texto da decisão 2 do plano foi corrigido.
- **Descoberta (processo):** propriedades fast-check da UI também precisam de timeout próprio (`PROP_TIMEOUT = 30_000`); custou uma rodada extra de eng-testes e dev. Candidata M-017.
- Precedência: pares impossíveis numa mesma jogada (vitória × grade cheia com erros; conflito criado × `noConflicts`) não têm teste. Testados: vitória > noConflicts, cheia com erros > conflito criado, cheia com erros > conteúdo, conflito criado > conteúdo, `noConflicts` > conteúdo.
