# Checkpoint 08 — Capstone solution

## Capability

`list_files(path)` lists bounded regular files below a workspace-relative directory, ignores symlinks, limits entries, and returns the standard envelope.

## Learner task

Have the agent inspect its own isolated source copy and implement the capability. Review the diff before building.

## Release gate

The reference tool-boundary test passes, including path escape and output-limit behavior, and the complete reference build remains green.

