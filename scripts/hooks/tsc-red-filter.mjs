// @ts-check
// Filtro da saída do tsc no commit RED: tolera só erros de símbolo inexistente.
// Falha fechado: entrada sem nenhuma linha `error TS` ou com erro não tolerado sai com 1.
import { readFileSync } from 'node:fs';

const TOLERATED = new Set(['TS2305', 'TS2307', 'TS2339', 'TS2724']);
const ERROR_LINE = /^\S.*error (TS\d+):/;

const errors = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => ({ line, match: ERROR_LINE.exec(line) }))
  .filter((entry) => entry.match !== null);

const rejected = errors.filter((entry) => !TOLERATED.has(entry.match?.[1] ?? ''));

if (errors.length === 0) {
  process.stderr.write('tsc-red-filter: nenhuma linha de erro TS na entrada; falha fechado.\n');
  process.exit(1);
}
if (rejected.length > 0) {
  process.stderr.write(`${rejected.map((entry) => entry.line).join('\n')}\n`);
  process.exit(1);
}
