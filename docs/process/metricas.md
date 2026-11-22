# Definição das métricas de `metrics.csv`

Fonte única das definições das colunas de [metrics.csv](metrics.csv). A estimativa e o real usam sempre a mesma regra.

## Tokens

- **`tokens` = input + cache write + output**, somados entre todos os modelos que aparecem nas linhas de uso do `/cost`. Mede o que a sessão processou de novo.
- **Cache read** fica fora de `tokens` e vai para a coluna própria `cache_read_real`. Em sessões longas ele domina o total e distorceria a calibração da estimativa.
- Custo em dólares (`usd_real`): o valor total que o `/cost` mostra.
- Colunas reais: `tokens_in_real`, `tokens_cache_write_real`, `tokens_out_real`, `cache_read_real`, `tokens_real` (= in + cache_write + out), `usd_real`.
- Colunas estimadas: `tokens_est_otim`, `tokens_est` (provável) e `tokens_est_pess`, todas pela mesma regra de `tokens`.

## Coleta do real

- O Diretor cola a saída do `/cost` ao fim de cada passo ou tarefa.
- O `/cost` é acumulado na sessão. O real de um passo é a diferença entre a leitura do fim do passo e a leitura anterior.
- Depois de um `/clear`, confira se o contador zerou. Se zerou, a leitura seguinte já é o real do passo; anote isso em `obs` na primeira vez.
- Subagentes: se o resultado do subagente informar tokens, registre numa linha própria (`agente` = nome do subagente). Se não informar, o custo fica dentro da leitura do `/cost` da sessão, e `obs` diz isso.
- Número indisponível = `n/d`. Nunca estimar o real.

## Tempo

- `min_est_otim`, `min_est`, `min_est_pess`: minutos de trabalho estimados, sem contar a espera pelo Diretor.
- `min_real`: minutos de trabalho efetivo, também sem a espera pelo Diretor. Sai da duração da API no `/cost` quando ela estiver disponível. Se não estiver, vem do relógio, e `obs` registra isso.

## Contexto

- `limpeza_antes`: `sim` se houve `/clear` + retomada imediatamente antes do passo, senão `nao`. Serve para comparar o custo dos passos com e sem limpeza.
- `ctx_inicial_est`: tokens estimados do contexto inicial de um subagente (orçamento padrão: 15k).
- `leituras_fora_manifesto`: quantos arquivos foram lidos fora do manifesto da tarefa.

## Qualidade

`rodadas_revisao`, `achados_blocker|major|minor`, `testes_novos`, `cobertura_dominio` (% de branches em `src/domain/`) e `mutation_score` (% em `src/domain/`). Em branco quando não se aplicam.
