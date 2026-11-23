# Sudoku PWA

Sudoku em português, instalável, que funciona sem internet, roda bem em celular modesto e pode ser jogado só com teclado ou leitor de tela. Não coleta nenhum dado do jogador. Código aberto sob a [licença MIT](LICENSE).

> **Estado:** Fase 0 (bootstrap do processo). Ainda não há jogo jogável; veja [docs/estado.md](docs/estado.md).

## O que vai ter (MVP)

Níveis de dificuldade medidos por técnica, destaque de conflitos, anotações com desfazer/refazer, timer e estatísticas, desafio diário, e funcionamento offline completo. Detalhes em [docs/produto/visao.md](docs/produto/visao.md).

## Como rodar

Pré-requisito: Node na versão fixada em [.nvmrc](.nvmrc) (recomendado via [nvm](https://github.com/nvm-sh/nvm)).

```bash
nvm use
npm ci
npm run dev      # servidor de desenvolvimento
npm run check    # typecheck + lint + testes (o gate local)
```

Os scripts (`test`, `test:prop`, `test:mut`, `e2e`, `lint`, `typecheck`, `audit`) entram com o esqueleto do projeto, no passo 5 da Fase 0.

## Documentação

| Para | Leia |
|---|---|
| Contribuir (pessoas e IAs) | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Entender o processo de engenharia | [PROCESSO.md](PROCESSO.md) |
| Princípios que não mudam | [docs/constituicao.md](docs/constituicao.md) |
| Decisões de arquitetura | [docs/adr/](docs/adr/) |
| Backlog e specs | [docs/produto/backlog.md](docs/produto/backlog.md), [specs/](specs/) |
| Reportar vulnerabilidade | [SECURITY.md](SECURITY.md) |

Este é o único `README.md` do repositório; a documentação de módulos e processos usa nomes próprios em `docs/`.
