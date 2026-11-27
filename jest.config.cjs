module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.{js,jsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx', '!src/**/*.d.ts', '!src/types/**'],
  coverageReporters: ['text', 'lcov'],
};
