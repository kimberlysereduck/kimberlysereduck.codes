import { useEffect, useState } from 'react';
import { ArrowUpRight, GitFork, Star, X } from 'lucide-react';
import type { GitHubRepo } from '../types/portfolio';
import { fetchReadme } from '../utils/github';

interface RepoDetailModalProps {
  repo: GitHubRepo | null;
  githubToken?: string;
  onClose: () => void;
}

export function RepoDetailModal({ repo, githubToken, onClose }: RepoDetailModalProps) {
  const [readme, setReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [repo, onClose]);

  useEffect(() => {
    if (!repo) return;

    let cancelled = false;
    setReadme(null);
    setReadmeError(null);
    setReadmeLoading(true);

    fetchReadme(repo.ownerLogin, repo.name, githubToken || '')
      .then((content) => {
        if (!cancelled) {
          setReadme(content);
          setReadmeLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setReadmeError(err instanceof Error ? err.message : 'Unable to load README');
          setReadmeLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repo, githubToken]);

  if (!repo) return null;

  const updatedLabel = new Date(repo.pushed_at || repo.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white border border-zinc-200 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-zinc-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-zinc-500">{repo.full_name}</p>
            <h2
              id="repo-modal-title"
              className="font-display text-xl font-semibold text-zinc-950 mt-1 break-words"
            >
              {repo.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close repository details"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-sm text-zinc-700 leading-relaxed">
            {repo.description || 'No description provided for this repository.'}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600 font-mono tabular-nums pb-5 border-b border-zinc-100">
            {repo.language && (
              <span className="font-sans font-medium text-zinc-900">{repo.language}</span>
            )}
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              {repo.stargazers_count.toLocaleString()} stars
            </span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              {repo.forks_count.toLocaleString()} forks
            </span>
            {repo.license && <span>{repo.license}</span>}
            <span>Branch: {repo.default_branch}</span>
            <span className="text-zinc-400">Updated {updatedLabel}</span>
          </div>

          {repo.topics.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 mb-1.5">Topics</h3>
              <p className="text-xs text-zinc-700 leading-relaxed break-words">
                {repo.topics.map((topic, index) => (
                  <span key={topic}>
                    {index > 0 && (
                      <span aria-hidden="true" className="text-zinc-300">
                        {' '}·{' '}
                      </span>
                    )}
                    {topic}
                  </span>
                ))}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium text-zinc-500 mb-2">README Preview</h3>
            {readmeLoading && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 animate-pulse">
                <div className="h-3 w-48 bg-zinc-200 rounded" />
                <div className="h-3 w-full bg-zinc-200 rounded" />
                <div className="h-3 w-5/6 bg-zinc-200 rounded" />
              </div>
            )}

            {!readmeLoading && readmeError && (
              <p className="text-xs text-zinc-500 italic">{readmeError}</p>
            )}

            {!readmeLoading && readme && (
              <pre className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-700 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto max-h-80">
                {readme}
              </pre>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            {repo.homepage && (
              <a
                href={repo.homepage.startsWith('http') ? repo.homepage : `https://${repo.homepage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-blue-600 transition-colors"
              >
                <span>Live Demo / Website</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>

          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Open on GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
