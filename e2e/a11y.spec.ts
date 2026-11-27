import { expect, test, type Page } from '@playwright/test';
import { at, createConflict, seriousViolations, solveByKeyboard } from './helpers';

const MIN_BUTTON = 44;
const MIN_CELL_NARROW = 24;

async function boxes(page: Page, selector: string) {
  const out = [];
  for (const handle of await page.locator(selector).all()) {
    const box = await handle.boundingBox();
    if (box === null) throw new Error(`sem boundingBox: ${selector}`);
    out.push(box);
  }
  return out;
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
}

/** Layout em largura estreita: sem sobreposição, teclado abaixo, dígito inteiro (CA-005-34, 28). */
async function expectNarrowLayoutOk(page: Page): Promise<void> {
  const cells = await boxes(page, '[role="gridcell"]');
  expect(cells).toHaveLength(81);
  for (let r = 0; r < 9; r += 1) {
    const row = cells.slice(r * 9, r * 9 + 9);
    const top = at(row[0]).y;
    for (const [i, box] of row.entries()) {
      expect(box.width).toBeGreaterThanOrEqual(MIN_CELL_NARROW);
      expect(box.height).toBeGreaterThanOrEqual(MIN_CELL_NARROW);
      expect(Math.abs(box.y - top)).toBeLessThan(1);
      if (i > 0)
        expect(box.x).toBeGreaterThanOrEqual(at(row[i - 1]).x + at(row[i - 1]).width - 0.5);
    }
    if (r > 0) {
      const prev = at(cells[(r - 1) * 9]);
      expect(at(row[0]).y).toBeGreaterThanOrEqual(prev.y + prev.height - 0.5);
    }
  }

  const grid = at((await page.locator('[role="grid"]').boundingBox()) ?? undefined);
  const keypad = at((await page.locator('.keypad').boundingBox()) ?? undefined);
  expect(keypad.y).toBeGreaterThanOrEqual(grid.y + grid.height);

  const keys = await boxes(page, '.keypad button');
  for (const [i, a] of keys.entries()) {
    for (const b of keys.slice(i + 1)) {
      const apart =
        a.x + a.width <= b.x + 0.5 ||
        b.x + b.width <= a.x + 0.5 ||
        a.y + a.height <= b.y + 0.5 ||
        b.y + b.height <= a.y + 0.5;
      expect(apart).toBe(true);
    }
  }

  const fit = await page.evaluate(() =>
    [...document.querySelectorAll('[role="gridcell"]')].map((el) => {
      const digit = el.querySelector('.cell-digit') as HTMLElement;
      const c = el.getBoundingClientRect();
      const d = digit.getBoundingClientRect();
      return {
        cell: el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight,
        // Tolerância de 2 px só no dígito: com line-height = font-size, o ascent/descent da fonte
        // faz scrollHeight passar clientHeight em ~1 px sem cortar o glifo (a célula não esconde overflow).
        digit:
          digit.scrollWidth <= digit.clientWidth + 2 &&
          digit.scrollHeight <= digit.clientHeight + 2,
        inside:
          d.left >= c.left - 0.5 &&
          d.right <= c.right + 0.5 &&
          d.top >= c.top - 0.5 &&
          d.bottom <= c.bottom + 0.5,
      };
    }),
  );
  expect(fit.filter((f) => !f.cell || !f.digit || !f.inside)).toEqual([]);
}

test.describe('a11y: axe nos três estados', () => {
  test('CA-005-35: sem violação séria ou crítica no estado inicial', async ({ page }) => {
    await page.goto('/');
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('CA-005-35: sem violação séria ou crítica com conflito', async ({ page }) => {
    await page.goto('/');
    await createConflict(page);
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('CA-005-35: sem violação séria ou crítica na vitória', async ({ page }) => {
    await page.goto('/');
    await solveByKeyboard(page);
    await expect(page.locator('.banner')).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('CA-005-39: a regra color-contrast do axe está ativa e sem violação nos três estados', async ({
    page,
  }) => {
    await page.goto('/');
    const states: [string, () => Promise<void>][] = [
      ['inicial', async () => {}],
      ['conflito', () => createConflict(page)],
      [
        'vitória',
        async () => {
          await page.reload();
          await solveByKeyboard(page);
        },
      ],
    ];
    for (const [name, setup] of states) {
      await setup();
      const results = await new (await import('@axe-core/playwright')).default({ page })
        .withRules(['color-contrast'])
        .analyze();
      const checked = results.passes.length + results.violations.length + results.incomplete.length;
      expect(checked, `color-contrast avaliada no estado ${name}`).toBeGreaterThan(0);
      expect(results.violations, `estado ${name}`).toEqual([]);
      await page.reload();
    }
  });
});

test.describe('a11y: movimento reduzido', () => {
  test('CA-005-33: com movimento reduzido, a transição computada é nula na vitória', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await solveByKeyboard(page);
    await expect(page.locator('.banner')).toBeVisible();
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll('*')].map((el) => getComputedStyle(el).transitionDuration),
    );
    const nonZero = durations.filter((d) => d.split(',').some((v) => parseFloat(v) > 0));
    expect(nonZero).toEqual([]);
  });
});

test.describe('a11y: geometria', () => {
  test('CA-005-28: botões do teclado têm ao menos 44×44 px em qualquer largura', async ({
    page,
  }) => {
    for (const width of [320, 360, 450]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const keys = await boxes(page, '.keypad button');
      expect(keys).toHaveLength(10);
      for (const box of keys) {
        expect(box.width, `largura ${width}`).toBeGreaterThanOrEqual(MIN_BUTTON);
        expect(box.height, `largura ${width}`).toBeGreaterThanOrEqual(MIN_BUTTON);
      }
    }
  });

  test('CA-005-28: células têm ao menos 44×44 px com 450 px de largura', async ({ page }) => {
    await page.setViewportSize({ width: 450, height: 900 });
    await page.goto('/');
    for (const box of await boxes(page, '[role="gridcell"]')) {
      expect(box.width).toBeGreaterThanOrEqual(MIN_BUTTON);
      expect(box.height).toBeGreaterThanOrEqual(MIN_BUTTON);
    }
  });

  const TEXT_200 = (): void => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.setProperty('font-size', '200%');
    });
  };

  async function open320(page: Page, text200: boolean): Promise<void> {
    if (text200) await page.addInitScript(TEXT_200);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    if (text200) {
      const html = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      );
      expect(html).toBe(32);
    }
  }

  test('CA-005-34: sem rolagem horizontal em 320 px CSS (equivale a 640 px a 200% de zoom)', async ({
    page,
  }) => {
    await open320(page, false);
    await expectNoHorizontalScroll(page);
  });

  test('CA-005-34: sem rolagem horizontal com texto a 200% em 320 px CSS', async ({ page }) => {
    await open320(page, true);
    await expectNoHorizontalScroll(page);
  });

  test('CA-005-34: em 320 px CSS as nove células cabem lado a lado, teclado abaixo e dígito inteiro', async ({
    page,
  }) => {
    await open320(page, false);
    await expectNarrowLayoutOk(page);
  });

  test('CA-005-34: com texto a 200% em 320 px CSS a grade fica sem sobreposição, teclado abaixo e dígito inteiro', async ({
    page,
  }) => {
    await open320(page, true);
    await expectNarrowLayoutOk(page);
  });

  test('CA-005-34: com conflito marcado em 320 px o dígito segue inteiro na célula', async ({
    page,
  }) => {
    await open320(page, false);
    await createConflict(page);
    await expectNarrowLayoutOk(page);
  });
});
