import { ArrowUpRight } from 'lucide-react';
import type { PortfolioData } from '../types/portfolio';

interface ExperienceSectionProps {
  portfolio: PortfolioData;
  onEditResume: () => void;
}

export function ExperienceSection({ portfolio, onEditResume }: ExperienceSectionProps) {
  return (
    <section id="experience" className="py-14 border-b border-zinc-200 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-4 mb-8">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-zinc-950">
            Work Experience
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Career timeline and key engineering contributions
          </p>
        </div>

        <button
          type="button"
          onClick={onEditResume}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer no-print focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          Import or edit resume
        </button>
      </div>

      {portfolio.experiences.length === 0 ? (
        <div className="py-10 border-t border-zinc-200 text-sm text-zinc-500">
          No work experience entries added yet. Click{' '}
          <button
            type="button"
            onClick={onEditResume}
            className="text-blue-600 hover:underline font-medium cursor-pointer"
          >
            Import or edit resume
          </button>{' '}
          to paste your resume or add roles.
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 border-t border-zinc-200">
          {portfolio.experiences.map((exp) => (
            <article
              key={exp.id}
              className="py-8 first:pt-7 last:pb-2 flex flex-col md:flex-row gap-4 md:gap-10"
            >
              <div className="md:w-52 shrink-0">
                <p className="font-mono text-xs text-zinc-600 tabular-nums">
                  {exp.startDate} — {exp.endDate}
                </p>
                {exp.location && (
                  <p className="text-xs text-zinc-500 mt-1">{exp.location}</p>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <h3 className="font-display text-lg font-semibold text-zinc-950">
                    {exp.role}
                  </h3>
                  <span aria-hidden="true" className="text-zinc-300">
                    ·
                  </span>
                  {exp.companyUrl ? (
                    <a
                      href={exp.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-sm font-medium text-zinc-700 hover:text-blue-600 transition-colors"
                    >
                      <span>{exp.company}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-zinc-700">{exp.company}</span>
                  )}
                </div>

                {exp.summary && (
                  <p className="mt-2.5 text-sm text-zinc-600 leading-relaxed max-w-2xl">
                    {exp.summary}
                  </p>
                )}

                {exp.highlights.length > 0 && (
                  <ul className="mt-3.5 space-y-2 text-sm text-zinc-600 leading-relaxed max-w-2xl">
                    {exp.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span aria-hidden="true" className="text-zinc-400 select-none shrink-0">
                          —
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {(portfolio.education.length > 0 || portfolio.skillGroups.length > 0) && (
        <div className="mt-12 pt-10 border-t border-zinc-200 grid grid-cols-1 md:grid-cols-12 gap-10">
          {portfolio.education.length > 0 && (
            <div className="md:col-span-5 min-w-0">
              <h3 className="font-display text-sm font-semibold text-zinc-950 mb-4">
                Education
              </h3>
              <ul className="space-y-4">
                {portfolio.education.map((edu) => (
                  <li key={edu.id} className="min-w-0 break-words">
                    <p className="text-sm font-medium text-zinc-900">{edu.degree}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {edu.institution}
                      {edu.year && (
                        <>
                          <span aria-hidden="true" className="text-zinc-300">
                            {' '}·{' '}
                          </span>
                          <span className="font-mono tabular-nums">{edu.year}</span>
                        </>
                      )}
                    </p>
                    {edu.details && (
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{edu.details}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {portfolio.skillGroups.length > 0 && (
            <div
              className={
                portfolio.education.length > 0 ? 'md:col-span-7 min-w-0' : 'md:col-span-12 min-w-0'
              }
            >
              <h3 className="font-display text-sm font-semibold text-zinc-950 mb-4">
                Core Competencies
              </h3>
              <dl className="space-y-4 sm:space-y-3">
                {portfolio.skillGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex flex-col sm:flex-row sm:gap-6 min-w-0"
                  >
                    <dt className="text-xs font-medium text-zinc-500 sm:w-44 shrink-0 pt-0.5 mb-1 sm:mb-0">
                      {group.category}
                    </dt>
                    <dd className="flex-1 min-w-0 text-sm text-zinc-700 leading-relaxed break-words">
                      {group.items.map((skill, index) => (
                        <span key={`${group.id}-${index}-${skill}`}>
                          {index > 0 && (
                            <span aria-hidden="true" className="text-zinc-300">
                              {' '}·{' '}
                            </span>
                          )}
                          {skill}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
