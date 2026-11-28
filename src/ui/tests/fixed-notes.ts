import { gameToggleNote, type Game } from '../../domain/game';
import type { Digit } from '../../domain/digit';
import { fixedGame } from '../fixed-puzzle';

/** Puzzle fixo com anotações já postas em células vazias (base 0), para testes de UI. */
export function gameWithNotes(
  notes: readonly { row: number; col: number; digits: readonly Digit[] }[],
): Game {
  let game = fixedGame();
  for (const { row, col, digits } of notes) {
    for (const digit of digits) {
      const result = gameToggleNote(game, row, col, digit);
      if (!result.ok) throw new Error(`fixture inválida: ${result.reason}`);
      game = result.value;
    }
  }
  return game;
}
