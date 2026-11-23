---
name: revisao
description: Checklist de revisão de código do Sudoku PWA por severidade (blocker/major/minor/nit), critério de saída do loop, formato do parecer e checagem de deriva spec×código. Use ao revisar um diff ou analisar consistência de uma spec.
---

# Revisão — procedimento

Fonte do critério de saída: `PROCESSO.md` §5. Revise **só o diff** (`git diff <base>...HEAD`, ou o delta desde a rodada anterior).

## Ordem
1. `npm run check` verde? Se não, pare e devolva: gate de máquina vem antes.
2. Rastreabilidade: liste os CA da spec e o teste que cita cada um; liste testes sem CA.
3. Ordem dos commits: `test` antes de `feat`/`fix` em cada tarefa não isenta; isenções com motivo da lista fechada.
4. Correção e legibilidade do código alterado.
5. Constituição e ADRs: domínio puro, determinismo, privacidade, a11y, orçamento.
6. Segurança: CSP, dependência nova (precisa?), terceiros, segredos, dados pessoais.
7. Deriva: o código faz o que a spec diz, nem mais nem menos.

## Severidades
| Nível | Exemplos |
|---|---|
| **blocker** | quebra de princípio da constituição; dado do jogador perdido; segredo no diff; `check` vermelho |
| **major** | CA sem teste ou teste sem CA; deriva spec×código; teste instável; mutante sobrevivente em código novo do domínio; violação de ADR aceito; ordem TDD quebrada sem isenção |
| **minor** | nome confuso, duplicação local, caso de borda não crítico, doc desatualizada |
| **nit** | estilo que o lint não pega, preferência |

## Critério de saída
**0 blocker, 0 major, ≤ 3 minor.** Minors aceitos viram issues `débito`. Nits não bloqueiam. Máximo de 3 rodadas; na 4ª, escalar ao Diretor com o impasse resumido.

## Formato do parecer (`specs/NNN-*/revisao-rN.md`)
```
# Revisão rN — spec NNN — <data>
Base: <sha> · Head: <sha> · check: verde|vermelho
Veredito: sai | nova rodada | escalar
| # | Sev. | Arquivo:linha | Achado | Sugestão |
Rastreabilidade: CA-NNN-01 → <teste> ... | órfãos: <lista>
```

## Regras
- Achado sem arquivo:linha não conta.
- Não proponha refatoração fora do diff; vire issue se importar.
- Checklist que se repete em 3 ciclos é candidato a lint/teste (`docs/process/melhorias.md`).
