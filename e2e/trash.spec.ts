import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { completePlay, storedPlays, writeThroughResponse } from './helpers';

async function trashAllFrom(page: Page, path: string) {
  await page.goto(path);
  const remove = page.getByRole('button', { name: '삭제', exact: true });
  while ((await remove.count()) > 0) {
    await remove.first().click();
    await page.getByRole('dialog').getByRole('button', { name: '휴지통으로 이동' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
}

/** 진행 중 '진행 문제'와 완료 '완료 문제'를 모두 휴지통으로 옮긴다. */
async function seedTrash(page: Page) {
  await completePlay(page, '완료 문제');
  await writeThroughResponse(page, '진행 문제');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();
  await trashAllFrom(page, '/history');
  await trashAllFrom(page, '/');
  await page.goto('/trash');
}

const card = (page: Page, title: string) => page.locator('.card', { hasText: title });

test('빈 휴지통 문구를 보여준다', async ({ page }) => {
  await page.goto('/trash');
  await expect(page.getByText('휴지통이 비어 있습니다.')).toBeVisible();
  await expect(page.getByRole('button', { name: '휴지통 비우기' })).toHaveCount(0);
});

test('삭제일 최신순으로 표시하고 일반 목록에는 노출하지 않는다', async ({ page }) => {
  await seedTrash(page);
  await expect(page.locator('.card-title')).toHaveText(['진행 문제', '완료 문제']);
  await expect(card(page, '진행 문제')).toContainText('진행 중 · ⑤ 실행');
  await expect(card(page, '완료 문제')).toContainText('완료 · 해결되지 않음');

  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(0);
  await page.goto('/history');
  await expect(page.locator('.card')).toHaveCount(0);
});

test('상세는 읽기 전용이고 수정 경로로 들어가도 휴지통으로 돌아온다', async ({ page }) => {
  await seedTrash(page);
  await card(page, '완료 문제').getByRole('link', { name: '보기' }).click();
  await expect(page.getByText('원인 내용')).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '수정' })).toHaveCount(0);

  const id = page.url().split('/').pop();
  await page.goto(`/history/${id}/edit/2`);
  await expect(page).toHaveURL(`/trash/${id}`);
  await page.goto(`/plays/${id}/stages/2`);
  await expect(page).toHaveURL(`/trash/${id}`);
});

test('복구는 확인 없이 삭제 전 상태로 되돌린다', async ({ page }) => {
  await seedTrash(page);
  const before = await storedPlays(page);

  await card(page, '완료 문제').getByRole('button', { name: '복구' }).click();
  await card(page, '진행 문제').getByRole('button', { name: '복구' }).click();
  await expect(page.getByText('휴지통이 비어 있습니다.')).toBeVisible();

  await page.goto('/history');
  await expect(page.locator('.card-title')).toHaveText(['완료 문제']);
  await page.goto('/');
  await expect(page.locator('.card-title')).toHaveText(['진행 문제']);

  const after = await storedPlays(page);
  const completed = (plays: { problem: string; completedAt: string }[]) =>
    plays.find((play) => play.problem === '완료 문제')?.completedAt;
  expect(completed(after)).toBe(completed(before));
});

test('전체 복구는 모두 되돌린다', async ({ page }) => {
  await seedTrash(page);
  await page.getByRole('button', { name: '전체 복구' }).click();
  await expect(page.getByText('휴지통이 비어 있습니다.')).toBeVisible();
  const plays = await storedPlays(page);
  expect(plays.map((play: { deletedAt: string | null }) => play.deletedAt)).toEqual([null, null]);
});

test('영구 삭제는 확인 후 실제 데이터를 지우고 다시 나타나지 않는다', async ({ page }) => {
  await seedTrash(page);
  await card(page, '완료 문제').getByRole('button', { name: '영구 삭제' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('영구 삭제하면 복구할 수 없습니다.');
  await dialog.getByRole('button', { name: '취소' }).click();
  expect(await storedPlays(page)).toHaveLength(2);

  await card(page, '완료 문제').getByRole('button', { name: '영구 삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '영구 삭제' }).click();
  await expect(page.locator('.card-title')).toHaveText(['진행 문제']);

  await page.reload();
  await expect(page.locator('.card-title')).toHaveText(['진행 문제']);
  expect(await storedPlays(page)).toHaveLength(1);
});

test('휴지통 비우기는 확인 후 휴지통의 PLAY만 지운다', async ({ page }) => {
  await seedTrash(page);
  await writeThroughResponse(page, '남아야 하는 문제');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();

  await page.goto('/trash');
  await page.getByRole('button', { name: '휴지통 비우기' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '휴지통 비우기' }).click();
  await expect(page.getByText('휴지통이 비어 있습니다.')).toBeVisible();

  const plays = await storedPlays(page);
  expect(plays.map((play: { problem: string }) => play.problem)).toEqual(['남아야 하는 문제']);
});

test('상세에서 복구하거나 영구 삭제할 수 있다', async ({ page }) => {
  await seedTrash(page);
  await card(page, '완료 문제').getByRole('link', { name: '보기' }).click();
  await page.getByRole('button', { name: '복구' }).click();
  await expect(page).toHaveURL('/trash');
  await expect(page.locator('.card-title')).toHaveText(['진행 문제']);

  await card(page, '진행 문제').getByRole('link', { name: '보기' }).click();
  await page.getByRole('button', { name: '영구 삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '영구 삭제' }).click();
  await expect(page).toHaveURL('/trash');
  expect(await storedPlays(page)).toHaveLength(1);
});
