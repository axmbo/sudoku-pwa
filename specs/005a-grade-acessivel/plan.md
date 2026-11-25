# Plano 005a — Grade acessível (primeira UI jogável)

- **Spec:** [spec.md](spec.md) · **Autor:** `arquiteto` · **Irmã (não planejada aqui):** [005b](../005b-anotacoes-e-tema/spec.md)
- **ADRs:** [0001](../../docs/adr/0001-stack-e-ferramentas.md) (orçamento), [0003](../../docs/adr/0003-framework-de-ui.md) (Preact, roving tabindex, `useReducer` sobre o domínio, sem `preact/compat`), [0007](../../docs/adr/0007-convencoes-do-dominio.md) (recusa como valor, índices 0–8). **Nenhum ADR novo:** tudo cabe no 0003; o conflito CA-005-28 × CA-005-34 foi resolvido pela pergunta 1 (decidida (a), 25/11/2026; spec, não arquitetura). ADR 0004 não se aplica (CA-005-37: sem persistência).

## Módulos e fronteiras

`src/domain/` **não muda**. Toda a 005a é `src/ui/` mais `index.html`/`main.tsx`. Regra de importação: `src/ui/**` importa de `src/domain/**` (só a API pública já exportada); `src/domain/**` nunca importa de `src/ui/**` (o lint do domínio, `tests/repo/lint-dominio.test.ts`, já vigia DOM/relógio/aleatoriedade).

| Arquivo (novo) | Papel | Pode importar |
|---|---|---|
| `src/ui/fixed-puzzle.ts` | Puzzle fixo (dados `unknown` no formato de `createPuzzle`) e `fixedGame()` que o valida com `createGame`. É o único ponto a trocar quando o gerador (002/003) e o novo jogo (B-10) chegarem. | domínio |
| `src/ui/model/navigation.ts` | `moveSelection`: puro, sem DOM (setas, Home/End, Ctrl+Home/End, sem volta). | `Index` |
| `src/ui/model/messages.ts` | Todos os textos pt-BR: nome da célula, anúncios, avisos. Única fonte de texto para a 005b estender (anotações). | domínio (tipos) |
| `src/ui/model/reducer.ts` | `gameReducer` sobre o domínio (`gamePlace`, `gameErase`, `getGameConflicts`, `getGameStatus`) mais a política de anúncio. Puro; sem DOM, relógio ou aleatoriedade. | domínio, `messages`, `navigation` |
| `src/ui/Grid.tsx`, `Cell.tsx` | `role="grid"`/`row`/`gridcell`, roving tabindex, teclado, destaque, ícone de conflito. Gerencia o foco no DOM (efeito). | `model/*`, domínio (tipos) |
| `src/ui/Keypad.tsx` | Botões 1–9 e Apagar. | `model/*` |
| `src/ui/Announcer.tsx` | Região viva única (`role="status"`, educada). | tipos |
| `src/ui/App.tsx` | Compõe tudo, `useReducer(gameReducer, fixedGame())`, banner visível de vitória/erros. | tudo de `ui` |
| `src/ui/styles.css`, `src/ui/theme.css` | Layout e tokens de cor (tema claro em variáveis CSS; a 005b acrescenta o escuro só trocando valores). | — |
| `src/main.tsx` (altera) | Monta `<App/>`; `index.html` já tem `lang="pt-BR"` e `<title>`. | `ui/App` |

Os testes ficam ao lado (`*.test.ts(x)`, projeto `ui` do Vitest, jsdom); E2E em `e2e/`.

### Decisões de projeto

1. **Selecionado ≠ focado.** O estado guarda `selected` (célula). O roving tabindex dá `tabindex=0` a `selected` (CA-005-06); toque e botões do teclado na tela mudam `selected` sem tirar a seleção ao focar o botão (CA-005-26/27). O contorno de seleção vem de classe (`is-selected`), não de `:focus`, e o `:focus-visible` cobre o foco por teclado (CA-005-11).
2. **Um anúncio por jogada (CA-005-31).** O reducer devolve no máximo um `Announcement`; o `Announcer` mostra só o último (substitui, não enfileira). `id` crescente faz o mesmo texto ser relido (`aria-atomic`). Precedência numa jogada: vitória > grade cheia com erros > conflito criado na célula jogada > "sem conflitos" (havia conflito e deixou de haver) > novo conteúdo da célula. Recusa por pista: "pista, não pode ser alterada" (CA-005-15). Recusa `game-over` (após vitória): sem anúncio (a grade segue navegável). **`announcement` é por ação, nunca herdado:** toda ação que não produz anúncio (`select`, `move`, jogada sem efeito, recusa `game-over`) devolve `announcement: null`; só a ação que anuncia traz um `Announcement` novo (`id` = anterior + 1). `id` nunca decresce e não avança sem anúncio novo. Assim o `Announcer` recebe só o novo e nunca relê um anúncio velho; limpar a região viva (`null`) não gera fala. O banner de vitória/erros é derivado de `getGameStatus`, não do `announcement`, e por isso persiste.
3. **Conflito criado vs. já existente (CA-005-20/21).** Comparam-se `getGameConflicts` antes e depois: anuncia-se conflito só se a célula jogada está nos conflitos de depois; usa-se a primeira unidade de `CellConflict.units` da célula (ordem fixa linha, coluna, caixa), no texto "Conflito: 5 repetido na linha 3" (índice +1 na UI). Conflito segue derivado, nunca guardado (invariante 9).
4. **Nome da célula por `aria-label`** (CA-005-03), mais a região viva para o que muda (rótulo de elemento focado que muda nem sempre é relido). Pista sem cor: peso da fonte e `aria-label` com "pista" (CA-005-02); conflito: ícone/padrão por CSS (`::after`/SVG inline por classe, sem `style` inline por causa da CSP `style-src 'self'`) mais "em conflito" no rótulo.
5. **Vitória e grade cheia** vêm de `getGameStatus` (`won` / `full-incorrect`); banner visível mais anúncio único; sem animação, e `prefers-reduced-motion` zera transições (CA-005-33).
6. **005b não fica sem porta:** `UiAction` e `Announcement` são uniões abertas a `toggle-note`, `undo`, `redo` e `set-mode`; `messages.cellLabel` recebe `notes` opcional ainda ignorado; tokens de cor são variáveis CSS trocáveis por `prefers-color-scheme`; o `Keypad` aceita botões extras por composição.

## Tipos públicos

```ts
// src/ui/model/navigation.ts
export interface Selection { readonly row: Index; readonly col: Index }
export type NavigationKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';
export function moveSelection(from: Selection, key: NavigationKey, ctrl: boolean): Selection; // sem volta nas bordas

// src/ui/model/messages.ts  (textos pt-BR; sem DOM)
export interface CellView { readonly value: Digit | null; readonly given: boolean; readonly conflicted: boolean }
export function cellLabel(row: Index, col: Index, view: CellView): string;       // "Linha 3, coluna 5, 7, pista"
export function conflictMessage(conflict: CellConflict): string;                  // "Conflito: 5 repetido na linha 3"
export const messages: {
  readonly noConflicts: string; readonly givenImmutable: string;
  readonly won: string; readonly fullWithErrors: string;
};

// src/ui/model/reducer.ts
export interface Announcement { readonly id: number; readonly text: string }
export interface UiState {
  readonly game: Game;
  readonly selected: Selection;
  readonly announcement: Announcement | null; // só da última ação; null se ela não anuncia (nunca herdado)
}
export type UiAction =
  | { readonly type: 'select'; readonly to: Selection }
  | { readonly type: 'move'; readonly key: NavigationKey; readonly ctrl: boolean }
  | { readonly type: 'digit'; readonly digit: Digit }   // 1-9; valor igual ao atual = sem efeito, sem anúncio
  | { readonly type: 'erase' };
export function initialState(game: Game): UiState;      // selected = (0,0)
export function gameReducer(state: UiState, action: UiAction): UiState;

// src/ui/fixed-puzzle.ts
export const FIXED_PUZZLE: unknown;                    // formato aceito por createPuzzle (pistas + solução)
export function fixedGame(): Game;                     // createGame(FIXED_PUZZLE); lança se recusar (erro de programação)
```

`Digit`, `Index`, `Game`, `CellConflict` vêm do domínio (já exportados). Nada novo no domínio.

## Estratégia de teste

Camadas: **unit** = funções puras de `ui/model` (Vitest, sem DOM); **comp** = Testing Library + jsdom (papéis, rótulos, teclado, toque); **E2E** = Playwright (só jornadas); **a11y** = `@axe-core/playwright` nos três estados; **CSS** = verificação estática de tokens (razão de contraste calculada de variáveis CSS) e medição de geometria no Playwright. jsdom não faz layout nem cor computada, por isso CA de tamanho/contraste/zoom vão a E2E ou ao teste estático.

| CA | Camada | Observação |
|---|---|---|
| CA-005-01 | unit + comp + E2E | unit: `fixedGame()` ok e **solução única** provada por contador de soluções só no teste (o domínio ainda não tem solver); comp: 81 células, pistas, 9 caixas separadas (classe de borda); E2E: abre e vê a grade |
| CA-005-02 | comp | nome só diz "pista" nas pistas; peso/estilo distintos via classe (aparência real: E2E/manual) |
| CA-005-03 | unit + comp | `cellLabel` pelos quatro formatos; comp: `getByRole('gridcell', {name})` |
| CA-005-05 | comp + a11y | classes de realce de linha/coluna/caixa/mesmo valor; contorno próprio por classe `is-selected`; verificação visual no E2E |
| CA-005-06 | unit + comp | só uma célula com `tabindex=0`; (1,1) na primeira vez e a última selecionada depois |
| CA-005-07, 08, 09 | unit (propriedade sobre `moveSelection`: resultado sempre em 0–8; borda não se move) + comp (teclado dispara o foco) | |
| CA-005-10 | E2E | Tab e Shift+Tab percorrem todos os controles, sem armadilha |
| CA-005-11 | CSS estático + E2E | token do indicador de foco ≥ 3:1; `:focus-visible` presente; E2E confere o foco aparecendo |
| CA-005-12, 13 | unit (reducer) + comp | anúncio do novo conteúdo; trocar valor |
| CA-005-14 | unit + comp | Backspace, Delete e 0; anúncio "vazia" |
| CA-005-15 | unit + comp | pista: estado idêntico, anúncio de imutabilidade |
| CA-005-19 | comp | ícone/padrão de conflito (elemento ou classe) em todas as células do conflito; "em conflito" no nome |
| CA-005-20, 21 | unit (reducer) | conflito criado (texto com valor e unidade), não repetido sem mudança de estado, "sem conflitos" ao eliminar o último; troca ou apagar |
| CA-005-22 | unit | jogada com conflito é aceita |
| CA-005-26 | comp | clique/toque seleciona e dá `tabindex=0` |
| CA-005-27 | comp | botão 1–9 e Apagar igual ao atalho; `selected` não muda |
| CA-005-28 | E2E | `boundingBox`: botões ≥ 44×44 sempre; células ≥ 44×44 em largura ≥ ~396 px mais margens e ≥ 24×24 sem sobreposição em 320 px (pergunta 1, decidida (a)) |
| CA-005-29 | unit + comp + E2E | `getGameStatus` `won`; banner visível e anúncio; digitar/apagar sem efeito; E2E joga até vencer só com teclado |
| CA-005-30 | unit + comp | `full-incorrect`: aviso sem revelar células além dos conflitos; jogo continua |
| CA-005-31 | unit + comp | rajada de jogadas: um `Announcement` por ação; região viva mostra só o último |
| CA-005-33 | CSS estático | regra `prefers-reduced-motion` zera transição/animação (E2E com `emulateMedia` confere) |
| CA-005-34 | E2E | viewport 320 px, zoom 200%: sem `scrollWidth > clientWidth`, teclado abaixo da grade, sem sobreposição |
| CA-005-35 | a11y (E2E) | axe com 0 sérias/críticas nos estados inicial, com conflito e vitória |
| CA-005-36 | comp + E2E | `lang`, `<title>`, um `h1`; textos só de `messages` |
| CA-005-37 | E2E | recarregar volta ao puzzle fixo; nada de `localStorage`/IndexedDB; a tela não menciona salvamento |
| CA-005-39 | CSS estático + a11y | contraste calculado dos pares do tema claro (texto 4,5:1; componente e foco 3:1) e `color-contrast` do axe |

Domínio: sem mutação nova (não muda). Mutation do Stryker não cobre `src/ui/` (config atual só do domínio); não se amplia aqui. Cobertura: meta de branches ≥ 90% segue só para o domínio; `ui/model` terá teste de ramos por CA, sem limiar novo (proposta de limiar para `ui/model`: pergunta 3).

## Orçamento de performance

ADR 0001: JS inicial ≤ 60 kB gzip, CSS ≤ 10 kB, LCP ≤ 2,5 s, TBT ≤ 200 ms, Lighthouse ≥ 90/100/95.
- **JS:** hoje só Preact (~5 kB). Estimativa de acréscimo, sem medição: 6 a 10 kB gzip (reducer, 4 componentes, `messages`, subconjunto do domínio importado: `game`, `board`, `conflicts`, `puzzle`; `serialize` fica de fora por tree-shaking). Ficam ~45 kB de folga. Sem `preact/compat`, sem biblioteca de estado ou ícones (ícone de conflito em CSS/SVG inline).
- **CSS:** 2 a 4 kB gzip estimados.
- **Interação:** cada jogada recria 81 células (VDOM, `memo` por célula só se a medição pedir); sem trabalho assíncrono. Nenhum Worker nesta spec.
- **Medição:** T08 registra o tamanho gzip real de JS e CSS (`vite build`) em `notas.md`. O ADR 0001 prevê gate de tamanho no PR, mas **não existe script ainda** (`scripts/ci` e `tests/repo` não o têm): sugerido como débito/B-extra, pergunta 2. LCP/TBT/Lighthouse ficam no job agendado (ADR 0001).

## Avaliação do tamanho (alerta do estado): 8 tarefas

Ficaram **8 tarefas**, no teto de "~8". Não passa, mas está no limite e com duas tarefas pesadas (T05 e T07).

- **Recomendação: não dividir.** A 005 já foi dividida uma vez (005a/005b); a 005a é a menor fatia jogável de ponta a ponta.
- **Prós de não dividir:** uma entrega verificável (jogar e vencer); sem custo extra de ciclo (spec, planejar, analisar, PR); o teste de jornada só faz sentido com tudo montado.
- **Contras:** T05 (Grid) e T07 (CSS) podem estourar a estimativa; um PR grande para revisão; se T05 ou T07 passarem de 15k de manifesto na execução, dividir ali.
- **Alternativa, se o Diretor preferir:** cortar após T06 (lógica e componentes, sem estilo nem E2E) como 005a-1 e deixar T07 e T08 (estilo, contraste, zoom, E2E, axe) como 005a-2. Prós: PRs menores. Contras: o 005a-1 fica sem aparência final nem a11y verificada; mais um ciclo de processo, e CA de estilo e a11y só fecham no segundo. Não decido sozinho: pergunta 4.

## Riscos

- **CA-005-28 × CA-005-34 em 320 px (conflito entre CA):** 9 células de 44 px somam 396 px, mais que 320 px. Não cabem sem rolagem horizontal. → Pergunta 1: **decidido (a), 25/11/2026**; CA-005-28 reescrito na spec (células encolhem abaixo de ~396 px, mínimo 24×24; botões sempre ≥ 44).
- **CSP `style-src 'self'`** barra `style=""` em HTML; o Preact aplica estilo por CSSOM (permitido), mas para não depender disso a UI usa só classes e variáveis CSS → teste E2E sem erro de CSP no console.
- **Leitor de tela real não se testa em CI** (jsdom e axe não dizem o que o TalkBack lê) → roteiro manual por release (`qa-auditor`, já previsto na spec); região viva única e simples reduz o risco.
- **Foco programático × Preact:** mover o foco depois da renderização pode competir com o `tabindex` → efeito após a atualização do DOM, testado em comp (jsdom) e E2E.
- **Solução única do puzzle fixo** sem solver no domínio → contador de soluções só no teste de T01 (força bruta com corte em 2); pode ser trocado pelo solver da 003.
- **Estimativas** de tokens/minutos são hipóteses (calibração da 004, ×1,4), sem medição própria da UI.

## Perguntas ao Diretor

1. **Decidido (a), 25/11/2026.** **CA-005-28 × CA-005-34** (bloqueava T07/T08, não T01–T06): o que prevalece em 320 px? (a) células com ≥ 44 px só quando a largura permitir (≥ 396 px mais margens) e, abaixo, as células encolhem para caber (o mínimo 24×24 do WCAG 2.2 AA vale; botões do teclado seguem ≥ 44); prós: sem rolagem horizontal, fiel ao WCAG AA; contras: cai o "44" nas telas estreitas; (b) manter 44 px em tudo e permitir rolagem horizontal da grade; prós: alvo grande; contras: quebra CA-005-34 e é ruim para leitor de tela e zoom; (c) 44 px de área de toque com células visuais menores via `padding` sobreposto; contras: sobrepõe vizinhas (não cumpre "sem tocar no vizinho"). **Recomendo (a)**, com `produto-ux` ajustando a redação do CA-005-28.
2. Decidido (recomendação), 25/11/2026: débito [#21](https://github.com/axmbo/sudoku-pwa/issues/21); a 005a só mede. **Gate de tamanho do ADR 0001** não existe: criar um teste/script de tamanho (JS ≤ 60 kB, CSS ≤ 10 kB) agora (fora da 005a, item próprio) ou deixar para quando o bundle encostar no teto? Recomendo registrar débito e deixar a 005a só medir.
3. Decidido (recomendação), 25/11/2026: item separado [#22](https://github.com/axmbo/sudoku-pwa/issues/22). **Cobertura de `src/ui/model`:** adotar limiar de branches (ex.: 90%) para essa pasta no Vitest, como no domínio? Recomendo sim, em item separado de configuração, sem bloquear a 005a.
4. Decidido (recomendação), 25/11/2026: 8 tarefas numa spec só, sem dividir. **Tamanho:** manter 8 tarefas em uma spec (recomendado) ou cortar em 005a-1/005a-2 (ver acima)?
