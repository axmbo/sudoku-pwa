import { render } from 'preact';

function App() {
  return (
    <main>
      <h1>Sudoku</h1>
      <p>Em construção.</p>
    </main>
  );
}

const root = document.getElementById('app');
if (root) render(<App />, root);
