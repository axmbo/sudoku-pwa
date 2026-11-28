# Diagnóstico: E2E intermitente CA-005-16 (`e2e/jogo.spec.ts:185`)

## Resumo
Corrida no `Grid.tsx` (código de produção, T10): a marca `byKeyboard` é limpa por um efeito atrasado da tecla anterior e engole o foco da seta seguinte. Dono da correção: `dev`, com teste de regressão RED antes (`eng-testes`).

## Reprodução (Pixel 7 emulado, 8 CPUs, 28/11/2026)
- Isolado, `-g CA-005-16 --repeat-each=20`: 20/20 verdes. Com `--workers=8 --repeat-each=40`: 40/40.
- Suíte completa (`npx playwright test`): 1 falha em 3 rodadas (rodada 2: 37/38, falhou exatamente `toBeFocused()` da (1,4)); somando as 2 de 2 do QA, 3 falhas em 5 rodadas.
- Suíte completa com `--workers=1`: 38/38 (1 rodada). Falha só sob carga de CPU (vários workers e `vite build` do webServer), como esperado de uma corrida de temporização.
- Reprodução determinística (script em scratchpad `race.mjs`): numa mesma tarefa, `keydown` `9` e, em seguida, `keydown` `ArrowRight` na grade. Resultado: foco permaneceu na célula antiga, `is-selected` na nova, em 30/30.

## Causa-raiz
`Grid.tsx` linhas 43-53 e 66: `onKeyDown` põe `byKeyboard=true`; o `useEffect` (sem deps, roda após a pintura, adiável) calcula `changed` e, se `!changed`, zera `byKeyboard`.
Sequência do teste: `1`, `9` (anotações; seleção não muda) e `ArrowRight` em rajada.
1. `9`: `byKeyboard=true`, render R9 (seleção igual).
2. `ArrowRight` chega antes do efeito de R9 rodar: `byKeyboard=true`, seleção muda.
3. O efeito atrasado de R9 roda com `changed=false` e faz `byKeyboard=false` (apaga a marca da seta).
4. O efeito do render da seta vê `changed=true`, mas `byKeyboard=false`: não chama `.focus()`. Foco fica na (1,3), seleção na (1,4).
Sob carga o efeito demora e a janela abre. O comentário do código ("a marca só cai quando a seleção não mudou") trata a rajada de setas (CA-005-07), mas não a rajada dígito+seta. Teste válido: exige que o foco real acompanhe a seleção, o que a CA-005-07 e a CA-005-06 também pedem.

## Dono
Defeito de produção (`src/ui/Grid.tsx`), não do teste. Usuário real com digitação rápida em modo anotação pode perder o foco ao navegar.

## Correção proposta
1. `eng-testes` (RED): teste de `Grid`/`App` em jsdom que dispara `digit` e `ArrowRight` em sequência sem deixar os efeitos rodarem (ex.: `fireEvent` dentro do mesmo `act`) e exige `document.activeElement` = célula selecionada. Opcional: manter o E2E como está.
2. `dev` (GREEN): não depender de marca mutável limpa por efeito. Opção mais simples: em `onKeyDown`, para ação `move`, guardar `pendingFocus.current = true` e só zerar a marca no efeito quando ele de fato focar (ou quando a seleção alvo coincidir com a focada); ações que não movem não mexem na marca. Alternativa: contador `focusTick` no reducer, incrementado em `move` que muda a seleção (como já existe para undo/redo), eliminando a marca por ref.
3. Rodar a suíte completa umas 5 vezes (e `--workers=8`) para confirmar.

## Custo
Tokens e tempo: n/d.
