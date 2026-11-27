import { useMemo, useState } from 'react';
import { ArrowUpRight, RefreshCw, Star, GitFork } from 'lucide-react';
import type {
  GitHubConnectionSettings,
  GitHubProfile,
  GitHubProfileError,
  GitHubRepo,
} from '../types/portfolio';

interface GitHubProjectsSectionProps {
  settings: GitHubConnectionSettings;
  profiles: GitHubProfile[];
  repos: GitHubRepo[];
  errors: GitHubProfileError[];
  loading: boolean;
  globalError: string | null;
  onRefresh: () => void;
  onSelectRepo: (repo: GitHubRepo) => void;
  onOpenGitHubSettings: () => void;
}

function formatRepoDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function GitHubProjectsSection({
  settings,
  profiles,
  repos,
  errors,
  loading,
  globalError,
  onRefresh,
  onSelectRepo,
  onOpenGitHubSettings,
}: GitHubProjectsSectionProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'created'>(settings.sortBy);
  const [includeForks, setIncludeForks] = useState<boolean>(!settings.excludeForks);

  const availableLanguages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of repos) {
      if (repo.language) {
        counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);
  }, [repos]);

  const filteredRepos = useMemo(() => {
    const activeProfile =
      selectedProfile !== 'all' &&
      !profiles.some((p) => p.login.toLowerCase() === selectedProfile.toLowerCase())
        ? 'all'
        : selectedProfile;

    return repos
      .filter((repo) => {
        if (!includeForks && repo.fork) return false;
        if (settings.excludeArchived && repo.archived) return false;
        if (
          activeProfile !== 'all' &&
          repo.ownerLogin.toLowerCase() !== activeProfile.toLowerCase()
        ) {
          return false;
        }
        if (selectedLanguage !== 'all' && repo.language !== selectedLanguage) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') {
          return b.stargazers_count - a.stargazers_count;
        }
        if (sortBy === 'created') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return new Date(b.pushed_at || b.updated_at).getTime() -
          new Date(a.pushed_at || a.updated_at).getTime();
      })
      .slice(0, settings.maxRepos);
  }, [repos, profiles, selectedProfile, selectedLanguage, sortBy, includeForks, settings]);

  return (
    <section id="projects" className="py-14 border-b border-zinc-200 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-zinc-950">
            Recent Projects &amp; Repositories
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Pulled directly from connected GitHub profiles
          </p>
        </div>

        <div className="flex items-center gap-3 no-print">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || settings.usernames.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenGitHubSettings}
            className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Manage Profiles
          </button>
        </div>
      </div>

      {/* Interactive Filter Toolbar */}
      {settings.usernames.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-200 no-print">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedProfile('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedProfile === 'all'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              All Profiles
            </button>
            {profiles.map((profile) => (
              <button
                key={profile.login}
                type="button"
                onClick={() => setSelectedProfile(profile.login)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedProfile.toLowerCase() === profile.login.toLowerCase()
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                @{profile.login}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeForks}
                onChange={(e) => setIncludeForks(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
              />
              <span>Include forks</span>
            </label>

            {availableLanguages.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="sr-only">Filter by language</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="sr-only">Sort repositories</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'stars' | 'created')}
                className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value="updated">Recently Updated</option>
                <option value="stars">Most Starred</option>
                <option value="created">Newest Created</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Profile Warning / Global Error States */}
      {(globalError || errors.length > 0) && (
        <div
          role="alert"
          className="mb-6 p-4 bg-white border border-red-200 rounded-xl text-sm text-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            {globalError && <p className="font-medium text-red-700">{globalError}</p>}
            {errors.map((err) => (
              <p key={err.username} className="text-xs text-red-700">
                {err.message}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && repos.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-white border border-zinc-200 rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 w-40 bg-zinc-200 rounded" />
              <div className="h-3 w-full bg-zinc-100 rounded mt-4" />
              <div className="h-3 w-3/4 bg-zinc-100 rounded mt-2" />
              <div className="h-3 w-48 bg-zinc-100 rounded mt-6" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State: No GitHub Profiles Connected */}
      {!loading && settings.usernames.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <h3 className="font-display text-base font-semibold text-zinc-950">
            Connect your GitHub profiles
          </h3>
          <p className="text-sm text-zinc-500 mt-1.5 max-w-md mx-auto">
            Add one or more GitHub usernames to automatically showcase your recent repositories,
            stars, and README summaries.
          </p>
          <button
            type="button"
            onClick={onOpenGitHubSettings}
            className="mt-5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Add GitHub Profile
          </button>
        </div>
      )}

      {/* Empty State: Filtered Out */}
      {!loading && settings.usernames.length > 0 && filteredRepos.length === 0 && !globalError && (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-600">
            No repositories match the current profile or language filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedProfile('all');
              setSelectedLanguage('all');
            }}
            className="mt-3 text-xs font-medium text-blue-600 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Repository Grid */}
      {filteredRepos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRepos.map((repo) => (
            <button
              key={repo.id}
              type="button"
              onClick={() => onSelectRepo(repo)}
              className="group min-w-0 w-full bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-5 sm:p-6 text-left flex flex-col justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div>
                {profiles.length > 1 && (
                  <p className="font-mono text-xs text-zinc-500 mb-1.5">@{repo.ownerLogin}</p>
                )}

                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-zinc-950 group-hover:text-blue-600 transition-colors break-words">
                    {repo.name}
                  </h3>
                  <ArrowUpRight
                    className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 shrink-0 mt-0.5 transition-colors"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-2 text-sm text-zinc-600 leading-relaxed line-clamp-2">
                  {repo.description || 'No description provided in this repository.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2.5 font-mono tabular-nums">
                  {repo.language && (
                    <>
                      <span className="font-sans font-medium text-zinc-700">{repo.language}</span>
                      <span aria-hidden="true" className="text-zinc-300">
                        ·
                      </span>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1" title="Stars">
                    <Star className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                    {repo.stargazers_count.toLocaleString()}
                  </span>
                  <span aria-hidden="true" className="text-zinc-300">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1" title="Forks">
                    <GitFork className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                    {repo.forks_count.toLocaleString()}
                  </span>
                </div>

                <span className="font-mono tabular-nums text-zinc-600">
                  Updated {formatRepoDate(repo.pushed_at || repo.updated_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
