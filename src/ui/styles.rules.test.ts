// Ganchos de CSS que o jsdom não vê (CA-005-02, 05, 11, 19, 34), sobre `src/ui/styles.css`.
// Seletores usados (existem em Cell.tsx/Grid.tsx): .cell, .cell-digit, .is-given, .is-selected,
// .is-conflict, :focus-visible. Declarações lidas por regra plana (sem aninhamento CSS).
import { describe, expect, it } from 'vitest';
import { parseRules, readUiCss, type CssRule } from './tests/css';

function rules(): CssRule[] {
  return parseRules(readUiCss('styles.css'));
}

/** Itens de seletor (já separados por vírgula) que casam com `re`, com suas declarações. */
function matching(re: RegExp): { selector: string; decls: ReadonlyMap<string, string> }[] {
  return rules().flatMap((r) =>
    r.selectors.filter((s) => re.test(s)).map((selector) => ({ selector, decls: r.declarations })),
  );
}

function weight(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  if (v === 'normal') return 400;
  if (v === 'bold') return 700;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function visible(v: string | undefined): boolean {
  return v !== undefined && !/^(none|0|0px|initial|unset)$/i.test(v.trim());
}

describe('styles.css: ganchos de acessibilidade', () => {
  it('CA-005-11: :focus-visible define outline visível', () => {
    const found = matching(/:focus-visible/).filter(
      (m) => visible(m.decls.get('outline')) || visible(m.decls.get('outline-width')),
    );
    expect(found.length).toBeGreaterThan(0);
  });

  it('CA-005-02: a pista tem font-weight diferente do valor do jogador', () => {
    const given = matching(/\.is-given/)
      .map((m) => weight(m.decls.get('font-weight')))
      .find((w) => w !== undefined);
    const player =
      matching(/^(\.cell|\.cell-digit|\.cell \.cell-digit)$/)
        .map((m) => weight(m.decls.get('font-weight')))
        .filter((w) => w !== undefined)
        .at(-1) ?? 400;
    expect(given).toBeDefined();
    expect(given).not.toBe(player);
  });

  it('CA-005-19: o conflito tem marca além da cor (::after com content, ou background-image)', () => {
    const found = matching(/\.is-conflict/).filter(
      (m) =>
        (/::after|:after/.test(m.selector) &&
          visible(m.decls.get('content')) &&
          m.decls.get('content') !== '""') ||
        visible(m.decls.get('background-image')),
    );
    expect(found.length).toBeGreaterThan(0);
  });

  it('CA-005-05: is-selected tem contorno próprio (outline, box-shadow ou border)', () => {
    const found = matching(/\.is-selected/).filter(
      (m) =>
        visible(m.decls.get('outline')) ||
        visible(m.decls.get('box-shadow')) ||
        visible(m.decls.get('border')),
    );
    expect(found.length).toBeGreaterThan(0);
  });
});

describe('styles.css: layout de 320 px a 44 px (CA-005-34)', () => {
  const cellRules = () =>
    matching(/\.cell(?![-\w])/).filter((m) => !/\.cell-digit/.test(m.selector));

  it('CA-005-34: a célula não usa overflow: hidden', () => {
    expect(cellRules().some((m) => /hidden|clip/.test(m.decls.get('overflow') ?? ''))).toBe(false);
    expect(cellRules().length).toBeGreaterThan(0);
  });

  it('CA-005-34: a célula é contêiner (container-type)', () => {
    expect(
      cellRules().some((m) => /^(inline-size|size)$/.test(m.decls.get('container-type') ?? '')),
    ).toBe(true);
  });

  it('CA-005-34: o font-size do .cell-digit usa cqi', () => {
    const digit = matching(/\.cell-digit/)
      .map((m) => m.decls.get('font-size'))
      .filter((v) => v !== undefined);
    expect(digit.some((v) => /cqi/.test(v ?? ''))).toBe(true);
  });

  it('CA-005-34: a própria célula não define font-size em cqi', () => {
    expect(cellRules().some((m) => /cqi/.test(m.decls.get('font-size') ?? ''))).toBe(false);
  });

  it('CA-005-34: html não fixa font-size em px', () => {
    const px = matching(/^(html|:root)$/).some((m) => /px/.test(m.decls.get('font-size') ?? ''));
    expect(px).toBe(false);
    expect(readUiCss('styles.css')).toBeTypeOf('string');
  });
});

describe('styles.css: cores só por token (CA-005-32)', () => {
  const COLOR_PROPS =
    /^(color|background|background-color|background-image|border(-[a-z]+)*|outline(-color)?|box-shadow|text-shadow|fill|stroke|caret-color|accent-color)$/;
  const LITERAL =
    /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|\b(white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|navy|teal|silver)\b/i;

  /** Valor sem os `var(--…)`: o que sobra não pode conter cor literal. */
  function literalIn(value: string): boolean {
    return LITERAL.test(value.replace(/var\([^)]*\)/g, ''));
  }

  it('CA-005-32: o detector acusa hexadecimal, rgb() e nome de cor, e aceita var()', () => {
    expect(literalIn('1px solid #fff')).toBe(true);
    expect(literalIn('rgb(0 0 0 / 50%)')).toBe(true);
    expect(literalIn('white')).toBe(true);
    expect(literalIn('2px solid var(--color-focus)')).toBe(false);
    expect(literalIn('transparent')).toBe(false);
  });

  it('CA-005-32: nenhuma regra de styles.css usa cor literal (só var(--…))', () => {
    const offenders = rules().flatMap((r) =>
      [...r.declarations]
        .filter(([prop, value]) => COLOR_PROPS.test(prop) && literalIn(value))
        .map(([prop, value]) => `${r.selectors.join(', ')} { ${prop}: ${value} }`),
    );
    expect(offenders).toEqual([]);
  });
});
