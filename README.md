# Portfolio

A React, TypeScript, and Vite portfolio with resume editing and GitHub project previews.

## Requirements and local development

Use Node.js 22.13 or later in the Node 22 release line (CI uses Node 22) and npm.

```sh
npm ci
npm run dev
```

Open the address printed by the server (normally http://localhost:3000). The Express development server saves edits to `data/portfolio.json` and proxies GitHub requests. It can optionally use `GITHUB_TOKEN` from a local `.env` file. Do not commit tokens or saved portfolio data.

## GitHub Pages

In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source. Push to `main` to run the checks and, if they pass, deploy. The workflow derives the asset base path from the Pages configuration, so the project site works at `https://<owner>.github.io/<repository>/` and at a configured custom domain. Configure any custom domain and DNS in GitHub Pages settings; no domain is assumed by this repository.

Pages serves static files only: it does not run Express. The Pages build fetches public profiles, repositories and README previews directly from the GitHub API. Anonymous GitHub API requests are rate limited; errors are displayed in the project section. An optional token entered in settings is stored in the browser's local storage and sent to GitHub. Use a limited, read-only token and avoid entering one on shared devices.

Edits on Pages are stored only in the current browser and are not published to other visitors. To change the public default portfolio, edit `src/data/defaultPortfolio.ts` and commit the change (or import/export JSON in the editor for local backups).

To preview the Pages build locally under a project path:

```sh
VITE_BASE_PATH=/portfolio/ npm run build:pages
VITE_BASE_PATH=/portfolio/ npm run preview
```

Open `/portfolio/` on the preview server. Use `VITE_BASE_PATH=/` for a root or custom-domain deployment. `npm run build` instead builds the server-backed version for use with Express.

## Checks

```sh
npm run lint
npm run typecheck
npm run test:coverage
npx playwright install chromium
npm run test:e2e
```

Jest and React Testing Library exercise components and utilities and write coverage to `coverage/`. Playwright tests the built static site under a non-root path, including local persistence, repository previews, and an axe-core WCAG 2 A/AA scan of the main portfolio. GitHub API responses are mocked for deterministic tests; automated accessibility checks do not replace manual keyboard and screen-reader testing.

The workflow runs these checks on pushes to `main` and on pull requests, and publishes coverage and browser reports as workflow artifacts.
