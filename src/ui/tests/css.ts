// Apoio dos testes estáticos de CSS (T07 da 005a): leitura como texto e parser mínimo,
// sem DOM. Cobre só o que o projeto usa: regras planas e `@media` com um nível de aninhamento.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface CssRule {
  readonly selectors: readonly string[];
  readonly declarations: ReadonlyMap<string, string>;
}

export function readUiCss(name: 'theme.css' | 'styles.css'): string {
  return readFileSync(resolve(process.cwd(), 'src/ui', name), 'utf8');
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseDeclarations(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of body.split(';')) {
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const prop = part.slice(0, idx).trim().toLowerCase();
    const value = part
      .slice(idx + 1)
      .trim()
      .replace(/\s*!important$/i, '');
    if (prop) map.set(prop, value);
  }
  return map;
}

/** Todas as regras com corpo plano (inclusive as dentro de `@media`), na ordem do arquivo. */
export function parseRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripComments(css))) !== null) {
    const selectors = (m[1] ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\s+/g, ' '))
      .filter((s) => s !== '' && !s.startsWith('@'));
    if (selectors.length > 0) {
      rules.push({ selectors, declarations: parseDeclarations(m[2] ?? '') });
    }
  }
  return rules;
}

/** Corpo (entre as chaves externas) do primeiro `@media` cuja condição casa com `condition`. */
export function mediaBody(css: string, condition: RegExp): string | undefined {
  const text = stripComments(css);
  const re = /@media([^{]*)\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!condition.test(m[1] ?? '')) continue;
    let depth = 1;
    let i = re.lastIndex;
    while (i < text.length && depth > 0) {
      const ch = text[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      i += 1;
    }
    return text.slice(re.lastIndex, i - 1);
  }
  return undefined;
}
