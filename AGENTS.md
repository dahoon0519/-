# AI collaboration instructions (Codex / ChatGPT / Gemini)

## Project facts
- React 19 + TypeScript + Vite frontend.
- Express server code and Netlify Functions; deployed via Netlify.
- Netlify builds with `npm run build` and publishes `dist`.
- Authentication, draft/publish content flow, and persistent storage are security-critical.

## Responsibility split
- Human project owner: approves changes and production deployment.
- ChatGPT: requirement analysis, coordination, reviewing changes and test evidence.
- Codex: implements changes in a dedicated task branch, tests, proposes pull requests.
- Gemini in Google AI Studio: visual and UX proposals and scoped UI changes. Sync through GitHub after inspecting diffs. Do not overwrite concurrent Codex changes.

## Required workflow
1. Pull latest `main` before starting; use a feature branch named `codex/<task>` or `gemini/<task>`.
2. Before editing, describe files likely to change and acceptance criteria.
3. Keep tasks small; avoid working on the same files simultaneously.
4. Do not commit credentials, API keys, cookies, personal information, or .env files.
5. For changed code, run `npm run lint`, `npm run build` and `npm run test:security` when feasible; report any failures and explain skipped checks.
6. Review changed files and the diff; open a pull request targeting `main`.
7. Never merge to `main` or deploy production automatically without explicit owner approval.
8. If a change touches login/OAuth, cookie sessions, CSRF, Netlify Blobs, media uploads or publication logic, explicitly review security and regression risks.
9. Preserve Japanese, Korean and English user-facing content and translations.
10. Treat AI Studio previews and deployed production as different environments. No production secrets in prompts or preview screenshots.

## First task for Codex
Read the repository, summarize architecture, locate tests and existing deployment behavior. Run baseline checks without altering application code. Report findings as a pull request comment or task result before implementing features.

## First task for Gemini
After linking this repository in AI Studio Build mode, perform a read-only UI/UX audit of desktop and mobile layouts. Produce a prioritized suggestion list. Do not push changes until the owner selects a task.

## Branch coordination
GitHub `main` is the source of truth. If Gemini or Codex pushes a change, the other agent must first pull the updated version. Resolve conflicting edits through PR review, not blind overwrites.
