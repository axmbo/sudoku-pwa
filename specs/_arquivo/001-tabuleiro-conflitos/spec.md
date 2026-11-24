# Spec 001 — Tabuleiro e validação de conflitos

- **Status:** aprovada
- **Issue:** nenhuma (item B-01 do backlog)
- **Autor:** `produto-ux` · **Aprovação do Diretor:** 22/11/2026

## Problema e motivação

Todo o jogo depende de um tabuleiro confiável: uma grade 9×9 em que algumas células são pistas fixas, o jogador coloca e apaga valores nas demais, e qualquer repetição de valor em linha, coluna ou bloco é identificada. Sem essa base, o solver, o gerador, o desfazer e a vitória (specs seguintes) não têm sobre o que se apoiar. O aviso de conflito é parte do escopo do MVP e precisa existir como informação, não só como cor na tela.

## Histórias

- **H1.** Como Marta, quero que as pistas do puzzle nunca mudem por engano, para não estragar o jogo ao tocar na célula errada.
- **H2.** Como Diego, quero colocar e apagar valores livremente nas células vazias, para testar hipóteses.
- **H3.** Como Lúcia, quero que cada repetição seja identificada com precisão (quais células, em qual unidade), para que o leitor de tela possa anunciá-la sem depender de cor.

## Conceitos usados

Linha e coluna são numeradas de 1 a 9 (como o jogador as vê). No domínio, são índices de 0 a 8, e a interface as apresenta de 1 a 9 ([ADR 0007](../../../docs/adr/0007-convencoes-do-dominio.md)); por isso o CA-001-21 é verificado no domínio como "não é inteiro de 0 a 8". Bloco é cada uma das nove sub-grades 3×3. Unidade é uma linha, uma coluna ou um bloco. Conflito é o mesmo valor aparecendo duas ou mais vezes na mesma unidade. O conflito é sempre consequência do estado atual da grade.

## Critérios de aceite

### Grade e pistas

- **CA-001-01** — Grade com 81 células
  - Dado uma grade de entrada válida
  - Quando o tabuleiro é criado
  - Então ele tem 9 linhas e 9 colunas, e cada uma das 81 células está vazia ou contém um valor de 1 a 9

- **CA-001-02** — Pistas preservadas
  - Dado uma grade de entrada em que certas células têm valor
  - Quando o tabuleiro é criado
  - Então exatamente essas células são pistas, com os mesmos valores e nas mesmas posições, e as demais células estão vazias e não são pistas

### Colocar e apagar

- **CA-001-03** — Colocar valor em célula vazia
  - Dado uma célula vazia que não é pista
  - Quando o jogador coloca um valor de 1 a 9 nela
  - Então a célula passa a conter esse valor, e nenhuma outra célula muda

- **CA-001-04** — Substituir valor do jogador
  - Dado uma célula que não é pista e contém um valor colocado pelo jogador
  - Quando o jogador coloca outro valor de 1 a 9 nela
  - Então a célula passa a conter o novo valor, e o valor anterior deixa de existir

- **CA-001-05** — Apagar valor do jogador
  - Dado uma célula que não é pista e contém um valor colocado pelo jogador
  - Quando o jogador apaga a célula
  - Então a célula fica vazia, e nenhuma outra célula muda

- **CA-001-06** — Apagar célula vazia
  - Dado uma célula vazia que não é pista
  - Quando o jogador apaga a célula
  - Então a célula continua vazia, a grade fica idêntica à anterior e nenhum erro é sinalizado

### Pista imutável

- **CA-001-07** — Colocar valor em pista é recusado
  - Dado uma célula que é pista
  - Quando o jogador tenta colocar qualquer valor nela (igual ou diferente do atual)
  - Então a tentativa é recusada com o motivo "célula é pista", e a grade fica idêntica à anterior

- **CA-001-08** — Apagar pista é recusado
  - Dado uma célula que é pista
  - Quando o jogador tenta apagá-la
  - Então a tentativa é recusada com o motivo "célula é pista", e a grade fica idêntica à anterior

### Conflitos

- **CA-001-09** — Conflito em linha
  - Dado uma linha em que o valor 5 aparece em duas células
  - Quando os conflitos da grade são consultados
  - Então essas duas células constam como em conflito, com a linha indicada como unidade do conflito

- **CA-001-10** — Conflito em coluna
  - Dado uma coluna em que o valor 5 aparece em duas células
  - Quando os conflitos da grade são consultados
  - Então essas duas células constam como em conflito, com a coluna indicada como unidade do conflito

- **CA-001-11** — Conflito em bloco
  - Dado um bloco em que o valor 5 aparece em duas células que não estão na mesma linha nem na mesma coluna
  - Quando os conflitos da grade são consultados
  - Então essas duas células constam como em conflito, com o bloco indicado como unidade do conflito

- **CA-001-12** — Mesmo valor sem unidade em comum não é conflito
  - Dado duas células com o valor 5 que não compartilham linha, coluna nem bloco
  - Quando os conflitos da grade são consultados
  - Então nenhuma das duas consta como em conflito

- **CA-001-13** — Grade sem repetições
  - Dado uma grade em que nenhuma unidade repete valor
  - Quando os conflitos da grade são consultados
  - Então o resultado é vazio

- **CA-001-14** — Todas as células envolvidas são marcadas
  - Dado um valor repetido três vezes na mesma unidade
  - Quando os conflitos da grade são consultados
  - Então as três células constam como em conflito, e não apenas a última colocada

- **CA-001-15** — Valor em conflito é aceito e marcado
  - Dado uma célula vazia que não é pista, cujo valor 5 já existe na linha, coluna ou bloco dela
  - Quando o jogador coloca 5 nela
  - Então o valor é aceito, a célula e as que repetem o 5 passam a constar como em conflito, e a jogada não é recusada

- **CA-001-16** — Conflito com pista
  - Dado uma pista com valor 5 e uma célula vazia na mesma unidade
  - Quando o jogador coloca 5 na célula vazia
  - Então a pista e a célula do jogador constam como em conflito, e a pista continua imutável (CA-001-07 e CA-001-08 seguem valendo)

- **CA-001-17** — Conflito desaparece ao corrigir
  - Dado duas células em conflito, ao menos uma delas colocada pelo jogador
  - Quando o jogador apaga ou troca o valor dessa célula e a repetição deixa de existir
  - Então nenhuma das duas consta mais como em conflito por essa repetição

- **CA-001-18** — Conflito depende só do estado atual
  - Dado duas grades com exatamente o mesmo conteúdo, obtidas por sequências de jogadas diferentes
  - Quando os conflitos de cada uma são consultados
  - Então os resultados são idênticos

- **CA-001-19** — Conflitos em várias unidades ao mesmo tempo
  - Dado uma célula cujo valor repete na linha dela e também na coluna dela
  - Quando os conflitos da grade são consultados
  - Então a célula consta uma vez como em conflito, com a linha e a coluna indicadas como unidades do conflito

### Entradas inválidas e bordas

- **CA-001-20** — Valor fora de 1 a 9 é recusado
  - Dado uma célula que não é pista
  - Quando o jogador tenta colocar um valor que não é inteiro de 1 a 9 (por exemplo 0, 10, -1, 2,5 ou algo que não é número)
  - Então a tentativa é recusada com o motivo "valor inválido", e a grade fica idêntica à anterior

- **CA-001-21** — Célula fora da grade é recusada
  - Dado um tabuleiro criado
  - Quando se tenta colocar ou apagar valor numa célula cuja linha ou coluna não é inteiro de 1 a 9
  - Então a tentativa é recusada com o motivo "célula inexistente", e a grade fica idêntica à anterior

- **CA-001-22** — Grade de entrada malformada é recusada
  - Dado uma grade de entrada com quantidade de linhas diferente de 9, linha com quantidade de células diferente de 9, ou célula cujo conteúdo não é vazio nem inteiro de 1 a 9
  - Quando se tenta criar o tabuleiro
  - Então a criação é recusada com o motivo "grade malformada", e nenhum tabuleiro é criado

- **CA-001-23** — Grade de entrada com pistas em conflito é recusada
  - Dado uma grade de entrada em que duas pistas repetem valor numa mesma unidade
  - Quando se tenta criar o tabuleiro
  - Então a criação é recusada com o motivo "pistas em conflito", e nenhum tabuleiro é criado

- **CA-001-24** — Recusa não altera o tabuleiro
  - Dado qualquer tentativa recusada de colocar ou apagar valor (CA-001-07, 08, 20 e 21)
  - Quando a recusa ocorre
  - Então o tabuleiro e seus conflitos ficam exatamente como estavam antes da tentativa, e o motivo da recusa é distinguível dos demais motivos

- **CA-001-25** — Precedência entre motivos de recusa
  - Dado uma tentativa a que se aplica mais de um motivo de recusa, como colocar valor inválido numa pista, colocar valor inválido numa célula inexistente, ou criar o tabuleiro com uma grade malformada que também tem pistas em conflito
  - Quando a recusa ocorre
  - Então vale um único motivo, pela ordem: ao colocar ou apagar, "célula inexistente" antes de "valor inválido" e este antes de "célula é pista"; ao criar o tabuleiro, "grade malformada" antes de "pistas em conflito"

## Acessibilidade e UX

Esta spec não tem interface. Ela obriga, porém, informação que a interface das specs seguintes precisa para ser acessível:

- O conflito é informado por célula e por unidade (linha, coluna, bloco), de modo que o leitor de tela em pt-BR possa dizer "em conflito na linha 3" e a tela mostre ícone ou padrão além de cor.
- Os motivos de recusa são distinguíveis entre si, para que a interface possa anunciá-los com mensagem própria em pt-BR.
- Linha e coluna são tratadas de 1 a 9, como o jogador as ouve e lê.

Teclado, foco, toque e contraste ficam para a spec de interface (005).

## Fora de escopo

- Anotações (lápis), desfazer e refazer, detecção de vitória e grade completa: spec 004 (B-04).
- Solver, contagem de soluções e verificação de solução única: spec 002 (B-02).
- Gerador de puzzles, seed e níveis de dificuldade: spec 003 (B-03).
- Qualquer interface, anúncio por leitor de tela, teclado e toque: spec 005 (B-05).
- Salvar e restaurar o jogo, timer, estatísticas e desafio diário.
- Dicas: pós-MVP.

## Divisão prevista

Estimativa de 5 a 7 tarefas (contrato, criação e validação da entrada, colocar/apagar, conflitos, recusas). Cabe numa spec só; reavaliar no plano se passar de 8.

## Decisões do Diretor (22/11/2026)

1. Valor que conflita é aceito e marcado em conflito (CA-001-15), não recusado.
2. O conflito marca todas as células envolvidas na repetição (CA-001-14), derivado só do estado.
3. Grade de entrada com pistas em conflito é recusada na criação (CA-001-23).
4. Precedência entre motivos de recusa (CA-001-25), aprovada na revisão do PR #1.
5. Linha e coluna de 0 a 8 no domínio, de 1 a 9 na interface (ADR 0007, 23/11/2026).
6. Duas células que repetem numa linha e num bloco ao mesmo tempo listam as duas unidades no conflito (23/11/2026).
7. `-0` como linha ou coluna é aceito como 0; como valor, é recusado (CA-001-20) (23/11/2026).

## Perguntas em aberto

Nenhuma.
