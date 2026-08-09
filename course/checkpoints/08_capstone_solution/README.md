# Checkpoint 08 — Capstone solution

## Capability

`list_files(path)` lists bounded regular files below a workspace-relative directory, ignores symlinks, limits entries, and returns the standard envelope.

## Learner task

Have the agent inspect its own isolated source copy and implement the capability. Review the diff before building.

## Release gate

The reference tool-boundary test passes, including path escape and output-limit behavior, and the complete reference build remains green.

## Materialize

Run `node course/scripts/checkpoints.mjs materialize 08_capstone_solution starter` from the repository root. Confirm `list_files` is absent in the starter, then inspect `answer.patch` only after producing or reviewing a learner diff. The `solution` variant must match the canonical reference byte-for-byte.
