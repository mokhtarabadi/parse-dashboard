# AGENTS.md — parse-dashboard (cognitive-lead)

> Entry point. Read this file first on every task. Then read `docs/conventions.md` and `opencode.json`.
> If `DESIGN.md`, `docs/architecture.md`, or `docs/data_model.md` exist, read them too.
> All three are currently absent here — skip gracefully, never invent their contents.

## 1. First-read rule

- Absolute first action: read this `AGENTS.md`.
- Then read `docs/conventions.md` and `opencode.json` (both exist at root).
- `DESIGN.md` / `docs/architecture.md` / `docs/data_model.md`: read only if present.

## 2. Core file locations

- `opencode.json` — tool permissions, formatter (prettier), linter (eslint). Root only.
- `docs/conventions.md` — formatting, lint, test, commit rules.
- `src/` — React frontend (components, dashboard, lib, login). `Parse-Dashboard/` — Express server.
- `tasks/` — Kanban state. `CHANGELOG.md` + `changelogs/` — releases (semantic-release, do not hand-edit versions).
- Never create `.opencode/` scaffolding: it does not exist here.

## 3. Kanban dirs

- Lanes: `tasks/backlog/`, `tasks/in-progress/` (WIP), `tasks/qa/` (cap 3), `tasks/completed/`, `tasks/archive/`.
- Implementation work starts only with the task file in `tasks/in-progress/`.
- Move task files only via `git mv` (or filesystem `mv` if untracked). Never `mv` across lanes by hand-editing paths.
- No `TODO.md` or `STATE.md`. Task files and this doc are the state.

## 4. Zero-autonomous-commit (ZAC)

- FORBIDDEN: `git add`, `git commit`, `git checkout`, `git push`. Denied in `opencode.json` permissions.
- Staging only via `custom_context_stage_and_inject_diff`; unstaging only via `custom_context_unstage_files`.
- Commits only via `custom_context_commit_and_clean_task`, and only after the Manager's explicit
  "Approved for closure" / "Close task".

## 5. End-of-task sequence

1. `lint_task_file`, then `custom_context_stage_and_inject_diff` with the task path.
2. `git mv tasks/in-progress/<file> tasks/qa/<file>`, update the `**File:**` header, re-lint, re-stage.
3. Hand off to the Manager. Closure only through the tool in §4 after explicit approval.

## 6. Skill loading rules

- Load every skill named in the task's `<context_phase>` via the `skill` tool before planning.
- Auto-load matrix (minimum): React/Vite → `react-vite`; Node API layers → `node-hexagonal-api`;
  new task files → `task-generator`; closing/archiving → `archive-tasks`;
  complex bug/deadlock/silent failure → `debug-instrumentation`;
  implementation-producing input → `prompt-refactor` before planning.
- `code-search` is not an installed skill here: use `custom_context` graph/tree/signature tools instead.

## 7. Gatekeeper halt protocol

- If an order violates any rule in this file or `docs/conventions.md`: HALT, emit
  `⚠️ RULE VIOLATION WARNING` naming the broken rule, do not proceed.
- Ambiguous ad-hoc orders: HALT and ask for clarification. Never guess intent.
- Circuit breakers: same tool 5× with same args, reasoning drift, state divergence,
  or 50+ steps without progress → HALT with `⚠️ CIRCUIT BREAKER` + recommended next step.

## 8. Context bootstrapping

- Before coding: load `project-memory`, check `.opencode/memory/index.md` if present
  (absent here — fall back to `list_namespaces`/`search_memory`), and obey retrieved constraints.
- Context via `custom_context` MCP tools (`get_directory_tree`, `read_source_files`,
  `extract_signatures`, `build_graph`, `query_graph`, …). Never dump large files inline with native `read`.
- Delegate heavy discovery to `cognitive-discovery` subagents (max 4 parallel).

## 9. Buffer isolation

- Work only inside this project root. Never touch parent dirs, `node_modules/`, or build output
  (`bundles/`, `PIG/bundles/`, `Parse-Dashboard/public/bundles/`).
- Living docs: when editing inside `src/` or `Parse-Dashboard/`, read the sibling `README.md`
  and `DECISIONS.md` first; update them when contracts or decisions change.

## 10. Shell protocol

- Quote paths with spaces/special chars. Prefer dedicated tools over shell where one exists.
- Verification runs start with the repo's own gates: `npm test` (jest, roots `src/lib`), `npm run lint`
  (eslint). Record exact command + exit code in the task file. Never claim completion without evidence.
- Keep the diff minimal: scoped edits only, no cleanup/refactor/docs beyond the requested scope.
