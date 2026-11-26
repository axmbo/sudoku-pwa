import type { JSX } from 'preact';
import { useReducer } from 'preact/hooks';
import { getGameStatus, type Game } from '../domain/game';
import { Announcer } from './Announcer';
import { Grid } from './Grid';
import { Keypad } from './Keypad';
import { messages } from './model/messages';
import { gameReducer, initialState } from './model/reducer';
import { gridView } from './model/view';

export interface AppProps {
  readonly game: Game;
}

export function App({ game }: AppProps): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, game, initialState);
  const status = getGameStatus(state.game);
  return (
    <main>
      <h1>Sudoku</h1>
      {status === 'won' && <p class="banner">{messages.won}</p>}
      {status === 'full-incorrect' && <p class="banner">{messages.fullWithErrors}</p>}
      <Grid cells={gridView(state.game, state.selected)} dispatch={dispatch} />
      <Keypad dispatch={dispatch} />
      <Announcer announcement={state.announcement} />
    </main>
  );
}
