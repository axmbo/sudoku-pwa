# Conferência do formato do Claude Code (regra de ouro 13)

Feita em 22/11/2026 contra a documentação oficial (code.claude.com/docs), para a versão instalada 2.1.278. Recursos que a doc marca como de versão posterior à instalada (ex.: `autoCompactWindow`, v2.1.296+) **não** são usados.

## Fatos e decisão derivada

| # | Fato confirmado (página) | Decisão para o projeto |
|---|---|---|
| 1 | Subagente aceita `name`, `description`, `tools`, `disallowedTools`, `model` (sonnet/opus/haiku/fable/inherit), `permissionMode`, `skills` (injeta a skill inteira no início), `hooks` (escopo do subagente), `memory`, `maxTurns`, `effort`, `omitClaudeMd` (v2.1.271+), entre outros. Campo desconhecido é ignorado sem aviso. (sub-agents) | Os agentes declaram as skills em `skills:`, com `model: sonnet` por padrão. A grafia dos campos é conferida com cuidado, porque erro de digitação passa sem aviso. |
| 2 | Subagentes próprios **carregam o `CLAUDE.md`** por padrão; os embutidos Explore, Plan e web-fetch não. Skills não são pré-carregadas sem `skills:`, mas podem ser invocadas sob demanda. (sub-agents) | As regras de ouro ficam só no `CLAUDE.md`, sem cópia nos arquivos de agente, e por isso ele precisa ser curto. |
| 3 | `.claude/commands/` ainda funciona, mas foi unificado às skills, e a doc recomenda skills. O diretório vira `/nome`. Campos úteis: `disable-model-invocation`, `user-invocable`, `argument-hint`, `context: fork` + `agent`. `SKILL.md` com menos de 500 linhas é recomendação; a descrição é truncada em 1.536 caracteres. (skills) | Os 7 pontos de entrada (`/especificar`, `/retomar`…) viram skills em `.claude/skills/`, com `disable-model-invocation: true` nos que só o Diretor dispara. Meta interna: até 80 linhas por skill. |
| 4 | Hook `SessionStart` com matchers `startup\|resume\|clear\|compact\|fork`. Dispara depois de `/clear` e de compactação. O stdout (exit 0) vira contexto; acima de 10.000 caracteres, só uma prévia entra. (hooks) | O hook faz `cat docs/estado.md` em todos os matchers, e o `/retomar` fica como complemento. Isso garante o L1 sem depender da boa vontade do modelo. `estado.md` com até 40 linhas fica bem abaixo do limite. |
| 5 | A entrada do `PreToolUse` traz `agent_type` (o `name` do subagente). Hooks no frontmatter do agente têm escopo só dele. Bloqueio por exit 2. (hooks, sub-agents) | No frontmatter do `dev`, um hook `PreToolUse` (`Edit\|Write`) bloqueia `*.test.*` e `*.spec.*`. É um guardrail determinístico do TDD. |
| 6 | `permissions.deny` usa sintaxe gitignore (`~/` = home). Precedência deny > ask > allow, e allow não abre exceção em deny. O `!` de exceção não funciona com padrões ancorados em `~/`. Regra de Bash não é fronteira de segurança. (permissions) | Negar **todo** `~/.ssh/**` e `~/.gnupg/**`, inclusive `*.pub`, mais `**/.env*`, nas ferramentas de arquivo, com regras de Bash como defesa extra. Chave pública chega ao agente só quando o Diretor a cola no chat. É mais restritivo que o BOOTSTRAP ("exceto `*.pub`"), porque a exceção não é expressável com segurança. |
| 7 | Transcritos de subagente ficam em `~/.claude/projects/<proj>/<sessão>/subagents/agent-<id>.jsonl`. Confirmado localmente. (sub-agents) | O real do subagente é somado desse arquivo, numa linha própria do `metrics.csv` (ver `metricas.md`). |
| 8 | Skill com `disable-model-invocation: true` não pode ser chamada pela ferramenta Skill; só o usuário a dispara por `/nome`. (skills; registrado em 24/11/2026, M-011) | O `/prosseguir` não invoca a skill da etapa: lê o `SKILL.md` dela e segue o procedimento. Assim as skills de etapa continuam fora do alcance da invocação automática pelo modelo, e o `/prosseguir`, disparado pelo Diretor, vale como o disparo dele. |

## Ressalvas

- O subagente leu só os primeiros 100 mil caracteres das páginas de hooks e skills. Se um detalhe de 4 ou 5 falhar na prática, o comportamento observado prevalece e esta tabela é corrigida.
- Os itens 4 e 5 são validados de verdade no passo 5 (hook rodando) e no teste de sobrevivência (passo 8).
