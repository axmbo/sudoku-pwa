# Spec 005a — Grade acessível (primeira UI jogável)

- **Status:** aprovada
- **Issue:** #19
- **Autor:** `produto-ux` · **Aprovação do Diretor:** 25/11/2026
- **Item:** B-05 (parte 1 de 2) · **Depende de:** 001, 004 (domínio já entregue)
- **Irmã:** [005b — Anotações e tema](../../005b-anotacoes-e-tema/spec.md) (Issue #20), que depende desta.

## Problema e motivação

O domínio do jogo (tabuleiro, conflitos, anotações, desfazer/refazer, vitória) existe, mas ninguém consegue jogar: não há tela. Esta é a primeira interface jogável, com **um puzzle fixo**, embutido e de solução única, até o gerador existir (decisão do Diretor, 24/11/2026). Ela precisa nascer acessível: Lúcia (leitor de tela) e Diego (teclado) jogam uma partida inteira de valores, Marta joga no celular com alvos de toque grandes e fonte ampliada.

A spec 005 original (37 CA) foi dividida em duas por decisão do Diretor (25/11/2026). Esta 005a entrega a partida jogável de ponta a ponta (preencher, apagar, conflito, vitória) em tema claro; anotações, desfazer/refazer, tema escuro e layout em tela larga ficam na 005b.

**Os IDs `CA-005-NN` não mudam.** IDs que ficaram na 005b: 04, 16, 17, 18, 23, 24, 25, 32 e os novos 38, 40 a 45. Esta spec define o novo **CA-005-39**.

## Histórias

- **H1.** Como Diego, quero jogar uma partida inteira só com o teclado (mover, preencher e apagar valores) para não depender do mouse. (Anotar, desfazer e refazer: 005b.)
- **H2.** Como Lúcia, quero ouvir linha, coluna, valor e conflito de cada célula, e ser avisada de vitória, para jogar com o leitor de tela em pt-BR.
- **H3.** Como Marta, quero tocar numa célula e digitar por botões grandes na tela para jogar no celular sem teclado físico.
- **H4.** Como qualquer jogador, quero ver quando um número se repete na linha, coluna ou caixa sem depender só de cor.

## Critérios de aceite

Convenção: "célula selecionada" = a que tem o foco na grade. Valores, conflitos e vitória vêm do domínio (001/004); esta spec define só o que o jogador vê, ouve e faz. Nesta spec o tema é o claro.

### Apresentação

- **CA-005-01** — Grade inicial
  - Dado que o jogador abre o jogo
  - Quando a tela carrega
  - Então vê uma grade de 9 linhas por 9 colunas com as pistas do puzzle fixo, separação visível das 9 caixas 3×3 e as demais células vazias; o puzzle é sempre o mesmo e tem solução única.
- **CA-005-02** — Pista distinguível sem cor
  - Dado a grade inicial
  - Quando o jogador compara uma pista com um valor que ele mesmo colocou
  - Então os dois se distinguem por mais que cor (ex.: peso ou estilo da fonte) e o leitor de tela informa "pista" apenas nas pistas.
- **CA-005-03** — Nome acessível da célula
  - Dado uma célula com o foco
  - Quando o leitor de tela a lê
  - Então diz em pt-BR linha e coluna (1–9) e o conteúdo: "Linha 3, coluna 5, 7, pista"; "Linha 3, coluna 5, 7" (valor do jogador); "Linha 3, coluna 5, vazia"; e acrescenta "em conflito" quando for o caso. (A forma com anotações, "vazia, anotações 2 4 9", é o CA-005-45, na 005b.)
- **CA-005-05** — Destaque de contexto
  - Dado uma célula selecionada
  - Quando o foco está nela
  - Então linha, coluna e caixa dela ficam realçadas de forma sutil, e células com o mesmo valor também; o realce nunca é a única forma de distinguir a célula selecionada (ela tem contorno próprio).

### Navegação por teclado

- **CA-005-06** — Entrada na grade
  - Dado que a grade ainda não recebeu foco
  - Quando o jogador pressiona Tab até ela
  - Então o foco cai numa única célula (a linha 1, coluna 1 na primeira vez; depois, a última selecionada) e a grade inteira conta como uma só parada de Tab.
- **CA-005-07** — Setas
  - Dado o foco numa célula
  - Quando pressiona seta para cima, baixo, esquerda ou direita
  - Então o foco vai para a vizinha naquela direção.
- **CA-005-08** — Bordas sem volta
  - Dado o foco numa célula da borda
  - Quando pressiona a seta em direção à borda
  - Então o foco não se move e não vai para o lado oposto.
- **CA-005-09** — Saltos
  - Dado o foco numa célula
  - Quando pressiona Home ou End; Ctrl+Home ou Ctrl+End
  - Então vai à primeira ou última célula da linha; à primeira (1,1) ou última (9,9) da grade.
- **CA-005-10** — Sem armadilha de foco
  - Dado o foco na grade
  - Quando pressiona Tab ou Shift+Tab
  - Então o foco sai da grade para o controle seguinte ou anterior, e é possível percorrer todos os controles da página só com o teclado.
- **CA-005-11** — Foco visível
  - Dado qualquer controle ou a célula selecionada
  - Quando recebe o foco por teclado
  - Então o indicador de foco é visível, com contraste mínimo de 3:1 contra o fundo e contra a célula vizinha.

### Preencher e apagar

- **CA-005-12** — Colocar valor
  - Dado o foco numa célula vazia que não é pista
  - Quando pressiona uma tecla de 1 a 9
  - Então o valor aparece na célula e o leitor de tela anuncia o novo conteúdo da célula. (A remoção das anotações vizinhas com esse valor é o CA-005-43, na 005b.)
- **CA-005-13** — Trocar valor
  - Dado uma célula com valor do jogador
  - Quando pressiona outra tecla de 1 a 9
  - Então a célula passa a ter o novo valor.
- **CA-005-14** — Apagar
  - Dado uma célula com valor do jogador
  - Quando pressiona Backspace, Delete ou 0
  - Então a célula fica vazia e o leitor de tela anuncia "vazia". (Apagar anotações é o CA-005-44, na 005b.)
- **CA-005-15** — Pista é imutável
  - Dado o foco numa pista
  - Quando tenta colocar, trocar ou apagar valor
  - Então nada muda e o leitor de tela anuncia "pista, não pode ser alterada". (Anotar numa pista é coberto pelo CA-005-18, na 005b.)

### Conflitos

- **CA-005-19** — Marca de conflito sem depender de cor
  - Dado que o jogador colocou um valor repetido numa linha, coluna ou caixa
  - Quando a grade é redesenhada
  - Então todas as células envolvidas mostram um ícone ou padrão além de cor, e os nomes acessíveis delas incluem "em conflito".
- **CA-005-20** — Anúncio de conflito
  - Dado uma jogada que cria conflito
  - Quando a jogada é aplicada
  - Então o leitor de tela recebe um aviso educado (sem interromper a fala em curso) dizendo o valor e a unidade repetida (ex.: "Conflito: 5 repetido na linha 3"), uma vez por jogada, além de "em conflito" no nome das células.
- **CA-005-21** — Conflito resolvido
  - Dado que existiam conflitos
  - Quando uma jogada (trocar ou apagar valor) elimina o último conflito
  - Então as marcas somem e o leitor de tela anuncia "sem conflitos"; jogadas que não mudam o estado de conflito não geram anúncio de conflito. "Mudar o estado de conflito" significa: a jogada cria conflito para a célula jogada (CA-005-20) ou elimina o último conflito existente (este CA); trocar um valor em conflito por outro que continua em conflito não gera novo anúncio de conflito. (O mesmo efeito via desfazer é tratado no CA-005-23, na 005b.)
- **CA-005-22** — Conflito não bloqueia
  - Dado um valor que gera conflito
  - Quando é colocado
  - Então a jogada é aceita (o jogador pode errar e corrigir), e o conflito é só sinalizado.

### Toque e teclado na tela

- **CA-005-26** — Seleção por toque
  - Dado uma tela de toque
  - Quando o jogador toca numa célula
  - Então ela fica selecionada, como se tivesse recebido o foco por teclado.
- **CA-005-27** — Teclado na tela: dígitos e Apagar
  - Dado uma célula selecionada
  - Quando o jogador toca num botão de 1 a 9 ou em Apagar
  - Então o efeito é o mesmo do atalho de teclado equivalente (CA-005-12 a 15), aplicado à célula selecionada, que continua selecionada. (Anotar, Desfazer e Refazer na tela: CA-005-38, na 005b.)
- **CA-005-28** — Alvos de toque
  - Dado os botões do teclado na tela e as células da grade
  - Quando medidos
  - Então os botões têm sempre ao menos 44×44 px CSS; as células têm ao menos 44×44 px quando a largura disponível permite (cerca de 396 px mais as margens ou mais); em larguras menores as células encolhem para caber, nunca abaixo de 24×24 px CSS (mínimo do WCAG 2.2 AA, critério 2.5.8) e sem sobreposição com as vizinhas.

### Vitória e grade cheia

- **CA-005-29** — Vitória
  - Dado que a jogada preenche a grade igual à solução
  - Quando é aplicada
  - Então aparece uma mensagem visível de vitória e o leitor de tela a anuncia; entrada de valor e apagar deixam de ter efeito (regra do domínio), e a grade segue navegável e legível. (Anotar, desfazer e refazer após a vitória: CA-005-42, na 005b.)
- **CA-005-30** — Grade cheia com erros
  - Dado a grade completamente preenchida, mas diferente da solução
  - Quando a última jogada é aplicada
  - Então um aviso visível e anunciado informa que há erros, sem declarar vitória e sem revelar quais valores estão errados além dos conflitos já marcados; o jogo continua.

### Acessibilidade transversal e layout

- **CA-005-31** — Anúncios sem inundar
  - Dado uma sequência rápida de jogadas
  - Quando o jogador digita
  - Então cada jogada gera no máximo um anúncio, e um anúncio novo substitui o pendente em vez de enfileirar todos. Quando uma jogada cumpre mais de um anúncio (CA-005-12, 14, 20, 21, 29, 30), vale o de maior prioridade, nesta ordem: vitória (CA-005-29); grade cheia com erros (CA-005-30); conflito criado (CA-005-20); "sem conflitos" (CA-005-21); novo conteúdo da célula (CA-005-12 e 14). O conflito segue indicado no nome acessível das células e na marca visual.
- **CA-005-33** — Movimento reduzido
  - Dado que o sistema pede movimento reduzido
  - Quando há transições ou animações (ex.: vitória)
  - Então elas são suprimidas ou substituídas por mudança instantânea.
- **CA-005-34** — Layout em retrato e zoom
  - Dado tela estreita em retrato com área útil de 320 px CSS de largura (já descontado o efeito de qualquer zoom: por exemplo, uma tela de 640 px com zoom de 200% tem 320 px CSS) e, separadamente, texto ampliado a 200% pela configuração de fonte do sistema ou do navegador
  - Quando a tela é exibida
  - Então a grade ocupa a largura disponível, o teclado na tela fica abaixo dela, tudo cabe sem rolagem horizontal, nada se sobrepõe, as nove células de uma linha cabem lado a lado (9 × 24 px = 216 px, mínimo do CA-005-28) e o dígito de cada célula aparece inteiro, sem corte. Larguras abaixo de 320 px CSS não são alvo desta spec. (Layout lado a lado em tela larga: CA-005-40, na 005b.)
- **CA-005-35** — Verificação automática de acessibilidade
  - Dado a tela nos estados inicial, com conflito e em vitória
  - Quando a verificação automática de acessibilidade roda
  - Então não há violação séria ou crítica em nenhum deles. (O estado em modo anotação: CA-005-41, na 005b.)
- **CA-005-36** — Idioma e estrutura
  - Dado a página
  - Quando lida por leitor de tela
  - Então o idioma é pt-BR, há um título de página e um título principal, e todo texto, rótulo e anúncio está em pt-BR.
- **CA-005-37** — Partida não persiste
  - Dado uma partida em andamento
  - Quando o jogador recarrega ou reabre a página
  - Então a partida recomeça do puzzle fixo (a persistência é a B-06); a tela não promete salvamento.
- **CA-005-39** — Contraste no tema claro *(novo; parte do CA-005-32 original, cuja versão para claro e escuro fica na 005b)*
  - Dado a tela no tema claro
  - Quando exibida
  - Então textos têm contraste mínimo de 4,5:1, e componentes e foco ao menos 3:1, em todos os estados (célula normal, selecionada, em conflito, pista).

## Acessibilidade e UX

Resumo dos requisitos (os CA acima são a fonte verificável):

- **Teclado:** jogo de valores completo sem mouse; uma parada de Tab na grade; setas sem volta; Home/End e Ctrl+Home/End; sem armadilha de foco.
- **Leitor de tela (pt-BR):** nome da célula com linha, coluna, conteúdo, pista e conflito; mudanças relevantes em aviso educado, uma por jogada.
- **Foco e contraste:** foco visível ≥ 3:1; texto ≥ 4,5:1 (tema claro); conflito, pista e selecionada nunca só por cor.
- **Toque:** botões do teclado na tela sempre ≥ 44×44 px; células ≥ 44×44 px quando a largura permite (≥ ~396 px mais margens), senão encolhem até no mínimo 24×24 px (CA-005-28); teclado na tela com dígitos e Apagar.
- **Movimento:** movimento reduzido respeitado.
- **Verificação:** automática (0 sérias/críticas), E2E só com teclado, e roteiro manual com TalkBack por release (registrado pelo `qa-auditor`, fora desta spec).
- **Desempenho:** a resposta a uma tecla ou toque não tem atraso perceptível e o orçamento do ADR 0001 vale.

## Fora de escopo

- **Na 005b ([spec](../../005b-anotacoes-e-tema/spec.md), Issue #20):** anotações na UI (modo, anotar, exibição), desfazer e refazer, botões Anotar/Desfazer/Refazer do teclado na tela, tema escuro e seguir o sistema, layout lado a lado em tela larga.
- Persistência e retomada da partida (B-06); timer e estatísticas (B-07); desafio diário (B-08); instalação, offline e atualização (B-09); novo jogo, reiniciar e seleção de nível (B-10).
- Gerador e solver (specs 002 e 003): a 005a usa um puzzle fixo.
- Dicas, verificação do que está certo ou errado, preenchimento automático de anotações (pós-MVP).
- Temas personalizados, configurações, som, vibração.
- Dois ou mais puzzles; escolha de puzzle.

## Decisões do Diretor (25/11/2026)

1. **Alternar modo anotação:** (a) tecla `N` mais botão, modo pegajoso. Vale na 005b.
2. **Teclado numérico na tela:** (a) sim. Ajuste do Diretor: dígitos e Apagar entram na **005a**; Anotar, Desfazer e Refazer na 005b.
3. **Anúncio de conflito:** (a) aviso educado com valor e unidade, além de "em conflito" no nome da célula (CA-005-20).
4. **Grade cheia com erros:** (a) avisar "há erros", sem dizer onde (CA-005-30).
5. **Desfazer/refazer na UI:** (a) anuncia ação e célula e move o foco para a célula afetada. Vale na 005b.
6. **Layout:** (a) retrato primeiro, lado a lado em tela larga (retrato: CA-005-34 aqui; tela larga: CA-005-40 na 005b).
7. **Tema:** (a) seguir claro/escuro do sistema, com contraste nos dois. Ajuste da divisão: contraste do claro aqui (CA-005-39); escuro e verificação nos dois na 005b (CA-005-32).
8. **Destaque de linha, coluna, caixa e mesmo valor:** (a) sim, sutil (CA-005-05).
9. **Divisão da spec:** dividir em 005a e 005b, com o teclado numérico na tela na 005a e o tema escuro na 005b.
10. **Issues:** 005a = #19; 005b = #20.
11. **Alvos de toque × 320 px (conflito CA-005-28 × CA-005-34):** (a) células ≥ 44×44 px quando a largura permitir (≥ ~396 px mais margens); abaixo disso encolhem para caber, nunca abaixo de 24×24 px (WCAG 2.2 AA, 2.5.8) e sem sobreposição; botões do teclado na tela sempre ≥ 44×44 px. Reescreve o CA-005-28; o CA-005-34 permanece (sem rolagem horizontal a partir de 320 px).
