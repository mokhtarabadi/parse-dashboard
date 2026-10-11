# Task 03: Publish alpha Docker image to GHCR

**File:** `tasks/completed/03-ghcr-alpha-docker.md`
**Source:** manager
**Type:** improvement
**Status:** closed

## Goal

Build the dashboard image from the alpha branch and publish it to GitHub Container Registry, with no release-branch involvement.

## Manager's Notes

- Direct order, CI workflow path approved: new workflow builds multi-arch image on alpha pushes and pushes to GHCR with GITHUB_TOKEN (no extra secrets). Local build used for verification only. No commits or pushes by the agent; the Manager owns git ops. No local registry push without a separate login approval.

## Local TODOs

- [x] Add .github/workflows/docker-alpha-ghcr.yml (alpha push plus dispatch, GHCR login, multi-arch build and push)
- [x] Verify workflow YAML parses and local docker build passes
- [x] Append CHANGELOG internal line
- [ ] Stage, move to qa, hand off

## Acceptance Criteria

- [ ] Push to alpha (or manual dispatch) builds and pushes ghcr.io/mokhtarabadi/parse-dashboard:alpha without touching the release flow
- [ ] Existing Docker Hub release automation unchanged
- [ ] YAML valid, Dockerfile path verified by a local build

## Verification Evidence

- **Test command:** `docker build -t ghcr.io/mokhtarabadi/parse-dashboard:alpha-local .`
- **Expected result:** image builds clean (exit 0); workflow YAML parses
- **Actual result:** workflow YAML parses (push on alpha plus dispatch, one build job); `docker build` completed and the image exists locally (663 MB, amd64)
- **Exit code:** 0 (build manifest exported and named; image inspect confirms)

## Definition of Done

- [ ] Workflow file valid and minimal
- [ ] `lint_task_file` passes on the active task file
- [ ] `CHANGELOG.md` updated via Parse-Then-Append
- [ ] `verification-before-completion` applied and evidence recorded

## Risk & Rollback

- **Risk:** low. New workflow file only; existing release and Docker Hub automation untouched. Registry publish happens only on alpha push or manual dispatch.
- **Rollback:** delete the workflow file (Manager owns git ops).

---

## Execution Log & Reasoning

- 2026-10-11: task created per ad-hoc approval (CI workflow path). Environment verified: docker daemon OK, gh authenticated as mokhtarabadi, repo mokhtarabadi/parse-dashboard.
- 2026-10-11: Manager ordered close (quote: ok close task), moving to completed.

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
**Factual Git Diff:** Stored in Commit Hash: `5405b45ead99682ebf260bd093cac965ec880a63`
<!-- END_GIT_DIFF -->
