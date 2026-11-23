# ADR 0003: Framework de UI

- **Status:** Proposto
- **Data:** 22/11/2026
- **Autor:** agente `arquiteto`

## Contexto

A UI é pequena (grade 9x9, teclado numérico, modos de anotação, timer, estatísticas, desafio diário), com lógica toda no domínio puro (`src/domain/`, sem DOM). Restrições: orçamento de JS inicial ≤ 60 kB gzip (ADR 0001), Android modesto, a11y 0 violações sérias, testes com Testing Library, sem scripts de terceiros, baixo lock-in. A grade segue o padrão APG `grid`: contêiner `role="grid"`, linhas `role="row"`, células `gridcell`, apenas um elemento na sequência de Tab, setas movem o foco (a página do APG não discute roving tabindex nem `aria-activedescendant`; a escolha é nossa).

## Opções consideradas

Tamanhos de bundlephobia (gzip), 22/11/2026.

| Critério | Preact 11.2.0 | Svelte 5.59.1 | Vanilla + Web Components (Lit 3.3.3 opcional) |
|---|---|---|---|
| Bundle | ~4,9 kB | pacote 13,7 kB; o runtime que entra no build depende do compilador, **não confirmado** | 0 kB (vanilla); Lit: tamanho não consultado |
| Testing Library | `@testing-library/preact` 3.2.6, peer `preact >=10` | `@testing-library/svelte` 5.4.2, peers svelte 5 e vitest | só `@testing-library/dom`; Shadow DOM complica consultas por papel |
| Grade ARIA | JSX declarativo; foco e `tabindex` geridos por estado | idem, com compilador | manual; `aria-*` por referência de id não atravessa shadow roots (limitação conhecida, não verificada agora) |
| DX | JSX/TSX, ecossistema React, HMR via `@preact/preset-vite` (peer vite 8 ok) | sintaxe própria `.svelte`, runes | máxima disciplina própria, mais código de renderização |
| Lock-in | baixo (API compatível com React, `preact/compat`) | médio (compilador e sintaxe próprios) | nenhum |

## Decisão

**Preact 11 (TSX) com `@preact/preset-vite` e `@testing-library/preact`.**

- Menor atrito entre os três critérios que pesam mais aqui: bundle pequeno (medido só para o Preact; o runtime do Svelte e o Lit não foram medidos), testabilidade já empacotada, a11y da grade controlada por estado simples.
- Estado do jogo vem do domínio (funções puras, undo/redo imutável); a UI só o projeta. Evitar biblioteca de estado extra; `useReducer` sobre o domínio basta.
- Grade: **roving tabindex** (uma célula com `tabindex=0`, demais `-1`), setas, Home/End, Ctrl+Home/End, sem wrap (recomendação do APG para grades de dados). `aria-label` por célula informa linha, coluna, valor, se é dado fixo, anotações e conflito. Conflito nunca só por cor.
- Sem `preact/compat` salvo necessidade comprovada (mantém o bundle mínimo).
- Fixar Preact em versão exata; se o 11 mostrar instabilidade, regredir para 10.x (peers de Testing Library aceitam).

## Consequências

- Positivas: bundle com folga no orçamento; JSX tipado em TS strict; testes de interação por papel e rótulo.
- Negativas: Preact 11 é recente (a 11.x estável, 11.2.0, é a `latest`; as tags `rc`/`beta` do npm estão defasadas; parte dos guias ainda é da v10); dependência de uma lib de VDOM onde o vanilla bastaria.
- Reversível: o domínio não depende da UI; trocar de framework custa só a camada `src/ui/`.
- Revisão deste ADR se o JS inicial ultrapassar o orçamento por causa da UI.

## Fontes (consultadas em 22/11/2026)

- https://bundlephobia.com/package/preact@latest (4,9 kB min+gzip) e https://bundlephobia.com/package/svelte@latest (13,7 kB)
- https://preactjs.com/guide/v10/getting-started
- https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- `npm view` de preact, svelte, lit, `@testing-library/preact`, `@testing-library/svelte`, `@preact/preset-vite`
