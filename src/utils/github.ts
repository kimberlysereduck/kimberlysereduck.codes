import type { GitHubProfile, GitHubProfileError, GitHubRepo, GitHubSyncResponse } from '../types/portfolio';

const API = 'https://api.github.com';

function headers(token: string, accept = 'application/vnd.github+json'): Record<string, string> {
  return {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function profileError(username: string, status: number): GitHubProfileError {
  return {
    username,
    status,
    message: status === 404
      ? `GitHub user "@${username}" was not found.`
      : status === 403 || status === 429
        ? 'GitHub API rate limit or permission error. Try again shortly or check your token.'
        : `GitHub API returned status ${status} for "@${username}".`,
  };
}

export async function syncProfiles(usernames: string[], forceRefresh: boolean, token: string): Promise<GitHubSyncResponse> {
  if (!__PAGES__) {
    const params = new URLSearchParams({ usernames: usernames.join(',') });
    if (forceRefresh) params.set('refresh', 'true');
    const response = await fetch(`/api/github/profiles?${params}`, {
      headers: token ? { 'x-github-token': token } : {},
    });
    const payload = await response.json() as GitHubSyncResponse & { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Unable to sync GitHub repositories.');
    return payload;
  }

  const normalized = Array.from(new Set(usernames.map((name) => name.trim().replace(/^@/, '')).filter(Boolean))).slice(0, 6);
  const invalid = normalized.filter((name) => !/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(name));
  if (invalid.length) throw new Error(`Invalid GitHub username format: ${invalid.join(', ')}`);

  const results = await Promise.all(normalized.map(async (username) => {
    const options: RequestInit = { headers: headers(token), cache: forceRefresh ? 'no-cache' : 'default' };
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`${API}/users/${encodeURIComponent(username)}`, options),
      fetch(`${API}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&type=owner`, options),
    ]);
    if (!userResponse.ok) return { profile: null, repos: [], error: profileError(username, userResponse.status) };
    const profile = await userResponse.json() as GitHubProfile;
    if (!reposResponse.ok) return { profile, repos: [], error: profileError(username, reposResponse.status) };
    const rawRepos = await reposResponse.json() as Array<Omit<GitHubRepo, 'ownerLogin' | 'license'> & { license: { spdx_id: string | null } | null }>;
    const repos: GitHubRepo[] = rawRepos.map((repo) => ({
      ...repo,
      ownerLogin: profile.login,
      license: repo.license?.spdx_id || null,
    }));
    return { profile, repos, error: null };
  }));
  return {
    profiles: results.flatMap((result) => result.profile ? [result.profile] : []),
    repos: results.flatMap((result) => result.repos),
    errors: results.flatMap((result) => result.error ? [result.error] : []),
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchReadme(owner: string, repo: string, token: string): Promise<string> {
  if (!__PAGES__) {
    const response = await fetch(`/api/github/readme/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      headers: token ? { 'x-github-token': token } : {},
    });
    const data = await response.json() as { content?: string; error?: string };
    if (!response.ok) throw new Error(data.error || 'Unable to load README');
    return data.content || '';
  }

  const response = await fetch(`${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`, {
    headers: headers(token, 'application/vnd.github.raw+json'),
  });
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'No README found in this repository.' : `Unable to load README (${response.status}).`);
  }
  const text = await response.text();
  return text.length > 6000 ? `${text.slice(0, 6000)}\n\n... (README truncated for preview)` : text;
}
