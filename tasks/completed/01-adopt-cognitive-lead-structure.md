# Task 01: Adopt cognitive-lead structure

**File:** `tasks/completed/01-adopt-cognitive-lead-structure.md`
**Source:** manager
**Type:** improvement
**Status:** closed

## Goal

Bring this project exactly onto the cognitive-lead structure (opencode.json, AGENTS.md, docs/conventions.md, tasks/ Kanban lanes, living folder docs, CHANGELOG entry) with a minimal diff and zero gaps.

## Manager's Notes

- Direct order (Persian, translated): "Create a task and close it with these changes." Original verbatim: "یک تسک بساز و ببندش با این تغییرات".
- Treated as explicit close authorization ("Close task") after translation.
- Constraints from the structure order: work only inside project root; skip absent DESIGN.md / docs/architecture.md / docs/data_model.md gracefully; never create .opencode/ scaffolding; no git add, commit, or push by hand; task moves only via git mv; no TODO.md or STATE.md; minimal diff.
- Skill load order followed: project-memory, opencode-init, audit-agents, migrate-kanban, init-folder-docs, task-generator, task-lint. Note: code-search exists on disk under ~/.config/opencode/skills but was not in the session skill list, so mapping used custom_context tree plus signature tools instead.

## Local TODOs

- [x] Map repo (tree + signatures) and confirm gaps
- [x] Create opencode.json with valid shape
- [x] Write AGENTS.md covering all 10 audit clauses
- [x] Write docs/conventions.md sections
- [x] Create tasks/ Kanban lanes
- [x] Scaffold src/ + Parse-Dashboard/ README and DECISIONS
- [x] Append CHANGELOG entry (additive only)
- [x] Re-run audit checklist, zero gaps

## Acceptance Criteria

- [x] opencode.json exists and parses as JSON
- [x] AGENTS.md contains all 10 clauses (first-read, core files, Kanban, ZAC, end-of-task, skills, halt, bootstrapping, isolation, shell)
- [x] docs/conventions.md contains format, tests, commits, structure, risk sections
- [x] tasks/backlog, in-progress, qa, completed, archive exist
- [x] README.md + DECISIONS.md exist in src/ and Parse-Dashboard/
- [x] CHANGELOG.md diff is purely additive
- [x] No .opencode/, TODO.md, STATE.md created; no hand-run git add/commit/push

## Verification Evidence

- **Test command:** `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8'))"` (opencode.json validity; no code surface changed so jest/eslint have no new target — docs/config-only change)
- **Expected result:** JSON OK, full audit checklist passes, zero gaps
- **Actual result:** JSON OK; all files, all 10 AGENTS.md clauses, all 5 conventions sections, all 5 lanes present; forbidden paths absent
- **Exit code:** 0

> Verification runner rule: no JS/test surface was touched, so `rtk test` has no applicable command for this change; the audit checklist re-run above is the verification gate and was recorded with exit code 0.

## Definition of Done

- [x] Build/Test/Lint pass with exit code 0 (nothing to build/test/lint: zero JS files changed; JSON validity + task lint + markdown lint recorded)
- [x] `lint_task_file` passes on the active task file
- [x] `CHANGELOG.md` updated via Parse-Then-Append
- [x] `verification-before-completion` applied and evidence recorded

## Risk & Rollback

- **Risk:** docs/conventions.md sits under /docs/, which this repo's own .gitignore excludes — the file exists on disk but stays untracked unless the ignore rule changes.
- **Rollback plan:** all changes are new files plus one additive CHANGELOG hunk; revert by deleting the new files and dropping the hunk. Commits reachable via git log.

---

## Execution Log & Reasoning

- Mapped repo via custom_context get_directory_tree + extract_signatures on src/dashboard/Dashboard.js; confirmed 6 gaps (no AGENTS.md, opencode.json, docs/conventions.md, tasks/, living docs, CHANGELOG entry).
- Assumption A1: translated Persian close order as explicit "Close task" authorization (direct-input translation protocol).
- Created opencode.json ($schema + ZAC git denials + prettier/eslint pointers), AGENTS.md (10 clauses), docs/conventions.md (5 sections), 5 Kanban lanes with .gitkeep, 4 living-doc files, additive CHANGELOG entry.
- Reverted a foreign context-reports/ line the context tool appended to .gitignore (via edit, not git checkout — ZAC holds).
- Q1 (non-blocking): should /docs/ stay gitignored, leaving docs/conventions.md untracked?

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
**Factual Git Diff:** Stored in Commit Hash: `b795fb4fa6ed3c6e126333a4124703811c2e1b7f`
<!-- END_GIT_DIFF -->
