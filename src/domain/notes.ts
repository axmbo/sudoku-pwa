import type { Digit } from './digit';

/** Anotações de uma célula: dígitos em ordem crescente, sem repetição, congelado. */
export type Notes = readonly Digit[];

export const emptyNotes: Notes = Object.freeze([]) as Notes;

export function toggleNote(notes: Notes, digit: Digit): Notes {
  const next = notes.includes(digit) ? notes.filter((d) => d !== digit) : [...notes, digit];
  return Object.freeze(next.sort((a, b) => a - b)) as Notes;
}
