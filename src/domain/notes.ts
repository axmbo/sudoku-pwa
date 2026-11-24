import type { Digit } from './digit';

/** Anotações de uma célula: dígitos em ordem crescente, sem repetição, congelado. */
export type Notes = readonly Digit[];

export const emptyNotes: Notes = Object.freeze([]) as Notes;

export function toggleNote(notes: Notes, digit: Digit): Notes {
  return Object.freeze([...notes, digit].sort((a, b) => a - b)) as Notes;
}
