# Project knowledge base

Durable, account-independent handoff docs for Timer App Yoga. Written 2026-06-10 (during the
breath-timer rebuild on `dev-breath-timer`) so that any future Claude session — new machine, new
account, new context window — can pick up cold. The repo's `CLAUDE.md` points here.

## The docs

| File | What it holds |
|---|---|
| [working-style.md](working-style.md) | How Jarvis works with Claude — brainstorm vs build modes, full-scope preference. **Read first.** |
| [design-pranayama.md](design-pranayama.md) | The locked design philosophy: grid model, aperiodic grid, practitioner principles, patterns library vision. The "why" behind the breath timer. |
| [breath-timer.md](breath-timer.md) | The breath-timer feature itself: architecture, iteration history, current state, what's open before release. |
| [release-and-builds.md](release-and-builds.md) | iOS release playbook + local build/signing setup (Apple ID facts, gotchas) + the never-eas-for-testing rule. |
| [project-state.md](project-state.md) | Snapshot of everything else: branches, feature flags, deferred items, Sound Lab, known issues. |

## Continuity notes (what lives where)

- **These docs** — in the repo, travel with `git clone`. Update them when a feature ships or a
  workflow changes; they are the canonical backup of project knowledge.
- **Live Claude memory** — `~/.claude/projects/-Users-jarvisfosdick-code-timer-app-timer-app/memory/`
  on Jarvis's MacBook. Machine-local, keyed by directory path, independent of Claude account or
  plan. Richer and more current than these docs, but does not survive a machine change unless
  copied. If memory and these docs disagree, memory is probably newer — verify against git.
- **Claude account** — chat history on claude.ai is tied to the account, not the plan; downgrading
  to free keeps it. Claude Code transcripts/memory are local files, untouched by plan changes.
- **Sound Lab** (`../sound-lab/`) — its own git repo, **LOCAL-ONLY, no remote** as of 2026-06-10.
  The rendered ambience beds and recipes exist only on this Mac (plus the copies synced into this
  repo's `assets/sounds/`). If backing things up before an account/machine change, push sound-lab
  to a remote or copy it — it is the one piece of project knowledge not on GitHub.
