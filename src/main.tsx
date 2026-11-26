import { render } from 'preact';
import { App } from './ui/App';
import { fixedGame } from './ui/fixed-puzzle';

const root = document.getElementById('app');
if (root) render(<App game={fixedGame()} />, root);
