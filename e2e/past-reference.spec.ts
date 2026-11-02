import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { completePlay, fillStage, storedPlays, writeThroughResponse } from './helpers';

async function openResponseStage(page: Page) {
  await page.goto('/plays/new');
  await fillStage(page, '무슨 일이 있었는가?', '상황', '원인 찾아보기');
  await fillStage(page, '왜 이런 일이 생겼다고 생각하는가?', '원인', '문제 정의하기');
  await fillStage(page, '무엇을 해결할 것인가?', '현재 문제', '대응 정하기');
  await expect(page.getByRole('heading', { name: '④ 대응' })).toBeVisible();
}

const toggle = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('기본으로 접혀 있고 검색 전에는 과거 PLAY를 보여주지 않는다', async ({ page }) => {
  await completePlay(page, '회의 문제');
  await openResponseStage(page);

  await expect(page.getByLabel('과거 문제 검색')).toBeHidden();
  await page.getByText('과거 PLAY 참고').click();
  await expect(page.getByLabel('과거 문제 검색')).toBeVisible();
  await expect(page.locator('.reference .card')).toHaveCount(0);
});

test('④ 대응 단계에만 있다', async ({ page }) => {
  await page.goto('/plays/new');
  await expect(page.getByText('과거 PLAY 참고')).toHaveCount(0);
  await writeThroughResponse(page, '문제');
  await expect(page.getByText('과거 PLAY 참고')).toHaveCount(0);
});

test('완료 PLAY의 문제만 검색하고 대응을 자동으로 복사하지 않는다', async ({ page }) => {
  await completePlay(page, '회의 문제', '과거의 대응');
  await writeThroughResponse(page, '회의 진행 중 문제');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();

  await openResponseStage(page);
  await page.getByText('과거 PLAY 참고').click();
  await page.getByLabel('과거 문제 검색').fill('회의');
  await expect(page.locator('.reference .card')).toHaveCount(1);

  await toggle(page, '회의 문제').click();
  await expect(page.locator('.reference').getByText('과거의 대응')).toBeVisible();
  await expect(page.locator('.reference').getByText('해결되지 않음')).toBeVisible();
  await expect(page.locator('.reference').getByText('아직 모르겠다')).toBeVisible();
  await expect(page.getByLabel('무엇을 해볼 것인가?')).toHaveValue('');

  await page.getByLabel('과거 문제 검색').fill('없는 단어');
  await expect(page.locator('.reference').getByText('검색 결과가 없습니다.')).toBeVisible();
});

test('최대 3개까지 펼치고 4번째를 열면 가장 오래 열린 항목을 접는다', async ({ page }) => {
  const names = ['회의1', '회의2', '회의3', '회의4'];
  for (const name of names) await completePlay(page, name);

  await openResponseStage(page);
  await page.getByText('과거 PLAY 참고').click();
  await page.getByLabel('과거 문제 검색').fill('회의');

  for (const name of ['회의1', '회의2', '회의3']) await toggle(page, name).click();
  const expanded = page.locator('.reference [aria-expanded="true"]');
  await expect(expanded).toHaveCount(3);

  await toggle(page, '회의4').click();
  await expect(expanded).toHaveCount(3);
  await expect(toggle(page, '회의1')).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle(page, '회의4')).toHaveAttribute('aria-expanded', 'true');

  await toggle(page, '회의2').click();
  await expect(expanded).toHaveCount(2);
});

test('완료 PLAY를 수정할 때 자기 자신은 결과에 나오지 않는다', async ({ page }) => {
  await completePlay(page, '회의 문제');
  const [play] = await storedPlays(page);
  await page.goto(`/history/${play.id}/edit/4`);
  await page.getByText('과거 PLAY 참고').click();
  await page.getByLabel('과거 문제 검색').fill('회의');
  await expect(page.locator('.reference .card')).toHaveCount(0);
});
