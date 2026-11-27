import { useEffect, useState, type ChangeEvent } from 'react';
import { Download, Plus, Trash2, Upload, X } from 'lucide-react';
import { DEFAULT_PORTFOLIO } from '../data/defaultPortfolio';
import type {
  EducationItem,
  GitHubProfile,
  PortfolioData,
  SkillGroup,
  WorkExperience,
} from '../types/portfolio';
import { parseResumeText } from '../utils/resumeParser';

export type EditorTab = 'github' | 'import' | 'details';

interface EditorDrawerProps {
  isOpen: boolean;
  initialTab: EditorTab;
  portfolio: PortfolioData;
  profiles: GitHubProfile[];
  githubToken: string;
  onSavePortfolio: (updated: PortfolioData, token: string) => Promise<void>;
  onClose: () => void;
}

function normalizeGitHubInput(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/github\.com\/([a-zA-Z0-9-]+)/i);
  if (urlMatch) return urlMatch[1];
  return trimmed.replace(/^@/, '').replace(/\/.*$/, '');
}

export function EditorDrawer({
  isOpen,
  initialTab,
  portfolio,
  profiles,
  githubToken,
  onSavePortfolio,
  onClose,
}: EditorDrawerProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [draft, setDraft] = useState<PortfolioData>(portfolio);
  const [tokenDraft, setTokenDraft] = useState<string>(githubToken);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [resumeRawText, setResumeRawText] = useState('');
  const [parseFeedback, setParseFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setDraft(structuredClone(portfolio));
      setTokenDraft(githubToken);
      setParseFeedback(null);
      setUsernameError(null);
      setSaveError(null);
    }
  }, [isOpen, initialTab, portfolio, githubToken]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddUsername = () => {
    const cleaned = normalizeGitHubInput(newUsername);
    if (!cleaned) {
      setUsernameError('Enter a GitHub username or profile URL.');
      return;
    }
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleaned)) {
      setUsernameError('Enter a valid GitHub username (letters, numbers, and hyphens).');
      return;
    }
    if (draft.github.usernames.some((u) => u.toLowerCase() === cleaned.toLowerCase())) {
      setUsernameError(`@${cleaned} is already connected.`);
      return;
    }
    setUsernameError(null);
    setDraft((prev) => ({
      ...prev,
      github: {
        ...prev.github,
        usernames: [...prev.github.usernames, cleaned],
      },
    }));
    setNewUsername('');
  };

  const handleRemoveUsername = (username: string) => {
    setDraft((prev) => ({
      ...prev,
      github: {
        ...prev.github,
        usernames: prev.github.usernames.filter((u) => u !== username),
      },
    }));
  };

  const handleParseResume = () => {
    if (!resumeRawText.trim()) {
      setParseFeedback('Paste your resume text or upload a .txt / .md / .json file first.');
      return;
    }

    // Check if user pasted/uploaded JSON backup
    if (resumeRawText.trim().startsWith('{')) {
      try {
        const parsedJson = JSON.parse(resumeRawText) as Partial<PortfolioData>;
        if (parsedJson.fullName || parsedJson.experiences) {
          setDraft((prev) => ({ ...prev, ...parsedJson }));
          setParseFeedback('Imported structured portfolio JSON. Review details and save.');
          setActiveTab('details');
          return;
        }
      } catch {
        // Fall back to text parser
      }
    }

    const extracted = parseResumeText(resumeRawText, draft);
    setDraft((prev) => ({
      ...prev,
      ...extracted,
    }));

    const expCount = extracted.experiences?.length ?? 0;
    const eduCount = extracted.education?.length ?? 0;
    const skillCount = extracted.skillGroups?.length ?? 0;
    setParseFeedback(
      `Extracted profile details (${expCount} roles, ${eduCount} education entries, ${skillCount} skill groups). Review and adjust below.`
    );
    setActiveTab('details');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setResumeRawText(text);
    setParseFeedback(`Loaded "${file.name}". Click "Parse & Apply Resume" to extract fields.`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.fullName.toLowerCase().replace(/\s+/g, '-') || 'portfolio'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateExperience = (id: string, patch: Partial<WorkExperience>) => {
    setDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => (exp.id === id ? { ...exp, ...patch } : exp)),
    }));
  };

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      role: 'Software Engineer',
      company: 'Company Name',
      location: '',
      startDate: '2024',
      endDate: 'Present',
      summary: '',
      highlights: ['Key impact or technical achievement'],
    };
    setDraft((prev) => ({
      ...prev,
      experiences: [newExp, ...prev.experiences],
    }));
  };

  const removeExperience = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  };

  const addEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: 'B.S. in Computer Science',
      institution: 'University Name',
      year: '2020',
    };
    setDraft((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const updateEducation = (id: string, patch: Partial<EducationItem>) => {
    setDraft((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, ...patch } : edu)),
    }));
  };

  const removeEducation = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  const addSkillGroup = () => {
    const newGroup: SkillGroup = {
      id: `skill-${Date.now()}`,
      category: 'Category',
      items: ['Skill 1', 'Skill 2'],
    };
    setDraft((prev) => ({
      ...prev,
      skillGroups: [...prev.skillGroups, newGroup],
    }));
  };

  const updateSkillGroup = (id: string, patch: Partial<SkillGroup>) => {
    setDraft((prev) => ({
      ...prev,
      skillGroups: prev.skillGroups.map((grp) => (grp.id === id ? { ...grp, ...patch } : grp)),
    }));
  };

  const removeSkillGroup = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      skillGroups: prev.skillGroups.filter((grp) => grp.id !== id),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSavePortfolio(draft, tokenDraft.trim());
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Portfolio and GitHub Connections"
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white h-full flex flex-col border-l border-zinc-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              Portfolio Settings
            </h2>
            <p className="text-xs text-zinc-500">
              Connect GitHub profiles and customize your resume content
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings drawer"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="px-6 py-3 border-b border-zinc-200 bg-zinc-50">
          <div className="inline-flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('github')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'github'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              GitHub Profiles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Import Resume
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Edit Details
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {__PAGES__ && (
            <p className="text-sm text-zinc-700">
              Changes are saved only in this browser and are not published to other visitors.
            </p>
          )}
          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          {parseFeedback && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
              {parseFeedback}
            </div>
          )}

          {/* TAB 1: GITHUB PROFILES */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">Connected GitHub Accounts</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Add personal or secondary GitHub usernames to aggregate recent public
                  repositories automatically.
                </p>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUsername();
                      }
                    }}
                    placeholder="e.g. octocat or https://github.com/octocat"
                    className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddUsername}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Profile
                  </button>
                </div>
                {usernameError && (
                  <p className="mt-2 text-xs text-red-600">{usernameError}</p>
                )}

                <ul className="mt-4 divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
                  {draft.github.usernames.length === 0 ? (
                    <li className="p-4 text-xs text-zinc-500 text-center">
                      No GitHub profiles connected yet.
                    </li>
                  ) : (
                    draft.github.usernames.map((uname) => {
                      const synced = profiles.find(
                        (p) => p.login.toLowerCase() === uname.toLowerCase()
                      );
                      return (
                        <li
                          key={uname}
                          className="px-4 py-3 flex items-center justify-between gap-4 bg-white"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {synced?.avatar_url ? (
                              <img
                                src={synced.avatar_url}
                                alt={synced.login}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full border border-zinc-200 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-mono text-zinc-600 shrink-0">
                                @
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-medium text-zinc-900 truncate">
                                @{synced?.login || uname}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">
                                {synced
                                  ? `${synced.name || synced.login} · ${synced.public_repos} public repos`
                                  : 'Will sync when saved'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveUsername(uname)}
                            aria-label={`Remove ${uname}`}
                            className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              <div className="pt-6 border-t border-zinc-200 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-950">Repository Display</h3>

                <label className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.github.excludeForks}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        github: { ...prev.github, excludeForks: e.target.checked },
                      }))
                    }
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>Exclude forked repositories</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.github.excludeArchived}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        github: { ...prev.github, excludeArchived: e.target.checked },
                      }))
                    }
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>Exclude archived repositories</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                      Default Sort Order
                    </label>
                    <select
                      value={draft.github.sortBy}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          github: {
                            ...prev.github,
                            sortBy: e.target.value as 'updated' | 'stars' | 'created',
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
                    >
                      <option value="updated">Recently Updated</option>
                      <option value="stars">Most Starred</option>
                      <option value="created">Newest Created</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                      Maximum Projects Shown
                    </label>
                    <select
                      value={draft.github.maxRepos}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          github: { ...prev.github, maxRepos: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white"
                    >
                      <option value={4}>4 repositories</option>
                      <option value={6}>6 repositories</option>
                      <option value={8}>8 repositories</option>
                      <option value={12}>12 repositories</option>
                      <option value={18}>18 repositories</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-200">
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Optional GitHub Personal Access Token
                </label>
                <p className="text-xs text-zinc-500 mb-2">
                  Public repositories load without a token. A token is stored in this browser&apos;s
                  local storage until removed; use a read-only token only if needed.
                </p>
                <input
                  type="password"
                  value={tokenDraft}
                  onChange={(e) => setTokenDraft(e.target.value)}
                  placeholder="github_pat_... (optional)"
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT RESUME */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">
                  Import Summary &amp; Experience from Resume
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Paste your resume text below (or upload a <span className="font-mono">.txt</span>,{' '}
                  <span className="font-mono">.md</span>, or <span className="font-mono">.json</span>{' '}
                  file). Include section headings like <span className="font-medium">Summary</span>,{' '}
                  <span className="font-medium">Experience</span>,{' '}
                  <span className="font-medium">Education</span>, and{' '}
                  <span className="font-medium">Skills</span>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Upload .txt / .md / .json</span>
                  <input
                    type="file"
                    accept=".txt,.md,.json,text/plain,text/markdown,application/json"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Export Portfolio JSON</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={resumeRawText}
                onChange={(e) => setResumeRawText(e.target.value)}
                placeholder={`Jane Doe\nPrincipal Software Engineer | San Francisco, CA\njane@example.com | https://github.com/janedoe\n\nSummary\nDistributed systems engineer with 10 years of experience...\n\nExperience\nStaff Software Engineer — Acme Corp (2022 - Present)\n- Designed multi-region event pipeline...\n\nEducation\nB.S. Computer Science — Stanford University (2016)\n\nSkills\nLanguages: TypeScript, Go, Python`}
                className="w-full p-3.5 text-xs font-mono border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
              />

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(structuredClone(DEFAULT_PORTFOLIO));
                    setParseFeedback('Reset draft to the starter portfolio template.');
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                >
                  Reset to Starter Template
                </button>

                <button
                  type="button"
                  onClick={handleParseResume}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  Parse &amp; Apply Resume
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-950">Profile &amp; Summary</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={draft.fullName}
                      onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      Headline / Title
                    </label>
                    <input
                      type="text"
                      value={draft.headline}
                      onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={draft.location}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      Availability Note
                    </label>
                    <input
                      type="text"
                      value={draft.availability}
                      onChange={(e) => setDraft({ ...draft, availability: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={draft.phone || ''}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={draft.website || ''}
                      onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={draft.linkedinUrl || ''}
                      onChange={(e) => setDraft({ ...draft, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Professional Summary
                  </label>
                  <textarea
                    rows={4}
                    value={draft.professionalSummary}
                    onChange={(e) =>
                      setDraft({ ...draft, professionalSummary: e.target.value })
                    }
                    className="w-full p-3 text-sm border border-zinc-200 rounded-lg leading-relaxed"
                  />
                </div>
              </div>

              {/* Work Experience Editor */}
              <div className="pt-6 border-t border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-950">Work Experience</h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Role
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/60 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-500">
                          {exp.role || 'Role'} · {exp.company || 'Company'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                          placeholder="Role Title"
                          className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                          placeholder="Company Name"
                          className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(exp.id, { startDate: e.target.value })
                          }
                          placeholder="Start (e.g. 2022)"
                          className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                          placeholder="End (e.g. Present)"
                          className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg"
                        />
                      </div>

                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                        placeholder="Location (e.g. Seattle, WA)"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg"
                      />

                      <textarea
                        rows={2}
                        value={exp.summary}
                        onChange={(e) => updateExperience(exp.id, { summary: e.target.value })}
                        placeholder="Brief role overview"
                        className="w-full p-2.5 text-sm bg-white border border-zinc-200 rounded-lg"
                      />

                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Key Achievements (one per line)
                        </label>
                        <textarea
                          rows={3}
                          value={exp.highlights.join('\n')}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              highlights: e.target.value.split('\n').filter(Boolean),
                            })
                          }
                          className="w-full p-2.5 text-xs bg-white border border-zinc-200 rounded-lg leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education Editor */}
              <div className="pt-6 border-t border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-950">Education</h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Education
                  </button>
                </div>

                {draft.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-3.5 border border-zinc-200 rounded-xl bg-zinc-50/60 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                      placeholder="Degree"
                      className="sm:col-span-5 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                      placeholder="Institution"
                      className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => updateEducation(edu.id, { year: e.target.value })}
                      placeholder="Year"
                      className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      aria-label="Remove education"
                      className="sm:col-span-1 flex justify-center text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Skills Editor */}
              <div className="pt-6 border-t border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-950">Skills</h3>
                  <button
                    type="button"
                    onClick={addSkillGroup}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Group
                  </button>
                </div>

                {draft.skillGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3.5 border border-zinc-200 rounded-xl bg-zinc-50/60 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => updateSkillGroup(group.id, { category: e.target.value })}
                      placeholder="Category"
                      className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={group.items.join(', ')}
                      onChange={(e) =>
                        updateSkillGroup(group.id, {
                          items: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Comma-separated skills"
                      className="sm:col-span-7 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkillGroup(group.id)}
                      aria-label="Remove skill group"
                      className="sm:col-span-1 flex justify-center text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
