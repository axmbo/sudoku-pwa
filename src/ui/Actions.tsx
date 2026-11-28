import type { JSX } from 'preact';
import type { UiAction } from './model/reducer';
import type { ControlsView } from './model/view';

export interface ActionsProps {
  readonly controls: ControlsView;
  readonly dispatch: (action: UiAction) => void;
}

export function Actions({ controls, dispatch }: ActionsProps): JSX.Element {
  return (
    <div class="actions">
      <button
        type="button"
        class={controls.noteMode ? 'is-on' : undefined}
        aria-pressed={controls.noteMode}
        onClick={() => dispatch({ type: 'toggle-mode' })}
      >
        Anotar{' '}
        <span class="action-state" aria-hidden="true">
          {controls.noteMode ? 'ligado' : 'desligado'}
        </span>
      </button>
      <button
        type="button"
        aria-disabled={controls.canUndo ? undefined : 'true'}
        onClick={() => dispatch({ type: 'undo' })}
      >
        Desfazer
      </button>
      <button
        type="button"
        aria-disabled={controls.canRedo ? undefined : 'true'}
        onClick={() => dispatch({ type: 'redo' })}
      >
        Refazer
      </button>
    </div>
  );
}
