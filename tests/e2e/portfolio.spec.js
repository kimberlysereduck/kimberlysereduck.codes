import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/readme')) {
      await route.fulfill({ contentType: 'text/plain', body: '# Example project' });
    } else if (url.pathname.endsWith('/repos')) {
      const username = url.pathname.split('/')[2];
      await route.fulfill({ json: username === 'kimberlysereduck' ? [{
        id: 1, name: 'example-project', full_name: `${username}/example-project`,
        html_url: `https://github.com/${username}/example-project`, homepage: null,
        description: 'Example project', language: 'TypeScript', stargazers_count: 2,
        forks_count: 0, fork: false, archived: false, topics: [],
        updated_at: '2026-01-01T00:00:00Z', pushed_at: '2026-01-01T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z', default_branch: 'main', license: null,
      }] : [] });
    } else {
      const username = url.pathname.split('/')[2];
      await route.fulfill({ json: { login: username, avatar_url: '', html_url: `https://github.com/${username}`, public_repos: 1 } });
    }
  });
});

test('loads the project site, resume, repositories, and README preview', async ({ page }) => {
  const backendRequests = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) backendRequests.push(request.url());
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Kimberly Sereduck' })).toBeVisible();
  const resume = page.getByRole('link', { name: 'Resume PDF' });
  await expect(resume).toHaveAttribute('href', /\/portfolio\/assets\/.*\.pdf$/);
  const pdf = await page.request.get(await resume.getAttribute('href'));
  expect(pdf.ok()).toBe(true);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  await page.getByRole('button', { name: /example-project/ }).click();
  await expect(page.getByRole('dialog')).toContainText('# Example project');
  await page.getByRole('button', { name: 'Close repository details' }).click();
  expect(backendRequests).toEqual([]);
});

test('saves edits locally and keeps them after reloading', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Edit Portfolio' }).click();
  await page.getByRole('dialog').locator('input[type="text"]').first().fill('Test Person');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Test Person' })).toBeVisible();
});

test('reports browser storage failures instead of claiming changes were saved', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.getByRole('button', { name: 'Edit Portfolio' }).click();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Unable to save changes');
});

test('has no automatically detectable WCAG 2 A or AA violations on the portfolio', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: /example-project/ })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
