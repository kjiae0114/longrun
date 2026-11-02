import { expect, test } from '@playwright/test';
import { completePlay, fillStage, storedPlays, writeThroughResponse } from './helpers';

test('①~⑦을 작성하고 완료하면 해결되지 않아도 완료된다', async ({ page }) => {
  await completePlay(page, '문제 내용');
  const [play] = await storedPlays(page);
  expect(play.completedAt).not.toBeNull();
  expect(play.result.state).toBe('UNRESOLVED');
  expect(play.problem).toBe('문제 내용');
});

test('단계마다 무엇을 적으면 되는지 안내한다', async ({ page }) => {
  await page.goto('/plays/new');
  await expect(page.getByText('실제로 있었던 일을 적어 보세요')).toBeVisible();
  await page.getByLabel('무슨 일이 있었는가?').fill('상황');
  await page.getByRole('button', { name: '원인 찾아보기' }).click();
  await expect(page.getByText('모르겠다고 적어도 괜찮습니다')).toBeVisible();
});

test('새 PLAY 화면에 들어가기만 하면 생성되지 않는다', async ({ page }) => {
  await page.goto('/plays/new');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();
  await expect(page).toHaveURL('/');
  expect(await storedPlays(page)).toEqual([]);
});

test('상황이 비어 있으면 다음 단계로 이동하지 않는다', async ({ page }) => {
  await page.goto('/plays/new');
  await page.getByRole('button', { name: '원인 찾아보기' }).click();
  await expect(page.getByRole('alert')).toHaveText('상황을 입력해 주세요.');
  await expect(page.getByRole('heading', { name: '① 상황' })).toBeVisible();
  expect(await storedPlays(page)).toEqual([]);
});

test('저장하고 나가기 후 새로고침해도 이어서 작성할 수 있다', async ({ page }) => {
  await page.goto('/plays/new');
  await page.getByLabel('무슨 일이 있었는가?').fill('상황 내용');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();
  await expect(page).toHaveURL('/');

  const [play] = await storedPlays(page);
  await page.reload();
  await page.goto(`/plays/${play.id}/stages/7`);
  await expect(page.getByRole('heading', { name: '② 원인' })).toBeVisible();
});

test('이전 단계로 이동해도 입력이 저장되고 단계 표시는 이동 수단이 아니다', async ({ page }) => {
  await page.goto('/plays/new');
  await fillStage(page, '무슨 일이 있었는가?', '상황 내용', '원인 찾아보기');
  await page.getByLabel('왜 이런 일이 생겼다고 생각하는가?').fill('아직 쓰는 중');
  await page.getByRole('button', { name: '이전 단계로' }).click();
  await expect(page.getByRole('heading', { name: '① 상황' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'PLAY 단계' }).getByRole('link')).toHaveCount(0);
  const [play] = await storedPlays(page);
  expect(play.cause).toBe('아직 쓰는 중');
});

test('저장하지 않고 메뉴로 이동하면 확인을 받고, 취소하면 내용이 남는다', async ({ page }) => {
  await page.goto('/plays/new');
  await page.getByLabel('무슨 일이 있었는가?').fill('상황 내용');
  await page.getByRole('link', { name: 'HISTORY' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('작성한 내용을 저장하고 나갈까요?');
  await expect(dialog.getByRole('button')).toHaveText(['저장하고 나가기', '취소']);

  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(page.getByLabel('무슨 일이 있었는가?')).toHaveValue('상황 내용');
  expect(await storedPlays(page)).toEqual([]);

  await page.getByRole('link', { name: 'HISTORY' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '저장하고 나가기' }).click();
  await expect(page).toHaveURL('/history');
  expect(await storedPlays(page)).toHaveLength(1);
});

test('저장에 실패하면 이동하지 않고 입력을 유지한다', async ({ page }) => {
  await page.goto('/plays/new');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };
  });
  await page.getByLabel('무슨 일이 있었는가?').fill('상황 내용');
  await page.getByRole('button', { name: '원인 찾아보기' }).click();
  await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
  await expect(page.getByLabel('무슨 일이 있었는가?')).toHaveValue('상황 내용');
});

test('다음 행동을 정한다를 고르면 내용 없이 완료할 수 없다', async ({ page }) => {
  await writeThroughResponse(page, '문제 내용');
  await page.getByLabel('일부 실행함').check();
  await page.getByRole('button', { name: '결과 확인하기' }).click();
  await page.getByRole('button', { name: '다음 행동 정하기' }).click();
  await expect(page.getByRole('alert')).toContainText('결과와 스트레스 변화');

  await page.getByLabel('판단하기 어려움').check();
  await page.getByRole('group', { name: '스트레스' }).getByLabel('변화 없음').check();
  await page.getByRole('group', { name: '통제할 수 있다는' }).getByLabel('변화 없음').check();
  await page.getByRole('button', { name: '다음 행동 정하기' }).click();

  await page.getByLabel('다음 행동을 정한다').check();
  await page.getByRole('button', { name: 'PLAY 마치기' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: '⑦ 다음 행동' })).toBeVisible();

  await page.getByLabel('다음에 할 행동').fill('팀장과 이야기하기');
  await page.getByRole('button', { name: 'PLAY 마치기' }).click();
  await expect(page).toHaveURL('/history');
});

test('스크롤한 긴 단계에서 다음 단계로 가면 화면 맨 위부터 보여준다', async ({ page }) => {
  await writeThroughResponse(page, '문제');
  await page.getByLabel('실행함', { exact: true }).check();
  await page.getByRole('button', { name: '결과 확인하기' }).click();
  await page.getByLabel('해결됨', { exact: true }).check();
  await page.getByRole('group', { name: '스트레스' }).getByLabel('증가').check();
  await page.getByRole('group', { name: '통제할 수 있다는' }).getByLabel('감소').check();
  await page.getByRole('button', { name: '다음 행동 정하기' }).click();
  await expect(page.getByRole('heading', { name: '⑦ 다음 행동' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('이전 판단을 펼쳐서 볼 수 있고 입력한 스크립트는 실행되지 않는다', async ({ page }) => {
  const script = '<img src=x onerror="window.__xss=1">';
  await writeThroughResponse(page, script);
  await page.getByText('이전 판단 보기').click();
  await page.locator('.previous details summary', { hasText: '③ 문제' }).click();
  await expect(page.locator('.previous').getByText(script)).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});
