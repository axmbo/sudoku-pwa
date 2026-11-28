import { expect, test } from '@playwright/test';
import {
  annotate,
  cell,
  focusGrid,
  goTo,
  noteModeOn,
  notesOf,
  solveByKeyboard,
  toggleNoteMode,
} from './helpers';

test.describe('jogo: jornadas por teclado', () => {
  test('CA-005-01: abre com a grade 9×9 do puzzle fixo (30 pistas) e o resto vazio', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
    await expect(page.locator('[role="gridcell"].is-given')).toHaveCount(30);
    await expect(cell(page, 1, 1)).toHaveText('5');
    await expect(cell(page, 1, 3)).toHaveText('');
    await expect(page.locator('.box-end-col')).not.toHaveCount(0);
  });

  test('CA-005-06: Tab entra na grade em uma única célula (1,1) e a grade é uma só parada', async ({
    page,
  }) => {
    await page.goto('/');
    await focusGrid(page);
    await expect(cell(page, 1, 1)).toBeFocused();
    await expect(page.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Inserir 1' })).toBeFocused();
  });

  test('CA-005-06: ao voltar à grade, o foco cai na última célula selecionada', async ({
    page,
  }) => {
    await page.goto('/');
    await focusGrid(page);
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 2, 1)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 2, 2)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Inserir 1' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(cell(page, 2, 2)).toBeFocused();
  });

  test('CA-005-07: em rajada de setas o foco real acompanha a célula selecionada', async ({
    page,
  }) => {
    await page.goto('/');
    await focusGrid(page);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 2, 2)).toHaveClass(/is-selected/);
    await expect(cell(page, 2, 2)).toBeFocused({ timeout: 1000 });
  });

  test('CA-005-10: Tab e Shift+Tab saem da grade e percorrem todos os controles sem armadilha', async ({
    page,
  }) => {
    await page.goto('/');
    await focusGrid(page);
    const names: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press('Tab');
      names.push(
        await page.evaluate(
          () =>
            document.activeElement?.getAttribute('aria-label') ??
            document.activeElement?.textContent ??
            '',
        ),
      );
    }
    expect(names).toEqual([
      'Inserir 1',
      'Inserir 2',
      'Inserir 3',
      'Inserir 4',
      'Inserir 5',
      'Inserir 6',
      'Inserir 7',
      'Inserir 8',
      'Inserir 9',
      'Apagar',
    ]);
    for (let i = 0; i < 10; i += 1) await page.keyboard.press('Shift+Tab');
    await expect(page.locator('[role="gridcell"]:focus')).toHaveCount(1);
    // Shift+Tab a partir da grade sai dela (não fica preso).
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('[role="gridcell"]:focus')).toHaveCount(0);
  });

  test('CA-005-11: a célula e os botões focados por teclado têm contorno visível', async ({
    page,
  }) => {
    await page.goto('/');
    await focusGrid(page);
    const outline = (sel: string) =>
      page.evaluate((s) => {
        const style = getComputedStyle(document.querySelector(s) as Element);
        return {
          style: style.outlineStyle,
          width: parseFloat(style.outlineWidth),
          color: style.outlineColor,
        };
      }, sel);
    const onCell = await outline('[role="gridcell"]:focus');
    expect(onCell.style).not.toBe('none');
    expect(onCell.width).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Tab');
    const onButton = await outline('.keypad button:focus');
    expect(onButton.style).not.toBe('none');
    expect(onButton.width).toBeGreaterThanOrEqual(2);
    expect(onButton.color).toBe('rgb(124, 45, 18)');
  });

  test('CA-005-29: joga a partida inteira só com teclado até a vitória', async ({ page }) => {
    await page.goto('/');
    await solveByKeyboard(page);
    await expect(page.locator('.banner')).toHaveText('Parabéns, você venceu!');
    await expect(page.getByRole('status')).toContainText('Parabéns, você venceu!');
    await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
  });

  test('CA-005-37: recarregar volta ao puzzle fixo, sem persistência e sem promessa de salvamento', async ({
    page,
  }) => {
    await page.goto('/');
    await focusGrid(page);
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('4');
    await expect(cell(page, 1, 3)).toHaveText('4');
    await page.reload();
    await expect(cell(page, 1, 3)).toHaveText('');
    const stores = await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      idb: (await indexedDB.databases()).length,
    }));
    expect(stores).toEqual({ local: 0, session: 0, idb: 0 });
    await expect(page.locator('body')).not.toContainText(/salv/i);
  });

  test('CA-005-36: lang pt-BR, título da página e h1 únicos', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page).toHaveTitle('Sudoku');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: 'Sudoku' })).toBeVisible();
  });

  test('CA-005-01: sem erro de CSP ou de console durante a jornada', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || /content security policy/i.test(msg.text())) {
        problems.push(msg.text());
      }
    });
    page.on('pageerror', (err) => problems.push(err.message));
    await page.goto('/');
    await solveByKeyboard(page);
    expect(problems).toEqual([]);
  });
});

test.describe('jogo: anotações e desfazer por teclado (005b)', () => {
  test('CA-005-16: N liga o modo, pegajoso entre células, e 1 a 9 anotam sem colocar valor', async ({
    page,
  }) => {
    await page.goto('/');
    await goTo(page, 1, 3);
    expect(await noteModeOn(page)).toBe(false);
    await toggleNoteMode(page);
    expect(await noteModeOn(page)).toBe(true);
    await page.keyboard.press('1');
    await page.keyboard.press('9');
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 1, 4)).toBeFocused();
    expect(await noteModeOn(page)).toBe(true);
    for (const d of '123456789') await page.keyboard.press(d);
    expect(await notesOf(page, 1, 3)).toBe('19');
    expect(await notesOf(page, 1, 4)).toBe('123456789');
    await expect(cell(page, 1, 3).locator('.cell-digit')).toHaveText('');
    await toggleNoteMode(page);
    expect(await noteModeOn(page)).toBe(false);
  });

  test('CA-005-43: colocar o valor remove a anotação dele das vizinhas', async ({ page }) => {
    await page.goto('/');
    await annotate(page, 1, 4, '46');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await expect(cell(page, 2, 3)).toBeFocused();
    await page.keyboard.press('4');
    await page.keyboard.press('n');
    await goTo(page, 1, 3);
    expect(await noteModeOn(page)).toBe(false);
    await page.keyboard.press('4');
    await expect(cell(page, 1, 3).locator('.cell-digit')).toHaveText('4');
    expect(await notesOf(page, 1, 4)).toBe('6');
  });

  test('CA-005-23: Ctrl+Z reverte o valor e as anotações podadas, com foco na célula afetada', async ({
    page,
  }) => {
    await page.goto('/');
    await annotate(page, 1, 4, '46');
    await toggleNoteMode(page);
    await goTo(page, 1, 3);
    await page.keyboard.press('4');
    expect(await notesOf(page, 1, 4)).toBe('6');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 3, 3)).toBeFocused();
    await page.keyboard.press('Control+z');
    await expect(cell(page, 1, 3)).toBeFocused();
    await expect(cell(page, 1, 3).locator('.cell-digit')).toHaveText('');
    expect(await notesOf(page, 1, 4)).toBe('46');
  });

  test('CA-005-24: Ctrl+Y reaplica a jogada, com foco na célula afetada', async ({ page }) => {
    await page.goto('/');
    await annotate(page, 1, 4, '46');
    await toggleNoteMode(page);
    await goTo(page, 1, 3);
    await page.keyboard.press('4');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 3, 3)).toBeFocused();
    await page.keyboard.press('Control+y');
    await expect(cell(page, 1, 3)).toBeFocused();
    await expect(cell(page, 1, 3).locator('.cell-digit')).toHaveText('4');
    expect(await notesOf(page, 1, 4)).toBe('6');
  });

  test('CA-005-23: Ctrl+Z também desfaz uma anotação', async ({ page }) => {
    await page.goto('/');
    await annotate(page, 1, 3, '7');
    expect(await notesOf(page, 1, 3)).toBe('7');
    await page.keyboard.press('Control+z');
    expect(await notesOf(page, 1, 3)).toBe('');
    await expect(cell(page, 1, 3)).toBeFocused();
  });
});
