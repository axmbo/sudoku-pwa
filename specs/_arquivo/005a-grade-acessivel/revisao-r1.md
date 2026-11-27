# Revisão r1 — spec 005a — 27/11/2026
Base: 96f096e · Head: f470aa9 · check: verde (871 testes, cobertura 100%, informado pelo Orquestrador; não reexecutado)
Veredito: **sai** (0 blocker, 0 major, 1 minor, 3 nits)

| # | Sev. | Arquivo:linha | Achado | Sugestão |
|---|---|---|---|---|
| 1 | minor | src/ui/Grid.tsx:23-30,56 | `actionFor` ignora modificadores: Ctrl/Alt/Meta + dígito, Alt+Seta (voltar do navegador), Cmd+Backspace etc. caem no `preventDefault` e jogam/apagam/movem. Atalhos do navegador e do leitor de tela ficam bloqueados na grade e uma jogada pode ser disparada sem querer. Só Ctrl+Home/End é intencional (CA-005-09). | Retornar `null` se `altKey` ou `metaKey`, e `ctrlKey` fora de Home/End; cobrir com teste (vira item/issue, não bloqueia a saída). |
| 2 | nit | src/ui/Keypad.tsx:15-26 | Depois de tocar num botão do teclado na tela o foco fica no botão; dígitos/Backspace do teclado físico não chegam à grade (o handler está só nas células). Fora dos CA da 005a. | Considerar devolver o foco à célula selecionada na 005b. |
| 3 | nit | src/ui/styles.css:75-81 | Regra `.is-given .cell-digit` duplica o escopo de `.cell.is-given .cell-digit` acima (só separa cor de peso). | Unir as duas regras. |
| 4 | nit | src/ui/Cell.tsx:25-36 | `gridcell` sem `aria-selected`; a seleção só é transmitida pelo foco real e pelo estilo. Hoje funciona (foco acompanha a seleção, T10), mas é redundância barata para leitores de tela. | Avaliar `aria-selected` na 005b. |

Observações sem achado
- Ordem TDD: T01 a T06 e T09/T10 têm `test` antes de `feat`/`fix`. T07 (CSS) e T08 (E2E) isentas por §6 (visual/CSS; invariante sobre estado existente), com motivo em `tasks.md:139,158`; defeitos da T08 viraram T09/T10 `tdd: sim` (decisão 19). Isenções válidas.
- Decisões 14 a 19 respeitadas (não reabertas). Timeout de 30 s em `src/domain/game.prop.test.ts` é o #23 (decisões 16/17), só o limite muda.
- Segurança: CSP de `index.html` intacta, sem estilo inline, sem recurso externo, sem dependência nova de produção, sem persistência de dados do jogador (CA-005-37). `lang="pt-BR"`, `<title>` e `<h1>` presentes (CA-005-36).
- Deriva spec x código: nenhuma encontrada (precedência de anúncio, `id` do anúncio, `tabIndex` móvel, bordas sem volta, 0/Delete/Backspace apagam conferidos).

Rastreabilidade (CA da 005a, 30): todos citados em ao menos um teste. Contagem de arquivos que citam: 01(4) 02(4) 03(3) 05(3) 06(3) 07(4) 08(3) 09(3) 10(2) 11(4) 12(2) 13(2) 14(2) 15(3) 19(5) 20(2) 21(2) 22(1: reducer.test.ts:149) 26(2) 27(2) 28(1: e2e/a11y.spec.ts:148,163) 29(5) 30(3) 31(4) 33(2) 34(2) 35(1: e2e/a11y.spec.ts:85-96) 36(3) 37(3) 39(2). CAs 04, 16-18, 23-25, 32, 38 sem teste: pertencem à 005b, corretos.
Órfãos: nenhum teste sem CA encontrado nos arquivos do diff.
