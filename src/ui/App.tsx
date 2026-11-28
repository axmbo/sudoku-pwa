import type { JSX } from 'preact';
import { useEffect, useReducer } from 'preact/hooks';
import { getGameStatus, type Game } from '../domain/game';
import { Actions } from './Actions';
import { Announcer } from './Announcer';
import { Grid } from './Grid';
import { Keypad } from './Keypad';
import { messages } from './model/messages';
import { gameReducer, initialState } from './model/reducer';
import { controlsView, gridView } from './model/view';

export interface AppProps {
  readonly game: Game;
}

export function App({ game }: AppProps): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, game, initialState);
  const status = getGameStatus(state.game);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if (event.ctrlKey && !event.altKey && !event.metaKey && (key === 'z' || key === 'y')) {
        event.preventDefault();
        dispatch({ type: key === 'z' ? 'undo' : 'redo' });
        return;
      }
      if (key === 'n' && !event.ctrlKey && !event.altKey && !event.metaKey && !event.repeat) {
        event.preventDefault();
        dispatch({ type: 'toggle-mode' });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <main>
      <h1>Sudoku</h1>
      {status === 'won' && <p class="banner">{messages.won}</p>}
      {status === 'full-incorrect' && <p class="banner">{messages.fullWithErrors}</p>}
      <Grid
        cells={gridView(state.game, state.selected)}
        dispatch={dispatch}
        focusTick={state.focusTick}
      />
      <div class="controls">
        <Keypad dispatch={dispatch} />
        <Actions controls={controlsView(state.game, state.noteMode)} dispatch={dispatch} />
      </div>
      <Announcer announcement={state.announcement} />
    </main>
  );
}
