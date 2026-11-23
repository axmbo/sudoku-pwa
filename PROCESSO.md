# Processo de engenharia — Sudoku PWA

Fonte única do processo (versão **v0.1**, ver [CHANGELOG-processo](docs/process/CHANGELOG-processo.md)). Agentes, skills, `CLAUDE.md` e `CONTRIBUTING.md` detalham ou resumem e apontam para cá; não copiam. Mudança neste arquivo só via PDCA (seção 9) com aprovação do Diretor.

## 1. Papéis

| Papel | Quem | Responsabilidade |
|---|---|---|
| Diretor | humano | aprova escopo, specs, ADRs, mudanças de processo, merge e cada release (tag assinada) |
| Orquestrador / Tech Lead | sessão principal do Claude Code | coordena, estima, mede; não escreve código de produção, exceto integração trivial |
| `produto-ux` | agente | `spec.md`: histórias, CA em Dado/Quando/Então, UX e acessibilidade como requisito |
| `arquiteto` | agente | `plan.md`, ADRs, fronteiras de módulos, tipos públicos, orçamento de performance |
| `eng-testes` | agente | plano de testes e testes **antes** do código (vermelho) |
| `dev` | agente | implementa até o verde e refatora; **não edita testes** |
| `revisor` | agente, só leitura | revisão do diff, rastreabilidade CA↔teste, deriva spec×código, segurança |
| `qa-auditor` | agente | E2E, axe, Lighthouse, offline, orçamento de performance; relata números |
| `devsecops` | agente, raro | plataforma, pipelines, segurança, assinatura, `SECURITY.md` |
| `curador-pdca` | agente | contexto (`estado.md`, manifestos, podas) e PDCA (métricas, retro, melhorias) |

Definições em [.claude/agents/](.claude/agents/). Princípios: quem implementa não revisa; quem revisa não edita código; o mínimo de agentes que cobre os ângulos. `curador-pdca` nasceu da fusão de `curador-contexto` + `analista-pdca` (volume inicial baixo, mesmos dados); o PDCA separa se ele estourar o orçamento.

**Modelos:** todos em `sonnet` por padrão. `opus` só por tarefa, com a justificativa registrada na tarefa ou no ADR (candidatos: ADR de plataforma/ameaças, revisão do gerador/solver). `haiku` para consolidação mecânica. O PDCA compara a qualidade dos achados por modelo.

## 2. Regras de ouro

As regras de ouro vivem em [CLAUDE.md](CLAUDE.md) (camada L0, carregada em toda sessão e em todo subagente próprio). Elas só mudam com aprovação explícita do Diretor.

## 3. Hierarquia da fonte da verdade (SDD)

SDD com equivalente próprio e enxuto, não o GitHub Spec Kit ([ADR 0002](docs/adr/0002-sdd-proprio.md)).

```
docs/constituicao.md        princípios imutáveis
docs/produto/visao.md       visão, personas, escopo do MVP
docs/produto/backlog.md     itens priorizados
docs/adr/NNNN-*.md          decisões de arquitetura
specs/NNN-<slug>/
  spec.md    O QUÊ e POR QUÊ; CA com ID (CA-NNN-01); fora de escopo. Sem tecnologia.
  plan.md    COMO: módulos, tipos públicos, ADRs, riscos, estratégia de teste
  tasks.md   tarefas atômicas, cada uma com CA cobertos, testes, arquivos e MANIFESTO
  notas.md   decisões e descobertas da execução (curto)
  RESUMO.md  ≤ 20 linhas, ao arquivar
docs/estado.md              snapshot vivo (≤ 40 linhas)
```

Templates em [specs/_templates/](specs/_templates/); procedimento na skill `sdd`.

**Fluxo:** especificar (`produto-ux`) → clarificar (perguntas numeradas ao Diretor) → Diretor aprova a spec → planejar + tarefas (`arquiteto` + `eng-testes`) → analisar consistência (`revisor`: spec × plan × tasks, todo CA coberto) → implementar (`eng-testes` → `dev`, tarefa a tarefa).

- **Rastreabilidade:** todo CA tem ao menos um teste que cita o ID no nome ou na descrição. O `revisor` bloqueia CA sem teste e teste sem CA.
- **Deriva:** ao fim do ciclo, o `revisor` confere se código e spec dizem a mesma coisa. Deriva é **major**.
- **Spec antes de código.** Mudou o requisito: muda a spec primeiro.

## 4. Gestão de contexto

Camadas: **L0** `CLAUDE.md` (sempre); **L1** `docs/estado.md` + `docs/constituicao.md` (início de sessão; o hook `SessionStart` injeta o `estado.md`); **L2** spec/plan da feature ativa; **L3** manifesto da tarefa. Ninguém sobe de camada sem motivo declarado no retorno.

- **Orçamento de contexto inicial por subagente: 15 mil tokens** (o PDCA ajusta).
- **Manifesto por tarefa:** lista fechada de caminhos (com seção/linhas quando possível), montada pelo `curador-pdca` antes da tarefa. Leitura fora do manifesto exige justificativa e é contada em `leituras_fora_manifesto`.
- **Handoff por arquivo:** `estado.md` é atualizado ao fim de cada tarefa e sessão; uma sessão nova retoma lendo só L0 + L1.
- **Limpar > compactar:** entre tarefas independentes, `/clear` + `/retomar`. Compactar só no meio de tarefa longa.
- **Arquivamento:** spec concluída ganha `RESUMO.md` e vai para `specs/_arquivo/`. ADR superado é marcado, não apagado.
- **Higiene e limites:** `CLAUDE.md` ≤ 80 linhas; agente ≤ 40 linhas de corpo; skill ≤ 80 linhas; `estado.md` ≤ 40 linhas. O `curador-pdca` mede a cada ciclo e propõe podas.
- **Estado × regra:** estado (`estado.md`, `notas.md`) diz onde estamos; regra (este arquivo, `CLAUDE.md`, skills, agentes, constituição) diz como trabalhamos. Nunca no mesmo arquivo.

Procedimento na skill `gestao-contexto`.

## 5. Ciclo de trabalho (um item de backlog = uma spec = um ciclo)

```
PLAN   fluxo SDD; Diretor aprova a spec; curador monta manifestos;
       Orquestrador estima tokens e minutos por agente (otimista/provável/pessimista)
DO     por tarefa: eng-testes (vermelho) → dev (verde) → dev (refatora);
       curador atualiza estado.md; /clear antes da próxima tarefa
CHECK  npm run check → revisor (diff + CA↔teste + deriva) → qa-auditor (se tocar UI/PWA)
       loop de revisão até o critério de saída
ACT    curador-pdca registra métricas, retro e melhorias; arquiva a spec;
       Diretor aprova; lições aprovadas viram regra (seção 9); commit
```

Spec com mais de ~8 tarefas é dividida.

### Gates (máquina antes de modelo)

Nada vai para revisão por LLM antes de `npm run check` verde (typecheck + lint + testes).

### Loop de revisão

- Severidades: **blocker**, **major**, **minor**, **nit**.
- **Critério de saída: 0 blocker, 0 major, ≤ 3 minor** (os minors aceitos viram issues `débito`). Nits não bloqueiam.
- Máximo de **3 rodadas**; na 4ª, parar e escalar ao Diretor com o resumo do impasse.
- Cada rodada revisa só o que mudou desde a anterior.

Checklist e formato do parecer na skill `revisao`.

## 6. Testes

Quantidade por risco, não por número bruto. Metas iniciais (o PDCA ajusta):

| Camada | Cobre | Meta |
|---|---|---|
| Unitários (domínio) | regras, solver, gerador, dificuldade, undo, serialização | ≥ 90% de branches em `src/domain/` |
| Property-based (fast-check) | puzzle gerado tem solução única; solver devolve grade válida; serializar∘desserializar = id; undo∘do = id; mesma seed ⇒ mesmo puzzle | ≥ 1 propriedade por invariante |
| Mutation (Stryker) | qualidade real dos testes do domínio | ≥ 70% em `src/domain/`; incremental no PR |
| Componentes/integração | teclado/toque, anotações, conflitos, persistência | fluxos principais |
| E2E (Playwright) | novo jogo, jogar até vencer, retomar, offline, instalar/atualizar SW | 5–8 cenários |
| Acessibilidade | axe em todas as telas, só teclado, leitor de tela na grade | 0 violações sérias/críticas |
| Performance/PWA | Lighthouse (perf, a11y, best-practices) + checagens PWA próprias (manifest, SW, E2E offline) | orçamento do [ADR 0001](docs/adr/0001-stack-e-ferramentas.md) |

E2E só para jornadas, nunca para regra de negócio. Teste instável é **major**.

### TDD (padrão) e isenções

- Não fazer TDD exige isenção declarada na tarefa: `tdd: isento — <motivo>`. **Lista fechada:** spike descartável (branch `spike/*`, nunca mergeada), configuração de build/CI, ajuste puramente visual/CSS, código gerado. O `revisor` valida o motivo.
- **Guardrails**, do mais barato ao mais caro:
  1. **Ordem dos commits:** `test(...)` com o teste falhando antes de `feat(...)`/`fix(...)`. Script de CI, só no PR e só nas tarefas não isentas (lidas de `tasks.md`), roda os testes no commit de teste esperando falha.
  2. **Separação de papéis:** o hook `PreToolUse` do agente `dev` bloqueia edição de `*.test.*`/`*.spec.*`; alteração de teste volta à `eng-testes` com justificativa.
  3. **Cobertura do diff** em `src/domain/`.
  4. **Mutation testing:** mutante sobrevivente em código novo do domínio é **major**.
  5. **Revisão** CA ↔ teste ↔ código.
- **Rebase merge** no PR (histórico linear sem squash), para preservar a evidência vermelho→verde ([ADR 0006](docs/adr/0006-plataforma-versionamento-ci.md)).

### BDD leve

CA em **Dado / Quando / Então** com ID; o nome do teste cita o ID; os E2E são as jornadas Gherkin principais. Sem Cucumber.

Procedimento na skill `tdd-dominio`.

## 7. Git e plataforma

GitHub + Renovate ([ADR 0006](docs/adr/0006-plataforma-versionamento-ci.md)).

- **Rastreabilidade:** 1 spec = 1 issue = 1 branch = 1 PR. Branch `<tipo>/NNN-slug` (ex.: `feat/001-tabuleiro`) ou `<tipo>/slug` sem issue. O PR fecha a issue e aponta para `specs/NNN-*/`.
- **Conventional Commits** com escopo; tipo em inglês, descrição em português. Validados por commitlint (hook local e CI). Commits feitos por IA levam trailer `Co-Authored-By`.
- **Trunk-based**, branches com vida ≤ 1 ciclo. `main` protegida: sem push direto, checks obrigatórios, histórico linear, **0 aprovações obrigatórias** (o merge do Diretor é a revisão humana).
- **Assinatura:** commits assinados com chave SSH em software, dedicada (não exigida na `main`); tags de release assinadas com chave em hardware do Diretor, e o pipeline recusa tag não assinada ou fora da lista permitida. A assinatura de commit atesta origem, não revisão. Runbook em `docs/runbooks/assinatura.md` (passo 6 da Fase 0).
- **Guardrail de chaves:** nenhum agente lê, copia, gera ou move chave privada, nem pede passphrase. O Diretor executa os comandos com chave privada. `.claude/settings.json` nega `~/.ssh/**`, `~/.gnupg/**` e `**/.env*`.
- **SemVer** e CHANGELOG gerado dos commits. Release = tag.
- **Issues** com templates (bug, feature/spec, débito) e labels de severidade iguais às da revisão.

Procedimento na skill `git-fluxo`.

### Pipelines econômicos

| Gatilho | O que roda |
|---|---|
| pre-commit local | formatação, lint, typecheck e testes do que mudou |
| push em branch | `check`: typecheck + lint + unitários + property-based, com cache |
| PR para `main` | o acima + cobertura do diff + ordem TDD + E2E em 1 navegador + axe + CodeQL + segredos e dependências |
| agendado ou label `full-ci` | mutation completo, E2E em matriz, Lighthouse CI, auditoria de dependências |
| tag | verificação da assinatura, build, Lighthouse, atestado de proveniência, deploy no Pages |

Filtros de caminho (só `docs/` não roda testes), cancelamento de execuções antigas da mesma branch, timeouts curtos, cache agressivo. A lógica fica em `scripts/ci/*` e `npm run`; o workflow é casca fina.

### Segurança do produto

CSP restritiva, sem scripts de terceiros, dependências mínimas e fixadas, Renovate, atualização do Service Worker sem quebrar jogos salvos, nenhum dado pessoal coletado. Ver [SECURITY.md](SECURITY.md).

## 8. Estimativas e métricas

- Antes de cada ciclo, a estimativa (faixa otimista/provável/pessimista de tokens e minutos, por agente) vai para [metrics.csv](docs/process/metrics.csv); depois, o real.
- Definições das colunas e coleta do real (log jsonl da sessão): [metricas.md](docs/process/metricas.md). Nunca inventar métrica: sem número, `n/d`.
- Meta de calibração: erro médio de tokens < 30% após 5 ciclos.

Procedimento na skill `pdca`.

## 9. PDCA do processo

- **Todo ciclo:** retro (≤ 10 linhas) em `docs/process/retro/ciclo-NN.md`: o que funcionou, o que custou caro, 1–3 ações.
- **A cada 3 ciclos:** revisão estrutural da equipe (custo por achado útil, troca de modelo, fundir/dividir agentes, tamanho de `CLAUDE.md`/agentes, checklist que pode virar lint, qualidade dos manifestos, templates que ninguém lê).
- **Ciclo de vida de uma regra:** lição (retro) → candidata em [melhorias.md](docs/process/melhorias.md) → aprovada pelo Diretor → promovida ao lugar mais barato que a garante: (1) lint/teste/hook, (2) skill, (3) arquivo de agente, (4) `CLAUDE.md` → registrada no [CHANGELOG-processo](docs/process/CHANGELOG-processo.md) com versão.
- Regra sem uso em 5 ciclos é candidata a remoção. Regra duplicada em dois lugares é defeito: um dono, os outros apontam.
- O `curador-pdca` é dono da organização desses arquivos e do conteúdo das lições.
