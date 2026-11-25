# Spec 005b — Anotações, desfazer/refazer e tema

- **Status:** aprovada
- **Issue:** #20
- **Autor:** `produto-ux` · **Aprovação do Diretor:** 25/11/2026
- **Item:** B-05 (parte 2 de 2) · **Depende de:** [005a](../005a-grade-acessivel/spec.md) (Issue #19), além de 001 e 004 (domínio já entregue)

## Problema e motivação

A 005a entrega a grade jogável com valores, conflitos e vitória, em tema claro. Falta o que torna o jogo confortável: anotações a lápis, desfazer/refazer, tema escuro seguindo o sistema e layout lado a lado em tela larga. Esta spec acrescenta isso **sobre a UI da 005a**, mantendo as mesmas garantias de acessibilidade: Lúcia (leitor de tela) e Diego (teclado) anotam e desfazem sem mouse; Marta usa os botões grandes na tela.

Esta spec só pode ser planejada e implementada depois da 005a.

**Os IDs `CA-005-NN` não mudam.** IDs que ficaram na 005a: 01, 02, 03, 05 a 15, 19 a 22, 26 a 31, 33 a 37 e o novo 39. Esta spec define os novos **CA-005-38 e 40 a 45**.

## Histórias

- **H1.** Como Diego, quero anotar, desfazer e refazer só com o teclado, para não depender do mouse.
- **H2.** Como Lúcia, quero ouvir as anotações de cada célula e o que foi desfeito, e em qual célula, para jogar com o leitor de tela em pt-BR.
- **H3.** Como Marta, quero botões grandes de Anotar, Desfazer e Refazer na tela para jogar no celular.
- **H5.** Como qualquer jogador, quero que o jogo siga o tema claro ou escuro do meu sistema, sempre legível, e use bem uma tela larga.

## Critérios de aceite

Convenção: "célula selecionada" = a que tem o foco na grade. Anotações, desfazer e refazer vêm do domínio (001/004); esta spec define só o que o jogador vê, ouve e faz. Tudo aqui vale somando-se aos critérios da 005a (anúncios sem inundar: CA-005-31; alvos de toque: CA-005-28).

### Anotações

- **CA-005-04** — Anotações visíveis
  - Dado uma célula vazia com anotações
  - Quando é exibida
  - Então os candidatos aparecem pequenos, cada um sempre na mesma posição dentro da célula (1 no canto superior esquerdo … 9 no inferior direito), legíveis com contraste de texto.
- **CA-005-16** — Alternar modo anotação
  - Dado a partida em andamento
  - Quando o jogador pressiona a tecla `N` ou ativa o botão Anotar
  - Então o modo alterna entre valor e anotação (modo pegajoso: permanece até nova alternância), o estado fica visível (não só por cor) e é anunciado ("modo anotação ligado" / "desligado"); o botão informa seu estado ao leitor de tela.
- **CA-005-17** — Anotar
  - Dado o modo anotação ligado e o foco numa célula vazia
  - Quando pressiona 1 a 9
  - Então esse candidato é alternado (aparece ou some) nas anotações da célula, sem colocar valor, e o leitor de tela anuncia as anotações atuais.
- **CA-005-18** — Anotar em célula preenchida
  - Dado o modo anotação ligado e o foco numa célula com valor ou pista
  - Quando pressiona 1 a 9
  - Então nada muda e o leitor de tela anuncia que a célula já tem valor (numa pista, "pista, não pode ser alterada").
- **CA-005-43** — Valor remove anotações vizinhas *(novo; parte do CA-005-12 original)*
  - Dado uma célula vazia selecionada e vizinhas (mesma linha, coluna ou caixa) com anotação do valor X
  - Quando o jogador coloca X nessa célula
  - Então a anotação X some das vizinhas, visível na grade.
- **CA-005-44** — Apagar anotações *(novo; parte do CA-005-14 original)*
  - Dado uma célula vazia com anotações
  - Quando pressiona Backspace, Delete ou 0 (ou o botão Apagar)
  - Então as anotações somem, a célula fica sem nenhuma e o leitor de tela anuncia "vazia".
- **CA-005-45** — Nome acessível com anotações *(novo; parte do CA-005-03 original)*
  - Dado uma célula vazia com anotações
  - Quando o leitor de tela a lê
  - Então diz "Linha 3, coluna 5, vazia, anotações 2 4 9" (anotações em ordem crescente), com "em conflito" quando for o caso.

### Desfazer e refazer

- **CA-005-23** — Desfazer por teclado e botão
  - Dado ao menos uma ação feita
  - Quando pressiona Ctrl+Z ou ativa o botão Desfazer
  - Então a última ação (valor, apagar ou anotação) é revertida, o foco vai para a célula afetada, e o leitor de tela anuncia o que foi desfeito e em qual célula. Se o desfazer cria ou elimina conflito, valem os anúncios dos CA-005-20 e 21.
- **CA-005-24** — Refazer por teclado e botão
  - Dado uma ação desfeita e nenhuma jogada nova depois
  - Quando pressiona Ctrl+Y ou ativa o botão Refazer
  - Então a ação é reaplicada, o foco vai para a célula afetada e o anúncio é equivalente ao do desfazer.
- **CA-005-25** — Nada a desfazer ou refazer
  - Dado histórico vazio (ou nada a refazer)
  - Quando aciona Desfazer (ou Refazer)
  - Então nada muda e o leitor de tela anuncia "nada para desfazer" (ou "nada para refazer"); o botão continua focável e informa o estado indisponível.

### Teclado na tela (complemento)

- **CA-005-38** — Botões Anotar, Desfazer e Refazer *(novo; parte do CA-005-27 original)*
  - Dado uma célula selecionada
  - Quando o jogador toca em Anotar, Desfazer ou Refazer
  - Então o efeito é o mesmo do atalho equivalente (CA-005-16, 23, 24, 25), a célula continua selecionada (exceto o salto de foco do desfazer/refazer, CA-005-23 e 24) e cada botão tem ao menos 44×44 px CSS (CA-005-28).

### Tema e layout

- **CA-005-32** — Tema do sistema e contraste nos dois temas
  - Dado o tema claro ou escuro do sistema
  - Quando a tela é exibida
  - Então o jogo segue o tema do sistema, textos têm contraste mínimo de 4,5:1, e componentes e foco ao menos 3:1, em todos os estados (célula normal, selecionada, em conflito, pista, anotações) nos dois temas. (O contraste só do claro, sem as anotações, já está no CA-005-39, na 005a.)
- **CA-005-40** — Layout lado a lado em tela larga *(novo; parte do CA-005-34 original)*
  - Dado tela larga ou em paisagem
  - Quando a tela é exibida
  - Então a grade e o teclado na tela ficam lado a lado, sem rolagem horizontal, sem sobreposição, e a ordem de Tab segue a ordem visual. (Retrato e zoom: CA-005-34, na 005a.)

### Verificação e regras após a vitória

- **CA-005-41** — Verificação automática em modo anotação e no tema escuro *(novo; parte do CA-005-35 original)*
  - Dado a tela em modo anotação e, separadamente, no tema escuro
  - Quando a verificação automática de acessibilidade roda
  - Então não há violação séria ou crítica em nenhum deles.
- **CA-005-42** — Anotar, desfazer e refazer após a vitória *(novo; parte do CA-005-29 original)*
  - Dado a partida vencida
  - Quando o jogador tenta anotar, desfazer ou refazer (teclado ou botão)
  - Então nada muda (regra do domínio) e a grade segue navegável e legível.

## Acessibilidade e UX

Resumo dos requisitos (os CA acima são a fonte verificável):

- **Teclado:** `N` alterna o modo anotação; Ctrl+Z e Ctrl+Y desfazem e refazem; sem armadilha de foco.
- **Leitor de tela (pt-BR):** anotações lidas no nome da célula; modo, anotação e desfazer/refazer anunciados uma vez por ação; botão de modo com estado exposto.
- **Foco e contraste:** modo anotação nunca só por cor; contraste nos dois temas.
- **Toque:** botões Anotar, Desfazer e Refazer ≥ 44×44 px.
- **Movimento:** valem as regras da 005a (CA-005-33).
- **Verificação:** automática, E2E só com teclado e roteiro manual com TalkBack por release (`qa-auditor`, fora desta spec).

## Fora de escopo

- **Na 005a ([spec](../005a-grade-acessivel/spec.md), Issue #19):** grade, navegação, valores, apagar, conflitos, toque, teclado na tela com dígitos e Apagar, vitória e grade cheia com erros, anúncios, movimento reduzido, retrato e zoom, contraste do tema claro.
- Persistência e retomada da partida (B-06); timer e estatísticas (B-07); desafio diário (B-08); instalação, offline e atualização (B-09); novo jogo, reiniciar e seleção de nível (B-10).
- Gerador e solver (specs 002 e 003).
- Dicas, verificação do que está certo ou errado, preenchimento automático de anotações (pós-MVP).
- Temas personalizados, seletor manual de tema, configurações, som, vibração.

## Decisões do Diretor (25/11/2026)

1. **Alternar modo anotação:** (a) tecla `N` mais botão, modo pegajoso (CA-005-16).
2. **Teclado numérico na tela:** (a) sim; dígitos e Apagar na 005a, Anotar, Desfazer e Refazer aqui (CA-005-38).
3. **Anúncio de conflito:** (a) aviso com valor e unidade (CA-005-20, na 005a); vale também para desfazer (CA-005-23).
4. **Grade cheia com erros:** (a) avisar "há erros" (CA-005-30, na 005a).
5. **Desfazer/refazer na UI:** (a) anuncia ação e célula e move o foco para a célula afetada (CA-005-23 e 24).
6. **Layout:** (a) retrato primeiro (005a), lado a lado em tela larga (CA-005-40).
7. **Tema:** (a) seguir claro/escuro do sistema, com contraste nos dois (CA-005-32).
8. **Destaque de contexto:** (a) sim, sutil (CA-005-05, na 005a).
9. **Divisão da spec:** dividir em 005a e 005b, com o teclado numérico na tela na 005a e o tema escuro na 005b.
10. **Issues:** 005a = #19; 005b = #20.
