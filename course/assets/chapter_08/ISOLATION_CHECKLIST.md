# Capstone isolation checklist

Before agent execution:

- [ ] Use a disposable copy/container or purpose-built worktree; record the exact baseline.
- [ ] Confirm the target status has no unrelated modifications or untracked sensitive files.
- [ ] Run baseline build/tests and stop if they are not green.
- [ ] Use a fixed build directory inside the disposable target.
- [ ] Confirm no real credentials are present in files, prompts, child environment, or sample logs.
- [ ] Record allowed paths, commands, limits, approval owner, and recovery location.
- [ ] Remember: a Git worktree separates files but is not a process/security sandbox.

Before accepting:

- [ ] Inspect `git status --short`, diff stat, and the complete relevant diff.
- [ ] Check generated binaries, untracked files, renames, and file-mode changes separately.
- [ ] Match each requirement to code and at least one test/evidence item.
- [ ] Verify build/tests occurred after the latest source write.
- [ ] Classify every failure or rejected action.
- [ ] Keep, amend, or discard explicitly; do not merge/push from this lab workflow.
