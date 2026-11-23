---
name: qualidade-web
description: Qualidade web do Sudoku PWA — grade de Sudoku acessível (teclado, leitor de tela, ARIA), PWA offline e atualização do service worker, orçamento de performance para Android modesto. Use ao especificar, implementar, testar ou auditar UI e PWA.
---

# Qualidade web — procedimento

Fontes: princípios 1–4 e 8 da `docs/constituicao.md`; orçamento e ferramentas no [ADR 0001](../../../docs/adr/0001-stack-e-ferramentas.md); UI no ADR 0003.

## Grade acessível
- Padrão ARIA **grid**: 81 células em 9 linhas; uma célula com `tabindex=0` por vez (roving tabindex).
- Teclado: setas movem; `1`–`9` preenche; `Backspace`/`Delete`/`0` apaga; uma tecla alterna o modo anotação; `Ctrl+Z`/`Ctrl+Y` desfaz/refaz; `Home`/`End` na linha, `Ctrl+Home`/`Ctrl+End` na grade; setas sem wrap (ADR 0003). Sem armadilha de foco.
- Nome acessível da célula em pt-BR: "Linha 3, coluna 5, 7, pista" / "vazia, anotações 2 4 9" / "em conflito".
- Mudanças relevantes (conflito, vitória, desfazer) anunciadas em `aria-live="polite"`, sem inundar.
- Foco visível com contraste ≥ 3:1; texto ≥ 4,5:1; não depender só de cor (conflito também com ícone/padrão).
- Alvos de toque ≥ 44×44 px CSS no teclado numérico da tela; `prefers-reduced-motion` respeitado.
- Testes: axe em toda tela (0 sérias/críticas), E2E só com teclado, roteiro manual com leitor de tela (TalkBack) por release.

## PWA e offline
- Manifest válido (nome, ícones maskable, `start_url`, `display: standalone`, `lang: pt-BR`).
- Service Worker com precache do app shell; nenhum recurso de terceiros.
- **Atualização sem perda:** nova versão espera (`waiting`) e pede ao jogador para recarregar; nunca apagar o armazenamento do jogo; migrações de schema rodam antes de ler dados (ADR 0004).
- E2E: abrir offline após a primeira visita; instalar; atualizar o SW com jogo em andamento e reencontrá-lo.
- A checagem PWA do Lighthouse está descontinuada (ADR 0001): as checagens acima são próprias.

## Performance (dispositivo de referência: Android classe Moto G, 4G lento)
- Os números (JS inicial gzip, LCP, TBT, tempo de geração por nível) estão no ADR 0001; não copie aqui.
- Geração e solver no Web Worker: a UI nunca trava durante a geração.
- Sem fontes web externas; imagens e ícones otimizados; CSS crítico pequeno.
- Medir no CI: tamanho do bundle e do Worker e teto de nós da geração a cada PR (determinísticos); Lighthouse mobile e tempo real de geração no CI agendado e na tag.

## Segurança web
CSP restritiva (`default-src 'self'`, sem `unsafe-inline` em script), sem scripts/analytics de terceiros, sem dados pessoais, dependências mínimas.
