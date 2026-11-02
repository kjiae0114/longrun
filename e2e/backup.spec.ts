import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { completePlay, storedPlays, writeThroughResponse } from './helpers';

async function exportBackup(page: Page): Promise<string> {
  await page.goto('/backup');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '내보내기' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^longrun-backup-\d{4}-\d{2}-\d{2}\.json$/);
  return readFile(await file.path(), 'utf-8');
}

async function chooseFile(page: Page, text: string) {
  await page.goto('/backup');
  await page.getByLabel('백업 파일 선택').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
}

test('내보낸 파일을 가져오면 진행 중, 완료, 휴지통이 그대로 복원된다', async ({ page }) => {
  await completePlay(page, '완료 문제');
  await completePlay(page, '삭제할 문제');
  await page.locator('.card', { hasText: '삭제할 문제' }).getByRole('button', { name: '삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '휴지통으로 이동' }).click();
  await expect(page.locator('.card')).toHaveCount(1);
  await writeThroughResponse(page, '진행 문제');
  await page.getByRole('button', { name: '저장하고 나가기' }).click();
  await expect(page).toHaveURL('/');

  const before = await storedPlays(page);
  const backup = await exportBackup(page);
  expect(JSON.parse(backup).plays).toHaveLength(3);

  await page.evaluate(() => localStorage.clear());
  await chooseFile(page, backup);
  await page.getByRole('dialog').getByRole('button', { name: '가져오기' }).click();
  await expect(page.getByRole('status')).toHaveText('백업 데이터를 가져왔습니다.');
  expect(await storedPlays(page)).toEqual(before);

  await page.goto('/');
  await expect(page.locator('.card-title')).toHaveText(['진행 문제']);
  await page.goto('/history');
  await expect(page.locator('.card-title')).toHaveText(['완료 문제']);
  await page.goto('/trash');
  await expect(page.locator('.card-title')).toHaveText(['삭제할 문제']);
});

test('가져오기를 취소하면 기존 데이터를 유지한다', async ({ page }) => {
  await completePlay(page, '기존 문제');
  const before = await storedPlays(page);
  await chooseFile(page, JSON.stringify({ format: 'longrun', version: 1, plays: [] }));
  await page.getByRole('dialog').getByRole('button', { name: '취소' }).click();
  expect(await storedPlays(page)).toEqual(before);
});

for (const [name, text] of [
  ['JSON이 아닌 파일', 'not json'],
  ['다른 형식의 JSON', '{"hello":"world"}'],
  ['잘못된 PLAY가 있는 파일', '{"format":"longrun","version":1,"plays":[{"id":"a"}]}'],
]) {
  test(`${name}은 거부하고 기존 데이터를 유지한다`, async ({ page }) => {
    await completePlay(page, '기존 문제');
    const before = await storedPlays(page);
    await chooseFile(page, text);
    await page.getByRole('dialog').getByRole('button', { name: '가져오기' }).click();
    await expect(page.getByRole('alert')).toContainText('기존 데이터는 변경되지 않았습니다');
    expect(await storedPlays(page)).toEqual(before);
  });
}

test('손상된 데이터는 덮어쓰지 않고 안내하며 백업으로 복원할 수 있다', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('longrun:plays', '{broken'));
  await page.reload();
  await expect(page.getByRole('heading', { name: '저장된 데이터를 읽을 수 없습니다.' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('longrun:plays'))).toBe('{broken');

  await page.getByRole('link', { name: '데이터 백업으로 이동' }).click();
  await page.getByLabel('백업 파일 선택').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"longrun","version":1,"plays":[]}'),
  });
  await page.getByRole('dialog').getByRole('button', { name: '가져오기' }).click();
  await expect(page.getByRole('status')).toBeVisible();

  await page.getByRole('link', { name: 'HOME', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'HOME' })).toBeVisible();
});
