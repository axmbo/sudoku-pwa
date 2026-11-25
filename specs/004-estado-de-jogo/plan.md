# Plano 004 — Estado de jogo (anotações, desfazer/refazer, vitória, serialização)

- **Spec:** [spec.md](spec.md) · **Autor:** `arquiteto`
- **ADRs:** [0007](../../docs/adr/0007-convencoes-do-dominio.md) (Result, `unknown` na fronteira, 0–8, imutável e congelado), [0004](../../docs/adr/0004-persistencia-local.md) (envelope `game` com `schemaVersion`, puzzle completo, histórico), [0001](../../docs/adr/0001-stack-e-ferramentas.md) (orçamento). **Nenhum ADR novo** (ver "Decisões do plano").

## Módulos e fronteiras

Tudo em `src/domain/`, puro (sem DOM, relógio, `Math.random`, I/O). Cada arquivo importa só os de cima na lista (ordem real: `puzzle`, `notes`, `history`, `game`, `serialize`); nada importa de `src/persistence/` nem de UI.

| Arquivo | Papel | Importa |
|---|---|---|
| `puzzle.ts` (novo) | `Puzzle`, `createPuzzle(unknown)`: valida pistas, solução completa e consistente | `board`, `conflicts`, `digit`, `result` |
| `notes.ts` (novo) | `Notes` (conjunto ordenado), `toggleNote`, `emptyNotes` | `digit` |
| `history.ts` (novo) | `Move`, `CellMemo`, `HistoryEntry` (tipos, T01), `applyMove` interno, `undo`/`redo` | `board` (valores), `notes`, `digit`, `units` |
| `game.ts` (novo) | `Game`, `createGame`, leituras (`notesAt`, `getGameStatus`, `getGameConflicts`, `canUndo`, `canRedo`), jogadas e `commit` do histórico | `board`, `conflicts` (`CellConflict`), `history`, `notes`, `puzzle`, `units`, `result` |
| `serialize.ts` (novo) | `serializeGame`, `deserializeGame` (inclui replay de validação) | `game`, `history`, `puzzle` |
| `board.ts` | **não muda** (só reusa `placeValue`, `eraseValue`, `cellAt`, `getConflicts`) | |

`Board` permanece só valores e pistas; anotações vivem no `Game` (evita tocar 001 e `board.test.ts`). Não se cria `src/domain/index.ts` aqui (a 005 decide a fachada).

## Tipos públicos

```ts
// puzzle.ts — `difficulty` e `seed` são strings opacas aqui; a spec 003 (ADR 0005) tipa o nível.
export interface Puzzle {
  readonly givens: Grid;            // 9x9, null = vazio
  readonly solution: Grid;          // 9x9 completo, válido, consistente com givens
  readonly difficulty: string;      // não vazio
  readonly seed: string;            // não vazio
  readonly generatorVersion: number; // inteiro >= 1
}
export type PuzzleRefusal = 'malformed-puzzle' | 'conflicting-givens' | 'invalid-solution';
export function createPuzzle(input: unknown): Result<Puzzle, PuzzleRefusal>;

// notes.ts
export type Notes = readonly Digit[]; // crescente, sem repetição, congelado

// history.ts
export type Move =
  | { readonly kind: 'place'; readonly index: number; readonly digit: Digit }
  | { readonly kind: 'erase'; readonly index: number }
  | { readonly kind: 'toggle-note'; readonly index: number; readonly digit: Digit }
  | { readonly kind: 'clear-notes'; readonly index: number };
export interface CellMemo { readonly value: Digit | null; readonly notes: Notes } // conteúdo da célula ANTES da jogada
export interface HistoryEntry { readonly move: Move; readonly before: CellMemo }

// game.ts
export interface Game {
  readonly puzzle: Puzzle;
  readonly board: Board;                    // valores atuais (pistas inclusas)
  readonly notes: readonly Notes[];         // 81, índice row*9+col
  readonly history: readonly HistoryEntry[]; // todas as jogadas feitas, inclusive as desfeitas
  readonly cursor: number;                  // 0..history.length; history[0..cursor) está aplicado
}
export type GameStatus = 'incomplete' | 'full-incorrect' | 'won';
export function createGame(input: unknown): Result<Game, PuzzleRefusal>;
export function getGameStatus(game: Game): GameStatus;       // derivado, nunca gravado
export function getGameConflicts(game: Game): readonly CellConflict[];
export function notesAt(game: Game, row: Index, col: Index): Notes;
export function canUndo(game: Game): boolean;                 // fatos explícitos para a UI (H5)
export function canRedo(game: Game): boolean;

export type GamePlaceRefusal = PlaceRefusal | 'game-over';
export type GameEraseRefusal = EraseRefusal | 'game-over';
export type NoteRefusal = 'game-over' | 'cell-not-found' | 'invalid-value' | 'cell-is-given' | 'cell-has-value';
export type ClearNotesRefusal = 'game-over' | 'cell-not-found' | 'cell-is-given';
export type UndoRefusal = 'game-over' | 'nothing-to-undo';
export type RedoRefusal = 'game-over' | 'nothing-to-redo';
export function gamePlace(g: Game, row: unknown, col: unknown, value: unknown): Result<Game, GamePlaceRefusal>;
export function gameErase(g: Game, row: unknown, col: unknown): Result<Game, GameEraseRefusal>;
export function gameToggleNote(g: Game, row: unknown, col: unknown, digit: unknown): Result<Game, NoteRefusal>;
export function gameClearNotes(g: Game, row: unknown, col: unknown): Result<Game, ClearNotesRefusal>;
export function gameUndo(g: Game): Result<Game, UndoRefusal>;
export function gameRedo(g: Game): Result<Game, RedoRefusal>;

// serialize.ts
export const GAME_FORMAT_VERSION = 1;
export function serializeGame(game: Game): string; // texto JSON do envelope do ADR 0004
export type DeserializeRefusal = 'invalid-data' | 'future-version' | 'inconsistent-data';
export function deserializeGame(input: unknown): Result<Game, DeserializeRefusal>;
```

### Regras de comportamento

Todas ancoradas em CA:

- **Precedência de recusa** (como a 001, CA-001-25): `game-over` > `cell-not-found` > `invalid-value` > `cell-is-given` > `cell-has-value`. Em `gameUndo`/`gameRedo`: `game-over` > `nothing-to-*`.
- **Jogada sem efeito devolve `ok` com a mesma referência de `Game`** (sem entrada no histórico, sem descartar o que é refazível): colocar o valor que a célula já tem, apagar célula vazia, limpar anotações de célula sem anotações (CA-004-07, 18).
- **Jogada nova** (`gamePlace`, `gameErase`, `gameToggleNote`, `gameClearNotes` com efeito) trunca `history` em `cursor` e acrescenta a entrada (CA-004-15). `gameUndo`/`gameRedo` só movem `cursor` e restauram a célula com `before`/`move`.
- **Colocar valor** limpa as anotações da própria célula e só ela (CA-004-08, 10); **apagar valor** deixa a célula vazia sem anotações (CA-004-09). Desfazer restaura `before` inteiro (valor e anotações).
- **Vitória** = grade cheia, sem conflito e igual à `puzzle.solution`; `getGameStatus` calcula na hora (CA-004-19 a 22, 31). `'full-incorrect'` = cheia e não vencida (CA-004-20). Nenhuma conferência contra a solução antes disso (CA-004-33). Partida `won` recusa tudo com `game-over` (CA-004-23).
- **`createGame` e `createPuzzle` são o contrato de entrada** para a 003 e a 005; solução contradizendo pistas ou grade incompleta vira `invalid-solution`. A unicidade da solução é da 003, não daqui.

### Formato serializado (v1, ADR 0004)

`serializeGame` devolve JSON compacto (sem espaços nem quebras de linha, como `JSON.stringify` sem indentação; o bloco abaixo está quebrado só para leitura) com chaves em ordem fixa, no envelope do `game` do ADR 0004 (assim a B-06 grava o objeto sem remontar). O compacto faz parte do formato: CA-004-26 exige texto idêntico byte a byte.

```
{"schemaVersion":1,"data":{
  "puzzle":{"givens":"<81 chars, . = vazio>","solution":"<81 dígitos>","difficulty":"..","seed":"..","generatorVersion":1},
  "values":"<81 chars, . = vazio, como em givens>", "notes":[<81 inteiros, bit d-1 = dígito d>],
  "moves":[[<0 place|1 erase|2 toggle-note|3 clear-notes>,<índice>,<dígito ou 0>], ...],
  "cursor":<int>}}
```

- **Fica fora** (CA-004-31): conflitos, status/vitória, `before` das entradas, tempo (B-07; o ADR 0004 põe o timer no envelope `game`, então acrescentá-lo depois muda o schema: entra como `schemaVersion` 2 com migração `v1 -> v2`, a registrar em B-06/B-07). Isso mantém o dado enxuto e sem redundância derivável.
- `deserializeGame` ordem: (1) texto vazio, JSON inválido, não objeto, `schemaVersion` ausente ou não inteiro ≥ 1 → `invalid-data`; (2) `schemaVersion` > 1 → `future-version` (antes de olhar o resto, sem tocar no dado); (3) campo obrigatório ausente ou de tipo errado → `invalid-data`; (4) incoerência → `inconsistent-data`: puzzle recusado por `createPuzzle`, valor sobre pista diferente do dado, anotação em célula com valor ou em pista, `cursor` fora de `0..moves.length`, jogada que o jogo recusaria (replay), estado após o replay de `moves[0..cursor)` diferente de `values`/`notes`, `moves[cursor..)` não reaplicável em sequência (CA-004-25 exige refazer funcionar), partida vencida antes do último movimento aplicado ou com refazíveis restantes. O replay também recalcula `before`.
- O replay usa arrays locais mutáveis dentro da função (não exportados) e congela o resultado; a API pública continua imutável (ADR 0007).

### Tamanho do jogo serializado (decisão 5; medição de 24/11/2026)

Medido com `node` (script descartável; formato acima; 81 anotações cheias; desktop, não o dispositivo de referência):

| Jogadas | Bytes (JSON) | `stringify` | `parse` | `structuredClone` (proxy da escrita no IndexedDB) |
|---|---|---|---|---|
| 500 | 5.173 (~5 kB) | 0,06 ms | 0,17 ms | 0,38 ms |
| 2.000 | 18.490 (~18 kB) | 0,28 ms | 0,51 ms | 1,1 ms |
| 10.000 | 89.502 (~90 kB) | 1,1 ms | 2,3 ms | 5,8 ms |
| 50.000 | 444.565 (~445 kB) | 6,6 ms | 13,4 ms | 34,9 ms |

Conclusão: o custo é ~9 bytes por jogada mais ~0,9 kB fixos; uma partida real (centenas a poucos milhares de jogadas) fica em alguns kB, muito abaixo de qualquer cota do IndexedDB (ADR 0004) e do limite de 5 MiB que já seria folgado. **Cabe sem problema.** O ponto de atenção é o ADR 0004 gravar o jogo "a cada jogada": a escrita é O(histórico). Em dispositivo modesto o custo pode ser várias vezes o da tabela (extrapolação, **não medida**); até ~2.000 jogadas é desprezível, em 10.000+ vira ms perceptíveis. Mitigação, que é da B-06 e não desta spec: o ADR 0004 já admite agrupar escritas desde que `visibilitychange`/`pagehide` gravem na hora. Registrar na B-06.

## Estratégia de teste

Todos em Vitest; propriedades em `*.prop.test.ts` com `fast-check`; mutation (Stryker) incremental sobre os arquivos novos. Sem UI: nenhum E2E nem a11y. Nome do teste `it('CA-004-NN: ...')`.

| CA | Camada | Observação |
|---|---|---|
| CA-004-01 | unit | alternar liga e desliga; demais anotações intactas; coordenadas assimétricas (2,7) |
| CA-004-02 | unit + prop | ordem de inserção 7,2,4 → 2,4,7; prop: qualquer sequência de toggles dá lista crescente sem repetição |
| CA-004-03 | unit | `cell-is-given`; `Game` idêntico e histórico igual |
| CA-004-04 | unit | `cell-has-value` |
| CA-004-05 | unit (`it.each`) | dígito 0, 10, 2,5, texto, vazio → `invalid-value`; linha/coluna fora → `cell-not-found`; motivos distintos |
| CA-004-06 | unit | anotação 5 aceita com 5 na linha; `getGameConflicts` não muda |
| CA-004-07 | unit | uma entrada desfazível; sem anotações → `ok` com mesma referência e histórico igual |
| CA-004-08 | unit | valor 9 limpa 2 e 9; desfazer devolve vazia com 2 e 9 |
| CA-004-09 | unit | apagar deixa vazia sem anotações; desfazer devolve o valor |
| CA-004-10 | unit | vizinhos mantêm anotação 6; uma só entrada no histórico |
| CA-004-11 | unit | volta a valores e anotações de antes; `canRedo` verdadeiro |
| CA-004-12 | unit | refazer = estado de antes de desfazer |
| CA-004-13 | unit | `nothing-to-undo`, estado igual |
| CA-004-14 | unit | `nothing-to-redo` em partida sem desfazer e depois de refazer tudo |
| CA-004-15 | unit | jogada nova zera `canRedo` |
| CA-004-16 | prop | 500 jogadas válidas geradas, escolhidas para não vencer; desfaz tudo = inicial; refaz tudo = igual; numRuns reduzido pelo custo |
| CA-004-17 | unit + prop | um exemplo por tipo de jogada; prop: `gameUndo(apply(g,m)) = g` para jogada aceita que **não vence** (decisão 3: após a vitória desfazer é recusado); prop: jogada que vence ⇒ `gameUndo` recusa com `game-over` e o estado segue `won` |
| CA-004-18 | unit + prop | recusas e jogadas sem efeito não mudam histórico nem `canRedo` |
| CA-004-19 | unit | uma célula vazia, coloca o 3 → `won` |
| CA-004-20 | unit | cheia com erro, com e sem conflito → `full-incorrect` ≠ `incomplete` |
| CA-004-21 | unit + prop (T05 unit; T06 prop) | incompleta nunca `won`, mesmo com tudo certo |
| CA-004-22 | prop | `won` ⇒ sem conflitos; com conflito ⇒ não `won` (invariante 10) |
| CA-004-23 | unit (`it.each`) | seis operações em `won` → `game-over`; mesma referência e histórico |
| CA-004-24 | prop | após sequência qualquer de jogadas/undo/redo, `puzzle` e pistas iguais ao original |
| CA-004-25 | unit + prop | `deserialize(serialize(g))` igual a `g` (invariante 7), com refazíveis e undo até o início |
| CA-004-26 | unit | `schemaVersion` inteiro ≥ 1; duas serializações idênticas (bytes) |
| CA-004-27 | unit | versão 2 e 99 → `future-version`, entrada não alterada |
| CA-004-28 | unit (`it.each`) | `''`, texto livre, campo ausente, tipo errado, versão ausente/`1.5`/`'1'`/`0` → `invalid-data`, sem lançar |
| CA-004-29 | unit (`it.each`) | cinco incoerências da spec + extras do plano (refazíveis inaplicáveis, vitória antes do fim) → `inconsistent-data` |
| CA-004-30 | unit | partida `won` volta `won` com o mesmo histórico |
| CA-004-31 | unit | texto serializado não contém conflitos nem status; recalculados iguais ao ler |
| CA-004-32 | unit | toggles 2, 5, 8 e um `gameUndo` → só o 8 sai |
| CA-004-33 | unit | colocar 7 onde o correto é 3, sem conflito → aceito, `incomplete`, sem sinal de erro |
| `INV:` createPuzzle/createGame | unit | recusas `malformed-puzzle`, `conflicting-givens`, `invalid-solution`; sem CA próprio, é pré-condição de CA-004-24 e 29 (declarar `INV:` no teste) |

Organização dos testes (estado, decisão 7): os testes novos já nascem divididos por assunto (`puzzle`, `notes`, `game.notes`, `game.values`, `game.history`, `game.status`, `serialize`, `deserialize`, `*.prop`), cada um cabendo em um manifesto. `board.test.ts` (~8,2k tokens) **não cresce** nesta spec (`board.ts` não muda), então dividi-lo **não entra como tarefa da 004**; fica como chore de refatoração pura a fazer antes da próxima spec que o altere (a 003 ou depois). Arbitrários novos (`__arbitraries__/moves.ts`, jogada válida a partir de um `Game`) são da `eng-testes`.

## Orçamento de performance

- **Bundle (ADR 0001, JS inicial ≤ 60 kB gzip):** o domínio novo é código sem dependência, dominado por laços sobre 81 células. Tamanho gzip **n/d**: será medido no primeiro build com a UI (spec 005); espera-se pequeno frente ao orçamento, hipótese não medida. Sem dependência nova.
- **Tempo:** cada jogada aloca um `Board` de 81 células, um array `notes` de 81 referências e uma entrada de histórico (compartilhamento estrutural nas anotações não alteradas); o custo é desprezível frente a um quadro de renderização, por estimativa ainda não medida (o ADR 0007 já registrava "não medido"). `gameUndo`/`gameRedo` são O(1) (usam `before`). `deserializeGame` é O(jogadas): ver tabela acima (~2,3 ms de `parse` em 10.000 jogadas, mais o replay, a medir na T08).
- **Memória:** histórico guarda uma `HistoryEntry` por jogada (poucas dezenas de bytes); sem limite por decisão de produto.

## Decisões do plano

1. **Anotações no `Game`, não no `Board`:** mantém 001 intacta (`board.ts` e seus 390 testes). Alternativa descartada: estender `CellState` com `notes`, que reabriria 001.
2. **Histórico com `before` em memória, só comandos no disco:** desfazer O(1); o dado gravado leva só a jogada, e o replay na leitura valida coerência (CA-004-29) e reconstrói `before`. Alternativa descartada: gravar `before` (redundante e exige validar contra o replay mesmo assim).
3. **String JSON determinística como saída de `serializeGame`**, no envelope `{schemaVersion, data}` do ADR 0004: a B-06 grava sem remontar e a versão do formato é a `schemaVersion` do envelope (uma só versão a migrar). Não há decisão nova de arquitetura: aplica o ADR 0004. Confirmado pelo Diretor em 24/11/2026 (texto, não objeto).
4. **Sem ADR novo.** Nenhuma escolha fere ADR aceito nem constituição; as convenções (recusa como valor, `unknown`, 0–8, imutável) vêm do 0007.
5. **Nomes `game*`** (`gamePlace`, …) evitam colidir com `placeValue`/`eraseValue` do `board.ts`, que continuam sendo a regra de célula.

## Riscos

- **Escrita O(histórico) a cada jogada na B-06** → tabela acima; levar a mitigação à B-06 (agrupar com flush em `visibilitychange`/`pagehide`).
- **`difficulty`/`seed` como `string` opaca** pode divergir do tipo que a 003 definir → `createPuzzle` é o único ponto a ajustar; a 003 deve reutilizar `Puzzle` e estreitar `difficulty`. Não confirmado se o nível será união de literais.
- **Replay na leitura em histórico enorme** (dezenas de milhares) → linear e com arrays locais; teste de leitura com 10.000 jogadas na T08 como regressão de tempo (limiar a calibrar, não inventado aqui).
- **Mutantes na validação de `deserialize`** (muitas ramificações) → `it.each` por incoerência da spec e dos extras; mutante equivalente justificado em `notas.md`.
- **Spec silenciosa em dois pontos**, resolvidos pelo Diretor em 24/11/2026 sem CA novo: limpar anotações em célula com valor é no-op `ok` sem entrada no histórico (em pista, `cell-is-given`); jogada sem efeito (CA-004-18) devolve `ok` com a mesma referência de `Game`.
