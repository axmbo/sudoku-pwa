import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const nvmrc = readFileSync(new URL('../../.nvmrc', import.meta.url), 'utf8').trim();

describe('versão do Node', () => {
  it('INV: o Node em execução é o do .nvmrc', () => {
    expect(process.version).toBe(`v${nvmrc}`);
  });

  it('INV: engines.node do package.json é igual ao .nvmrc', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { engines?: { node?: string } };

    expect(pkg.engines?.node).toBe(nvmrc);
  });
});
