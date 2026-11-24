# Plano 001 — Tabuleiro e validação de conflitos

- **Spec:** [spec.md](spec.md) · **Autor:** `arquiteto`
- **ADRs:** [0001](../../docs/adr/0001-stack-e-ferramentas.md) (stack, orçamento), [0005](../../docs/adr/0005-worker-e-gerador-deterministico.md) (domínio puro), [0007](../../docs/adr/0007-convencoes-do-dominio.md) (**Aceito**, 23/11/2026: recusa como valor, `unknown` na fronteira, índices 0–8, imutabilidade). Constituição: princípios 5, 9, 10.

## Módulos e fronteiras

Tudo em `src/domain/`, sem dependência fora dele (lint já proíbe DOM, relógio, `Math.random`, rede, timers, `ui/` e `worker/`). Nenhum módulo usa relógio ou PRNG: a spec não precisa de nenhum dos dois.

| Arquivo | Conteúdo | Pode importar |
|---|---|---|
| `digit.ts` (existe) | `Digit`, `isDigit(value: unknown): value is Digit` (alarga o parâmetro de `number` para `unknown`; testes atuais seguem válidos) | nada |
| `result.ts` | `Result<T, R>` | nada |
| `units.ts` | `Index`, `Unit`, `UnitKind`, `cellIndex(row, col)` (nasce na T01, usada por `cellAt`), `ALL_UNITS` (27), `unitCells(unit)` (T03) | `digit` (só tipos) |
| `conflicts.ts` | `findConflicts(values)` sobre 81 valores, puro e interno ao domínio | `digit`, `units` |
| `board.ts` | `CellState`, `Board`, `Grid`, `createBoard`, `placeValue`, `eraseValue`, `cellAt`, `getConflicts` e os tipos de recusa | `digit`, `result`, `units`, `conflicts` |

Sem ciclos: `conflicts.ts` não conhece `Board`; `board.ts` expõe `getConflicts(board)` como fachada. Sem barrel (`index.ts`) nesta spec. Não nascem `peers`, anotações, histórico nem vitória (escopo das specs 002 e 004).

## Tipos públicos

```ts
// digit.ts
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export function isDigit(value: unknown): value is Digit;

// result.ts
export type Result<T, R extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: R };

// units.ts
export type Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // linha, coluna ou bloco; UI soma 1
export type UnitKind = 'row' | 'column' | 'box';
export interface Unit { readonly kind: UnitKind; readonly index: Index }
export const ALL_UNITS: readonly Unit[]; // 27, ordem fixa: 9 row, 9 column, 9 box
export function unitCells(unit: Unit): readonly number[]; // 9 índices de célula (0–80), crescentes

// conflicts.ts (interno ao domínio)
export interface CellConflict {
  readonly row: Index;
  readonly col: Index;
  readonly value: Digit;
  readonly units: readonly [Unit, ...Unit[]]; // ordem fixa: row, column, box
}
export function findConflicts(values: readonly (Digit | null)[]): readonly CellConflict[];

// board.ts
// `CellState` = conteúdo de uma célula. O glossário (skill dominio-sudoku) usa `Cell` para a
// posição (linha, coluna); o tipo de conteúdo tem outro nome para não colidir. Posição = par (row, col).
export interface CellState { readonly value: Digit | null; readonly given: boolean }
export interface Board { readonly cells: readonly CellState[] } // 81, índice row*9+col; congelado
export type Grid = readonly (readonly (Digit | null)[])[];  // forma esperada da entrada (9x9, null = vazio)

export type CreateRefusal = 'malformed-grid' | 'conflicting-givens';
export type MoveRefusal = 'cell-not-found' | 'invalid-value' | 'cell-is-given';

export function createBoard(input: unknown): Result<Board, CreateRefusal>;
export function placeValue(board: Board, row: unknown, col: unknown, value: unknown): Result<Board, MoveRefusal>;
export function eraseValue(board: Board, row: unknown, col: unknown): Result<Board, MoveRefusal>;
export function cellAt(board: Board, row: Index, col: Index): CellState;
export function getConflicts(board: Board): readonly CellConflict[]; // vazio = sem conflito; ordenado por índice de célula
```

### Contrato das operações

- **`createBoard(input)`**: `input` é `unknown`; vazio = `null`; `0` e demais não-dígitos são "grade malformada". Cada célula com valor vira pista (`given: true`); as demais, `{ value: null, given: false }`. Recusa `'malformed-grid'` (forma ou conteúdo errado) antes de `'conflicting-givens'` (pistas em conflito, detectado por `findConflicts`).
- **`placeValue`**: valida nesta ordem, parando no primeiro motivo: (1) `row` e `col` inteiros de 0 a 8, senão `'cell-not-found'`; (2) `value` dígito, senão `'invalid-value'`; (3) célula não é pista, senão `'cell-is-given'` (vale mesmo com valor igual ao da pista). Aceito: novo `Board` com só essa célula diferente. Valor repetido na unidade é **aceito** (CA-001-15); o conflito aparece em `getConflicts`.
- **`eraseValue`**: ordem (1) célula existente, (2) não é pista. Célula já vazia: `ok` com tabuleiro de conteúdo idêntico (sem desvio especial no código; evita mutante equivalente).
- **`getConflicts`**: derivado só de `board.cells[].value`; nada é armazenado no `Board` (invariante 9). Cada célula envolvida aparece uma vez, com todas as unidades em que o valor dela repete. Unidade conta como "do conflito" para a célula se **outra** célula da mesma unidade tem o mesmo valor; logo duas células na mesma linha e no mesmo bloco aparecem com `row` e `box`. CA-001-11 exige `box` quando não há linha/coluna em comum; quando há, valem `row` e `box` (decisão do Diretor, 23/11/2026).
- **Imutabilidade:** `Board`, `cells` e cada `CellState` são `readonly` e `Object.freeze`d; operações devolvem novo `Board` reaproveitando as células não alteradas. Recusa não devolve tabuleiro, então "grade idêntica" (CA-001-24) vale por construção e é testada comparando o original antes e depois.
- **Motivos de recusa em inglês**; a UI (005) mapeia para pt-BR ("célula é pista", "valor inválido", "célula inexistente", "grade malformada", "pistas em conflito").

## Estratégia de teste

Convenção: o nome do teste cita o CA (`CA-001-07: ...`); arquivos `*.test.ts` (exemplos) e `*.prop.test.ts` (fast-check) ao lado do código; geradores em `src/domain/__arbitraries__/` (só `eng-testes` escreve). Propriedades-chave: **P1** pistas nunca mudam sob qualquer sequência de jogadas, aceitas ou recusadas; **P2** `getConflicts` coincide com um oráculo ingênuo (todos os pares de células com mesmo valor numa unidade); **P3** recusa nunca altera o tabuleiro e o motivo respeita a precedência; **P4** mesmo conteúdo por sequências diferentes dá o mesmo resultado (invariante 9).

| CA | Camada | Observação |
|---|---|---|
| CA-001-01 | unit + prop | 81 células, valores `null` ou 1–9; prop (T01): toda grade sem conflito gerada resulta em 81 células |
| CA-001-02 | unit + prop | pista ⇔ valor na entrada, mesma posição (prop sobre grades sem conflito) |
| CA-001-03 | unit | só a célula alvo muda |
| CA-001-04 | unit | valor anterior some |
| CA-001-05 | unit | só a célula alvo muda |
| CA-001-06 | unit | conteúdo idêntico, `ok` |
| CA-001-07 | unit + prop (P1/P3) | inclui valor igual ao da pista |
| CA-001-08 | unit + prop (P1/P3) | |
| CA-001-09 | unit + prop (P2) | cobre `row` |
| CA-001-10 | unit + prop (P2) | cobre `column` |
| CA-001-11 | unit + prop (P2) | caso sem linha/coluna em comum, para isolar `box` |
| CA-001-12 | unit + prop (P2) | 5 e 5 sem unidade em comum |
| CA-001-13 | unit | grade sem repetição; vazio |
| CA-001-14 | unit + prop (P2) | três repetições, todas marcadas |
| CA-001-15 | unit | aceito e marcado |
| CA-001-16 | unit | pista + célula do jogador em conflito; pista segue imutável |
| CA-001-17 | unit (T07) | conflito some após apagar/trocar; `board.invariants.test.ts`, tarefa isenta (invariante sobre estado existente) |
| CA-001-18 | unit + prop (P4), ambos na T07 | exemplo (`board.invariants.test.ts`) e duas sequências, mesmo conteúdo, mesmos conflitos (`board.prop.test.ts`) |
| CA-001-19 | unit | uma entrada com `row` e `column` |
| CA-001-20 | unit + prop (P3) | `it.each` de 0, 10, -1, 2.5, `NaN`, `'5'`, `null`, `undefined`, objeto; prop: qualquer não-dígito |
| CA-001-21 | unit + prop (P3) | -1, 9, 1.5, `NaN`, `'3'`, `null` em `row` e em `col`, em `placeValue` e `eraseValue` |
| CA-001-22 | unit + prop | linhas ≠ 9, linha com ≠ 9 células, célula `0`/`10`/`'5'`/`2.5`/`-0`/`NaN`/`Infinity`, array esparso, string de 9 caracteres, array-like, entrada que nem é array; prop: uma célula suja ⇒ `malformed-grid` |
| CA-001-23 | unit | duas pistas iguais em linha, em coluna e em bloco |
| CA-001-24 | unit + prop (P3) | motivos distintos entre si (um teste por motivo) e tabuleiro intacto |
| CA-001-25 | unit (`it.each`, tabela completa) | pista+inválido ⇒ `invalid-value`; célula inexistente+inválido ⇒ `cell-not-found`; malformada+conflito ⇒ `malformed-grid`; só combinações observáveis. Coordenada inexistente não pode ser pista, então não entram na tabela: "os três ao mesmo tempo" (reduz a inexistente × inválido), inexistente + pista e `cell-not-found` × `cell-is-given` em `eraseValue`. A inversão dessas ordens só aparece por aliasing de índice linear e é morta no teste de aliasing da T06 (células aliasadas são pistas), mais um teste de robustez (fora da grade não lança) |

Mutation (Stryker, ≥ 70%, mutante sobrevivente em código novo é major) incide sobre todos os arquivos novos de `src/domain/`; as propriedades P2 e P3 existem para matar mutantes de geometria e de precedência. Cobertura de branches ≥ 90%.

## Orçamento de performance

Impacto no JS inicial (ADR 0001, ≤ 60 kB gzip): **nulo por ora**, pois nenhum módulo da `src/ui` importa o domínio até a spec 005 (tree-shaking). Estimativa do domínio da 001 depois de bundled: < 2 kB gzip, **não medida**. O Worker (≤ 30 kB) reaproveitará `units.ts` e `Board` nas specs 002 e 003; `unitCells` calcula os 9 índices a cada chamada, sem tabela pré-calculada (decisão do Diretor, 23/11/2026, na T03; a tabela exigiria asserção não nula, que o lint proíbe); se o custo pesar na 002 ou 003, a pré-computação entra como REFACTOR com teste que a exija. Custo de CPU: `getConflicts` é O(27 × 9) por consulta e cada jogada aloca um array de 81 células; irrelevante frente aos tetos de nós de geração (que são da 003). Sem dependência nova.

## Riscos

- Numeração 0–8 no domínio × texto da spec em 1–9 (CA-001-21) → resolvido: 0–8 no domínio, conversão só na UI (ADR 0007 aceito; nota na spec, 23/11/2026).
- `unknown` + `Object.freeze` geram ramos de validação que viram mutantes sobreviventes → testes de tabela por tipo de entrada (T02, T06) e P3.
- Interpretação de "unidade do conflito" quando linha e bloco coincidem → resolvido: lista as duas unidades (Diretor, 23/11/2026).
- Geradores fast-check de grades válidas com e sem conflito são o ponto mais frágil de P2/P4 → ficam em `__arbitraries__/` com teste próprio simples (T07).
- Configuração do Stryker/Vitest contar `__arbitraries__/` no domínio → descartado: `vitest.config.ts` e `stryker.config.json` já excluem `src/domain/__arbitraries__/**` (conferido pela `eng-testes`, 23/11/2026); sem mudança de config.
