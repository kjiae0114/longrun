import { expect, test } from '@playwright/test';

test('메인 메뉴와 휴지통으로 이동할 수 있다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'HOME' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: '메인' });
  await expect(nav.getByRole('link')).toHaveText(['HOME', 'HISTORY']);

  await nav.getByRole('link', { name: 'HISTORY' }).click();
  await expect(page.getByRole('heading', { name: 'HISTORY' })).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: '휴지통' }).click();
  await expect(page.getByRole('heading', { name: '휴지통' })).toBeVisible();
});

test('직접 접속한 경로를 새로고침해도 같은 화면을 유지한다', async ({ page }) => {
  await page.goto('/history');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'HISTORY' })).toBeVisible();
});

test('없는 경로에서 HOME으로 돌아갈 수 있다', async ({ page }) => {
  await page.goto('/does-not-exist');
  await page.getByRole('link', { name: 'HOME으로 이동' }).click();
  await expect(page.getByRole('heading', { name: 'HOME' })).toBeVisible();
});
