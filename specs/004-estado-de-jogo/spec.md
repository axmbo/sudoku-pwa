# Spec 004 — Estado de jogo (anotações, desfazer/refazer, vitória, serialização)

- **Status:** aprovada
- **Issue:** [#14](https://github.com/axmbo/sudoku-pwa/issues/14) (item B-04 do backlog)
- **Autor:** `produto-ux` · **Aprovação do Diretor:** 24/11/2026

## Problema e motivação

A spec 001 entrega o tabuleiro com valores e conflitos, mas o jogador ainda não pode fazer anotações a lápis, voltar atrás numa jogada, saber que venceu nem guardar o jogo para retomar depois. Sem isso não há partida de verdade, e as specs de interface (005), persistência (B-06) e timer (B-07) não têm sobre o que se apoiar. Esta spec define o comportamento do estado de jogo completo, sem tela e sem armazenamento.

## Histórias

- **H1.** Como Diego, quero anotar candidatos a lápis em células vazias para registrar minhas deduções sem comprometer um valor.
- **H2.** Como Diego, quero desfazer e refazer jogadas sem limite prático para testar hipóteses e voltar atrás sem medo.
- **H3.** Como Marta, quero ser avisada de forma inequívoca quando completo o puzzle corretamente, para saber que terminei.
- **H4.** Como Marta, quero que o jogo em andamento possa ser guardado e reaberto exatamente como estava (valores, anotações e histórico), para retomar de onde parei.
- **H5.** Como Lúcia, quero que cada mudança de estado (anotação, desfazer, vitória) seja um fato explícito e distinguível, para que a interface possa anunciá-lo sem ambiguidade.

## Conceitos

- **Partida:** puzzle (pistas, solução, nível, semente, versão do gerador) mais o que o jogador fez: valores, anotações e histórico de jogadas.
- **Anotação:** conjunto de dígitos de 1 a 9 marcados a lápis numa célula vazia, não pista.
- **Jogada:** uma mudança desfazível do estado: colocar valor, apagar valor, alternar uma anotação, limpar as anotações de uma célula.
- **Histórico:** sequência de jogadas feitas, com ponto atual; define o que se pode desfazer e refazer.

## Critérios de aceite

### Anotações

- **CA-004-01** — Alternar anotação numa célula vazia
  - Dado uma célula vazia que não é pista e sem a anotação 4
  - Quando o jogador alterna a anotação 4 nessa célula
  - Então a célula passa a ter a anotação 4 e as demais anotações dela não mudam; alternar de novo a remove.

- **CA-004-02** — Anotações em ordem canônica e sem repetição
  - Dado uma célula com as anotações 7, 2 e 4 (inseridas nessa ordem)
  - Quando se consulta as anotações da célula
  - Então elas vêm como conjunto sem repetição e em ordem crescente (2, 4, 7).

- **CA-004-03** — Anotação recusada em pista
  - Dado uma célula que é pista
  - Quando o jogador tenta alternar uma anotação nela
  - Então a jogada é recusada com o motivo "célula é pista", o estado não muda e o histórico não ganha entrada.

- **CA-004-04** — Anotação recusada em célula com valor
  - Dado uma célula não pista que já tem valor colocado
  - Quando o jogador tenta alternar uma anotação nela
  - Então a jogada é recusada com o motivo "célula tem valor", sem mudar o estado nem o histórico.

- **CA-004-05** — Anotação inválida ou posição inválida
  - Dado qualquer partida
  - Quando o jogador alterna uma anotação com dígito fora de 1 a 9, não inteiro, ou com linha ou coluna fora do tabuleiro (valores como 0, 10, 2,5, texto, vazio)
  - Então a jogada é recusada com motivo distinto para dígito inválido e para posição inválida, sem mudar o estado nem o histórico.

- **CA-004-06** — Anotar um dígito que já existe nos vizinhos é permitido
  - Dado uma célula vazia cuja linha já contém o valor 5 em outra célula
  - Quando o jogador alterna a anotação 5 nessa célula
  - Então a anotação é aceita, e a anotação em si não é tratada como conflito.

- **CA-004-07** — Limpar todas as anotações de uma célula
  - Dado uma célula vazia com três anotações
  - Quando o jogador pede para limpar as anotações da célula
  - Então a célula fica sem anotações, numa única jogada desfazível; em célula sem anotações, a operação é aceita sem efeito e não entra no histórico.

### Interação entre valor e anotação

- **CA-004-08** — Colocar valor limpa as anotações da própria célula
  - Dado uma célula vazia com as anotações 2 e 9
  - Quando o jogador coloca o valor 9 nela
  - Então a célula tem o valor 9 e nenhuma anotação; desfazer devolve a célula vazia com as anotações 2 e 9.

- **CA-004-09** — Apagar valor não recupera anotações sozinho
  - Dado uma célula com valor, cujas anotações foram limpas ao colocá-lo
  - Quando o jogador apaga o valor
  - Então a célula fica vazia e sem anotações; desfazer a exclusão devolve o valor.

- **CA-004-10** — Anotações dos vizinhos permanecem ao colocar valor (decisão 1)
  - Dado uma célula vazia cujos vizinhos (linha, coluna e bloco) têm a anotação 6
  - Quando o jogador coloca o valor 6 nessa célula
  - Então todas as anotações 6 dos vizinhos permanecem intactas; nenhuma é removida automaticamente, e o histórico ganha uma só jogada.

### Desfazer e refazer

- **CA-004-11** — Desfazer a última jogada
  - Dado uma partida não vencida (em partida vencida, ver CA-004-23) com ao menos uma jogada no histórico
  - Quando o jogador desfaz
  - Então o estado volta exatamente ao de antes da última jogada (valores e anotações) e a jogada passa a poder ser refeita.

- **CA-004-12** — Refazer a jogada desfeita
  - Dado uma jogada que acabou de ser desfeita
  - Quando o jogador refaz
  - Então o estado volta exatamente ao de depois da jogada, igual ao que era antes de desfazer.

- **CA-004-13** — Desfazer sem histórico
  - Dado uma partida sem nenhuma jogada
  - Quando o jogador desfaz
  - Então a operação é recusada com o motivo "nada a desfazer" e o estado não muda.

- **CA-004-14** — Refazer sem jogada desfeita
  - Dado uma partida em que nada foi desfeito, ou em que tudo já foi refeito
  - Quando o jogador refaz
  - Então a operação é recusada com o motivo "nada a refazer" e o estado não muda.

- **CA-004-15** — Jogada nova descarta o que seria refeito
  - Dado uma partida com jogadas desfeitas que ainda podem ser refeitas
  - Quando o jogador faz uma jogada nova
  - Então não há mais nada a refazer.

- **CA-004-16** — Desfazer e refazer em sequência longa
  - Dado uma partida com 500 jogadas válidas, nenhuma das quais a vence (partida vencida: ver CA-004-23)
  - Quando o jogador desfaz todas e depois refaz todas
  - Então, após desfazer todas, o estado é o inicial do puzzle; após refazer todas, é idêntico ao de antes de desfazer; nenhuma jogada é perdida (sem limite prático de histórico).

- **CA-004-17** — Desfazer cobre todos os tipos de jogada
  - Dado jogadas de colocar valor, apagar valor, alternar anotação e limpar anotações, numa partida não vencida (partida vencida: ver CA-004-23)
  - Quando o jogador desfaz cada uma
  - Então cada desfazer restaura exatamente o estado anterior àquela jogada, qualquer que seja o tipo.

- **CA-004-18** — Jogada recusada ou sem efeito não entra no histórico
  - Dado uma partida com N jogadas no histórico
  - Quando o jogador faz uma jogada recusada (CA-004-03, 04 ou 05, ou as recusas da spec 001) ou uma jogada que não altera nada (colocar o valor que a célula já tem, apagar célula já vazia)
  - Então o histórico continua com N jogadas e o que poderia ser refeito não é descartado.

- **CA-004-32** — Uma jogada por ação do jogador (decisão 2)
  - Dado uma célula vazia sobre a qual o jogador alterna as anotações 2, 5 e 8 em sequência
  - Quando o jogador desfaz uma vez
  - Então só a anotação 8 é desfeita (2 e 5 permanecem); cada desfazer reverte exatamente uma ação, sem agrupamento de jogadas.

### Vitória

- **CA-004-19** — Vitória ao completar igual à solução
  - Dado uma partida com uma única célula não pista vazia, cujo valor correto é 3
  - Quando o jogador coloca o 3 nessa célula
  - Então a partida passa a estado "vencida".

- **CA-004-20** — Grade completa errada não é vitória
  - Dado uma partida em que todas as células estão preenchidas e ao menos uma difere da solução, com ou sem conflito visível
  - Quando se consulta o estado da partida
  - Então a partida não está vencida, e é possível distinguir "grade cheia e incorreta" de "grade incompleta".

- **CA-004-33** — Sem conferência contra a solução antes de a grade ficar cheia (decisão 4)
  - Dado uma partida com células vazias e uma célula cujo valor correto é 3
  - Quando o jogador coloca nela o 7, que não gera conflito mas difere da solução
  - Então a jogada é aceita normalmente, sem sinal de erro; a diferença em relação à solução só é observável quando a grade fica cheia (CA-004-20).

- **CA-004-21** — Grade incompleta nunca vence
  - Dado uma partida com ao menos uma célula vazia, mesmo que todos os valores colocados estejam corretos
  - Quando se consulta o estado da partida
  - Então a partida não está vencida.

- **CA-004-22** — Vitória nunca coexiste com conflito
  - Dado qualquer partida vencida
  - Quando se calculam os conflitos
  - Então não há nenhum; e, em partida com conflito, a vitória é impossível.

- **CA-004-23** — Partida vencida recusa tudo, inclusive desfazer (decisão 3)
  - Dado uma partida vencida
  - Quando o jogador tenta colocar, apagar, anotar, limpar anotações, desfazer ou refazer
  - Então cada operação é recusada com o motivo "partida encerrada", o estado permanece vencido e o histórico não muda.

- **CA-004-24** — Pistas e solução intactas durante toda a partida
  - Dado qualquer sequência de jogadas, desfazeres e refazeres
  - Quando se consulta as pistas e a solução
  - Então são idênticas às do puzzle original.

### Serialização versionada

- **CA-004-25** — Ida e volta preserva a partida inteira (decisão 5)
  - Dado uma partida com valores, anotações, histórico completo (todas as jogadas, sem truncar, incluindo jogadas desfeitas ainda refazíveis) e puzzle completo (pistas, solução, nível, semente, versão do gerador)
  - Quando ela é serializada e depois lida de volta
  - Então a partida lida é igual à original, com o histórico inteiro, e desfazer e refazer funcionam como na original, inclusive até o estado inicial.

- **CA-004-26** — Versão de formato presente e estável
  - Dado uma partida serializada
  - Quando se examina o resultado
  - Então ele declara a versão do formato (inteiro positivo), e a mesma partida serializada duas vezes gera resultado idêntico.

- **CA-004-27** — Versão de formato mais nova que a conhecida
  - Dado um dado serializado cuja versão de formato é maior que a suportada
  - Quando se tenta ler
  - Então a leitura é recusada com o motivo "versão futura", sem alterar nem descartar o dado.

- **CA-004-28** — Dado ilegível ou mal formado
  - Dado entradas como texto vazio, texto que não é do formato, campo obrigatório ausente, tipo errado, versão ausente ou não inteira
  - Quando se tenta ler
  - Então a leitura é recusada com o motivo "dado inválido", sem lançar falha inesperada.

- **CA-004-29** — Dado bem formado mas incoerente
  - Dado um dado serializado com formato correto, mas incoerente: valor sobre pista diferente do dado, anotação em célula com valor, solução que contradiz as pistas, histórico que não leva ao estado gravado, ponto atual do histórico fora dos limites
  - Quando se tenta ler
  - Então a leitura é recusada com o motivo "dado inconsistente"; nunca se devolve uma partida que viole as regras do jogo.

- **CA-004-30** — Partida vencida também é serializada
  - Dado uma partida vencida
  - Quando ela é serializada e lida de volta
  - Então volta vencida, com o mesmo histórico.

- **CA-004-31** — Estado derivado não é gravado
  - Dado uma partida com conflitos
  - Quando ela é serializada
  - Então os conflitos e o estado de vitória não fazem parte do dado gravado; ao ler, são recalculados e coincidem com os da original.

## Acessibilidade e UX

Esta spec não tem interface. Ela garante o que a interface (spec 005) precisa para ser acessível:

- Toda recusa tem motivo distinto e legível por máquina, para a interface mapear a mensagem em pt-BR e anunciá-la ao leitor de tela.
- Desfazer, refazer e vitória são fatos explícitos no estado, nunca inferidos por comparação, para poderem ser anunciados.
- Anotações têm ordem estável (crescente), para o leitor de tela falá-las sempre na mesma ordem ("anotações 2 4 9").
- Conflito e vitória são independentes de cor por construção: são dados, não aparência. Teclado, foco, contraste e alvos de toque ficam na spec 005.

## Fora de escopo

- Interface e atalhos de teclado (alternar modo anotação, Ctrl+Z, Ctrl+Y): spec 005.
- Gravar e ler em armazenamento do dispositivo, migração entre versões e retomada ao reabrir: B-06. Aqui só o formato versionado e sua leitura/recusa.
- Timer e tempo decorrido: B-07. O tempo não faz parte do dado desta spec.
- Estatísticas e desafio diário.
- Dicas (pós-MVP); preenchimento automático de anotações; limpeza automática de anotações dos vizinhos (decisão 1).
- Limite de histórico (ilimitado por decisão de produto; ver visão do produto).

## Decisões do Diretor (24/11/2026)

1. **Anotações dos vizinhos permanecem** ao colocar valor; o jogador as remove. Reflete-se em CA-004-10.
2. **Desfazer = uma jogada por ação do jogador**, sem agrupar anotações. Reflete-se em CA-004-32 (e CA-004-07, 08, 17).
3. **Depois da vitória, tudo é recusado, inclusive desfazer.** Reflete-se em CA-004-23.
4. **Nenhuma conferência contra a solução** até a grade ficar cheia (só conflito, como na spec 001). Reflete-se em CA-004-33 e CA-004-20.
5. **O jogo gravado leva o histórico completo**, sem limite. O `arquiteto` mede o tamanho do dado no plano. Reflete-se em CA-004-25 e CA-004-16.
