---
name: pdca
description: Estimativa e PDCA do Sudoku PWA — como estimar tokens e minutos em faixa, registrar em metrics.csv, coletar o real do log jsonl, escrever a retro do ciclo e transformar lição em regra. Use antes de cada ciclo (estimar) e ao fim (retro).
---

# Estimativa e PDCA — procedimento

Fontes: `PROCESSO.md` §8–9; definições de coluna em `docs/process/metricas.md` (dona única das definições).

## Estimar (antes do ciclo)
1. Por tarefa e por agente, faixa **otimista / provável / pessimista** de tokens (in + cache write + out) e minutos.
2. Base: média do real de tarefas parecidas em `metrics.csv`. Sem histórico, use a tabela da Fase 0 como âncora e diga isso em `obs`.
3. Some o contexto inicial do manifesto (`ctx_inicial_est`) ao provável.
4. Grave uma linha por tarefa × agente em `metrics.csv` **antes** de começar; `limpeza_antes` = `sim`/`nao`.

## Coletar o real (depois)
1. Recorte o log `~/.claude/projects/<projeto>/<sessão>.jsonl` do commit anterior ao commit da tarefa.
2. Some `message.usage` deduplicando por `message.id`; subagentes em `<sessão>/subagents/agent-<id>.jsonl`, em linha própria.
3. `tokens_real = in + cache_write + out`; `cache_read_real` à parte; `usd_real` = `n/d`.
4. Sem dado: `n/d`. **Nunca estime o real.**

Script de apoio (jq), sobre um arquivo e janela de tempo:
```bash
jq -s --arg a "$INICIO" --arg b "$FIM" '[.[] | select(.message.usage and .timestamp >= $a and .timestamp <= $b)]
  | unique_by(.message.id) | map(.message.usage) | {in: (map(.input_tokens)|add), cw: (map(.cache_creation_input_tokens)|add),
  out: (map(.output_tokens)|add), cr: (map(.cache_read_input_tokens)|add)}' "$LOG"
```

## Retro (fim do ciclo) — `docs/process/retro/ciclo-NN.md`
≤ 10 linhas:
```
# Ciclo NN — spec NNN — DD/MM/AAAA
Funcionou: ...
Custou caro: ... (tokens est./real, rodadas, leituras fora do manifesto)
Ações (1–3): ... → candidata M-NNN em melhorias.md
```

## Lição → regra
1. Cada ação vira candidata `M-NNN` em `docs/process/melhorias.md`, escrita como diff de proposta.
2. Só o Diretor aprova. Aprovada: promova ao lugar **mais barato** que a garante — lint/teste/hook → skill → agente → `CLAUDE.md`.
3. Registre em `docs/process/CHANGELOG-processo.md` com versão nova (v0.2, v0.3…).
4. Regra sem uso em 5 ciclos: proponha remoção.

## A cada 3 ciclos
Revisão estrutural (`PROCESSO.md` §9): custo por achado útil por agente e modelo, fundir/dividir, tamanho dos arquivos, checklist → lint, manifestos, templates. Erro médio de estimativa de tokens: meta < 30% após 5 ciclos. Minutos de CI do mês (GitHub Actions) como métrica.
