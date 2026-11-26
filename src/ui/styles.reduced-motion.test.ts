// CA-005-33: movimento reduzido. Verificação estática de `src/ui/styles.css`.
import { describe, expect, it } from 'vitest';
import { mediaBody, parseRules, readUiCss } from './tests/css';

const REDUCE = /prefers-reduced-motion\s*:\s*reduce/;

function reducedRules() {
  const body = mediaBody(readUiCss('styles.css'), REDUCE);
  if (body === undefined) throw new Error('styles.css sem @media (prefers-reduced-motion: reduce)');
  return parseRules(body);
}

function zeroed(value: string | undefined): boolean {
  return value !== undefined && /^(none|0(\.0+)?m?s)(\s*,\s*(none|0(\.0+)?m?s))*$/i.test(value);
}

describe('styles.css: movimento reduzido', () => {
  it('CA-005-33: existe @media (prefers-reduced-motion: reduce)', () => {
    expect(mediaBody(readUiCss('styles.css'), REDUCE)).toBeDefined();
  });

  it('CA-005-33: dentro dela, transition e animation são zeradas para todos os elementos', () => {
    const decls = reducedRules()
      .filter((r) => r.selectors.some((s) => s === '*' || s === '*::before' || s === '*::after'))
      .map((r) => r.declarations);
    const has = (props: string[]) =>
      decls.some((d) =>
        props.some((p) => {
          const v = d.get(p);
          return zeroed(v);
        }),
      );
    expect(has(['transition', 'transition-duration', 'transition-property'])).toBe(true);
    expect(has(['animation', 'animation-duration', 'animation-name'])).toBe(true);
  });
});
