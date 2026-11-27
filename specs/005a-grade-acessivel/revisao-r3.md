# Revisão r3 — spec 005a — 27/11/2026
Base: 618d196 · Head: 40f3ea0 (T12: classe `keypad-erase` + `@container (max-width: 14rem)`) · check: verde (871 testes, cobertura 100%)
Veredito: sai (0 blocker, 0 major, 1 minor, 0 nit)

| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| 1 | minor | src/ui/styles.css:154-166 | Faixa intermediária de zoom de texto: o limiar de 14rem equivale a ~1,34x de texto a 320 px (teclado ~300 px) e ~1,65x a 390 px (~370 px). Abaixo disso o Apagar segue em `min(0.875rem, 3.8cqi)` (~11,4 px a 320 px; ~14 px a 390 px) e não cresce com o texto (ex.: 125% a 320 px, 150% a 390 px). Nada corta, não há rolagem e o alvo é ≥ 44 px, então CA-005-28 e CA-005-34 (200%) estão atendidos e o 1.4.4 é satisfeito a 200%; é só falta de escala gradual entre 100% e o limiar. A 100% em 320 px o rótulo já era ~11,4 px (pré-existente, abaixo de 0.875rem). | Aceitar como débito (issue `débito`), ou subir o limiar para ~16rem (dispara a partir de ~1,15x a 320 px, mas então a 100% em 390 px o contêiner de ~23rem segue 5+5). Não bloqueia. |

## Respostas às perguntas
- Limiar 14rem: a 100% em 320 px o contêiner mede ~19rem (320.png: 5+5 intacto, Apagar na fileira 2), então nunca dispara a 100%. Em 1280 px o teclado tem 24,75rem fixos e nunca dispara em nenhum zoom. Dispara só com texto ampliado em tela estreita (320-200.png e 390-200.png: Apagar em fileira própria, fonte grande, sem corte, sem rolagem).
- Faixa intermediária: ver achado 1 (sem corte nem quebra de alvo; só não cresce).
- Isenção: válida (CSS declarativo + nome de classe sem lógica, ajuste visual verificado por capturas; `PROCESSO.md` §6, declarada na T12). Diff de código de produção: só `class="keypad-erase"`.
- Testes do Keypad: continuam achando o botão por papel e nome (`getByRole('button', { name: 'Apagar' })` em Keypad.test.tsx:39,56,80 e App.test.tsx:103); a classe não altera nome acessível. Verdes.
- Minor 1 e nit 3 da r2: resolvidos (classe no lugar de `:last-child`; Apagar escala a 200%).

Rastreabilidade: CA-005-28, CA-005-34 → T12 (isenta, capturas) · testes existentes inalterados e verdes · órfãos: nenhum
