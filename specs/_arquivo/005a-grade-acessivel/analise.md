# Análise de consistência — spec 005a — 25/11/2026

Escopo: `spec.md`, `plan.md`, `tasks.md` da 005a; ADRs 0001, 0003, 0007; `docs/constituicao.md`; `PROCESSO.md` §6; `docs/estado.md` (decisões 13 e 14, não reabertas). Skill `sdd` (análise de consistência) e severidades da skill `revisao`.

**Resultado: com achados.** 0 blocker, 1 major, 8 minor, 2 nit. Com 1 major aberto, `tasks.md` **não** recebe a marca "ok em DD/MM" ainda. O major é de redação da spec e de emulação no teste; não mexe nas decisões 13 e 14.

## O que conferi e está ok

- **Cobertura de CA:** os 30 CA da spec (01-03, 05-15, 19-22, 26-31, 33-37, 39) aparecem em ao menos uma tarefa (`tasks.md:171-186`) e na tabela de teste do plano (`plan.md:77-104`). A lista de IDs bate com a da 005b (`spec.md:15` × `005b/spec.md:14`).
- **Vazamento da 005b:** nenhum CA da 005b (04, 16-18, 23-25, 32, 38, 40-45) é coberto por tarefa ou teste da 005a; as menções a eles são só ponteiros na spec.
- **ADRs e constituição:** 0003 (Preact, roving tabindex, `useReducer`, sem `preact/compat`), 0007 (recusa como valor, índices 0-8, `fixedGame()` lança só por bug), 0001 (orçamento citado, medição em T08) e princípios 2, 4 e 5 (CSP sem `style` inline; `src/domain` intocado) estão coerentes. Não há ADR novo e não precisa de nenhum.
- **Isenções:** T07 ("ajuste puramente visual/CSS") e T08 ("invariante sobre estado existente sem código de produção novo") estão na lista fechada de `PROCESSO.md` §6, com motivo. T07 explicita que lógica volta a T05/T06; T08 explicita que defeito vira item novo `tdd: sim`.
- **Manifestos:** todos abaixo de 15k (maior ≈ 8,4k, ≈ 9,3k com L0). Âncoras de linhas conferidas no código: `game.ts` L21-60, L136-186, L222-fim; `board.ts` L1-20 e L57-65; `puzzle.ts` L1-45; `conflicts.ts` L1-12; `units.ts` L1-12. Totais por tarefa batem, exceto T01 (nit C1).
- **Ordem e dependências:** T01 → T02/T03 → T04 → T05 → T06 → T07 → T08 respeita as saídas que cada manifesto lista (T04 lê T01-T03, T05 lê T02-T04, T06 lê T05, T07 lê T05/T06, T08 lê T07).
- **Números:** 30 CA, 8 tarefas, 44 px, 24 px, ~396 px, #19/#20/#21/#22 iguais nos três arquivos. CA-005-28 reescrito (decisão 14) está igual em `spec.md:125`, `plan.md:95` e `tasks.md:134`.

## Achados

### Major

**A1. "Zoom de 200% a partir de 320 px" não tem definição testável e, lido ao pé da letra, contradiz o mínimo de 24 px do CA-005-28.**
- Onde: `spec.md:149-151` (CA-005-34) com `spec.md:125` (CA-005-28); `plan.md:100`; `tasks.md:153` ("viewport 320 px com zoom 200%").
- Por quê: 320 px de tela com zoom de 200% dá 160 px CSS de viewport. Nove células de no mínimo 24 px somam 216 px, mais que 160 px. Então ou cabe sem rolagem (CA-34) ou as células têm ≥ 24 px (CA-28), nunca os dois. Se a intenção é 320 px CSS já com o zoom aplicado (a leitura do WCAG 1.4.10, Reflow), o CA precisa dizer isso. Nem o plano nem T08 dizem como emular o zoom no Playwright (CSS zoom, `deviceScaleFactor` não mudam o viewport CSS), então o teste pode passar sem provar nada. "Fonte do sistema aumentada" também não tem critério: célula em px fixos com texto a 200% pode não caber (CA "seguem legíveis").
- Sugestão: `produto-ux` reescreve o CA-005-34 com a condição mensurável (ex.: "viewport de 320 px CSS e texto ampliado a 200%, sem rolagem horizontal; as células seguem legíveis") e diz o que acontece abaixo de 320 px. Depois `arquiteto` descreve em T08 a emulação (viewport 320 px CSS + `font-size` raiz a 200%, p. ex. por `addInitScript`/`page.emulateMedia` não basta) e o critério de "legível" (dígito sem corte, `scrollWidth ≤ clientWidth` na célula). Isso não reabre a decisão 14.
- Dono: spec → `produto-ux`; depois plan/tasks → `arquiteto`.

### Minor

**B1. Grid/Cell "importam domínio (tipos)", mas precisam de funções do domínio, e a derivação de visão não tem dono nem teste puro.**
- Onde: `plan.md:16` (tabela de módulos) × `tasks.md:106` (manifesto T05 lista `cellAt`). Cell precisa do valor/pista da célula, dos conflitos (`getGameConflicts`) e de "mesma linha/coluna/caixa/mesmo valor" para o realce. Nada em `Tipos públicos` (`plan.md:36-69`) oferece isso; a lógica cairia em `Cell.tsx`, testada só por classe em jsdom.
- Sugestão: ou ampliar a coluna "Pode importar" para `domínio (funções de leitura)`, ou criar um seletor puro em `ui/model` (ex.: `cellViews(state)`) com teste unitário, e declarar o contrato nos tipos públicos.
- Dono: `arquiteto`.

**B2. `id` + `aria-atomic` não faz o leitor reler texto idêntico.**
- Onde: `plan.md:28` ("`id` crescente faz o mesmo texto ser relido (`aria-atomic`)"); `tasks.md:115` (Announcer: "mesmo texto com `id` novo é reanunciado"). Se o texto no DOM não muda (ex.: "pista, não pode ser alterada" duas vezes seguidas, CA-005-15), a região viva não fala de novo; `aria-atomic` só controla quanto da região é lido. Em jsdom o teste não consegue provar "reanunciado".
- Sugestão: especificar o mecanismo (remontar o nó com `key={id}` ou alternar o conteúdo), dizer o que o teste afirma (nó substituído, não "fala") e deixar a fala real no roteiro de TalkBack do `qa-auditor`.
- Dono: `arquiteto`.

**B3. Ganchos da 005b dentro da 005a sem CA, sem teste e fora dos tipos.**
- Onde: `plan.md:32` (decisão 6): `cellLabel` "recebe `notes` opcional ainda ignorado", `Keypad` "aceita botões extras por composição", "uniões abertas"; mas `plan.md:43` define `CellView` sem `notes` e `plan.md:52` define `Announcement` como interface (não união). Nenhuma tarefa os testa. Check 2 do `sdd` (escopo escondido) e código sem teste no ciclo.
- Sugestão: tirar `notes` e os botões extras da 005a (a 005b os acrescenta com teste) e deixar só o que já é verdade (tokens de cor em variáveis CSS; `UiAction` extensível por união). Corrigir "uniões abertas" para "extensíveis".
- Dono: `arquiteto`.

**B4. `FIXED_PUZZLE` incompleto no plano e risco de lentidão do contador de soluções.**
- Onde: `plan.md:67` ("pistas + solução") × `src/domain/puzzle.ts:34-35`: `createPuzzle` também exige `difficulty`, `seed` (strings não vazias) e `generatorVersion` (inteiro ≥ 1); `tasks.md:18` não diz que valores usar. Além disso `tasks.md:16` pede contador por força bruta "sem propriedade": sem heurística, uma busca ingênua pode estourar o timeout padrão do Vitest e virar teste instável (major em `PROCESSO.md` §6).
- Sugestão: nomear os cinco campos e dizer que `difficulty`/`seed`/`generatorVersion` do puzzle fixo são rótulos opacos (ex.: `'fixo'`, `'005a'`, `1`) que o gerador substitui; pedir ao contador escolha da célula com menos candidatos e teto de tempo explícito.
- Dono: `arquiteto`.

**B5. Listas de CA por tarefa não batem com o texto das tarefas nem com a tabela de cobertura.**
- Onde: `tasks.md:93` (T05 não lista CA-005-10, embora `tasks.md:95` diga "parte de 10" e a tabela `tasks.md:181` aponte T05); `tasks.md:72` (T04 não lista CA-005-06, embora `tasks.md:74` teste `initialState` "CA-005-06" e a tabela `tasks.md:177` aponte T04); `tasks.md:160` (manifesto de T08 cita `#CA-005-34` a `#37`, mas T08 cobre CA-005-33 e CA-005-39, `tasks.md:151`); `tasks.md:102` (manifesto de T05 também omite o CA-005-10).
- Sugestão: incluir CA-005-10 em T05 e CA-005-06 em T04 na linha "CA cobertos"; acrescentar `#CA-005-33` e `#CA-005-39` ao manifesto de T08 (~0,4k; continua < 15k).
- Dono: `arquiteto`.

**B6. Pares de contraste de T07 não cobrem texto sobre os fundos de realce.**
- Onde: `tasks.md:134` (pares do `theme.contrast.test.ts`). CA-005-39 (`spec.md:164-167`) exige 4,5:1 para texto "em todos os estados"; o realce de linha/coluna/caixa/mesmo valor (CA-005-05) e o fundo de conflito mudam o fundo do texto, mas os pares listados são texto×fundo base, pista, valor, conflito, selecionada×vizinha e foco. O axe de T08 pega parte disso só nos estados que o E2E monta.
- Sugestão: acrescentar os pares texto (pista e valor do jogador) × cada fundo de realce, e texto × fundo de conflito.
- Dono: `arquiteto`.

**B7. T08 diz "sem código de produção" e, na linha de agentes, chama o `dev`.**
- Onde: `tasks.md:167` ("`eng-testes` → `dev` (para o código de produção mínimo que o E2E revelar faltar)") × `tasks.md:152` (a própria tarefa afirma que isso contradiz a isenção e que defeito vira item novo). A lista de agentes reabre o que a isenção fecha.
- Sugestão: trocar por `eng-testes` apenas (como já diz `tasks.md:10`: "T08 só `eng-testes`") e mover a frase do `dev` para "item novo, se houver".
- Dono: `arquiteto`.

**B8. Precedência entre anúncios e regra de "estado de conflito" não estão na spec, e o texto do plano e o da tarefa divergem.**
- Onde: `spec.md:79,102,106,136` (CA-12, 20, 21, 30) pedem, cada um, um anúncio, sem dizer o que vale quando coincidem (a jogada que completa a grade com conflito cumpre CA-20 e CA-30; a que vence cumpre CA-12 e CA-29). O plano resolve com precedência (`plan.md:28`: vitória > grade cheia com erros > conflito criado > "sem conflitos" > conteúdo), o que na prática suprime o anúncio do CA-12/20 nesses casos. Além disso `plan.md:29` diz "comparam-se conflitos antes e depois", mas a regra descrita usa só o "depois" para o conflito, e `tasks.md:74` ("não muda o estado de conflito") e `spec.md:106` usam outra formulação ("estado de conflito" é ambíguo: trocar um valor em conflito por outro também em conflito é "mesmo estado"?).
- Sugestão: `produto-ux` acrescenta uma frase na spec confirmando a precedência (um anúncio por jogada, o de maior prioridade) e define "muda o estado de conflito" (a célula jogada passa a estar em conflito, ou o último conflito some); `arquiteto` alinha `plan.md:29` e `tasks.md:74` a essa redação.
- Dono: spec → `produto-ux`; plan/tasks → `arquiteto`.

### Nit

**C1. Texto desatualizado ou impreciso.**
- `plan.md:118,123`: ainda diz "Não decido sozinho: pergunta 4", mas a pergunta 4 está decidida (`plan.md:139`).
- `tasks.md:6`: "Rascunho do `arquiteto` ... a `eng-testes` refina ... o `curador-pdca` fecha" convive com `tasks.md:10` ("Manifestos fechados").
- `tasks.md:28`: T01 soma ≈ 4,7k pelos itens (1,5+0,5+0,4+0,5+0,9+0,6+0,3), não 5,2k; `metrics.csv` repete 5,2k (conservador, sem risco).
- `tasks.md:144`: caminho `skills/qualidade-web`, deveria ser `.claude/skills/qualidade-web/SKILL.md` (como em `tasks.md:164`).
- Dono: `arquiteto` (e `curador-pdca` para `metrics.csv`).

**C2. Manifesto de T04 sem `board.ts`.** `tasks.md:84-86`: o reducer precisa de `cellAt` para montar o anúncio de conteúdo da célula (CA-005-12/14), mas `board.ts#L57-65` só está no manifesto de T05. Acrescentar (~0,2k).
- Dono: `arquiteto`.

## Resumo por dono

- `produto-ux` (spec): A1 (redação do CA-005-34), B8 (precedência e "estado de conflito").
- `arquiteto` (plan/tasks): A1 (emulação em T08), B1 a B8, C1, C2.
- Depois das correções: nova passada curta desta análise; com 0 major e ≤ 3 minor abertos o resultado vira `ok` e `tasks.md:4` ganha a data.

## Rodada 2 — 25/11/2026

Escopo: `git diff` de `spec.md`, `plan.md`, `tasks.md` e `metrics.csv` (coluna `ctx_inicial_est`) desde a rodada 1; ADR 0001; `vite.config.ts`; `docs/estado.md` (não alterado no diff).

**Resultado: com achados.** 0 blocker, 0 major, 3 minor, 1 nit. Pelo critério de saída (0 major, ≤ 3 minor) a análise pode fechar; os 3 minor são correções de redação do plano (N1, N2) e um registro de decisão (N3). `tasks.md:4` pode receber a marca "ok" depois de N1 a N3, ou com eles aceitos como débito.

### Rodada 1: situação

| Achado | Situação |
|---|---|
| A1 (CA-005-34 sem definição testável) | Resolvido. Spec define 320 px CSS e texto a 200% em separado; plan.md:112 e T08 descrevem a emulação (viewport CSS e `font-size` da raiz) e o critério "dígito inteiro". |
| B1 (derivação de visão sem dono) | Resolvido: `gridView` em `model/view.ts` com tipo, teste unit e T05 atualizada. |
| B2 (releitura do mesmo texto) | Resolvido: `key={id}`, teste afirma só o nó substituído; fala real no roteiro do `qa-auditor`. |
| B3 (ganchos da 005b) | Resolvido (plan.md decisão 6). |
| B4 (`FIXED_PUZZLE`, contador) | Resolvido: cinco campos, contador com teto de tempo. |
| B5 (listas de CA) | Resolvido: CA-005-06 em T04, CA-005-10 em T05, #33 e #39 no manifesto de T08. |
| B6 (contraste sobre realces) | Resolvido em T07 e na linha CA-005-39 do plano. |
| B7 (T08 chamando `dev`) | Resolvido. |
| B8 (precedência e "estado de conflito") | Resolvido na spec (CA-005-21 e 31) e alinhado em plan.md:29-30 e T04. Ver N3 sobre o efeito. |
| C1, C2 | Resolvidos (T01 4,7k; `board.ts` em T04; pergunta 4; caminho da skill). |

Consistência após as correções: os 30 CA continuam cobertos; os totais de manifesto de `tasks.md` (T01 4,7k, T04 8,9k, T05 9,3k, T06 7,3k, T07 8,9k, T08 9,1k) batem com `metrics.csv`; maior com L0 ≈ 10,2k, abaixo de 15k. CA-005-28 e a decisão 14 intactos (a spec não toca o CA-005-28; `estado.md` sem diff; plan.md só acrescenta "CSS" ao 320 px).

### Achados novos

**N1 (minor). O ADR 0001 não define alvo de navegadores, e o fallback de `cqi` está descrito de duas formas.**
- `docs/adr/0001-stack-e-ferramentas.md` não tem alvo (só Chrome no throttling, linha 47). O único alvo é `build.target: 'es2022'` em `vite.config.ts:6`, que vale para JS e não afeta `cqi`. `container-type` e `cqi` são Baseline desde 2023 (Chrome 105, Safari 16, Firefox 110, do meu conhecimento, sem consulta externa); cobrem o público provável (Android com TalkBack), mas isso é suposição, não alvo decidido.
- Fallback: `plan.md:34` diz declarar `font-size: 1rem` antes da regra com `cqi` (declaração inválida é descartada, então a anterior vale): basta para não quebrar, mas em célula de 24 px com texto a 200% o dígito (~32 px) é cortado. `plan.md:144` descreve outro fallback (`@media` por largura). O E2E roda 1 navegador (Chromium), então o fallback não é exercitado.
- Sugestão: `arquiteto` unifica o fallback (um só), registra que o alvo é "navegadores com suporte a container queries (Baseline 2023)" e que a ausência de alvo no ADR 0001 é lacuna a tratar em ADR/nota (item de backlog), sem ADR novo agora.

**N2 (minor). Decisão 7 não diz que o dígito é elemento filho do contêiner.** `plan.md:34`: unidades `cqi` resolvem contra o contêiner ancestral mais próximo; no próprio elemento com `container-type` elas se referem ao ancestral (linha/grade), não à célula. T05 (`tasks.md:93-107`) e T07 não citam o elemento do dígito (ex.: `<span>` dentro do `gridcell`), e o teste estático de T07 ("dígito com `cqi`") não pode checar isso. Sugestão: dizer que a célula contém um elemento de dígito e que a regra `container-type` fica na célula e a `cqi` no dígito.

**N3 (minor). Spec aprovada alterada em comportamento sem registro da ciência do Diretor.** Ver resposta ao item 4. `estado.md` não registra as mudanças em CA-005-21, 31 e 34. Sugestão: o Diretor confirma e o orquestrador registra a decisão.

**N4 (nit).** `docs/estado.md:10` ainda diz "manifestos ≤ 8,4k"; agora o maior é 9,3k (T05).

### Itens específicos

- Item 3: ver N1.
- Item 4: CA-005-21 é mais que redação: trocar um valor em conflito por outro que continua em conflito passa a não anunciar conflito, o que a redação anterior (CA-005-20, "jogada que cria conflito") deixava aberto e o plano antigo resolvia no sentido oposto (anunciava se a célula jogada estivesse em conflito depois). CA-005-31 passa a ter precedência explícita, o que suprime o anúncio do CA-005-12/20 quando coincide com 29/30: é decisão nova, antes só do plano. CA-005-34 também mudou (definição de 320 px CSS, 9 × 24 px, dígito inteiro, abaixo de 320 px fora de escopo). Nenhuma contradiz uma promessa explícita, mas as três alteram o que o jogador ouve ou vê.
- Item 5: decisão 14 intacta.
