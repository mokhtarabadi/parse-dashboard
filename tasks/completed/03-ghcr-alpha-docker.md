# Task 03: Publish alpha Docker image to GHCR

**File:** `tasks/qa/03-ghcr-alpha-docker.md`
**Source:** manager
**Type:** improvement
**Status:** open

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

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->

```diff
diff --git a/.github/workflows/docker-alpha-ghcr.yml b/.github/workflows/docker-alpha-ghcr.yml
new file mode 100644
index 00000000..a51173e2
--- /dev/null
+++ b/.github/workflows/docker-alpha-ghcr.yml
@@ -0,0 +1,50 @@
+# Builds and publishes the dashboard image from alpha to GHCR.
+# No release branch involved; existing Docker Hub automation is untouched.
+
+name: docker-alpha-ghcr
+on:
+  push:
+    branches: [alpha]
+  workflow_dispatch:
+env:
+  REGISTRY: ghcr.io
+  IMAGE_NAME: ${{ github.repository }}
+jobs:
+  build:
+    runs-on: ubuntu-latest
+    timeout-minutes: 60
+    permissions:
+      contents: read
+      packages: write
+    steps:
+      - uses: actions/checkout@v4
+      - name: Set up QEMU
+        uses: docker/setup-qemu-action@v2
+      - name: Set up Docker Buildx
+        uses: docker/setup-buildx-action@v2
+        with:
+          install: true
+      - name: Log in to GHCR
+        uses: docker/login-action@v2
+        with:
+          registry: ${{ env.REGISTRY }}
+          username: ${{ github.actor }}
+          password: ${{ secrets.GITHUB_TOKEN }}
+      - name: Extract Docker metadata
+        id: meta
+        uses: docker/metadata-action@v4
+        with:
+          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
+          tags: |
+            type=raw,value=alpha
+            type=sha,prefix=alpha-
+      - name: Build and push Docker image
+        uses: docker/build-push-action@v3
+        with:
+          context: .
+          platforms: linux/amd64,linux/arm64/v8
+          cache-from: type=gha
+          cache-to: type=gha,mode=max
+          push: true
+          tags: ${{ steps.meta.outputs.tags }}
+          labels: ${{ steps.meta.outputs.labels }}
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 7f185381..8e7567e8 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -39,3 +39,4 @@ Details:
 - 2026-10-10: Adopted cognitive-lead structure (AGENTS.md, opencode.json, docs/conventions.md,
   tasks/ Kanban lanes, src/ + Parse-Dashboard/ living docs). No behavior change.
 - 2026-10-11: Experiments control room completed (composer, editable target/start, validation warnings, arm preview, compare states; pure src/lib bucket-preview helper). No behavior change outside the Experiments page.
+- 2026-10-11: Alpha Docker publishing to GHCR added (docker-alpha-ghcr workflow, no release involvement).
```

<!-- END_GIT_DIFF -->
