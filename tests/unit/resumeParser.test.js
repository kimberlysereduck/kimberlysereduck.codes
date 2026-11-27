import { parseResumeText } from '../../src/utils/resumeParser';
import { DEFAULT_PORTFOLIO } from '../../src/data/defaultPortfolio';

test('extracts resume details while preserving existing GitHub settings', () => {
  const result = parseResumeText(
    'Jane Doe\nEngineer\njane@example.com\nhttps://github.com/janedoe\nSummary\nBuilds tools.\nSkills\nLanguages: TypeScript, Python',
    DEFAULT_PORTFOLIO,
  );
  expect(result).toMatchObject({
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    professionalSummary: 'Builds tools.',
    github: { usernames: ['janedoe', ...DEFAULT_PORTFOLIO.github.usernames], maxRepos: 8 },
    skillGroups: [{ category: 'Languages', items: ['TypeScript', 'Python'] }],
  });
  expect(parseResumeText('  ', DEFAULT_PORTFOLIO)).toEqual({});
});
