# Symbolic command policy

The model supplies one enum value; the harness selects a fixed executable, argument vector, working directory, timeout, output limit, and sanitized environment. No shell string is evaluated.

| Action | Fixed intent | Working directory | Default limit | Approval | Evidence returned |
|---|---|---|---:|---|---|
| `configure` | configure the fixture build tree | workspace root | 45 s / 64 KiB | course allowlist | action, exit code, bounded output, timeout/truncation |
| `build` | compile the configured fixture | workspace root | 45 s / 64 KiB | course allowlist | action, exit code, bounded output, timeout/truncation |
| `test` | run deterministic tests | workspace root | 45 s / 64 KiB | course allowlist | action, exit code, bounded output, timeout/truncation |
| anything else | no mapping exists | none | none | denied | structured `action_not_allowed`; no child process |

Policy invariants:

1. Workspace root is configured by trusted application code, never by model arguments.
2. Each action maps to an argument array and launches without a shell.
3. The child receives an explicit operating-system/toolchain environment allowlist; `OPENROUTER_API_KEY` and arbitrary parent variables are absent. Stronger deployments should also use a restricted identity and network boundary.
4. A child exit code of 1 can appear in an `ok:true` tool envelope: process observation succeeded while the build/test failed.
5. Timeout and truncation are explicit data, not inferred from missing text.
6. Approval denial and an `action_not_allowed` result are recorded without execution. Error codes are the lowercase stable strings emitted by the dispatcher.

This is invocation policy, not a general sandbox. Building untrusted code still requires disposable filesystem, restricted credentials, resource controls, and appropriate network isolation.
