# Tarefas NNN — <título>

- **Spec:** [spec.md](spec.md) · **Plano:** [plan.md](plan.md)
- **Autores:** `arquiteto` + `eng-testes` · **Análise de consistência:** <pendente | ok em DD/MM>

<Tarefas atômicas e ordenadas; ~8 no máximo por spec. O bloco abaixo se repete por tarefa.>

## T01 — <título>

- **CA cobertos:** CA-NNN-01
- **tdd:** sim | isento — <motivo da lista fechada de PROCESSO.md §6>
- **Testes esperados:** <arquivo de teste e o que cada caso verifica, citando o CA; com desfazer/refazer, refazer por tipo de jogada>
- **via 7b para mutantes:** não | sim — <estado ainda não alcançável pela API; `Game` montado à mão> (definição em `PROCESSO.md` §6)
- **Arquivos a criar/alterar:** <caminhos>
- **Manifesto de contexto** (lista fechada; seção/linhas quando possível):
  - `CLAUDE.md` (L0, automático)
  - `docs/estado.md`
  - <caminho>#<seção ou linhas>
- **Estimativa:** tokens <otim>/<prov>/<pess> · minutos <otim>/<prov>/<pess>
- **Agentes:** `eng-testes` → `dev`
