import { useCallback, useEffect, useState } from 'react';
import { ContactFooter } from './components/ContactFooter';
import { EditorDrawer, type EditorTab } from './components/EditorDrawer';
import { ExperienceSection } from './components/ExperienceSection';
import { GitHubProjectsSection } from './components/GitHubProjectsSection';
import { Header } from './components/Header';
import { HeroSummary } from './components/HeroSummary';
import { RepoDetailModal } from './components/RepoDetailModal';
import { DEFAULT_PORTFOLIO } from './data/defaultPortfolio';
import type {
  GitHubProfile,
  GitHubProfileError,
  GitHubRepo,
  GitHubSyncResponse,
  PortfolioData,
} from './types/portfolio';

const LOCAL_STORAGE_KEY = 'portfolio_app_data_v2';
const TOKEN_STORAGE_KEY = 'portfolio_github_token_v1';

export default function App() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as PortfolioData;
      }
    } catch {
      // ignore invalid localStorage
    }
    return DEFAULT_PORTFOLIO;
  });

  const [githubToken, setGithubToken] = useState<string>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [profiles, setProfiles] = useState<GitHubProfile[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [profileErrors, setProfileErrors] = useState<GitHubProfileError[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubGlobalError, setGithubGlobalError] = useState<string | null>(null);

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('github');

  // Load persisted portfolio from backend on mount if available
  useEffect(() => {
    let cancelled = false;
    fetch('/api/portfolio')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PortfolioData | null) => {
        if (!cancelled && data && data.fullName) {
          setPortfolio(data);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch(() => {
        // Offline or dev reload fallback uses localStorage / DEFAULT_PORTFOLIO
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep page title synced with portfolio owner name
  useEffect(() => {
    if (portfolio.fullName) {
      document.title = `${portfolio.fullName} — Portfolio`;
    }
  }, [portfolio.fullName]);

  const syncGitHubProfiles = useCallback(
    async (usernames: string[], forceRefresh = false, tokenOverride?: string) => {
      if (usernames.length === 0) {
        setProfiles([]);
        setRepos([]);
        setProfileErrors([]);
        setGithubGlobalError(null);
        return;
      }

      setGithubLoading(true);
      setGithubGlobalError(null);

      try {
        const params = new URLSearchParams({
          usernames: usernames.join(','),
        });
        if (forceRefresh) {
          params.set('refresh', 'true');
        }

        const headers: Record<string, string> = {};
        const activeToken = tokenOverride !== undefined ? tokenOverride : githubToken;
        if (activeToken) {
          headers['x-github-token'] = activeToken;
        }

        const res = await fetch(`/api/github/profiles?${params.toString()}`, { headers });
        const payload = (await res.json()) as GitHubSyncResponse & { error?: string };

        if (!res.ok) {
          throw new Error(payload.error || 'Unable to sync GitHub repositories.');
        }

        setProfiles(payload.profiles || []);
        setRepos(payload.repos || []);
        setProfileErrors(payload.errors || []);
      } catch (err) {
        setGithubGlobalError(
          err instanceof Error ? err.message : 'Unable to sync GitHub profiles.'
        );
      } finally {
        setGithubLoading(false);
      }
    },
    [githubToken]
  );

  // Sync automatically whenever connected GitHub usernames change
  const usernamesKey = portfolio.github.usernames.join(',');
  useEffect(() => {
    syncGitHubProfiles(portfolio.github.usernames, false);
  }, [usernamesKey, syncGitHubProfiles, portfolio.github.usernames]);

  const handleOpenEditor = (tab: EditorTab) => {
    setEditorTab(tab);
    setEditorOpen(true);
  };

  const handleSavePortfolio = async (updated: PortfolioData, token: string) => {
    setPortfolio(updated);
    setGithubToken(token);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }

    try {
      await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // localStorage already updated
    }

    await syncGitHubProfiles(updated.github.usernames, true, token);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-950 flex flex-col overflow-x-clip">
      <Header fullName={portfolio.fullName} onOpenEditor={() => handleOpenEditor('details')} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6">
        <HeroSummary
          portfolio={portfolio}
          profiles={profiles}
          onOpenGitHubSettings={() => handleOpenEditor('github')}
        />

        <ExperienceSection
          portfolio={portfolio}
          onEditResume={() => handleOpenEditor('import')}
        />

        <GitHubProjectsSection
          settings={portfolio.github}
          profiles={profiles}
          repos={repos}
          errors={profileErrors}
          loading={githubLoading}
          globalError={githubGlobalError}
          onRefresh={() => syncGitHubProfiles(portfolio.github.usernames, true)}
          onSelectRepo={(repo) => setSelectedRepo(repo)}
          onOpenGitHubSettings={() => handleOpenEditor('github')}
        />

        <ContactFooter portfolio={portfolio} profiles={profiles} />
      </main>

      <RepoDetailModal
        repo={selectedRepo}
        githubToken={githubToken}
        onClose={() => setSelectedRepo(null)}
      />

      <EditorDrawer
        isOpen={editorOpen}
        initialTab={editorTab}
        portfolio={portfolio}
        profiles={profiles}
        githubToken={githubToken}
        onSavePortfolio={handleSavePortfolio}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
