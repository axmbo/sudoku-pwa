import type { JSX } from 'preact';
import type { Digit } from '../domain/digit';
import type { UiAction } from './model/reducer';

export interface KeypadProps {
  readonly dispatch: (action: UiAction) => void;
}

const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Keypad({ dispatch }: KeypadProps): JSX.Element {
  return (
    <div class="keypad">
      {DIGITS.map((digit) => (
        <button
          type="button"
          key={digit}
          aria-label={`Inserir ${digit}`}
          onClick={() => dispatch({ type: 'digit', digit })}
        >
          {digit}
        </button>
      ))}
      <button type="button" class="keypad-erase" onClick={() => dispatch({ type: 'erase' })}>
        Apagar
      </button>
    </div>
  );
}
