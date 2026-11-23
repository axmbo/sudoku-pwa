import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  it('REL-01: recusa tag cujo nome gravado no objeto difere do ref e cita o nome', () => {
    const repo = makeRepo();
    git(repo, 'tag', '-a', 'v1.0.0', '-m', 'release antiga');
    // Reaproveita o objeto da tag v1.0.0 sob outro nome v* (ataque de replay).
    const objeto = git(repo, 'rev-parse', 'refs/tags/v1.0.0');
    git(repo, 'update-ref', 'refs/tags/v9.9.9', objeto);

    const r = runScript(repo, 'v9.9.9', makeSigners(repo), 'main');

    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('v1.0.0');
  });

  it('REL-02: recusa tag cujo commit alvo não é alcançável da main e cita a main', () => {
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

describe('gate de tag no pipeline de release (estático)', () => {
  it('REL-03: release.yml lê allowed_signers_tags e passa 3 argumentos ao script', () => {
    const yml = readFileSync(`${root}.github/workflows/release.yml`, 'utf8');
    // O merge-base do REL-02 precisa do histórico: o checkout do job verify-tag exige fetch-depth: 0.
    expect(yml).toMatch(
      /actions\/checkout@.*\n {8}with:\n(?: {10}(?!fetch-depth).*\n)* {10}fetch-depth: 0\n/,
    );
    expect(yml).toMatch(/origin\/main:\.github\/allowed_signers_tags/);
    expect(yml).not.toMatch(/origin\/main:\.github\/allowed_signers(?!_tags)/);
    expect(yml).toMatch(
      /verify-tag\.sh\s+"\$GITHUB_REF_NAME"\s+"\$RUNNER_TEMP\/allowed_signers[^"]*"\s+\S+/,
    );
  });

  it('REL-03: .github/allowed_signers_tags existe, não é vazio e só tem chaves sk-', () => {
    const file = `${root}.github/allowed_signers_tags`;
    expect(existsSync(file), 'arquivo ausente').toBe(true);
    const linhas = readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.trim() !== '');
    expect(linhas.length).toBeGreaterThan(0);
    for (const linha of linhas) {
      expect(linha, linha.slice(0, 60)).toMatch(
        /\ssk-(ssh-ed25519|ecdsa-sha2-nistp256)@openssh\.com\s/,
      );
    }
  });
});

// Critérios REL-01 a REL-04: docs/runbooks/assinatura.md, etapa 7.
describe('scripts/ci/verify-tag.sh: comportamento já existente', () => {
  function gravaTagComAssinaturaFalsa(repo: string, nome: string): void {
    const alvo = git(repo, 'rev-parse', 'HEAD');
    const corpo = [
      `object ${alvo}`,
      'type commit',
      `tag ${nome}`,
      'tagger Teste <teste@example.com> 1700000000 +0000',
      '',
      'release',
      '-----BEGIN SSH SIGNATURE-----',
      'AAAA',
      '-----END SSH SIGNATURE-----',
      '',
    ].join('\n');
    const r = spawnSync('git', ['mktag'], { cwd: repo, input: corpo, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git mktag falhou: ${r.stderr}`);
    git(repo, 'update-ref', `refs/tags/${nome}`, r.stdout.trim());
  }

  it('REL-04: recusa tag leve', () => {
    const repo = makeRepo();
    git(repo, 'tag', 'v1.0.0');

    const r = runScript(repo, 'v1.0.0', makeSigners(repo), 'main');

    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/leve|anotada/);
  });

  it('REL-04: recusa tag anotada sem assinatura', () => {
    const repo = makeRepo();
    git(repo, 'tag', '-a', 'v1.0.0', '-m', 'sem assinatura');

    const r = runScript(repo, 'v1.0.0', makeSigners(repo), 'main');

    expect(r.status).toBe(1);
    expect(r.stderr).toContain('não tem assinatura SSH');
  });

  it('REL-04: recusa quando o allowed_signers está ausente', () => {
    const repo = makeRepo();
    gravaTagComAssinaturaFalsa(repo, 'v1.0.0');

    const r = runScript(repo, 'v1.0.0', join(repo, 'nao-existe'), 'main');

    expect(r.status).toBe(1);
    expect(r.stderr).toContain('allowed_signers ausente ou vazio');
  });

  it('REL-04: recusa quando o allowed_signers está vazio', () => {
    const repo = makeRepo();
    gravaTagComAssinaturaFalsa(repo, 'v1.0.0');
    const vazio = join(repo, 'vazio');
    writeFileSync(vazio, '');

    const r = runScript(repo, 'v1.0.0', vazio, 'main');

    expect(r.status).toBe(1);
    expect(r.stderr).toContain('allowed_signers ausente ou vazio');
  });
});
