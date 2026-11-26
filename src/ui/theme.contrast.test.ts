// Contraste do tema claro (CA-005-11, CA-005-39), verificação estática de `src/ui/theme.css`.
//
// CONTRATO para o `dev`: `theme.css` declara, no PRIMEIRO bloco `:root { ... }` (tema claro,
// fora de `@media`), as variáveis abaixo com cores literais `#rgb` ou `#rrggbb`
// (este teste só entende hexadecimal; sem `rgb()`, `hsl()`, `var()` nem nomes de cor).
//   --color-bg              fundo da página e das células comuns
//   --color-text            texto geral
//   --color-given           dígito de pista
//   --color-player          dígito do jogador
//   --color-selected-bg     fundo da célula selecionada
//   --color-peer-bg         fundo das vizinhas (linha, coluna, caixa)
//   --color-same-value-bg   fundo das células com o mesmo valor
//   --color-conflict-bg     fundo da célula em conflito
//   --color-selected-outline contorno da célula selecionada (componente, 3:1)
//   --color-focus           anel de foco (componente, 3:1)
// Limiares WCAG 2.x: texto 4,5:1; componente de interface e foco 3:1.
import { describe, expect, it } from 'vitest';
import { parseRules, readUiCss } from './tests/css';

export function parseHex(hex: string): [number, number, number] {
  const h = hex.trim().toLowerCase();
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(h);
  if (m3)
    return [m3[1], m3[2], m3[3]].map((c) => parseInt((c ?? '0') + (c ?? '0'), 16)) as [
      number,
      number,
      number,
    ];
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(h);
  if (!m6) throw new Error(`cor não suportada (use #rgb ou #rrggbb): "${hex}"`);
  return [m6[1], m6[2], m6[3]].map((c) => parseInt(c ?? '0', 16)) as [number, number, number];
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function lightTheme(): ReadonlyMap<string, string> {
  const css = readUiCss('theme.css');
  const root = parseRules(css).find((r) => r.selectors.includes(':root'));
  if (!root) throw new Error('theme.css sem bloco :root');
  return root.declarations;
}

function color(vars: ReadonlyMap<string, string>, name: string): string {
  const value = vars.get(name);
  if (value === undefined) throw new Error(`variável ausente em theme.css: ${name}`);
  return value;
}

const TEXT = 4.5;
const COMPONENT = 3;
const BACKGROUNDS = [
  '--color-bg',
  '--color-selected-bg',
  '--color-peer-bg',
  '--color-same-value-bg',
  '--color-conflict-bg',
] as const;

describe('contraste: calculadora WCAG (prova do próprio teste)', () => {
  it('CA-005-39: preto sobre branco dá 21:1 e branco sobre branco dá 1:1', () => {
    expect(contrastRatio('#000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#fff', '#fff')).toBeCloseTo(1, 5);
  });

  it('CA-005-39: par ruim fica abaixo de 4,5:1 (cinza claro sobre branco)', () => {
    expect(contrastRatio('#aaaaaa', '#ffffff')).toBeLessThan(TEXT);
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(TEXT);
  });

  it('CA-005-39: aceita #rgb e #rrggbb e rejeita outros formatos', () => {
    expect(parseHex('#abc')).toEqual(parseHex('#aabbcc'));
    expect(() => parseHex('rgb(0,0,0)')).toThrow();
  });
});

describe('theme.css: tema claro', () => {
  it('CA-005-39: texto geral sobre o fundo tem pelo menos 4,5:1', () => {
    const v = lightTheme();
    expect(contrastRatio(color(v, '--color-text'), color(v, '--color-bg'))).toBeGreaterThanOrEqual(
      TEXT,
    );
  });

  for (const fg of ['--color-given', '--color-player'] as const) {
    for (const bg of BACKGROUNDS) {
      it(`CA-005-39: ${fg} sobre ${bg} tem pelo menos 4,5:1`, () => {
        const v = lightTheme();
        expect(contrastRatio(color(v, fg), color(v, bg))).toBeGreaterThanOrEqual(TEXT);
      });
    }
  }

  it('CA-005-11: o contorno da selecionada se distingue do fundo e da vizinha (3:1)', () => {
    const v = lightTheme();
    const o = color(v, '--color-selected-outline');
    expect(contrastRatio(o, color(v, '--color-bg'))).toBeGreaterThanOrEqual(COMPONENT);
    expect(contrastRatio(o, color(v, '--color-peer-bg'))).toBeGreaterThanOrEqual(COMPONENT);
  });

  for (const bg of BACKGROUNDS) {
    it(`CA-005-11: o foco sobre ${bg} tem pelo menos 3:1`, () => {
      const v = lightTheme();
      expect(contrastRatio(color(v, '--color-focus'), color(v, bg))).toBeGreaterThanOrEqual(
        COMPONENT,
      );
    });
  }
});
