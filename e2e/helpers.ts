import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function fillStage(page: Page, question: string, text: string, button: string) {
  await page.getByLabel(question).fill(text);
  await page.getByRole('button', { name: button }).click();
}

/** 새 PLAY를 ⑤ 단계 직전(④ 저장 완료)까지 작성한다. */
export async function writeThroughResponse(page: Page, problem: string, response = '대응 내용') {
  await page.goto('/plays/new');
  await fillStage(page, '무슨 일이 있었는가?', '상황 내용', '원인 찾아보기');
  await fillStage(page, '왜 이런 일이 생겼다고 생각하는가?', '원인 내용', '문제 정의하기');
  await fillStage(page, '무엇을 해결할 것인가?', problem, '대응 정하기');
  await fillStage(page, '무엇을 해볼 것인가?', response, '실행해보기');
  await expect(page.getByRole('heading', { name: '⑤ 실행' })).toBeVisible();
}

/** ⑤ 단계부터 끝까지 작성해 PLAY를 완료한다. */
export async function finishFromExecution(page: Page) {
  await page.getByLabel('실행함', { exact: true }).check();
  await page.getByRole('button', { name: '결과 확인하기' }).click();
  await page.getByLabel('해결되지 않음').check();
  await page.getByRole('group', { name: '스트레스' }).getByLabel('증가').check();
  await page.getByRole('group', { name: '통제할 수 있다는' }).getByLabel('감소').check();
  await page.getByRole('button', { name: '다음 행동 정하기' }).click();
  await page.getByLabel('아직 모르겠다').check();
  await page.getByRole('button', { name: 'PLAY 마치기' }).click();
  await expect(page).toHaveURL('/history');
}

export async function completePlay(page: Page, problem: string, response = '대응 내용') {
  await writeThroughResponse(page, problem, response);
  await finishFromExecution(page);
}

export function storedPlays(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('longrun:plays') ?? '[]'));
}
