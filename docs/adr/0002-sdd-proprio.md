# ADR 0002: Spec-Driven Development com equivalente próprio (sem GitHub Spec Kit)

- **Status:** Proposto
- **Data:** 22/11/2026
- **Autor:** Orquestrador

## Contexto

O BOOTSTRAP (§3A) pede SDD com quatro artefatos por feature (`spec.md`, `plan.md`, `tasks.md`, `notas.md`) e manda avaliar uma ferramenta pronta, como o GitHub Spec Kit, contra um equivalente próprio. Critérios: custo em tokens dos templates, aderência ao Claude Code e lock-in. A economia de tokens e a gestão de contexto são requisitos do processo, não detalhes.

## Opções consideradas

| Critério | GitHub Spec Kit | Equivalente próprio |
|---|---|---|
| Custo dos templates | longos e genéricos; cada spec paga o texto que ninguém lê | curtos, sob medida, enxugáveis pelo PDCA |
| Aderência ao Claude Code | comandos genéricos para vários agentes | skills nativas (`/especificar`, `/planejar`…) com `skills:` no frontmatter dos agentes |
| Dependências | CLI em Python/uv e pasta `.specify/` | nenhuma: Markdown + skills |
| Duplicação | `.specify/memory/constitution.md` e scripts duplicariam `PROCESSO.md` e `constituicao.md` | uma fonte por regra |
| Lock-in | formato e atualizações ditados pela ferramenta | formato do próprio repositório |
| Manifesto de contexto por tarefa | não nativo | campo obrigatório no template de `tasks.md` |

## Decisão

Adotar um **SDD próprio**:

- templates em `specs/_templates/` (`spec.md`, `plan.md`, `tasks.md` com manifesto, `notas.md`, `RESUMO.md`);
- procedimento na skill `sdd`;
- pontos de entrada como skills invocáveis: `/especificar`, `/planejar` (plan + tasks + estimativa), `/analisar`, `/implementar`, `/revisar`, `/retro`, `/retomar`.

O fluxo e a hierarquia ficam em `PROCESSO.md` §3.

## Consequências

- **Positivas:** contexto inicial menor por spec; nenhuma dependência nova; os templates evoluem pelo PDCA com o mesmo rito das outras regras.
- **Negativas:** a manutenção dos templates e das skills é nossa; não herdamos melhorias da comunidade.
- **Revisão:** se, após 3 ciclos, os templates crescerem a ponto de igualar os do Spec Kit, ou se surgir um recurso dele que custe caro reproduzir, reabrir este ADR.
