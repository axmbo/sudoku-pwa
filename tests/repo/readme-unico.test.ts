import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function trackedAndUntrackedFiles(): string[] {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  });
  return output.split('\n').filter((line) => line !== '');
}

describe('README único e canônico', () => {
  it('INV: só existe um README.md no repositório, na raiz', () => {
    const readmes = trackedAndUntrackedFiles().filter(
      (file) => file.split('/').pop()?.toLowerCase() === 'readme.md',
    );

    expect(readmes).toEqual(['README.md']);
  });
});
