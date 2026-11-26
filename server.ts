import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json');

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const githubCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
const GITHUB_REPO_RE = /^[a-zA-Z0-9._-]+$/;

function getGitHubHeaders(optionalToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Professional-Portfolio-App',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = optionalToken || process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchGitHubAccountData(
  username: string,
  forceRefresh: boolean,
  optionalToken?: string
) {
  const cacheKey = `account:${username.toLowerCase()}:${optionalToken ? 'auth' : 'pub'}`;
  if (!forceRefresh) {
    const cached = githubCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as {
        profile: Record<string, unknown> | null;
        repos: Record<string, unknown>[];
        error?: { username: string; message: string; status: number };
      };
    }
  }

  const headers = getGitHubHeaders(optionalToken);

  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
    fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&type=owner`,
      { headers }
    ),
  ]);

  if (!userRes.ok) {
    const message =
      userRes.status === 404
        ? `GitHub user "@${username}" was not found.`
        : userRes.status === 403
          ? 'GitHub API rate limit reached. Try again shortly or add a personal access token.'
          : `GitHub API returned status ${userRes.status} for "@${username}".`;
    return {
      profile: null,
      repos: [],
      error: { username, message, status: userRes.status },
    };
  }

  const rawUser = (await userRes.json()) as Record<string, unknown>;
  const rawRepos = reposRes.ok
    ? ((await reposRes.json()) as Record<string, unknown>[])
    : [];

  const profile = {
    login: String(rawUser.login || username),
    name: rawUser.name ? String(rawUser.name) : null,
    avatar_url: String(rawUser.avatar_url || ''),
    html_url: String(rawUser.html_url || `https://github.com/${username}`),
    bio: rawUser.bio ? String(rawUser.bio) : null,
    company: rawUser.company ? String(rawUser.company) : null,
    location: rawUser.location ? String(rawUser.location) : null,
    blog: rawUser.blog ? String(rawUser.blog) : null,
    public_repos: Number(rawUser.public_repos || 0),
    followers: Number(rawUser.followers || 0),
  };

  const repos = rawRepos.map((repo) => {
    const licenseObj = repo.license as Record<string, unknown> | null | undefined;
    return {
      id: Number(repo.id),
      name: String(repo.name || ''),
      full_name: String(repo.full_name || ''),
      ownerLogin: profile.login,
      html_url: String(repo.html_url || ''),
      homepage: repo.homepage ? String(repo.homepage) : null,
      description: repo.description ? String(repo.description) : null,
      language: repo.language ? String(repo.language) : null,
      stargazers_count: Number(repo.stargazers_count || 0),
      forks_count: Number(repo.forks_count || 0),
      fork: Boolean(repo.fork),
      archived: Boolean(repo.archived),
      topics: Array.isArray(repo.topics) ? repo.topics.map(String) : [],
      updated_at: String(repo.updated_at || ''),
      pushed_at: String(repo.pushed_at || ''),
      created_at: String(repo.created_at || ''),
      default_branch: String(repo.default_branch || 'main'),
      license: licenseObj && licenseObj.spdx_id ? String(licenseObj.spdx_id) : null,
    };
  });

  const payload = { profile, repos };
  githubCache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
  return payload;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/portfolio', (_req, res) => {
    try {
      if (fs.existsSync(PORTFOLIO_FILE)) {
        const raw = fs.readFileSync(PORTFOLIO_FILE, 'utf-8');
        res.json(JSON.parse(raw));
        return;
      }
      res.json(null);
    } catch (error) {
      console.error('Failed to read portfolio file:', error);
      res.status(500).json({ error: 'Unable to read saved portfolio data.' });
    }
  });

  app.put('/api/portfolio', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object' || typeof payload.fullName !== 'string') {
        res.status(400).json({ error: 'Invalid portfolio payload.' });
        return;
      }

      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const toSave = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
      res.json(toSave);
    } catch (error) {
      console.error('Failed to save portfolio file:', error);
      res.status(500).json({ error: 'Unable to save portfolio data.' });
    }
  });

  app.get('/api/github/profiles', async (req, res) => {
    try {
      const rawUsernames = String(req.query.usernames || '');
      const forceRefresh = req.query.refresh === 'true';
      const optionalToken = req.header('x-github-token') || undefined;

      const usernames = Array.from(
        new Set(
          rawUsernames
            .split(',')
            .map((u) => u.trim().replace(/^@/, ''))
            .filter(Boolean)
        )
      ).slice(0, 6);

      if (usernames.length === 0) {
        res.json({
          profiles: [],
          repos: [],
          errors: [],
          fetchedAt: new Date().toISOString(),
        });
        return;
      }

      const invalid = usernames.filter((u) => !GITHUB_USERNAME_RE.test(u));
      if (invalid.length > 0) {
        res.status(400).json({
          error: `Invalid GitHub username format: ${invalid.join(', ')}`,
        });
        return;
      }

      const results = await Promise.all(
        usernames.map((u) => fetchGitHubAccountData(u, forceRefresh, optionalToken))
      );

      const profiles: Record<string, unknown>[] = [];
      const repos: Record<string, unknown>[] = [];
      const errors: { username: string; message: string; status: number }[] = [];

      for (const result of results) {
        if (result.profile) profiles.push(result.profile);
        if (result.repos.length > 0) repos.push(...result.repos);
        if ('error' in result && result.error) errors.push(result.error);
      }

      res.json({
        profiles,
        repos,
        errors,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('GitHub sync error:', error);
      res.status(502).json({
        error: 'Unable to reach GitHub API right now. Please try again shortly.',
      });
    }
  });

  app.get('/api/github/readme/:owner/:repo', async (req, res) => {
    try {
      const { owner, repo } = req.params;
      if (!GITHUB_USERNAME_RE.test(owner) || !GITHUB_REPO_RE.test(repo)) {
        res.status(400).json({ error: 'Invalid repository owner or name.' });
        return;
      }

      const optionalToken = req.header('x-github-token') || undefined;
      const cacheKey = `readme:${owner.toLowerCase()}/${repo.toLowerCase()}`;
      const cached = githubCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.json(cached.data);
        return;
      }

      const headers = getGitHubHeaders(optionalToken);
      headers.Accept = 'application/vnd.github.raw+json';

      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
        { headers }
      );

      if (!response.ok) {
        res.status(response.status).json({
          error:
            response.status === 404
              ? 'No README found in this repository.'
              : `Unable to load README (${response.status}).`,
        });
        return;
      }

      const rawText = await response.text();
      const trimmed =
        rawText.length > 6000
          ? `${rawText.slice(0, 6000)}\n\n... (README truncated for preview)`
          : rawText;

      const payload = { content: trimmed };
      githubCache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
      res.json(payload);
    } catch (error) {
      console.error('README fetch error:', error);
      res.status(502).json({ error: 'Unable to fetch README from GitHub.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
