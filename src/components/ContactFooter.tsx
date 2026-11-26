import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import type { GitHubProfile, PortfolioData } from '../types/portfolio';

interface ContactFooterProps {
  portfolio: PortfolioData;
  profiles: GitHubProfile[];
}

export function ContactFooter({ portfolio, profiles }: ContactFooterProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    if (!portfolio.email) return;
    try {
      await navigator.clipboard.writeText(portfolio.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  return (
    <footer id="contact" className="py-14 scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-zinc-200">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-zinc-950">
            Contact
          </h2>
          <p className="mt-2 text-sm text-zinc-600 max-w-md leading-relaxed">
            Available for engineering leadership conversations, architecture reviews, and
            full-time roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 no-print">
          {portfolio.email && (
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${portfolio.email}`}
                className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Send Email
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Email copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                    <span>Copy address</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-zinc-500">
        <p>
          © {new Date().getFullYear()} {portfolio.fullName}
          {portfolio.location && (
            <>
              <span aria-hidden="true" className="mx-2 text-zinc-300">
                ·
              </span>
              <span>{portfolio.location}</span>
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-5">
          {profiles.map((profile) => (
            <a
              key={profile.login}
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-zinc-950 transition-colors"
            >
              <span>GitHub (@{profile.login})</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400" aria-hidden="true" />
            </a>
          ))}
          {portfolio.website && (
            <a
              href={portfolio.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-zinc-950 transition-colors"
            >
              <span>Website</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400" aria-hidden="true" />
            </a>
          )}
          {portfolio.linkedinUrl && (
            <a
              href={portfolio.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-zinc-950 transition-colors"
            >
              <span>LinkedIn</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
