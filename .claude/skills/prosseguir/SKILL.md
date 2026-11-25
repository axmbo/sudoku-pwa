---
name: prosseguir
description: Retoma o Sudoku PWA a partir de docs/estado.md e executa a próxima etapa registrada (implementar, revisar, retro…), sem o Diretor precisar saber qual é.
disable-model-invocation: true
---

# /prosseguir

Uso: `/clear` e depois `/prosseguir`. A skill não dispara o `/clear` (comando interno do Claude Code), por isso ele continua com o Diretor.

1. Faça os passos 1 a 3 do `/retomar` (`.claude/skills/retomar/SKILL.md`): estado, constituição, spec ativa e conferência do `git`.
2. Pegue a etapa na linha **Próximo** do `estado.md`: o primeiro comando entre crases que não seja `/clear`, `/retomar` nem `/prosseguir` (ex.: `/implementar 004 T06`).
3. **Pare e relate ao Diretor**, sem executar, se:
   - o repositório diverge do estado (branch, árvore suja, commits que o estado não conhece);
   - não há etapa, ou há mais de uma sem ordem clara;
   - a etapa depende de decisão do Diretor (aprovar spec, ADR ou mudança de processo, merge, tag, release) ou de uma pendência dele que a bloqueia.
4. Senão, diga em até 3 linhas onde estamos e qual etapa vai rodar, e execute-a já: leia `.claude/skills/<etapa>/SKILL.md` e siga-o com os argumentos. As skills de etapa têm `disable-model-invocation`, então leia o arquivo em vez de chamar a ferramenta Skill.
5. Durante a etapa e no relatório final, valem as regras de interação com o Diretor do `PROCESSO.md` §1: sem perguntas enquanto houver subagente rodando, e decisões só no relatório gerencial.
6. Ao fim, a etapa grava no `estado.md` a próxima com **um único comando** na linha **Próximo**, para o próximo `/prosseguir` achá-la.
