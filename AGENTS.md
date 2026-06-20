# Agent guide (vendor-neutral)

For any AI coding assistant working in this repo — Claude, Copilot, Cursor, Gemini, or whatever
comes next. The durable knowledge is tool-agnostic and lives in the repo, not in any one vendor's
memory.

## Start here
- **[docs/README.md](docs/README.md)** — index of the project knowledge base (design rationale,
  release/build playbook, feature history). The account-independent handoff. Read it first.
- **[docs/canonical-features.md](docs/canonical-features.md)** — behaviors (and deliberate
  absences) that must never silently disappear. Each entry links to the test that guards it.
- **README.md** — overview, get-started, build & deploy.

## Working rules
- TypeScript: zero errors (`npm run typecheck`), enforced by a pre-push hook.
- Tests are the contract. Match the tier to the claim: pure logic → unit/contract tests
  (`assets/**`); component state/wiring → RNTL (`components/**/__tests__`); what the user
  sees/does end-to-end → Maestro (`.maestro/`). Run: `npm test`, `npm run e2e`.
- **Canonical changes need product approval.** A failing canonical test is a question ("did you
  mean to change canon?"), not a wall: amend `docs/canonical-features.md` in the same commit, or
  stop. `.github/CODEOWNERS` enforces review on the canonical surfaces.
- Builds/deploys: `npm run preflight` first; see README + `docs/release-and-builds.md`. Never run
  a cloud `eas build` for testing (credits) — `npm run build:ios` is the free local path.

Claude-specific notes (if you are Claude) live in `CLAUDE.md`, which points back here.
