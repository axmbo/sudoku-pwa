---
name: git-fluxo
description: Fluxo Git do Sudoku PWA — nomes de branch, Conventional Commits em pt-BR, ordem test→feat, ligação issue↔spec↔PR, como abrir PR no GitHub, labels e rebase merge. Use ao criar branch, commitar ou abrir PR.
---

# Git — procedimento

Fonte: `PROCESSO.md` §7 e [ADR 0006](../../../docs/adr/0006-plataforma-versionamento-ci.md).

## Branch
- Nunca commitar em `main`. Com issue/spec: `<tipo>/NNN-<slug>` (ex.: `feat/001-tabuleiro`); sem issue: `<tipo>/<slug>`; spike: `spike/<slug>` (nunca mergeada).
- `<tipo>`: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`, `style`.
- Já existe branch apropriada: confirme com o Diretor antes de trocar. Já está fora de `main` e precisa de outra: confirme antes de criar.
- Não crie issue sozinho: use a que existe ou a que o Diretor indicar.

## Commit
- `<tipo>(<escopo>): <descrição em português>`; escopo técnico em inglês (`domain`, `solver`, `ui`, `ci`, `process`).
- Termos consagrados ficam em inglês (build, hook, service worker, commit).
- Commits da IA terminam com o trailer `Co-Authored-By` indicado na sessão.
- Ordem por tarefa não isenta: `test(...)` vermelho → `feat|fix|refactor(...)` verde → `refactor(...)` opcional.
- Um commit, uma intenção. Nada de `.env`, chave ou segredo (o push protection também barra).

## PR
- Um PR por spec. Título em Conventional Commits; corpo:
  ```
  Fecha #<issue>. Spec: specs/NNN-<slug>/
  ## O que muda
  ## CA cobertos
  ## Como verificar
  ## Métricas (tokens/minutos est. × real)
  ```
- Labels: tipo (`feat`, `fix`…), severidade nas issues (`blocker`, `major`, `minor`, `nit`), `débito`, `full-ci` (dispara o CI completo).
- Todo PR criado pela IA é revisado logo em seguida pelo `revisor` (contexto limpo, só leitura).
- Comentário da IA em PR termina com assinatura (`---` + linha "Comentário gerado por <modelo> (Claude Code)").

## Merge
- Sempre do Diretor, por **rebase merge** (histórico linear sem squash: preserva vermelho→verde).
- `main` protegida: sem push direto, checks obrigatórios, histórico linear, 0 aprovações obrigatórias.

## Assinatura
- Commits: chave SSH em software, dedicada à assinatura (não exigida na `main`).
- Tags de release: chave em hardware do Diretor; o pipeline recusa tag não assinada.
- Runbook: `docs/runbooks/assinatura.md`. O agente nunca toca em chave privada.

## Release
SemVer; CHANGELOG gerado dos commits; release = tag assinada criada pelo Diretor.
