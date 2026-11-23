import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const script = `${root}scripts/ci/verify-tag.sh`;
const identity = ['-c', 'user.name=Teste', '-c', 'user.email=teste@example.com'];

const dirs: string[] = [];

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync(
    'git',
    [...identity, '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args],
    { cwd, encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} falhou: ${r.stderr}`);
  return r.stdout.trim();
}

/** Repositório temporário com um commit em `main`. */
function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-'));
  dirs.push(dir);
  git(dir, 'init', '-b', 'main');
  git(dir, 'commit', '--allow-empty', '-m', 'inicial');
  return dir;
}

/** allowed_signers não vazio: a recusa testada tem de vir antes da checagem de assinatura. */
function makeSigners(repo: string): string {
  const file = join(repo, 'allowed_signers_teste');
  writeFileSync(file, 'teste@example.com namespaces="git" ssh-ed25519 AAAAFAKE\n');
  return file;
}

function runScript(repo: string, tag: string, signers: string, mainRef: string) {
  const r = spawnSync('bash', [script, tag, signers, mainRef], { cwd: repo, encoding: 'utf8' });
  return { status: r.status, stderr: r.stderr };
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('scripts/ci/verify-tag.sh', () => {
  it('CA-REL-01: recusa tag cujo nome gravado no objeto difere do ref e cita o nome', () => {
    const repo = makeRepo();
    git(repo, 'tag', '-a', 'v1.0.0', '-m', 'release antiga');
    // Reaproveita o objeto da tag v1.0.0 sob outro nome v* (ataque de replay).
    const objeto = git(repo, 'rev-parse', 'refs/tags/v1.0.0');
    git(repo, 'update-ref', 'refs/tags/v9.9.9', objeto);

    const r = runScript(repo, 'v9.9.9', makeSigners(repo), 'main');

    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('v1.0.0');
  });

  it('CA-REL-02: recusa tag cujo commit alvo não é alcançável da main e cita a main', () => {
    const repo = makeRepo();
    git(repo, 'switch', '-c', 'feature');
    git(repo, 'commit', '--allow-empty', '-m', 'fora da main');
    git(repo, 'tag', '-a', 'v1.0.0', '-m', 'release de branch');
    git(repo, 'switch', 'main');

    const r = runScript(repo, 'v1.0.0', makeSigners(repo), 'main');

    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('main');
  });
});
