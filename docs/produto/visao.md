# Visão do produto

## Em uma frase

Um Sudoku em pt-BR, instalável, que funciona sem internet, roda liso num celular modesto e pode ser jogado por inteiro com teclado ou leitor de tela, sem coletar nenhum dado do jogador.

## Personas

- **Marta, 58, jogadora diária.** Joga no ônibus, num Android de entrada, com sinal ruim. Quer abrir e jogar na hora, retomar de onde parou e fazer o desafio do dia. Usa fonte grande.
- **Diego, 31, jogador exigente.** Quer níveis difíceis de verdade (que pedem técnica, não chute), anotações rápidas e desfazer ilimitado. Acompanha tempos e sequências.
- **Lúcia, 40, cega, usuária de TalkBack.** Precisa navegar a grade célula a célula, ouvir linha, coluna, valor e anotações, e saber quando há conflito ou vitória.

## Escopo do MVP (decisão do Diretor, 22/11/2026)

1. **Níveis de dificuldade**, medidos pelas técnicas lógicas exigidas; todo puzzle com solução única.
2. **Destaque de conflitos** (repetição em linha, coluna ou bloco), sem depender só de cor.
3. **Anotações** (lápis) e **desfazer/refazer** sem limite prático.
4. **Timer** (pausa automática ao sair do app) e **estatísticas** por nível: jogos, vitórias, melhor tempo, sequência.
5. **Desafio diário**: o mesmo puzzle para todos no mesmo dia, gerado no dispositivo, sem servidor.
6. **PWA**: instalação, offline completo, atualização sem perder o jogo em andamento.
7. **Persistência local** do jogo em andamento, estatísticas e configurações.

## Fora do MVP

- **Dicas** (pós-MVP; ficam baratas porque o solver lógico já identifica a técnica).
- Contas, sincronização entre dispositivos, ranking online, qualquer servidor.
- Variantes (Killer, 6×6, 16×16), temas personalizados além de claro/escuro do sistema.
- Anúncios, analytics, telemetria.

## Medidas de sucesso

- Lighthouse mobile e orçamento de performance do ADR 0001 atendidos no dispositivo de referência.
- 0 violações sérias/críticas do axe; jornada completa com TalkBack.
- Jogo salvo sobrevive a 100% das atualizações (E2E).
