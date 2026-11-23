# Constituição do Sudoku PWA

Princípios imutáveis (camada L1). Mudar um deles exige ADR aprovado pelo Diretor e registro no [CHANGELOG-processo](process/CHANGELOG-processo.md). Specs, planos e código que conflitem com um princípio estão errados, não o princípio.

1. **Offline-first.** Depois da primeira visita, tudo funciona sem rede: jogar, gerar puzzle, desafio diário, estatísticas.
2. **Acessível de verdade.** WCAG 2.2 AA como piso. A grade é jogável só por teclado e com leitor de tela em pt-BR. Zero violações sérias ou críticas do axe.
3. **Rápido no celular modesto.** O dispositivo de referência é um Android classe Moto G em 4G lento. Todo item respeita o orçamento de performance do [ADR 0001](adr/0001-stack-e-ferramentas.md).
4. **Privacidade total.** Nenhum dado pessoal coletado, nenhum script ou requisição de terceiros, nenhuma telemetria. Os dados do jogador ficam no dispositivo.
5. **Domínio puro.** `src/domain/` não depende de DOM, rede, relógio ou aleatoriedade global. Tempo e aleatoriedade entram por injeção.
6. **Determinismo e versionamento do gerador.** Mesma seed + mesma versão do algoritmo ⇒ mesmo puzzle, em qualquer dispositivo. O desafio diário depende disso; mudar o gerador incrementa a versão. Sem `Math.random` no domínio.
7. **Todo puzzle tem solução única**, e a dificuldade é medida pelas técnicas lógicas necessárias, não por contagem de pistas.
8. **Os dados salvos sobrevivem a atualizações.** O schema da persistência é versionado e migrado; uma atualização do Service Worker nunca apaga um jogo em andamento.
9. **Qualidade verificável.** Gates de máquina antes de revisão por modelo; TDD por padrão; cada critério de aceite tem teste que o cita.
10. **pt-BR na interface e na documentação; inglês no código.**
11. **Código aberto (MIT)** e builds reproduzíveis: versões fixadas (lockfile, `.nvmrc`), proveniência atestada.
