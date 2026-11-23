import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('fumaça', () => {
  test('INV: a página abre em pt-BR com o título Sudoku e sem violações sérias de acessibilidade', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { level: 1, name: 'Sudoku' })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    const graves = violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });
});
