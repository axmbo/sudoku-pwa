import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

/** Solução do puzzle fixo da 005a (espelha `src/ui/fixed-puzzle.ts`; E2E não importa produção). */
export const SOLUTION = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
];

export function cell(page: Page, row: number, col: number): Locator {
  return page.locator(`[role="gridcell"][data-row="${row - 1}"][data-col="${col - 1}"]`);
}

/** Tab até a grade: o foco cai na célula selecionada. */
export async function focusGrid(page: Page): Promise<void> {
  await page.keyboard.press('Tab');
  await expect(page.locator('[role="gridcell"]:focus')).toHaveCount(1);
}

const GIVENS = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
];

/**
 * Digita a solução só com teclado (Home, seta direita, seta baixo), pulando as pistas.
 * Para logo após o último dígito: mover a seleção depois dele trocaria o anúncio da vitória.
 */
export async function solveByKeyboard(page: Page): Promise<void> {
  await focusGrid(page);
  await page.keyboard.press('Control+Home');
  const empties: [number, number][] = [];
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) if (GIVENS[r]?.[c] === '.') empties.push([r, c]);
  }
  let [row, col] = [0, 0];
  for (const [r, c] of empties) {
    while (row < r) {
      await page.keyboard.press('ArrowDown');
      row += 1;
    }
    while (col < c) {
      await page.keyboard.press('ArrowRight');
      col += 1;
    }
    while (col > c) {
      await page.keyboard.press('ArrowLeft');
      col -= 1;
    }
    await page.keyboard.press(at(SOLUTION[r]?.[c]));
  }
}

/** Cria conflito: 5 na célula (1,3), onde a linha 1 já tem 5 em (1,1). */
export async function createConflict(page: Page): Promise<void> {
  await focusGrid(page);
  await page.keyboard.press('Control+Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('5');
  await expect(cell(page, 1, 3)).toHaveClass(/is-conflict/);
}

export async function seriousViolations(
  page: Page,
  rules?: string[],
): Promise<{ id: string; impact?: string | null }[]> {
  let builder = new AxeBuilder({ page });
  if (rules) builder = builder.withRules(rules);
  const { violations } = await builder.analyze();
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

/** Estreita `T | undefined` sem asserção não nula (proibida pelo lint). */
export function at<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('índice fora do esperado');
  return value;
}

/** Liga ou desliga o modo anotação pelo atalho `N` (pegajoso). */
export async function toggleNoteMode(page: Page): Promise<void> {
  await page.keyboard.press('n');
}

/** Estado do botão Anotar (`aria-pressed`). */
export async function noteModeOn(page: Page): Promise<boolean> {
  return (
    (await page.getByRole('button', { name: /^Anotar/ }).getAttribute('aria-pressed')) === 'true'
  );
}

/** Dígitos anotados na célula (1-indexada), em ordem crescente. */
export async function notesOf(page: Page, row: number, col: number): Promise<string> {
  const spans = await cell(page, row, col).locator('.cell-notes > span').allTextContents();
  return spans.join('');
}

/** Move a seleção da célula atual para (row, col), a partir do canto (1,1), só por setas. */
export async function goTo(page: Page, row: number, col: number): Promise<void> {
  if ((await page.locator('[role="gridcell"]:focus').count()) === 0) await focusGrid(page);
  await page.keyboard.press('Control+Home');
  for (let i = 1; i < row; i += 1) await page.keyboard.press('ArrowDown');
  for (let i = 1; i < col; i += 1) await page.keyboard.press('ArrowRight');
  await expect(cell(page, row, col)).toBeFocused();
}

/** Liga o modo anotação e anota `digits` na célula (1-indexada), partindo de (1,1). */
export async function annotate(
  page: Page,
  row: number,
  col: number,
  digits: string,
): Promise<void> {
  await goTo(page, row, col);
  if (!(await noteModeOn(page))) await toggleNoteMode(page);
  for (const d of digits) await page.keyboard.press(d);
}
