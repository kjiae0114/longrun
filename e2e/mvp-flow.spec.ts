import { expect, test } from '@playwright/test';
import { fillStage, finishFromExecution, storedPlays } from './helpers';

/** MVP 판단 기준: 하나의 문제를 끝까지 정리하고, 다시 확인하고, 수정·삭제하고, 다음 판단에 참고한다. */
test('MVP 핵심 흐름', async ({ page }) => {
  // HOME → 새 PLAY → ①~⑦ → PLAY 마치기 → HISTORY
  await page.goto('/');
  await page.getByRole('link', { name: '새 PLAY 시작' }).click();
  await fillStage(page, '무슨 일이 있었는가?', '회의가 하루 종일 이어졌다', '원인 찾아보기');
  await fillStage(page, '왜 이런 일이 생겼다고 생각하는가?', '안건 없는 회의가 많다', '문제 정의하기');

  // 중간에 나갔다가 HOME에서 이어서 작성한다. 필수값이 비어 있는 ④부터 시작한다.
  await page.getByLabel('무엇을 해결할 것인가?').fill('회의 시간이 너무 길다');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();
  await page.reload();
  await page.getByRole('link', { name: '이어하기' }).click();
  await expect(page.getByRole('heading', { name: '④ 대응' })).toBeVisible();

  await fillStage(page, '무엇을 해볼 것인가?', '안건을 먼저 요청한다', '실행해보기');
  await finishFromExecution(page);
  await expect(page.locator('.card-title')).toHaveText(['회의 시간이 너무 길다']);

  // 다시 보기와 수정
  await page.getByRole('link', { name: '보기' }).click();
  await expect(page.getByText('안건 없는 회의가 많다')).toBeVisible();
  const [completed] = await storedPlays(page);
  await page.locator('.detail-section', { hasText: '④ 대응' }).getByRole('link').click();
  await page.getByLabel('무엇을 해볼 것인가?').fill('안건 없는 회의는 거절한다');
  await page.getByRole('button', { name: '실행해보기' }).click();
  await page.goto(`/history/${completed.id}`);
  await expect(page.getByText('안건 없는 회의는 거절한다')).toBeVisible();

  // 새 PLAY의 ④에서 과거 기록을 참고한다.
  await page.goto('/plays/new');
  await fillStage(page, '무슨 일이 있었는가?', '또 회의가 늘었다', '원인 찾아보기');
  await fillStage(page, '왜 이런 일이 생겼다고 생각하는가?', '일정이 겹쳤다', '문제 정의하기');
  await fillStage(page, '무엇을 해결할 것인가?', '회의 일정 조정', '대응 정하기');
  await page.getByText('과거 PLAY 참고').click();
  await page.getByLabel('과거 문제 검색').fill('회의');
  await page.getByRole('button', { name: '회의 시간이 너무 길다' }).click();
  await expect(page.locator('.reference').getByText('안건 없는 회의는 거절한다')).toBeVisible();
  await page.getByLabel('무엇을 해볼 것인가?').fill('일정을 몰아서 잡는다');
  await page.getByRole('button', { name: '실행해보기' }).click();
  await page.getByRole('button', { name: '저장하고 나가기' }).click();

  // 삭제 → 휴지통 → 복구 → 영구 삭제
  await page.goto(`/history/${completed.id}`);
  await page.getByRole('button', { name: '삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '휴지통으로 이동' }).click();
  await expect(page).toHaveURL('/history');
  await page.getByRole('contentinfo').getByRole('link', { name: '휴지통' }).click();
  await page.getByRole('button', { name: '복구', exact: true }).click();
  await expect(page.getByText('휴지통이 비어 있습니다.')).toBeVisible();

  const restored = (await storedPlays(page)).find((play: { id: string }) => play.id === completed.id);
  expect(restored.completedAt).toBe(completed.completedAt);

  await page.goto(`/history/${completed.id}`);
  await page.getByRole('button', { name: '삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '휴지통으로 이동' }).click();
  await expect(page).toHaveURL('/history');
  await page.goto('/trash');
  await page.getByRole('button', { name: '영구 삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '영구 삭제' }).click();
  await expect(page.getByText('휴지통이 비어 있습니다.')).toBeVisible();

  await page.reload();
  await expect(page.getByText('휴지통이 비어 있습니다.')).toBeVisible();
  const remaining = await storedPlays(page);
  expect(remaining.map((play: { problem: string }) => play.problem)).toEqual(['회의 일정 조정']);
});
