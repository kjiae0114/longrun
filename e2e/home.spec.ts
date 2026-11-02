import { expect, test } from '@playwright/test';
import { storedPlays, writeThroughResponse } from './helpers';

test('진행 중 PLAY가 없으면 새 PLAY 시작만 제공한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: '새 PLAY 시작' })).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(0);
});

test('최대 3개를 최신 생성순으로 보여주고 전체 목록으로 이동할 수 있다', async ({ page }) => {
  for (const problem of ['문제1', '문제2', '문제3', '문제4']) {
    await writeThroughResponse(page, problem);
    await page.getByRole('button', { name: '저장하고 나가기' }).click();
  }
  await expect(page).toHaveURL('/');
  await expect(page.locator('.card-title')).toHaveText(['문제4', '문제3', '문제2']);

  await page.getByRole('link', { name: '전체 진행 중 PLAY 보기' }).click();
  await expect(page.locator('.card-title')).toHaveText(['문제4', '문제3', '문제2', '문제1']);

  await page.goto('/plays/new');
  await expect(page.getByRole('heading', { name: '① 상황' })).toBeVisible();
});

test('문제가 없는 PLAY는 진행 중과 상황 일부를 보여주고 이어서 작성한다', async ({ page }) => {
  await page.goto('/plays/new');
  await page.getByLabel('무슨 일이 있었는가?').fill('상황 원문');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();

  const card = page.locator('.card');
  await expect(card.locator('.card-title')).toHaveText('진행 중');
  await expect(card).toContainText('② 원인');
  await expect(card).toContainText('상황 원문');

  await card.getByRole('link', { name: '이어하기' }).click();
  await expect(page.getByRole('heading', { name: '② 원인' })).toBeVisible();
});

test('삭제는 확인을 거쳐 휴지통으로 이동한다', async ({ page }) => {
  await writeThroughResponse(page, '문제');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();

  await page.getByRole('button', { name: '삭제' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('이 PLAY를 휴지통으로 이동할까요?');
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(page.locator('.card')).toHaveCount(1);

  await page.getByRole('button', { name: '삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '휴지통으로 이동' }).click();
  await expect(page.locator('.card')).toHaveCount(0);
  const [play] = await storedPlays(page);
  expect(play.deletedAt).not.toBeNull();
});
