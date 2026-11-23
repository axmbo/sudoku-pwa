# Plano da Fase 1 — domínio e primeira UI

Proposta do passo 7 do [plano da Fase 0](plano-fase-0.md). A Fase 1 entrega o núcleo jogável: os itens B-01 a B-05 do [backlog](../produto/backlog.md). Cada spec é um ciclo completo (`PROCESSO.md` §5). Os itens B-06 a B-10, que completam o MVP, ficam para a Fase 2 (aprovado pelo Diretor em 22/11/2026).

## Specs e ordem

| Spec | Item | Escopo | Depende de |
|---|---|---|---|
| 001 | B-01 | tabuleiro + validação de conflitos | — |
| 002 | B-02 | solver (backtracking + contagem de soluções com corte em 2) | 001 |
| 003 | B-03 | gerador com seed + dificuldade por técnicas | 001, 002 |
| 004 | B-04 | estado de jogo (anotações, desfazer/refazer, vitória, serialização versionada) | 001 |
| 005 | B-05 | grade acessível (primeira UI) | 001, 004 |

A 004 não depende de 002 nem de 003; pode vir antes da 003 se a 003 travar.

## Estimativa por ciclo

Âncora: o passo 5 (esqueleto, 6 tarefas de domínio com TDD e 2 rodadas de revisão) custou 558k tokens, 1,4× o pessimista dele. Faixas otimista / provável / pessimista; tokens = in + cache write + out ([métricas](metricas.md)).

| Spec | Tokens | Minutos | Risco |
|---|---|---|---|
| 001 | 250k / 500k / 1M | 60 / 120 / 240 | baixo; primeiro ciclo SDD completo (custo de aprender o fluxo) |
| 002 | 200k / 400k / 800k | 45 / 90 / 180 | baixo; algoritmo conhecido, property-based forte |
| 003 | 400k / 800k / 1,6M | 90 / 180 / 360 | **alto**; técnicas de dificuldade e determinismo. Provavelmente dividida em 003a (gerador + seed + unicidade) e 003b (níveis por técnica) |
| 004 | 250k / 500k / 1M | 60 / 120 / 240 | médio; o schema versionado conversa com o ADR 0004 |
| 005 | 350k / 700k / 1,4M | 90 / 180 / 360 | médio; E2E, axe e leitor de tela com o `qa-auditor` |
| **Total** | **1,45M / 2,9M / 5,8M** | **~6h / 11,5h / 23h** | sem contar a espera pelo Diretor |

## Orçamento por agente

- **Contexto inicial:** até 15k tokens por subagente (regra de ouro 10), montado pelo manifesto da tarefa (skill `gestao-contexto`).
- **Partilha provável de cada ciclo** (ponto de partida; a quebra real por tarefa × agente é gravada em `metrics.csv` no `/planejar`): orquestrador 35%, `eng-testes` 15%, `dev` 15%, `revisor` 15%, `arquiteto` 10%, `produto-ux` 5%, `curador-pdca` 5%. Na 005 entra o `qa-auditor`, com ~10% tirados do orquestrador.
- **Modelos:** sonnet por padrão; haiku para o mecânico (provas de hook, coleta de métricas); opus só com justificativa escrita.

## Critérios de saída da fase

- As cinco specs `concluída` e arquivadas, com retro de cada ciclo.
- `npm run check` verde; cobertura e mutation score do domínio dentro dos gates de `PROCESSO.md` §6 (mutation ≥ 70% em `src/domain/`; mutante sobrevivente em código novo é major).
- Erro médio de estimativa de tokens medido nos 5 ciclos (a meta < 30% vale a partir daqui, skill `pdca`).
