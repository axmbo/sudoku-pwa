# Revisão estrutural do ciclo 03 (`PROCESSO.md` §9) — 27/11/2026
Base: ciclos 01, 02 e 03 (27 tarefas, 3 specs); `metrics.csv`, retros, `melhorias.md`. Cada proposta vira candidata `M-NNN` com alternativas e recomendação; só o Diretor aprova.

## 1. Custo por achado útil das revisões (achado útil = blocker, major ou minor; nit não conta)
| Etapa | Tokens | Achados úteis | Tokens por achado útil |
|---|---|---|---|
| Análise de consistência da 005a (`revisor`, r1 e r2) | n/d por rodada; 256,1k no total de `analisar` (linha `ciclo-completo`) | 1 major + 8 minor | ~28k, **antes do código** |
| Revisão do ciclo 02 (r1 81,2k, r2 31,7k) | 112,9k (209,6k com correções) | 2 major + 2 minor | 28k (52k com correções) |
| Revisão do ciclo 03 (r1 55,6k, r2 38,0k, r3 28,6k) | 122,2k | 4 minor, 0 major | 30,6k |
| Revisão pós-PR #25 (delta) | 34,6k | 0 (2 nits) | n/a |
| qa-auditor automático | 23,3k | 0 falhas (Lighthouse n/d) | n/a |
- A análise antes do código é o ponto mais barato e o de maior severidade (o único major da 005a nasceu na spec); a revisão de código da 005a não achou major. Os defeitos visuais vieram da inspeção do Diretor, não da r1 (M-019).
- Ciclo 01: sem quebra de tokens de revisão nas retros; fica `n/d`.

## 2. Troca de modelo
- Revisão e implementação seguem em `sonnet`; nenhum achado da 005a exigiu `opus`. `haiku` não serve à revisão de delta visual (depende de ler capturas) e ao `qa-auditor` já basta: o agente declara `haiku`, mas `metrics.csv` registra `claude-sonnet-5-5` nas duas linhas da 005a; **divergência a conferir** (o registro ou o modelo efetivo está errado). Sem candidata nova.
- O orquestrador (`opus`) custou ~1,86M (teto) contra 1,84M dos subagentes: a maior alavanca de custo. Só decidir com dado de 2 ciclos medidos (M-021, alternativa B).

## 3. Fundir ou dividir agentes
- Uso por linha de `metrics.csv` (specs 001, 004, 005a): eng-testes 30, dev 27, revisor 12, curador-pdca 5, produto-ux 3, arquiteto 3, qa-auditor 2, `devsecops` 0 (só 3 linhas na Fase 0). **Sem fusão ou divisão:** `devsecops` é papel raro por desenho (custo zero parado); eng-testes e dev precisam das fronteiras do hook; `produto-ux`/`arquiteto` rodam 1 a 2 vezes por spec. Sem candidata.

## 4. Tamanho (`wc -l`, 27/11/2026)
- `CLAUDE.md` 61/80. Agentes (arquivo inteiro, frontmatter incluso): máximo 37 (`dev`), logo corpo < 40 em todos. Skills: máximo 47 (`git-fluxo`), `pdca` 45, `dominio-sudoku` 44, `sdd` e `tdd-dominio` 43, `gestao-contexto` e `revisao` 42; todas < 80. Medido antes das promoções do v0.10; depois delas, `pdca` 47 e `gestao-contexto` 43.
- `docs/estado.md` 40/40 antes desta retro: no limite; as decisões de spec concluída (13 a 22) migram para o `RESUMO.md` da 005a. M-020 e M-021 somam 3 linhas cada a `gestao-contexto` (45) e `pdca` (48), abaixo do limite. Sem poda proposta.

## 5. Checklist que pode virar lint
- Limites de linhas e links relativos quebrados (o arquivamento da 005a corrigiu 3 padrões à mão): **M-023**. A conferência de `Closes #N` (M-015) e o formato do `RESUMO.md` ficam manuais (baixa frequência).

## 6. Qualidade dos manifestos
- Todos fechados e < 15k (maior 9,6k, ~10,5k com L0), mas 9 de 12 tarefas da 005a tiveram leitura fora do manifesto (só T09, T11 e T12 limpas), com padrões repetidos (exports de `game.ts`, `vitest.config.ts` e seed, CA de texto fixo, ganchos de CSS): **M-020**. Manifesto inchado: nenhum caso (contexto alto com pouco uso não registrado).

## 7. Templates não lidos
- Logs de sessão que citam cada template: `tasks.md` 27, `spec.md` 13, `plan.md` 10, `notas.md` 4, `RESUMO.md` 4. Nenhum sem leitura; sem candidata. (Contagem por arquivo de log, não por leitura efetiva.)

## 8. Regras sem uso em 5 ciclos
- Só 3 ciclos completos; nenhuma regra atinge o critério de remoção. Em observação: o hook da M-001 (0 ocorrências em 27 tarefas) e a M-018 (1 ocorrência em 12).

## 9. Pareceres das pendências mantidas
- **M-001 (descartar sem ocorrência): recomendo descartar.** 0 ocorrências em 27 tarefas; reabre se aparecer uma. Alternativa: manter mais um ciclo (custo nulo, ruído em `melhorias.md`).
- **M-009(b) (`min_est` pela vazão): recomendo promover**, com vazão 0,7M tokens/h revista por ciclo, depois de M-022 (definição única de `min_real`). Dados: 004 0,57M/h, 005a 0,88M/h; minutos estimados 5,5× o medido na 005a (2,6× na 004). Alternativa: manter mais um ciclo (estimativa de minutos segue 3× a 5× alta; não afeta tokens).
- **M-018: recomendo descartar** (não repetiu de T06 a T12).

## Candidatas desta revisão e da retro
M-019 (capturas antes da r1), M-020 (manifesto de UI), M-021 (medir o orquestrador), M-022 (`min_real`), M-023 (teste de tamanho e links), mais os pareceres acima; detalhes em [melhorias](../melhorias.md).
