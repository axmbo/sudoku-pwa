---
name: sdd
description: Procedimento de Spec-Driven Development do Sudoku PWA — como escrever spec.md, plan.md e tasks.md a partir dos templates, regras de ID de critério de aceite e análise de consistência. Use ao especificar, planejar, quebrar em tarefas ou analisar uma spec.
---

# SDD — procedimento

Fonte: `PROCESSO.md` §3 (hierarquia e fluxo) e [ADR 0002](../../../docs/adr/0002-sdd-proprio.md). Templates em `specs/_templates/`.

## Numeração e pastas
- Spec nova: `specs/NNN-<slug>/`, com `NNN` = próximo número livre (três dígitos) e slug curto em kebab-case pt-BR.
- Copie o template; não deixe placeholder `<...>` sem preencher ou remover.

## spec.md (`produto-ux`)
- Só O QUÊ e POR QUÊ. Palavra de tecnologia na spec é defeito.
- **ID de CA:** `CA-NNN-XX`, dois dígitos, sequencial. **Estável**: nunca renumerar; CA removido fica ~~riscado~~ com o motivo.
- Um CA = um comportamento observável, em Dado / Quando / Então, verificável por teste.
- Estados de erro e borda também são CA (entrada inválida, grade cheia, sem rede).
- Perguntas ao Diretor numeradas, com opções. Status `aprovada` só com a aprovação registrada.

## plan.md (`arquiteto`)
- Só depois da spec aprovada.
- Cada CA aparece na tabela de estratégia de teste com a camada certa (`PROCESSO.md` §6).
- Decisão de arquitetura nova ⇒ ADR `Proposto`, referenciado no plano.

## tasks.md (`arquiteto` + `eng-testes`)
- ≤ ~8 tarefas; mais que isso, dividir a spec.
- Toda tarefa tem: CA cobertos, `tdd:` (sim ou isenção da lista fechada), testes esperados, arquivos, **manifesto fechado**, estimativa em faixa e agentes.
- Ordem: domínio antes de UI; contrato (tipos) antes de implementação.
- O manifesto segue a skill `gestao-contexto` (orçamento de 15k tokens).

## Análise de consistência (`revisor`, em `/analisar`)
Verifique e liste o que falhar:
1. Todo CA da spec está em ≥ 1 tarefa e na estratégia de teste.
2. Nenhuma tarefa cobre algo que não está na spec (escopo escondido).
3. Isenções de TDD só da lista fechada, com motivo.
4. Tipos públicos do plano compatíveis com ADRs aceitos e a constituição.
5. Manifestos existem e citam seções, não repositórios inteiros.

Resultado: `ok` ou lista de achados com severidade (skill `revisao`). Com `ok`, marque a data no cabeçalho de `tasks.md`.

## Mudança de requisito no meio do ciclo
Pare a tarefa, atualize a spec (novo CA ou CA riscado), peça aprovação, ajuste plan/tasks e só então o código.
