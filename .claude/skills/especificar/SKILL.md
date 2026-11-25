---
name: especificar
description: Inicia uma spec nova a partir de um item do backlog — produto-ux escreve specs/NNN-slug/spec.md e devolve perguntas ao Diretor.
argument-hint: <item do backlog ou descrição curta>
disable-model-invocation: true
---

# /especificar $ARGUMENTS

1. Localize o item em `docs/produto/backlog.md`. Não existe: pergunte ao Diretor se cria o item antes.
2. Confirme ou crie a branch `feat/NNN-<slug>` (skill `git-fluxo`); a issue é a que o Diretor indicar.
3. Grave a estimativa da etapa em `docs/process/metrics.csv` (skill `pdca`).
4. Acione o agente `produto-ux` passando só ponteiros: o item do backlog, `docs/produto/visao.md`, `specs/_templates/spec.md` e o número `NNN`.
5. Leve as perguntas dele ao Diretor (clarificar), numeradas. Com as respostas, `produto-ux` atualiza a spec.
6. Spec aprovada pelo Diretor: status `aprovada`, `docs/estado.md` atualizado, commit `docs(spec): especifica NNN <título>`.
7. Grave `/planejar NNN` como **Próximo** no `estado.md` (o `/prosseguir` para até o Diretor aprovar a spec) e sugira `/clear` + `/prosseguir`.
