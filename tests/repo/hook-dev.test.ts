import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const devMd = readFileSync(`${root}.claude/agents/dev.md`, 'utf8');

function extractHookCommand(): string {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(devMd)?.[1] ?? '';
  const lines = frontmatter.split('\n');
  const start = lines.findIndex((l) => /^\s*PreToolUse:\s*$/.test(l));
  expect(start, 'PreToolUse ausente no frontmatter de dev.md').toBeGreaterThanOrEqual(0);
  const line = lines.slice(start).find((l) => /^\s*command:\s*/.test(l));
  expect(line, 'command ausente no hook PreToolUse').toBeDefined();
  const raw = (line as string).replace(/^\s*command:\s*/, '').trim();
  // Escalar YAML entre aspas duplas: as sequências de escape usadas aqui coincidem com JSON.
  return raw.startsWith('"') ? (JSON.parse(raw) as string) : raw;
}

function runHook(projectDir: string, filePath: string) {
  const result = spawnSync('sh', ['-c', extractHookCommand()], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: filePath } }),
    encoding: 'utf8',
  });
  return result.status;
}

describe('hook PreToolUse do dev', () => {
  it('INV: o comando termina com `|| exit 2` (só o exit 2 bloqueia no Claude Code)', () => {
    expect(extractHookCommand()).toMatch(/\|\|\s*exit 2\s*$/);
  });

  it('INV: script ausente falha fechado com exit 2', () => {
    expect(runHook('/nao/existe/sudoku-pwa-inexistente', 'src/x.ts')).toBe(2);
  });

  it('INV: com o projeto correto, caminho de produção passa (exit 0)', () => {
    expect(runHook(root, 'src/x.ts')).toBe(0);
  });

  it('INV: com o projeto correto, caminho de teste é bloqueado (exit 2)', () => {
    expect(runHook(root, 'src/x.test.ts')).toBe(2);
  });
});
