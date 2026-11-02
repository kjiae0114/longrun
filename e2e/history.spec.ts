import { expect, test } from '@playwright/test';
import { completePlay, storedPlays, writeThroughResponse } from './helpers';

test('완료 PLAY가 없으면 새 PLAY 시작을 제공한다', async ({ page }) => {
  await writeThroughResponse(page, '진행 중인 문제');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();
  await page.goto('/history');
  await expect(page.getByRole('link', { name: '새 PLAY 시작' })).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(0);
});

test('완료 PLAY만 완료일 최신순으로 표시하고 문제로 검색한다', async ({ page }) => {
  await completePlay(page, '회의가 많다');
  await completePlay(page, '야근이 많다');
  await writeThroughResponse(page, '회의 준비 중');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();

  await page.goto('/history');
  await expect(page.locator('.card-title')).toHaveText(['야근이 많다', '회의가 많다']);

  await page.getByLabel('문제 검색').fill('회의');
  await expect(page.locator('.card-title')).toHaveText(['회의가 많다']);

  await page.getByLabel('문제 검색').fill('없는 단어');
  await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
});

test('상세에서 ①~⑦ 전체 내용을 볼 수 있다', async ({ page }) => {
  await completePlay(page, '문제 내용');
  await page.getByRole('link', { name: '보기' }).click();

  for (const text of ['상황 내용', '원인 내용', '대응 내용', '실행함', '해결되지 않음', '아직 모르겠다']) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(7);
});

test('수정해도 완료 상태와 최초 완료 시각을 유지하고 저장 후 상세로 돌아간다', async ({ page }) => {
  await completePlay(page, '문제 내용');
  const [before] = await storedPlays(page);

  await page.goto(`/history/${before.id}`);
  await page.locator('.detail-section', { hasText: '② 원인' }).getByRole('link').click();
  await page.getByLabel('왜 이런 일이 생겼다고 생각하는가?').fill('새 원인');
  await page.getByRole('button', { name: '문제 정의하기' }).click();
  await expect(page).toHaveURL(`/history/${before.id}/edit/3`);

  await page.goto(`/history/${before.id}/edit/7`);
  await page.getByRole('button', { name: '수정 저장하기' }).click();
  await expect(page).toHaveURL(`/history/${before.id}`);

  const plays = await storedPlays(page);
  expect(plays).toHaveLength(1);
  expect(plays[0]).toEqual({ ...before, cause: '새 원인' });
});

test('완료 PLAY의 필수값은 비울 수 없다', async ({ page }) => {
  await completePlay(page, '문제 내용');
  const [play] = await storedPlays(page);

  await page.goto(`/history/${play.id}/edit/2`);
  await page.getByLabel('왜 이런 일이 생겼다고 생각하는가?').fill('');
  await page.getByRole('button', { name: '이전 단계로' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(`/history/${play.id}/edit/2`);
});

test('삭제하면 HISTORY에서 사라진다', async ({ page }) => {
  await completePlay(page, '문제 내용');
  await page.getByRole('link', { name: '보기' }).click();
  await page.getByRole('button', { name: '삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '휴지통으로 이동' }).click();
  await expect(page).toHaveURL('/history');
  await expect(page.locator('.card')).toHaveCount(0);
});
