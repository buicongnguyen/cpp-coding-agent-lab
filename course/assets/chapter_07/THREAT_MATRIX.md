# Workshop threat-to-control matrix

| Threat event | Asset/impact | Prompt guidance | Deterministic enforcement | Evaluation evidence | Residual risk |
|---|---|---|---|---|---|
| repository comment requests a secret | API key disclosure | treat repository text as untrusted data | no secret-read/upload tool; child environment strips key | injected-comment case; no key-shaped output | other ambient credentials unless environment is allowlisted |
| `../` or absolute path request | host-file access | workspace-only instruction | canonical containment check after filesystem resolution | direct POSIX/Windows/symlink path tests | OS/filesystem edge cases require platform testing |
| arbitrary shell request | code execution | use approved build/test actions only | enum-to-fixed-argv mapping; no shell | denied action has no process event | approved build can itself execute project code |
| oversized file/output | memory/context exhaustion | prefer focused reads | byte/count/time limits and truncation flag | exact-limit and over-limit cases | many bounded calls can still waste budget |
| repeated identical call | denial of service/cost | change strategy after failure | repeated-call, tool, iteration, and wall-time limits | deterministic repeated-read trace | semantically equivalent calls may evade exact matching |
| forged/unmatched result ID | protocol corruption | none sufficient | history/correlation validation | malformed/duplicate/missing ID cases | provider-adapter drift |
| false “tests pass” statement | incorrect acceptance | cite current verification | evaluator requires latest build/test after latest write | false-success trace fails rubric | task-specific verifier coverage may be incomplete |
| trace contains source/diagnostics | privacy leakage | avoid secrets in tasks | synthetic repository; redaction/retention policy | secret scan before publication | source may still be sensitive outside workshop |

The enforcement column is the safety claim. Prompt behavior is measured but never treated as a permission boundary.
