---
name: gestao-contexto
description: Gestão de contexto do Sudoku PWA — camadas L0 a L3, como montar o manifesto de uma tarefa, orçamento de 15k tokens, quando limpar ou compactar, como atualizar docs/estado.md e arquivar specs. Use ao preparar tarefas, retomar sessão ou fechar ciclo.
---

# Gestão de contexto — procedimento

Fonte das regras: `PROCESSO.md` §4.

## Camadas
| Camada | Conteúdo | Quem carrega |
|---|---|---|
| L0 | `CLAUDE.md` | automático, toda sessão e todo subagente próprio |
| L1 | `docs/estado.md` (hook `SessionStart`) + `docs/constituicao.md` | início de sessão |
| L2 | `spec.md` + `plan.md` da feature ativa | quem planeja ou revisa |
| L3 | manifesto da tarefa | o agente da tarefa |

## Montar um manifesto
1. Comece pelo que a tarefa altera (arquivos listados) e pelos testes da tarefa.
2. Acrescente só os tipos/contratos importados, por arquivo e, se possível, por linhas (`src/domain/board.ts#L1-40`).
3. Da spec, só os CA cobertos (`spec.md#CA-001-02`); do plano, só a seção do módulo.
4. Estime: ~4 caracteres por token; some e compare com **15k tokens** (sem contar L0). Passou? Corte ou divida a tarefa.
5. Registre `ctx_inicial_est` em `metrics.csv`.
6. O agente reporta `leituras_fora_manifesto`; muitas = manifesto pobre, contexto alto com pouco uso = inchado.

## Limpar ou compactar
- **Limpar** (`/clear` + `/retomar`) entre tarefas independentes e entre ciclos, sempre depois de atualizar `estado.md`.
- **Compactar** só no meio de tarefa longa que não pode recomeçar por arquivo.
- Sinais de limpeza: troca de tarefa, conversa com muitas leituras que não servem mais, retomada após pausa longa.

## Atualizar `docs/estado.md`
- ≤ 40 linhas, só estado: fase/ciclo, spec ativa, tarefa atual, bloqueios, próximos passos, pendências do Diretor.
- Regra nunca vai para o estado: se aparecer, mova para o dono (§9 do `PROCESSO.md`).
- Atualize ao fim de cada tarefa e sessão, no mesmo commit do trabalho.
- Teste mental: uma sessão nova, lendo só L0 + L1, sabe o que fazer a seguir?

## Arquivar
- Spec concluída: escreva `RESUMO.md` (template), mova a pasta para `specs/_arquivo/NNN-<slug>/` e deixe o resumo como ponto de leitura.
- ADR superado: status `Superado por NNNN`, nunca apagar.

## Higiene (a cada ciclo)
`wc -l CLAUDE.md .claude/agents/*.md .claude/skills/*/SKILL.md docs/estado.md`. Limites: `CLAUDE.md` 80, agente 40 de corpo, skill 80, estado 40. Acima do limite, proponha poda em `docs/process/melhorias.md`.
