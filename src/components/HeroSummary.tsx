import { useState } from 'react';
import { ArrowUpRight, Download, Printer } from 'lucide-react';
import type { GitHubProfile, PortfolioData } from '../types/portfolio';

interface HeroSummaryProps {
  portfolio: PortfolioData;
  profiles: GitHubProfile[];
  onOpenGitHubSettings: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function HeroSummary({
  portfolio,
  profiles,
  onOpenGitHubSettings,
}: HeroSummaryProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const primaryProfile = profiles.find((p) => Boolean(p.avatar_url)) || profiles[0];
  const showAvatar = Boolean(primaryProfile?.avatar_url) && !avatarFailed;

  const metaParts = [portfolio.headline, portfolio.location, portfolio.availability].filter(
    Boolean
  );

  return (
    <section id="summary" className="pt-10 sm:pt-14 pb-12 sm:pb-14 border-b border-zinc-200 scroll-mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-8 min-w-0">
          {metaParts.length > 0 && (
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mb-4 leading-relaxed break-words">
              {metaParts.map((part, index) => (
                <span key={part}>
                  {index > 0 && (
                    <span aria-hidden="true" className="text-zinc-300">
                      {' '}·{' '}
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </p>
          )}

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 leading-[1.1] text-balance break-words">
            {portfolio.fullName}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl">
            {portfolio.professionalSummary}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm no-print">
            {portfolio.resumePdfUrl && (
              <a
                href={portfolio.resumePdfUrl.startsWith('/assets/')
                  ? `${__BASE_PATH__}${portfolio.resumePdfUrl.slice(1)}`
                  : portfolio.resumePdfUrl}
                download="Kimberly-Sereduck-Resume.pdf"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Resume PDF
              </a>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              Print Resume
            </button>

            {portfolio.email && (
              <a
                href={`mailto:${portfolio.email}`}
                className="text-zinc-700 hover:text-blue-600 transition-colors underline underline-offset-4 decoration-zinc-300 hover:decoration-blue-600 whitespace-nowrap"
              >
                {portfolio.email}
              </a>
            )}

            {portfolio.phone && (
              <a
                href={`tel:${portfolio.phone.replace(/[^\d+]/g, '')}`}
                className="font-mono text-xs text-zinc-600 hover:text-blue-600 transition-colors tabular-nums whitespace-nowrap"
              >
                {portfolio.phone}
              </a>
            )}

            {portfolio.linkedinUrl && (
              <a
                href={portfolio.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-700 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              </a>
            )}

            {portfolio.website && (
              <a
                href={portfolio.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-700 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                <span>Website</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4 min-w-0 bg-white border border-zinc-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-4">
            {showAvatar ? (
              <img
                src={primaryProfile.avatar_url}
                alt={`${portfolio.fullName} profile avatar`}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-14 h-14 rounded-full object-cover border border-zinc-200 shrink-0"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-display text-base font-semibold text-zinc-700 shrink-0"
              >
                {getInitials(portfolio.fullName)}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-950 truncate">
                {portfolio.fullName}
              </p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{portfolio.headline}</p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-zinc-100">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-zinc-500">Connected GitHub</span>
              <button
                type="button"
                onClick={onOpenGitHubSettings}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap cursor-pointer no-print focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
              >
                {profiles.length > 0 ? 'Manage' : 'Connect'}
              </button>
            </div>

            {profiles.length > 0 ? (
              <ul className="space-y-2.5">
                {profiles.map((profile) => (
                  <li key={profile.login} className="flex items-center justify-between gap-3 text-xs">
                    <a
                      href={profile.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-zinc-800 hover:text-blue-600 transition-colors truncate"
                    >
                      @{profile.login}
                    </a>
                    <span className="font-mono tabular-nums text-zinc-500 whitespace-nowrap shrink-0">
                      {profile.public_repos} repos
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-500 leading-relaxed">
                No GitHub profiles connected yet. Connect one or more usernames to pull recent
                repositories automatically.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
