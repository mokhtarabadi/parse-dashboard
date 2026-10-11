# Task 001: A/B experiments review — verify, fix, release

**File:** `tasks/backlog/001-ab-experiments-review.md`
**Source:** manager
**Type:** review
**Status:** open

## Goal

Verify the Experiments control room in this dashboard fork, fix gaps, rebuild + push the image.

## Review checklist (from graph + code review)

- [ ] `src/dashboard/Settings/ExperimentsSettings.react.js`: framework toggle, traffic presets, narrowing CONFIRM guard, kill flow, compare table, loading/empty/error/retry states
- [ ] Route + sidebar entry registered; master-key REST path (same as Config page), no dashboard-server changes
- [ ] `src/lib/abBucketPreview.js`: preview math identical to server/SDK vectors 86/56/60
- [ ] Validation warns on missing keys, bad percentages, bad dates before save
- [ ] Rebuild image, push, confirm Experiments view live in deployed dashboard

## Verification Evidence

- **Test command:** existing dashboard test suite + manual view check
- **Expected result:** green, view live
- **Actual result:** _(fill)_
- **Exit code:** _(fill)_

## Definition of Done

- [ ] Tests green, image pushed and view verified live

## Risk & Rollback

- **Risk:** separate deploy drift from upstream
- **Rollback plan:** previous image tag

## Execution Log & Reasoning

_(log here)_

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
<!-- END_GIT_DIFF -->
