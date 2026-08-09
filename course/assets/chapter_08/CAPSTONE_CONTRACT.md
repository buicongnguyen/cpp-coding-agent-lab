# Capstone contract

Pair: ____________________  Operator first: __________  Reviewer first: __________

Baseline commit/content hash: ____________________

Isolated workspace path label (no personal path in shared report): __________

Baseline build/test command and outcome: _________________________________

## Narrow requirement

Add or improve `list_files`: require a string `path` argument (`.` means workspace root), reject additional properties, list regular files below that workspace-relative directory, prevent escape, sort deterministically, limit output, and return the standard envelope. Successful data contains `files`, `count`, and `truncated`; it does not invent a result `path` field. Register the tool and test normal, missing-path, escape, exact-limit, and over-limit behavior.

Allowed files/directories: _______________________________________________

Explicitly forbidden scope: provider credentials, arbitrary shell/network tools, unrelated refactors, build artifacts, and the active instructor repository.

Verification required after the latest write:

- focused unit tests;
- complete deterministic test suite;
- build result;
- normal, escape, and exact/over-limit cases;
- diff/status review and evidence-backed final report.

Budgets: iterations ____  tool calls ____  wall time ____  repeated identical calls ____

Stop immediately on: baseline failure, path/command policy denial, secret-shaped output, budget exhaustion, or a change outside agreed scope.
