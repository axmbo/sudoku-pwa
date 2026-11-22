# Fase 0 — Sudoku PWA: contestação do BOOTSTRAP + plano de execução

## Context
O `BOOTSTRAP.md` pede a Fase 0: perguntas (feito), contestação em forma de diff (abaixo), depois a estrutura do processo, o esqueleto do projeto, a assinatura, o plano da Fase 1 e o teste de sobrevivência. Pedido extra do Diretor: antes do esqueleto, guiar a instalação da LTS ativa do Node num gerenciador de versões, sem remover a 22.17.1, fixando a versão no repo e no CI.

**Respostas do Diretor:**
1. MVP = níveis + conflitos + anotações/undo-redo + timer/estatísticas + desafio diário (dicas vão para o pós-MVP).
2. UI: o arquiteto decide em ADR.
3. Licença MIT.
4. Manter o nvm + `.nvmrc`.
5. Persistência: o arquiteto decide em ADR.
6. Referência de dispositivo: Android modesto (classe Moto G, 4G lento).
7. Subagentes em sonnet por padrão; opus só com justificativa registrada.
8. Código em inglês; UI e documentação em pt-BR; glossário na skill `dominio-sudoku`.

**Ambiente verificado:**
- nvm 0.40.2 com v22.17.1 (default) e v24.19.0, mais um `/usr/bin/node` do sistema.
- LTS ativa: **v26.13.1 "Lithium"**, lançada em 10/11/2026 (fonte: nodejs.org/dist/index.json).
- Git 2.34.1 (mínimo para assinatura SSH), Ubuntu 22.04, gh 2.100 e glab 1.131, Claude Code 2.1.278.

---

## 1. Contestação (diff de proposta sobre o BOOTSTRAP)

### Equipe e modelos
```diff
- curador-contexto (haiku/sonnet) + analista-pdca (haiku/sonnet)  # separados
+ curador-pdca (sonnet; haiku na consolidação mecânica)            # fundidos no início
```
Motivo: os dois leem os mesmos dados (metrics.csv, estado.md, tamanhos de arquivo), e o volume inicial é baixo. Dois agentes dobrariam o custo de contexto inicial sem ganhar um ângulo novo. O PDCA separa depois, se o agente estourar o orçamento.
```diff
- arquiteto: opus | revisor: opus | devsecops: opus
+ todos em sonnet por padrão; opus por tarefa, com justificativa na tarefa/ADR
+   (candidatos naturais: ADR de plataforma/ameaças, revisão do gerador/solver)
```
Motivo: resposta 7 e CLAUDE.md global. O PDCA compara a qualidade dos achados por modelo.

### Ferramentas e metas
```diff
- Lighthouse (perf, a11y, PWA)
+ Lighthouse (perf, a11y, best-practices) + checagens PWA próprias
+   (manifest válido, SW registrado, E2E offline/instalar/atualizar)
```
Motivo: a categoria PWA foi removida do Lighthouse (v12). Exigir uma nota PWA seria um gate impossível.
```diff
- main protegida: ... revisão obrigatória
+ main protegida: sem push direto, checks obrigatórios, histórico linear;
+ aprovação obrigatória = 0 (o merge do Diretor é a revisão humana)
```
Motivo: os PRs sairão da própria conta do Diretor, e o GitHub/GitLab não deixa o autor aprovar o próprio PR. Com "1 aprovação obrigatória", nada seria mergeado sem uma segunda conta. O devsecops confirma no ADR da plataforma.
```diff
+ Desafio diário ⇒ gerador DETERMINÍSTICO por seed (PRNG injetado, sem Math.random no domínio)
+   e algoritmo VERSIONADO: mudar o gerador muda o puzzle do dia. Vira princípio na constituição.
+ Avaliação de dificuldade por técnicas (solver lógico) entra no MVP: os níveis dependem dela.
+   Isso deixa as "dicas" do pós-MVP baratas.
```
```diff
- CLAUDE.md ≤ 150 linhas
+ CLAUDE.md ≤ 80 linhas (tudo o que não for regra de ouro/mapa vai para skill)
+ orçamento de contexto inicial por subagente: 15k tokens (o PDCA ajusta)
```
```diff
- 9 skills
+ 8 skills: `estimativa` + `pdca-retro` → `pdca` (mesmo dono, mesmo momento do ciclo)
```
```diff
- .claude/commands/ com 9 comandos (/especificar … /retomar)
+ comandos como skills invocáveis (formato atual do Claude Code; conferir na v2.1.278, regra 13),
+ 7 pontos de entrada: /especificar, /planejar (plan+tasks+estimativa), /analisar,
+   /implementar, /revisar, /retro, /retomar
+ hook SessionStart injeta docs/estado.md (se suportado); /retomar fica como fallback
```

### SDD
**Equivalente próprio e enxuto em vez do GitHub Spec Kit** (ADR 0002). Motivos:
- os templates do Spec Kit são longos, e cada spec pagaria esse custo em tokens;
- ele traz uma CLI em Python/uv e arquivos `.specify/` que duplicariam `PROCESSO.md`, o que cria lock-in;
- os quatro artefatos do BOOTSTRAP já seguem o mesmo modelo.

### TDD/guardrails
- Script de ordem dos commits (`test` antes de `feat`/`fix`, com o teste vermelho no commit de teste): roda **só no PR** e **só nas tarefas não isentas**, que o script lê em `tasks.md`.
- Hook "dev não edita `*.test.*`": vou verificar se o hook recebe a identificação do subagente ou se o frontmatter do agente aceita `hooks` com escopo próprio. Se nenhum dos dois existir, a regra fica no arquivo do agente e no revisor, e registro isso como limitação.

### Node (pedido extra)
- `.nvmrc` = `26.13.1` (versão exata, para builds reproduzíveis) e `engines.node: ">=26.13.1 <27"` + `.npmrc engine-strict=true`.
- CI com `node-version-file: .nvmrc`, o mesmo arquivo do local.
- `npm run check` inclui um teste de 1 linha que falha se `process.version` ≠ `.nvmrc`. Garante deterministicamente que local e CI rodam na mesma versão.
- O ADR do devsecops escolhe entre Renovate e Dependabot. Ponto a favor do Renovate: ele atualiza o `.nvmrc`, e o Dependabot não.

---

## 2. Execução após a aprovação (ordem)

**Ajustes do Diretor (aprovados com o plano):**
- **A. Estimativa da Fase 0 antes de executar.** Vai em `docs/process/metrics.csv`, com faixa otimista/provável/pessimista por passo e real ao fim. Colunas do BOOTSTRAP mais `tokens_est_otim`, `tokens_est_pess`, `min_est_otim`, `min_est_pess` (`tokens_est`/`min_est` = provável). Sem número real de tokens, registro `n/d` e peço `/cost` ao fim.
- **B. Ao fim de cada passo:** commit + entrega de hash, resumo de ≤ 5 linhas e o que conferir no diff.
- **D. Definição de "tokens".** Fica em `docs/process/metricas.md`, e o cabeçalho do CSV aponta para ele.
  - **`tokens` = input + cache write + output**, somados entre os modelos das linhas de uso do `/cost`. É o que a sessão processa de novo.
  - O **cache read** fica numa coluna própria (`cache_read_real`), porque domina em sessões longas e distorceria a calibração.
  - `usd_real` sai do `/cost`.
  - A estimativa usa a mesma regra; as faixas da tabela abaixo já estão nessa definição.
  - O real vem do `/cost` que o Diretor cola **ao fim de cada passo**. O `/cost` é acumulado na sessão, então registro a diferença entre leituras. Depois de um `/clear`, conto do zero se o contador zerar; confiro na primeira vez.
  - Colunas reais: `tokens_in_real`, `tokens_cache_write_real`, `tokens_out_real`, `cache_read_real`, `tokens_real` (regra acima), `usd_real`.
- **E. Gestão de contexto aplicada à própria Fase 0.**
  - `docs/estado.md` é criado no passo 0 e atualizado ao fim de cada passo, entrando no mesmo commit.
  - Depois dos passos **3, 5 e 7**, aviso que é um bom ponto para `/clear` + `/retomar`. Até o passo 4 criar `/retomar`, o equivalente é ler `CLAUDE.md`/`docs/estado.md`.
  - Coluna `limpeza_antes` (sim/não) no CSV, para comparar o custo dos passos com e sem limpeza.
- **C. Bash:** todo comando vem com uma linha dizendo o que faz e se mexe fora do repositório. As edições de arquivo são auto-aprovadas.

**Estimativa inicial (tokens otim/prov/pess · minutos otim/prov/pess):**

| Passo | Tokens | Minutos |
|---|---|---|
| 1 Node | 15k/30k/60k | 10/20/40 |
| 2 Conferência CC | 30k/60k/120k | 5/10/20 |
| 3 ADR plataforma | 60k/120k/250k | 15/30/60 |
| 4 Estrutura | 150k/300k/500k | 40/80/150 |
| 5 Esqueleto | 100k/200k/400k | 30/60/120 |
| 6 Assinatura | 60k/120k/250k | 30/60/120 |
| 7 Fase 1 + spec 001 | 50k/100k/200k | 15/30/60 |
| 8 Sobrevivência | 20k/40k/80k | 5/10/20 |
| 9 Resumo | 5k/10k/20k | 2/5/10 |
| **Total** | **~490k/980k/1,9M** | **~2,5h/5h/10h**, sem contar a espera pelo Diretor |

0. **Branch** `chore/fase-0` (nunca commitar em `main`). Arquivos: `docs/process/metrics.csv` com a estimativa acima, `docs/process/metricas.md` (definição D) e `docs/estado.md` → commit `docs(process): estimativa e estado da Fase 0`. Conventional Commits com o trailer de coautoria.
1. **Node guiado (o Diretor executa, eu verifico um passo por vez):**
   1. Atualizar o nvm para a release mais recente. Confiro a versão no GitHub do nvm na hora e dou o comando oficial de upgrade (via `git` se `~/.nvm` for um clone, senão o script de instalação).
   2. `nvm install 26.13.1`, sem `alias default`: a 22.17.1 continua como default global. Verificação: `nvm ls`, e um shell novo mostra 22.17.1.
   3. (Opcional) Snippet `cdnvm` do README do nvm no `~/.bashrc`, para trocar de versão automaticamente ao entrar na pasta.
   4. Nos meus comandos Bash do projeto, uso `source ~/.nvm/nvm.sh && nvm use` (o shell da ferramenta não troca sozinho).
2. **Conferência do formato do Claude Code 2.1.278** (regra 13) por subagente `claude-code-guide`:
   - frontmatter de agentes (`skills`, `hooks`, `model`);
   - se o subagente herda o `CLAUDE.md`;
   - skills × commands;
   - SessionStart;
   - entrada dos hooks (identificação do agente).
3. **ADR da plataforma** (devsecops em sonnet, com pesquisa nas docs oficiais atuais): GitHub × GitLab pelos critérios da seção 4A. **Pausa para o Diretor aprovar.**
4. **Estrutura do processo** (seção 8, passo 3, com os ajustes acima):
   - `CLAUDE.md`, `PROCESSO.md`, `docs/constituicao.md`, `docs/estado.md`;
   - `specs/_templates/*`, `.claude/agents/*` (8 agentes), `.claude/skills/*` (8 skills + 7 pontos de entrada), `.claude/settings.json`, com regras de negação para `~/.ssh/**` (exceto `*.pub`), `~/.gnupg/**`, `.env*` e similares;
   - `docs/produto/{visao,backlog}.md`;
   - ADRs 0001 (stack/Vite/TS/Vitest/Playwright), 0002 (SDD próprio), 0003 (UI), 0004 (persistência), 0005 (Worker + gerador determinístico), 0006 (plataforma);
   - `README.md` único, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` (MIT);
   - `docs/process/{metrics.csv,CHANGELOG-processo.md,melhorias.md}`;
   - `BOOTSTRAP.md` vai para `docs/historico/`.
5. **Esqueleto:**
   - Vite + TS strict + ESLint + Prettier + Vitest + fast-check + Playwright + axe;
   - Stryker configurado só no domínio;
   - scripts `check`, `test`, `test:prop`, `test:mut`, `e2e`, `lint`, `typecheck`, `audit`;
   - testes determinísticos: README único, versão do Node, um teste trivial do domínio;
   - commitlint + hook pre-commit;
   - pipelines da plataforma escolhida com filtros de caminho, cancelamento de execuções antigas e cache.

   `npm run check` verde.
6. **Assinatura (3A):** entrevista do devsecops, depois o passo a passo verificável. O Diretor executa tudo que envolva chave privada. Ao final, `docs/runbooks/assinatura.md` + `CONTRIBUTING.md`.
7. **Fase 1:** plano e estimativa das specs, com estimativa (faixas) e orçamento de contexto por agente gravados em `metrics.csv`. Proposta:
   - 001 tabuleiro + validação de conflitos;
   - 002 solver (backtracking + contagem de soluções);
   - 003 gerador com seed + avaliação de dificuldade por técnicas;
   - 004 estado de jogo (anotações, undo/redo, serialização versionada);
   - 005 grade acessível (primeira UI).

   Escrevo só a `specs/001-*/spec.md`.
8. **Teste de sobrevivência:** o Diretor roda `/clear` + `/retomar`; eu respondo o critério de saída da revisão, o orçamento de contexto e a próxima tarefa a partir apenas dos arquivos.
9. **Pare:** resumo de ≤ 20 linhas e espera da aprovação do Ciclo 1.

Em todos os passos, os commits são feitos por fase na branch, e o merge é do Diretor.

## 3. Verificação
- `node -v` no projeto = v26.13.1; fora dele, shell novo = v22.17.1.
- `npm run check` verde localmente e no CI, que usa a mesma versão via `.nvmrc`.
- Teste do README único falha se outro `README.md` for criado (provar uma vez).
- Commit de teste com o selo "Verified"; uma tag sem assinatura é recusada pelo pipeline.
- Teste de sobrevivência respondido corretamente após `/clear`.

## 4. Pontos de pausa obrigatórios (Diretor)
- Aprovação deste plano/contestação.
- ADR da plataforma (passo 3).
- Cada passo da assinatura.
- Resumo final antes do Ciclo 1.
