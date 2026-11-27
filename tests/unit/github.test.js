import { fetchReadme, syncProfiles } from '../../src/utils/github';

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.__PAGES__ = true;
});

test('maps GitHub profiles and repositories for a static Pages build', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ login: 'example' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, name: 'project', license: { spdx_id: 'MIT' } }] });
  const result = await syncProfiles(['@example'], true, 'read-token');
  expect(result.profiles[0].login).toBe('example');
  expect(result.repos[0]).toMatchObject({ ownerLogin: 'example', license: 'MIT' });
  expect(fetch.mock.calls[0][1]).toMatchObject({
    cache: 'no-cache',
    headers: { Authorization: 'Bearer read-token' },
  });
});

test('reports repository fetch failures rather than silently showing an empty list', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ login: 'example' }) })
    .mockResolvedValueOnce({ ok: false, status: 403 });
  const result = await syncProfiles(['example'], false, '');
  expect(result.profiles).toHaveLength(1);
  expect(result.errors[0]).toMatchObject({ username: 'example', status: 403 });
});

test('rejects invalid usernames before contacting GitHub', async () => {
  global.fetch = jest.fn();
  await expect(syncProfiles(['not valid'], false, '')).rejects.toThrow('Invalid GitHub username');
  expect(fetch).not.toHaveBeenCalled();
});

test('loads and truncates a raw README and reports missing READMEs', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, text: async () => 'a'.repeat(6001) })
    .mockResolvedValueOnce({ ok: false, status: 404 });
  expect(await fetchReadme('example', 'project', '')).toContain('README truncated');
  await expect(fetchReadme('example', 'missing', '')).rejects.toThrow('No README found');
});

test('uses the existing backend API outside Pages builds', async () => {
  globalThis.__PAGES__ = false;
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ profiles: [], repos: [], errors: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'Backend README' }) });
  await syncProfiles(['example'], true, 'token');
  expect(fetch).toHaveBeenCalledWith('/api/github/profiles?usernames=example&refresh=true', {
    headers: { 'x-github-token': 'token' },
  });
  await expect(fetchReadme('example', 'project', 'token')).resolves.toBe('Backend README');
  expect(fetch).toHaveBeenLastCalledWith('/api/github/readme/example/project', {
    headers: { 'x-github-token': 'token' },
  });
});
