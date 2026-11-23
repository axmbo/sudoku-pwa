# Backlog

Priorizado de cima para baixo; um item = uma spec = um ciclo. Os critérios aqui são de alto nível; os CA com ID nascem na `spec.md`. Domínio puro primeiro, UI depois.

| # | Item | Critérios de alto nível | Spec | Estado |
|---|---|---|---|---|
| B-01 | Tabuleiro e validação de conflitos | representar grade 9×9 com pistas; colocar/apagar valor; detectar conflitos em linha, coluna e bloco; pista imutável | 001 | a especificar |
| B-02 | Solver | resolver por backtracking; contar soluções com corte em 2; devolver grade válida | 002 | — |
| B-03 | Gerador com seed e dificuldade | mesma seed + versão ⇒ mesmo puzzle; solução única; nível pela técnica mais difícil exigida | 003 | — |
| B-04 | Estado de jogo | anotações; desfazer/refazer; detectar vitória; serialização versionada | 004 | — |
| B-05 | Grade acessível (primeira UI) | jogar só por teclado e com leitor de tela; conflito sem depender de cor; toque ≥ 44 px | 005 | — |
| B-06 | Persistência local | retomar o jogo ao reabrir; schema versionado com migração; sobreviver à atualização do SW | — | — |
| B-07 | Timer e estatísticas | timer com pausa automática; estatísticas por nível (jogos, vitórias, melhor tempo, sequência) | — | — |
| B-08 | Desafio diário | puzzle do dia igual em todos os dispositivos; histórico dos dias jogados | — | — |
| B-09 | PWA: instalação, offline e atualização | instalável; funciona offline após a 1ª visita; atualização pede recarga sem perder jogo | — | — |
| B-10 | Novo jogo e seleção de nível | escolher nível; geração no Worker sem travar a UI; tempo dentro do orçamento | — | — |
| — | **Pós-MVP:** dicas | dica indica a técnica e a célula, sem revelar direto | — | pós-MVP |
