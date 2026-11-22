# Definição das métricas de `metrics.csv`

Fonte única das definições das colunas de [metrics.csv](metrics.csv). A estimativa e o real usam sempre a mesma regra.

## Tokens

- **`tokens` = input + cache write + output**, somados entre todos os modelos que aparecem nas linhas de uso do `/cost`. Mede o que a sessão processou de novo.
- **Cache read** fica fora de `tokens` e vai para a coluna própria `cache_read_real`. Em sessões longas ele domina o total e distorceria a calibração da estimativa.
- Custo em dólares (`usd_real`): `n/d` enquanto não houver uma fonte oficial de preço aplicada aos tokens. Não estimar.
- Colunas reais: `tokens_in_real`, `tokens_cache_write_real`, `tokens_out_real`, `cache_read_real`, `tokens_real` (= in + cache_write + out), `usd_real`.
- Colunas estimadas: `tokens_est_otim`, `tokens_est` (provável) e `tokens_est_pess`, todas pela mesma regra de `tokens`.

## Coleta do real

- **Fonte:** o log da sessão do Claude Code, `~/.claude/projects/<projeto>/<sessão>.jsonl`. Cada resposta do modelo traz `message.usage` com `input_tokens`, `cache_creation_input_tokens` (cache write), `output_tokens` e `cache_read_input_tokens`. A extensão do VS Code não tem `/cost`, por isso o log é a fonte.
- Some deduplicando por `message.id` (o streaming repete a mesma mensagem) e recorte por intervalo de tempo. O real de um passo vai do commit do passo anterior até o commit do próprio passo.
- Subagentes gravam logs próprios em `~/.claude/projects/<projeto>/<sessão>/subagents/agent-<id>.jsonl`, e esse arquivo é somado à parte, numa linha própria. O `subagent_tokens` da notificação de término usa outra regra e não é usado.
- Um `/clear` inicia outro arquivo de sessão, e o recorte por tempo continua valendo.
- Número indisponível = `n/d`. Nunca estimar o real.

## Tempo

- `min_est_otim`, `min_est`, `min_est_pess`: minutos de trabalho estimados, sem contar a espera pelo Diretor.
- `min_real`: minutos de relógio entre o início e o commit do passo, **incluindo** a espera pelo Diretor, porque o log não separa as duas coisas; `obs` registra isso. A estimativa não inclui a espera, e a diferença entre as duas entra na calibração.

## Contexto

- `limpeza_antes`: `sim` se houve `/clear` + retomada imediatamente antes do passo, senão `nao`. Serve para comparar o custo dos passos com e sem limpeza.
- `ctx_inicial_est`: tokens estimados do contexto inicial de um subagente (orçamento padrão: 15k).
- `leituras_fora_manifesto`: quantos arquivos foram lidos fora do manifesto da tarefa.

## Qualidade

`rodadas_revisao`, `achados_blocker|major|minor`, `testes_novos`, `cobertura_dominio` (% de branches em `src/domain/`) e `mutation_score` (% em `src/domain/`). Em branco quando não se aplicam.
