import type {
  EducationItem,
  PortfolioData,
  SkillGroup,
  WorkExperience,
} from '../types/portfolio';

const SECTION_HEADINGS = {
  summary: /^(summary|professional summary|about|profile|objective|overview)\b/i,
  experience: /^(experience|work experience|employment|career history|professional experience)\b/i,
  education: /^(education|academic background|degrees)\b/i,
  skills: /^(skills|technical skills|technologies|core competencies|stack)\b/i,
};

const DATE_RANGE_REGEX =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:[-–—]|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current|Now)/i;

function cleanLine(line: string): string {
  return line.replace(/^[-•*▪◦‣]\s*/, '').trim();
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`;
}

export function parseResumeText(
  rawText: string,
  current: PortfolioData
): Partial<PortfolioData> {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim());

  const nonEmptyLines = lines.filter(Boolean);
  if (nonEmptyLines.length === 0) {
    return {};
  }

  // Extract contact links/emails from full text
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s|,)]+/i);
  const githubMatches = Array.from(
    rawText.matchAll(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9-]+)(?:\/|\b)/gi)
  ).map((m) => m[1]);

  const uniqueGithubUsernames = Array.from(
    new Set(
      githubMatches.filter(
        (u) => !['features', 'explore', 'topics', 'trending', 'orgs'].includes(u.toLowerCase())
      )
    )
  );

  // Split document into sections
  const sections: Record<'header' | 'summary' | 'experience' | 'education' | 'skills', string[]> = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
  };

  let activeSection: keyof typeof sections = 'header';

  for (const line of lines) {
    const strippedHeading = line.replace(/^#+\s*/, '').replace(/:$/, '').trim();
    if (strippedHeading.length > 0 && strippedHeading.length <= 42) {
      if (SECTION_HEADINGS.summary.test(strippedHeading)) {
        activeSection = 'summary';
        continue;
      }
      if (SECTION_HEADINGS.experience.test(strippedHeading)) {
        activeSection = 'experience';
        continue;
      }
      if (SECTION_HEADINGS.education.test(strippedHeading)) {
        activeSection = 'education';
        continue;
      }
      if (SECTION_HEADINGS.skills.test(strippedHeading)) {
        activeSection = 'skills';
        continue;
      }
    }
    sections[activeSection].push(line);
  }

  // Parse header for name, headline, location
  const headerLines = sections.header.filter(Boolean);
  const fullName =
    headerLines[0] && !headerLines[0].includes('@') && headerLines[0].length < 60
      ? headerLines[0].replace(/^#+\s*/, '').trim()
      : current.fullName;

  let headline = current.headline;
  if (headerLines[1] && !headerLines[1].includes('@') && !headerLines[1].startsWith('http')) {
    const parts = headerLines[1].split(/[|·]/).map((s) => s.trim());
    if (parts[0] && parts[0].length < 80) {
      headline = parts[0];
    }
  }

  // Parse summary
  const summaryLines = sections.summary.filter(Boolean);
  const professionalSummary =
    summaryLines.length > 0 ? summaryLines.join(' ').trim() : current.professionalSummary;

  // Parse experience entries
  const expLines = sections.experience;
  const parsedExperiences: WorkExperience[] = [];
  let currentExp: WorkExperience | null = null;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    if (!line) continue;

    const isBullet = /^[-•*▪◦‣]\s+/.test(line);
    const dateMatch = line.match(DATE_RANGE_REGEX);

    if (!isBullet && dateMatch) {
      if (currentExp) {
        parsedExperiences.push(currentExp);
      }

      const startDate = dateMatch[1].trim();
      const endDate = dateMatch[2].trim();
      const withoutDate = line.replace(DATE_RANGE_REGEX, '').replace(/[|()[\]]/g, ' ').trim();

      // Check previous line if role/company were split across two lines
      const prevLine = i > 0 && !/^[-•*▪◦‣]/.test(expLines[i - 1]) ? expLines[i - 1] : '';
      let role = '';
      let company = '';
      let location = '';

      const titleSource = withoutDate.length > 3 ? withoutDate : prevLine;
      const splitParts = titleSource
        .split(/\s+(?:at|@)\s+|\s*[—–|·,]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (splitParts.length >= 2) {
        role = splitParts[0];
        company = splitParts[1];
        if (splitParts.length >= 3) {
          location = splitParts.slice(2).join(', ');
        }
      } else if (splitParts.length === 1) {
        role = splitParts[0];
        company = 'Organization';
      }

      currentExp = {
        id: makeId('exp', parsedExperiences.length),
        role: role || 'Engineer',
        company: company || 'Company',
        location,
        startDate,
        endDate,
        summary: '',
        highlights: [],
      };
    } else if (currentExp) {
      if (isBullet) {
        currentExp.highlights.push(cleanLine(line));
      } else if (
        currentExp.highlights.length === 0 &&
        !currentExp.summary &&
        line.length > 20
      ) {
        // Check if this line is "Company | Location" right after role+date
        if (
          currentExp.company === 'Organization' &&
          line.length < 60 &&
          !line.endsWith('.')
        ) {
          const parts = line.split(/[|·,]/).map((s) => s.trim());
          currentExp.company = parts[0] || currentExp.company;
          if (parts[1]) currentExp.location = parts.slice(1).join(', ');
        } else {
          currentExp.summary = line;
        }
      } else if (isBullet || line.length > 25) {
        currentExp.highlights.push(cleanLine(line));
      }
    }
  }

  if (currentExp) {
    parsedExperiences.push(currentExp);
  }

  // Parse education
  const eduLines = sections.education.filter(Boolean);
  const parsedEducation: EducationItem[] = [];
  for (let i = 0; i < eduLines.length; i++) {
    const line = cleanLine(eduLines[i]);
    if (!line) continue;
    const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
    const parts = line
      .replace(/\b(19\d{2}|20\d{2})\b/, '')
      .split(/[|·,—–-]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length > 0) {
      parsedEducation.push({
        id: makeId('edu', i),
        degree: parts[0],
        institution: parts[1] || '',
        year: yearMatch ? yearMatch[1] : '',
      });
    }
  }

  // Parse skills
  const skillLines = sections.skills.filter(Boolean);
  const parsedSkillGroups: SkillGroup[] = [];
  skillLines.forEach((line, idx) => {
    const cleaned = cleanLine(line);
    const colonIdx = cleaned.indexOf(':');
    if (colonIdx > 0 && colonIdx < 32) {
      const category = cleaned.slice(0, colonIdx).trim();
      const items = cleaned
        .slice(colonIdx + 1)
        .split(/[,·|/]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        parsedSkillGroups.push({
          id: makeId('skill', idx),
          category,
          items,
        });
      }
    } else {
      const items = cleaned
        .split(/[,·|/]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        parsedSkillGroups.push({
          id: makeId('skill', idx),
          category: parsedSkillGroups.length === 0 ? 'Technical Skills' : 'Additional Tools',
          items,
        });
      }
    }
  });

  const result: Partial<PortfolioData> = {
    fullName,
    headline,
    professionalSummary,
  };

  if (emailMatch) result.email = emailMatch[0];
  if (linkedinMatch) result.linkedinUrl = linkedinMatch[0];
  if (parsedExperiences.length > 0) result.experiences = parsedExperiences;
  if (parsedEducation.length > 0) result.education = parsedEducation;
  if (parsedSkillGroups.length > 0) result.skillGroups = parsedSkillGroups;
  if (uniqueGithubUsernames.length > 0) {
    result.github = {
      ...current.github,
      usernames: Array.from(new Set([...uniqueGithubUsernames, ...current.github.usernames])),
    };
  }

  return result;
}
