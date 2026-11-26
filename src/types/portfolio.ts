export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  companyUrl?: string;
  location: string;
  startDate: string;
  endDate: string;
  summary: string;
  highlights: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface GitHubConnectionSettings {
  usernames: string[];
  excludeForks: boolean;
  excludeArchived: boolean;
  sortBy: 'updated' | 'stars' | 'created';
  maxRepos: number;
}

export interface PortfolioData {
  fullName: string;
  headline: string;
  location: string;
  availability: string;
  email: string;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  resumePdfUrl?: string;
  professionalSummary: string;
  experiences: WorkExperience[];
  education: EducationItem[];
  skillGroups: SkillGroup[];
  github: GitHubConnectionSettings;
  updatedAt: string;
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  ownerLogin: string;
  html_url: string;
  homepage: string | null;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  topics: string[];
  updated_at: string;
  pushed_at: string;
  created_at: string;
  default_branch: string;
  license: string | null;
}

export interface GitHubProfileError {
  username: string;
  message: string;
  status: number;
}

export interface GitHubSyncResponse {
  profiles: GitHubProfile[];
  repos: GitHubRepo[];
  errors: GitHubProfileError[];
  fetchedAt: string;
}
