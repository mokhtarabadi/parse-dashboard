# Task 01: Adopt cognitive-lead structure

**File:** `tasks/qa/01-adopt-cognitive-lead-structure.md`
**Source:** manager
**Type:** improvement
**Status:** open

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
```diff
diff --git a/AGENTS.md b/AGENTS.md
new file mode 100644
index 0000000..d29f540
--- /dev/null
+++ b/AGENTS.md
@@ -0,0 +1,78 @@
+# AGENTS.md — parse-dashboard (cognitive-lead)
+
+> Entry point. Read this file first on every task. Then read `docs/conventions.md` and `opencode.json`.
+> If `DESIGN.md`, `docs/architecture.md`, or `docs/data_model.md` exist, read them too.
+> All three are currently absent here — skip gracefully, never invent their contents.
+
+## 1. First-read rule
+
+- Absolute first action: read this `AGENTS.md`.
+- Then read `docs/conventions.md` and `opencode.json` (both exist at root).
+- `DESIGN.md` / `docs/architecture.md` / `docs/data_model.md`: read only if present.
+
+## 2. Core file locations
+
+- `opencode.json` — tool permissions, formatter (prettier), linter (eslint). Root only.
+- `docs/conventions.md` — formatting, lint, test, commit rules.
+- `src/` — React frontend (components, dashboard, lib, login). `Parse-Dashboard/` — Express server.
+- `tasks/` — Kanban state. `CHANGELOG.md` + `changelogs/` — releases (semantic-release, do not hand-edit versions).
+- Never create `.opencode/` scaffolding: it does not exist here.
+
+## 3. Kanban dirs
+
+- Lanes: `tasks/backlog/`, `tasks/in-progress/` (WIP), `tasks/qa/` (cap 3), `tasks/completed/`, `tasks/archive/`.
+- Implementation work starts only with the task file in `tasks/in-progress/`.
+- Move task files only via `git mv` (or filesystem `mv` if untracked). Never `mv` across lanes by hand-editing paths.
+- No `TODO.md` or `STATE.md`. Task files and this doc are the state.
+
+## 4. Zero-autonomous-commit (ZAC)
+
+- FORBIDDEN: `git add`, `git commit`, `git checkout`, `git push`. Denied in `opencode.json` permissions.
+- Staging only via `custom_context_stage_and_inject_diff`; unstaging only via `custom_context_unstage_files`.
+- Commits only via `custom_context_commit_and_clean_task`, and only after the Manager's explicit
+  "Approved for closure" / "Close task".
+
+## 5. End-of-task sequence
+
+1. `lint_task_file`, then `custom_context_stage_and_inject_diff` with the task path.
+2. `git mv tasks/in-progress/<file> tasks/qa/<file>`, update the `**File:**` header, re-lint, re-stage.
+3. Hand off to the Manager. Closure only through the tool in §4 after explicit approval.
+
+## 6. Skill loading rules
+
+- Load every skill named in the task's `<context_phase>` via the `skill` tool before planning.
+- Auto-load matrix (minimum): React/Vite → `react-vite`; Node API layers → `node-hexagonal-api`;
+  new task files → `task-generator`; closing/archiving → `archive-tasks`;
+  complex bug/deadlock/silent failure → `debug-instrumentation`;
+  implementation-producing input → `prompt-refactor` before planning.
+- `code-search` is not an installed skill here: use `custom_context` graph/tree/signature tools instead.
+
+## 7. Gatekeeper halt protocol
+
+- If an order violates any rule in this file or `docs/conventions.md`: HALT, emit
+  `⚠️ RULE VIOLATION WARNING` naming the broken rule, do not proceed.
+- Ambiguous ad-hoc orders: HALT and ask for clarification. Never guess intent.
+- Circuit breakers: same tool 5× with same args, reasoning drift, state divergence,
+  or 50+ steps without progress → HALT with `⚠️ CIRCUIT BREAKER` + recommended next step.
+
+## 8. Context bootstrapping
+
+- Before coding: load `project-memory`, check `.opencode/memory/index.md` if present
+  (absent here — fall back to `list_namespaces`/`search_memory`), and obey retrieved constraints.
+- Context via `custom_context` MCP tools (`get_directory_tree`, `read_source_files`,
+  `extract_signatures`, `build_graph`, `query_graph`, …). Never dump large files inline with native `read`.
+- Delegate heavy discovery to `cognitive-discovery` subagents (max 4 parallel).
+
+## 9. Buffer isolation
+
+- Work only inside this project root. Never touch parent dirs, `node_modules/`, or build output
+  (`bundles/`, `PIG/bundles/`, `Parse-Dashboard/public/bundles/`).
+- Living docs: when editing inside `src/` or `Parse-Dashboard/`, read the sibling `README.md`
+  and `DECISIONS.md` first; update them when contracts or decisions change.
+
+## 10. Shell protocol
+
+- Quote paths with spaces/special chars. Prefer dedicated tools over shell where one exists.
+- Verification runs start with the repo's own gates: `npm test` (jest, roots `src/lib`), `npm run lint`
+  (eslint). Record exact command + exit code in the task file. Never claim completion without evidence.
+- Keep the diff minimal: scoped edits only, no cleanup/refactor/docs beyond the requested scope.
diff --git a/CHANGELOG.md b/CHANGELOG.md
index d7472ef..083fb70 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -33,3 +33,8 @@ Details:
 [log_alpha]: https://github.com/parse-community/parse-dashboard/blob/alpha/changelogs/CHANGELOG_alpha.md
 [branch_release]: https://github.com/parse-community/parse-dashboard/tree/release
 [branch_alpha]: https://github.com/parse-community/parse-dashboard/tree/alpha
+
+## Internal
+
+- 2026-10-10: Adopted cognitive-lead structure (AGENTS.md, opencode.json, docs/conventions.md,
+  tasks/ Kanban lanes, src/ + Parse-Dashboard/ living docs). No behavior change.
diff --git a/Parse-Dashboard/DECISIONS.md b/Parse-Dashboard/DECISIONS.md
new file mode 100644
index 0000000..1f994ff
--- /dev/null
+++ b/Parse-Dashboard/DECISIONS.md
@@ -0,0 +1,3 @@
+# DECISIONS.md — Parse-Dashboard/
+
+- 2026-10-10: Living-docs scaffold adopted (cognitive-lead). No behavior change.
diff --git a/Parse-Dashboard/README.md b/Parse-Dashboard/README.md
new file mode 100644
index 0000000..03ea164
--- /dev/null
+++ b/Parse-Dashboard/README.md
@@ -0,0 +1,7 @@
+# Parse-Dashboard/ — Express server
+
+- `app.js` — app factory; `server.js` — startup; `index.js` — CLI entry; `Authentication.js` — auth (T2).
+- `configKeyCache.js`, `CLIHelper.js`, `CLI/` — server support. `browser-control/` — has its own README.
+- `public/` — static assets (`public/bundles/` is build output, never hand-edit).
+
+Read `DECISIONS.md` in this folder before changing server contracts. Update both files on change.
diff --git a/opencode.json b/opencode.json
new file mode 100644
index 0000000..3078f5b
--- /dev/null
+++ b/opencode.json
@@ -0,0 +1,21 @@
+{
+  "$schema": "https://opencode.ai/config.json",
+  "permission": {
+    "bash": {
+      "git add*": "deny",
+      "git commit*": "deny",
+      "git push*": "deny",
+      "git checkout*": "deny"
+    }
+  },
+  "formatter": {
+    "prettier": {
+      "enabled": true
+    }
+  },
+  "linter": {
+    "eslint": {
+      "enabled": true
+    }
+  }
+}
diff --git a/src/DECISIONS.md b/src/DECISIONS.md
new file mode 100644
index 0000000..70e9acb
--- /dev/null
+++ b/src/DECISIONS.md
@@ -0,0 +1,3 @@
+# DECISIONS.md — src/
+
+- 2026-10-10: Living-docs scaffold adopted (cognitive-lead). No behavior change.
diff --git a/src/README.md b/src/README.md
new file mode 100644
index 0000000..f56fb1c
--- /dev/null
+++ b/src/README.md
@@ -0,0 +1,9 @@
+# src/ — React frontend
+
+- `components/` — reusable UI units (`*.react.js` + `*.scss`; `*.example.js` feeds the PIG guide).
+- `dashboard/` — routed views (Data, Push, Settings, Analytics).
+- `lib/` — framework-agnostic helpers; `lib/stores/` — Flux-style stores; `lib/tests/` — jest suites.
+- `login/`, `quickstart/`, `icons/`, `stylesheets/`, `context/` — supporting modules.
+- Guide: `src/dashboard/Dashboard.js` is the view root; `src/lib/` has no React imports by convention.
+
+Read `DECISIONS.md` in this folder before changing contracts. Update both files on change.
```
<!-- END_GIT_DIFF -->
