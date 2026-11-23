# ADR 0005: Web Worker e gerador determinístico versionado

- **Status:** Aceito pelo Diretor em 22/11/2026, após duas rodadas do `revisor`.
- **Data:** 22/11/2026
- **Autor:** agente `arquiteto`

## Contexto

Gerar um puzzle com solução única e dificuldade conhecida é custoso e não pode travar a thread principal em Android modesto. O desafio diário exige que a mesma data local e o mesmo nível produzam o mesmo puzzle, offline e sem servidor. Níveis de dificuldade (MVP) dependem de um solver lógico que avalia técnicas; as dicas do pós-MVP reaproveitam esse solver. O domínio fica em `src/domain/`, sem DOM nem `Math.random`.

## Opções consideradas

| Tema | Opção A | Opção B |
|---|---|---|
| Comunicação | `postMessage` puro com protocolo tipado | Comlink 4.4.2 (1,9 kB gzip, RPC por proxy) |
| PRNG | sfc32 (128 bits de estado) | mulberry32 (32 bits) ou xoshiro128** |

## Decisão

**1. Worker com `postMessage` puro.** Há só duas operações (`generate`, `solve/rate`). Um protocolo `Request`/`Response` como união discriminada em TS, com `id` de requisição, é mais simples de testar do que um proxy e poupa 1,9 kB. Cancelamento: `worker.terminate()` e recriar. O núcleo é uma função pura em `src/domain/` testada sem Worker; o arquivo do Worker é uma casca fina. Se surgirem mais de ~5 operações, reavaliar Comlink.

**2. PRNG injetado: sfc32.** Interface `Rng { nextUint32(): number; nextInt(max): number }` recebida por parâmetro; o domínio nunca usa `Math.random`, `Date.now`, `new Date` nem `performance.now` (regras de lint `no-restricted-properties`/`no-restricted-syntax` em `src/domain/` + teste; princípio 5).
- Motivo: 128 bits de estado (período longo, sem o ciclo curto do mulberry32 de 32 bits, cujo período é ~4 bilhões e pula valores segundo bryc), passa PractRand segundo a mesma fonte (não reconferido), uso apenas de inteiros de 32 bits (`>>> 0`, adição com `| 0`), logo idêntico em qualquer engine. xoshiro128** foi preterido: a fonte aponta falhas de complexidade linear e baixos bits fracos (segundo a fonte, não reconferido).
- `nextInt(max)` por rejeição (sem viés de módulo), sem ponto flutuante. O embaralhamento é Fisher-Yates sobre `nextInt`.
- Seed do desafio diário: string `sudoku/v{ALGO}/{AAAA-MM-DD}/{nível}`. Um hash de string de 32 bits **iterado quatro vezes** (estilo xmur3: cada chamada devolve a próxima palavra) preenche as quatro palavras de estado do sfc32; assim a seed usa os 128 bits, não só 2^32 estados. O hash exato é fixado por teste dourado.
- Seed de jogo avulso (fora do diário): gerada pela **camada de UI** com `crypto.getRandomValues` (128 bits) e injetada no domínio. Fica gravada no jogo salvo (ADR 0004), o que torna qualquer partida reproduzível.

**3. Algoritmo versionado.** Constante `GENERATOR_VERSION` (inteira). Mudar qualquer coisa que altere a saída para a mesma seed (PRNG, ordem de escavação, critérios de aceite, técnicas) exige incrementar a versão. Um **teste dourado** (seed fixa -> hash do puzzle por versão) falha em mudança silenciosa. O histórico do diário guarda o puzzle e a versão (ADR 0004), então partidas passadas não dependem de regeração. Vale a **data local do aparelho** (decisão do Diretor, 22/11/2026): não há servidor, então o desafio vira à meia-noite local, e não à meia-noite UTC (21h BRT). **Há um desafio por nível por dia** (fácil, médio, difícil e especialista; decisão do Diretor, 22/11/2026): o `{nível}` da seed separa os quatro. "O mesmo puzzle para todos" vale por data local e nível. Consequência aceita: jogadores em fusos diferentes podem estar em dias diferentes no mesmo instante.

**4. Geração.** (a) Preencher grade completa por backtracking com candidatos embaralhados pelo PRNG. (b) Remover células em ordem embaralhada; após cada remoção, **contar soluções com corte em 2** (backtracking com heurística de menor candidato); manter a remoção só se a contagem for 1. (c) Avaliar com o solver lógico; se o nível não for o alvo, tentar de novo com o mesmo fluxo do PRNG, até N tentativas. Esgotadas as N, recomeçar com a sub-seed `{seed}/{k}`, com k = 1, 2, … (a primeira rodada usa a seed sem sufixo), de forma determinística, até um teto K; passando de K, o gerador falha de forma explícita (erro tipado) e o teste de orçamento acusa. N e K fazem parte da `GENERATOR_VERSION`. Propriedade testada com fast-check: todo puzzle gerado tem exatamente 1 solução.

**5. Dificuldade por técnicas (solver lógico, sem tentativa e erro).** Nível = técnica mais difícil necessária. Escala inicial, convenção nossa (não verificada em fonte externa; calibrar na Fase 1):

| Nível | Técnicas |
|---|---|
| Fácil | único nu (naked single), único oculto (hidden single) |
| Médio | + pares nus/ocultos, apontamento/redução em caixa (locked candidates) |
| Difícil | + trincas nuas/ocultas, X-Wing |
| Especialista | + XY-Wing, Swordfish; quando só a busca resolve, o puzzle é rejeitado |

## Consequências

- Positivas: UI sempre responsiva; resultado reproduzível e auditável; dicas futuras quase de graça; domínio testável sem Worker.
- Negativas: cada mudança no gerador tem custo de versionamento; a calibração dos níveis é empírica e pode exigir ajuste (nova versão do algoritmo); geração de Especialista pode ser lenta (orçamento no ADR 0001, não confirmado).
- Plano B se o orçamento estourar: pool de puzzles pré-gerados e versionados, sorteados pelo PRNG.

## Fontes (consultadas em 22/11/2026)

- https://github.com/bryc/code/blob/master/jshash/PRNGs.md (comparação de PRNGs de 32 bits)
- https://bundlephobia.com/package/comlink@latest
- `docs/historico/BOOTSTRAP.md` §4 e §5; `docs/process/plano-fase-0.md` seção 1
