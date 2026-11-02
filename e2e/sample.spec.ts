import { expect, test } from '@playwright/test';

test('개발 서버에서 샘플 데이터를 불러올 수 있다', async ({ page }) => {
  await page.goto('/backup');
  await page.getByRole('button', { name: '샘플 데이터 불러오기' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '가져오기' }).click();
  await expect(page.getByRole('status')).toHaveText('백업 데이터를 가져왔습니다.');

  await page.goto('/');
  await expect(page.locator('.card-title')).toHaveText(['회의 일정이 겹쳐서 집중할 시간이 없다']);
  await page.getByRole('link', { name: '이어하기' }).click();
  await expect(page.getByRole('heading', { name: '④ 대응' })).toBeVisible();

  await page.getByText('과거 PLAY 참고').click();
  await page.getByLabel('과거 문제 검색').fill('회의');
  await page.getByRole('button', { name: '회의 때문에 내 업무 시간이 확보되지 않는다' }).click();
  await expect(page.locator('.reference')).toContainText('거절보다 질문이 말하기 쉽다');

  await page.goto('/history');
  await expect(page.locator('.card-title')).toHaveText([
    '내 결과물이 어떻게 평가되는지 알 수 없다',
    '회의 때문에 내 업무 시간이 확보되지 않는다',
  ]);
});
