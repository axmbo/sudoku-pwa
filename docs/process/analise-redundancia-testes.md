# Diagnóstico de redundância da suíte unitária

Data: 28/11/2026. Branch `feat/005b-anotacoes-e-tema`, HEAD `e431d4d` (relatório do Stryker de `6fe8dcf`, 13:14 BRT, 100%). Análise só de leitura: nenhum teste, código ou configuração foi alterado. Tokens e tempo deste subagente: `n/d` (o orquestrador informa o real do log; regra em [metricas.md](metricas.md)).

## Relatório gerencial

**Conclusão em uma linha:** a suíte quase não tem redundância removível com segurança. O único bloco de duplicata exata é de contraste de tema (5 blocos no código, 42 testes na execução). O relatório do Stryker **não consegue provar** que um teste é dispensável, só que 22 testes não cobrem mutante algum.

### Números

| Classe | Grupos de candidatos | Testes envolvidos (execução) | Saem se o Diretor aprovar remover |
|---|---|---|---|
| (a) redundante de fato | 5 blocos, todos em `src/ui/theme.contrast.test.ts` | 42 | **42** (de 1104, 3,8%) |
| (b) parece repetido, mas cobre outra camada, CA ou regressão | cerca de 70 (25 CAs com testes em mais de um arquivo, 36 irmãos de triangulação no mesmo arquivo, 5 a 8 pares entre camadas) | não contados um a um | 0 |
| (c) dúvida | 7 grupos | 15 | 0 (decisão do Diretor) |
| Sem cobertura de mutante (Stryker) | 22 testes, 8 deles em `src/domain/` | 22 | 0 (ver seção 1) |

Contagem da suíte: 48 arquivos de teste, 1104 testes na execução (`docs/estado.md`). `npx vitest list` mostra 562, porque não expande `it.each`. O Stryker enxergou 801 testes em 32 arquivos (588 de `src/domain/`, 213 de `src/ui/`).

Os 42 testes de (a) são execuções expandidas. Cortam 5 declarações `it`/laço (cerca de 40 linhas de teste), sem perder verificação, porque outro teste faz a mesma asserção sobre o mesmo par de cores. Custo: os CAs 005-04, 005-39 e 005-11 perdem o título próprio; o teste que fica deve citar os três (CA-005-32, 005-04, 005-39, 005-11).

### Alternativas

| Alternativa | Prós | Contras |
|---|---|---|
| 1. Não fazer nada | Custo zero. A suíte está verde e com 100% de mutação. Os 42 testes são estáticos (CSS), de milissegundos. | A duplicata fica e confunde quem lê a rastreabilidade CA↔teste. |
| 2. Issue `débito` | Registra sem interromper a 005b. Cabe no fluxo da decisão 6 de `estado.md`. | Ganho pequeno para uma issue. Vira ruído se ficar aberta. |
| 3. Item da próxima retro | Custo mínimo, e o Diretor decide com o contexto da 005b fechada. | Sem dono nem prazo. Pode ser esquecido. |
| 4. Tarefa num ciclo futuro | Faz com TDD de refatoração de teste (só forma), com `npm run check` verde antes e depois. Pode juntar a divisão de `board.test.ts`. | Gasta ciclo em ganho pequeno. O ganho é de legibilidade, não de tempo de suíte. |

**Recomendação: alternativa 3**, com o resultado da retro decidindo entre 2 e 4. Não vale ciclo próprio só para 42 testes de milissegundos. Se o Diretor quiser agir, a menor ação é ajustar `theme.contrast.test.ts` na própria retro ou junto da divisão de `board.test.ts` (tarefa futura da decisão 7). **Não recomendo** remover nada da classe (c) sem rodar o Stryker com `disableBail` (seção 1), porque é a única forma de saber o que cada teste mata.

## 1. Mutação

### Dados do relatório

`reports/stryker-incremental.json`: 932 mutantes (894 mortos, 23 timeout, 15 ignorados). Esses 15 têm `statusReason`, são equivalentes declarados e não entram na conta. 801 testes registrados, e 779 deles cobrem ao menos um mutante (580 de `domain`, 199 de `ui`: os testes de UI cobrem código de domínio e entram no `coveredBy`).

### Escopo: o que não aparece no `killedBy`

- O Stryker só muta `src/domain/**` (`stryker.config.json`). Teste de `src/ui/`, `scripts/`, `tests/repo/` e E2E não mata mutante e não tem como entrar nesta análise. Os de `ui` que aparecem cobrem código de domínio.
- `vitest.stryker.config.ts` exclui os testes "regressão de tempo" e "gerador … alcança". Eles ficam fora do relatório e **não foram avaliados**.
- Propriedades rodam com no máximo 10 execuções (`tests/stryker.setup.ts`). Uma propriedade pode matar mais mutantes no `npm run check` (100 execuções) do que aqui.
- Os 1104 testes de hoje não são os 801 do relatório. O relatório vale para `6fe8dcf`, e depois só entraram commits de docs.

### Critério e limite do método

Critério pedido: "teste que só mata mutantes que outro teste também mata". O relatório **não permite** calcular isso. Com `disableBail: false` (padrão), o Stryker interrompe no primeiro teste que falha: **todos os 894 mutantes mortos têm `killedBy` com exatamente 1 teste**. O `killedBy` registra o *primeiro* matador na ordem de execução, não o conjunto de matadores. Timeout conta como detecção (23 mutantes), mas não tem `killedBy`. Consequência: a lista "não mata sozinho" não existe nestes dados.

O que dá para afirmar com segurança:

| Grupo | Testes | Como foi definido |
|---|---|---|
| Matam nenhum mutante, por certeza | **22** | `coveredBy` vazio: o teste não executa nenhum código mutado. |
| São o primeiro matador de algum mutante | 125 | Estão em `killedBy`. Isso depende da ordem de execução, não prova que são necessários. |
| Cobrem mutante, mas nunca foram o primeiro matador | 654 | **Não provados dispensáveis.** Podem matar os mesmos mutantes que um dos 125 e outros que o primeiro matador "roubou". |
| Únicos cobridores de algum mutante detectado | 6 | Necessários, se o mutante é morto por quem cobre. |

Nota: 11 mutantes detectados (todos de timeout) têm `coveredBy` vazio, porque o laço infinito nem registra cobertura. Não distorcem a conta acima.

Contar os 654 como "removíveis" seria um erro: o número depende só da ordem dos arquivos.

### Os 22 testes sem cobertura de mutante

| Arquivo | Qtd | Observação |
|---|---|---|
| `src/ui/Actions.test.tsx` | 10 | UI pura: não toca domínio. Esperado. |
| `src/ui/Keypad.test.tsx` | 3 | Idem. |
| `src/ui/model/reducer.prop.test.ts` | 1 | Idem. |
| `src/domain/__arbitraries__/board.test.ts` | 3 | Testes dos geradores (`coordenadas sujas`, `valores sujos`, `jogadas incluem colocar e apagar`, linhas 33, 40, 47). Verificam o gerador, não o domínio. Classe (b). |
| `src/domain/__arbitraries__/moves.test.ts` | 2 | Idem (linhas 42 e 112). Classe (b). |
| `src/domain/deserialize.test.ts` | 2 | Linha 406, `CA-004-28: kind 4 ... é invalid-data` (duas expansões). Não cobrem mutante, mas a fronteira kind 4 é CA. Classe (c). |
| `src/domain/units.test.ts` | 1 | Linha 16, `INV: ALL_UNITS tem 27 unidades em ordem fixa`. Constante; sem mutante coberto. Classe (c). |

Para obter o conjunto real de matadores por teste (e então a lista "não mata sozinho"), seria preciso rodar o Stryker com `"disableBail": true`, tarefa de cerca de 28 min no hardware atual, e mais lenta sem o bail. Não foi rodado (instrução do pedido). Fica como alternativa a avaliar se o Diretor quiser podar a classe (c).

## 2. Texto

Método: títulos de `it`/`test`/`it.each` extraídos por expressão regular (519 declarações estáticas; `it.each` conta uma vez), normalizados (minúsculas, sem acento, sem ID de CA nem "INV", só alfanuméricos) e comparados por `difflib.SequenceMatcher`. Blocos `expect` extraídos por expressão regular e comparados após normalizar espaços.

### 2.1 Títulos iguais ou quase iguais

| Par | Similaridade | Classe | Nota |
|---|---|---|---|
| `src/ui/theme.contrast.test.ts:212` (CA-005-04) e `:220` (CA-005-32) | 1,00 | **(a)** | Mesmo título, mesmo corpo (`--color-note` sobre cada fundo, mínimo 4,5:1), nos dois temas. 16 testes. |
| `src/domain/board.test.ts:497` (CA-001-03) e `:543` (CA-001-05) | 1,00 | (b) | Mesma asserção (`Object.isFrozen`), mas sobre `placeValue` e `eraseValue`: operações diferentes. |
| `src/ui/App.test.tsx:335` (CA-005-23) e `src/domain/game.history.test.ts:163` (CA-004-17) | 0,86 | (b) | Domínio × UI, CAs diferentes. A UI testa o anúncio e o foco. |
| `src/ui/App.test.tsx:217` e `src/ui/model/reducer.test.ts:393` (ambos CA-005-17) | 0,86 | (b) | Componente integrado × reducer. Outra camada. |
| 36 pares no mesmo arquivo com similaridade de 0,88 a 0,97 | — | (b) | Triangulação: linha/coluna/bloco, 1/9, undo/redo. Exemplos: `board.test.ts:145` e `:152`, `:317` e `:328`, `:810` e `:818`; `reducer.test.ts:177` e `:184`, `:535` e `:543`; `navigation.test.ts:23` a `:35`. A TDD do projeto manda triangular, então não são repetição. |

### 2.2 Blocos `expect` idênticos

| Bloco | Onde | Classe |
|---|---|---|
| `expect(contrastRatio(color(v, fg), color(v, bg))).toBeGreaterThanOrEqual(TEXT)` com os mesmos pares de cores | `theme.contrast.test.ts:91`, `:100`, `:107` e `:114` repetem pares que `:203` (`TEXT_PAIRS`) e `:208` (`COMPONENT_PAIRS`) já testam no tema claro | **(a)**, ver 2.4 |
| `expect(deserializeGame(serializeGame(game))).toEqual({ ok: true, value: game })` | `deserialize.test.ts:57`, `:435`, `serialize.prop.test.ts:52`, `serialize.prune.test.ts:60` | (c) para `:57`; (b) para os demais |
| `expect(btn('Desfazer').getAttribute('aria-disabled')).toBe('true')` + o de `Refazer` | `Actions.test.tsx:137` (componente isolado) e `App.test.tsx:386` (aplicação inteira); ambos CA-005-42 | (b) |
| `expect(dispatch).toHaveBeenCalledWith({ type: 'erase' })` | `Grid.test.tsx:265` (CA-005-14, teclado) e `Keypad.test.tsx:53` (CA-005-27, botão) | (b) |
| `expect(screen.getByRole('status').textContent).toBe('')` + `childElementCount 0` | `Announcer.test.tsx:19` (estado inicial nulo) e `:58` (transição para nulo, sem anúncio novo) | (b) |
| `expect(ann(second).text).toBe(ann(first).text)` + `id + 1` | `reducer.test.ts:141` (CA-005-15, pista) e `:431` (CA-005-18, anotar com modo ligado) | (b) |
| `expect(result.ok).toBe(true); expect(state(...))` | `game.history.test.ts:140` (desfazer place) e `:163` (desfazer toggle-note) | (b): operações diferentes |
| Mesmos três `expect` dos itens `createBoard` com `conflicting-givens`/`malformed-grid` | `board.test.ts:317`-`:340`, `:378`-`:399` | (b): triangulação |

### 2.3 Exemplo fixo × propriedade do mesmo CA

| Invariante (CA) | Exemplo | Propriedade | Classe |
|---|---|---|---|
| Duas serializações idênticas (CA-004-26) | `serialize.test.ts:65` | `serialize.prop.test.ts:28` (já inclui byte a byte, JSON válido, `schemaVersion`) | (c): o exemplo é subconjunto da propriedade; falta saber se o exemplo, que usa jogo fixo, pega algo que a propriedade com 10 execuções do Stryker não pega |
| Texto sem `status`, `conflicts`, `before` (CA-004-31) | `serialize.test.ts:104` (jogo com conflito, confere chaves e ordem) | `serialize.prop.test.ts:40` | (c): o exemplo também confere a lista de chaves, então só parte dele é subconjunto |
| Ida e volta serialize→deserialize (CA-004-25) | `deserialize.test.ts:57` (jogo fixo; primeiro matador de 71 mutantes) e `:435` | `serialize.prop.test.ts:52` | (c) para `:57`; (b) para `:435` (índice 80 e kind 3, borda) |
| Anotações crescentes, únicas, congeladas (CA-004-02) | `notes.test.ts:5`, `:13`, `:19` | `notes.prop.test.ts:9` e `:20` | (c): o exemplo cobre só 2 mutantes; a propriedade o subsume, mas o exemplo é o RED da tarefa |
| Setas movem 1 casa (CA-005-07) | `navigation.test.ts:8`, `:11`, `:15`, `:19` | `navigation.prop.test.ts:46` | (c) |
| Desfazer restaura estado anterior (CA-004-17) | `game.history.test.ts:140` a `:175` | `game.prop.test.ts:113` | (b): um por operação, com mensagem de erro precisa |
| Seta contra a borda e Home/End (CA-005-08, 005-09) | `navigation.test.ts:23` a `:69` | `navigation.prop.test.ts:59`, `:72`, `:90`, `:100` | (b): bordas fixas que a propriedade pode não sortear |
| Grade malformada (CA-001-22) | `board.test.ts:145` a `:221` | `board.prop.test.ts:45`, `:60` | (b): os exemplos são os casos de borda (`1`, `9`, `null`, array esparso) |
| Poda de anotações (CA-005-43) | `game.prune.test.ts:64` a `:116` | `game.prune.prop.test.ts:89`, `:111` | (b) |
| Desfazer/refazer no reducer (CA-005-23, 005-24) | `reducer.test.ts:535`, `:543` | `reducer.prop.test.ts:509`, `:527`, `:553` | (b): o exemplo confere o texto do anúncio |

### 2.4 Detalhe do (a)

`src/ui/theme.contrast.test.ts` repete a mesma comparação de cores em dois lugares, no tema claro:

| Teste redundante | Linha | Expansões | Já coberto por |
|---|---|---|---|
| CA-005-04: `--color-note` sobre cada fundo, 4,5:1 | 212 | 8 fundos × 2 temas = 16 | `:220` (CA-005-32, mesmo título e corpo) |
| CA-005-39: `--color-given`/`--color-player` sobre cada fundo, 4,5:1 | 98-105 (laço) | 16 | `:203` (`TEXT_PAIRS`, tema claro, mesmos 16 pares) |
| CA-005-39: texto sobre o fundo, 4,5:1 | 91 | 1 | `:203` (primeiro par de `TEXT_PAIRS`) |
| CA-005-11: contorno da selecionada sobre fundo e vizinha, 3:1 | 107 | 1 | `:208` (primeiros dois pares de `COMPONENT_PAIRS`) |
| CA-005-11: foco sobre cada fundo, 3:1 | 114-120 (laço) | 8 | `:208` (`COMPONENT_PAIRS`, tema claro) |

Total: 42 testes. Ressalva: os itens de CA-005-39 e CA-005-11 vêm da 005a e são o que `specs/` cita para o tema claro. Remover exige antes passar os IDs para o título dos testes de `TEXT_PAIRS` e `COMPONENT_PAIRS`.

## 3. Arquivos grandes

Tokens ≈ bytes ÷ 4 (`wc -c`).

| # | Arquivo | Linhas | Bytes | Tokens (≈) |
|---|---|---|---|---|
| 1 | `src/domain/board.test.ts` | 968 | 32.768 | 8.192 |
| 2 | `src/ui/model/reducer.test.ts` | 666 | 27.686 | 6.922 |
| 3 | `src/ui/model/reducer.prop.test.ts` | 685 | 26.114 | 6.529 |
| 4 | `src/ui/Grid.test.tsx` | 421 | 19.156 | 4.789 |
| 5 | `src/domain/deserialize.test.ts` | 441 | 18.518 | 4.630 |

(`src/ui/App.test.tsx`, 17.190 bytes, é o sexto.) Os 48 arquivos somam 8894 linhas.

**Decisão 7 do Diretor (`board.test.ts` será dividido por operação antes de crescer).** Tamanho atual: 968 linhas, ~8,2k tokens, exatamente o valor da decisão. O arquivo não cresceu desde `1b76bfa` (24/11/2026), então o gatilho "antes de crescer" **ainda não chegou**. Sinais de que a divisão já seria útil: ele ainda é o maior da suíte (18% acima do segundo); tem 14 blocos `describe` que já separam por operação (`createBoard`, `getConflicts`, `placeValue`, `eraseValue`, recusas), o que torna o corte direto; e os dois seguintes (`reducer.test.ts` e `reducer.prop.test.ts`, ~6,5k a 6,9k) são o próximo ponto (não verifiquei se cresceram na 005b). Nenhum CA aberto no backlog pede teste novo em `board.ts`; por isso a divisão não é urgente, mas vale conferir `reducer.test.ts` antes de crescer mais.

## 4. Classificação consolidada

Legenda: **(a)** redundante de fato; **(b)** repetido só na aparência; **(c)** dúvida. Formato `arquivo:linha` (CA).

**(a)**

- `theme.contrast.test.ts:212` (CA-005-04) × `:220` (CA-005-32).
- `theme.contrast.test.ts:91`, `:98-105` (CA-005-39) × `:203` (CA-005-32).
- `theme.contrast.test.ts:107`, `:114-120` (CA-005-11) × `:208` (CA-005-32).

**(c)**

- `serialize.test.ts:65` (CA-004-26) × `serialize.prop.test.ts:28` (CA-004-26).
- `serialize.test.ts:104` (CA-004-31) × `serialize.prop.test.ts:40` (CA-004-31).
- `deserialize.test.ts:57` (CA-004-25) × `serialize.prop.test.ts:52` (CA-004-25) e `deserialize.test.ts:435`.
- `notes.test.ts:5`, `:13`, `:19` (CA-004-02) × `notes.prop.test.ts:9`, `:20` (CA-004-02).
- `navigation.test.ts:8`, `:11`, `:15`, `:19` (CA-005-07) × `navigation.prop.test.ts:46` (CA-005-07).
- `deserialize.test.ts:406` (CA-004-28, kind 4) e `units.test.ts:16` (`INV`): sem cobertura de mutante.
- `game.history.test.ts:163` (CA-004-17) × `game.prop.test.ts:113` (CA-004-17), com o bloco `expect` quase igual ao de `:140`.

**(b)** (amostra; as demais combinações estão nas seções 2.1 a 2.3)

- `board.test.ts:497` (CA-001-03) × `:543` (CA-001-05): `place` × `erase`.
- `Actions.test.tsx:137` × `App.test.tsx:386` (ambos CA-005-42): componente × aplicação.
- `Grid.test.tsx:265` (CA-005-14) × `Keypad.test.tsx:53` (CA-005-27): teclado × botão.
- `Announcer.test.tsx:19` × `:58` (ambos CA-005-31): estado inicial × transição.
- `reducer.test.ts:141` (CA-005-15) × `:431` (CA-005-18): pista × modo anotação.
- `App.test.tsx:217` × `reducer.test.ts:393` (ambos CA-005-17): componente × reducer.
- `__arbitraries__/board.test.ts:33`, `:40`, `:47` e `__arbitraries__/moves.test.ts:42`, `:112`: testes dos geradores (sem mutante por definição).
- Os 25 CAs com testes em mais de um arquivo, entre eles CA-005-16 (14 testes em 7 arquivos), CA-005-31 (22 em 4), CA-005-43 (21 em 6): cada arquivo cobre uma camada (domínio, reducer, view, componente).

## Limitações do método

1. **`killedBy` só guarda o primeiro matador** (bail do Stryker). A pergunta "testes que só matam mutantes que outro também mata" não é respondível sem nova rodada com `disableBail: true`. Só os 22 sem cobertura são provadamente inofensivos para mutação.
2. **Escopo do Stryker:** só `src/domain/**`; sem UI, scripts nem E2E; sem os testes "regressão de tempo" e "gerador … alcança"; propriedades com ≤10 execuções.
3. **Contagem de testes:** 1104 na execução, 801 no relatório, 562 em `vitest list` (sem expandir `it.each`). Os números por classe misturam "declarações" e "execuções" onde indicado.
4. **Extração de títulos e `expect` por expressão regular:** não analisa AST; `it.each` com título em template e `expect` multilinha podem escapar. Os limiares de similaridade (0,85 entre arquivos e 0,88 no mesmo arquivo) foram escolhidos por inspeção.
5. **Classificação (b) e (c) é julgamento:** conferi o corpo dos pares citados, não de todos os 70 grupos de (b).
6. **Redundância de cobertura de linha ou ramo** (qualquer teste que passa pelo mesmo código) não foi medida; só mutação e texto.
