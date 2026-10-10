# src/ — React frontend

- `components/` — reusable UI units (`*.react.js` + `*.scss`; `*.example.js` feeds the PIG guide).
- `dashboard/` — routed views (Data, Push, Settings, Analytics).
- `lib/` — framework-agnostic helpers; `lib/stores/` — Flux-style stores; `lib/tests/` — jest suites.
- `login/`, `quickstart/`, `icons/`, `stylesheets/`, `context/` — supporting modules.
- Guide: `src/dashboard/Dashboard.js` is the view root; `src/lib/` has no React imports by convention.

Read `DECISIONS.md` in this folder before changing contracts. Update both files on change.
