// @ts-check
// Hook PreToolUse do `dev`: bloqueia edição de testes (responsabilidade da `eng-testes`).
// Falha fechado: qualquer entrada ilegível ou exceção resulta em exit 2.
import { readFileSync } from 'node:fs';

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const BLOCKED_DIRS = new Set(['e2e', 'tests', '__arbitraries__']);

/** @param {string} path */
function isTestPath(path) {
  const segments = path.split(/[\\/]/).filter(Boolean);
  const name = segments[segments.length - 1] ?? '';
  return TEST_FILE.test(name) || segments.slice(0, -1).some((s) => BLOCKED_DIRS.has(s));
}

/** @param {string} message */
function block(message) {
  process.stderr.write(`guard-test-files: ${message}\n`);
  process.exit(2);
}

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const toolInput = input?.tool_input;
  const path = toolInput?.file_path ?? toolInput?.notebook_path;
  if (typeof path !== 'string' || path === '') {
    block('caminho ausente ou inválido na entrada; bloqueado por segurança.');
  } else if (isTestPath(path)) {
    block(`${path} é arquivo de teste; devolva à eng-testes com a justificativa.`);
  }
} catch (error) {
  block(
    `falha ao processar a entrada (${error instanceof Error ? error.message : String(error)}); bloqueado por segurança.`,
  );
}
