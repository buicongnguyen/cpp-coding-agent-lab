# Live-provider gate runbook

This runbook executes the production plan's E1–E5 live-capable subset three times each. It does not turn a model response into a passing result automatically.

## Before spending provider credit

1. Choose the dated primary or fallback candidate in `MODEL_SELECTION.md`.
2. Configure an instructor-only OpenRouter project, spend limit, and alerts.
3. Build the canonical reference and pass deterministic CTest plus E1–E7.
4. Copy no proprietary project into the run; the script creates disposable fixtures under ignored `course/run/`.
5. Set credentials only in the current process environment.

PowerShell example from the repository root:

```powershell
$env:OPENROUTER_API_KEY = '<instructor-session-secret>'
$env:OPENROUTER_MODEL = 'openai/gpt-5.4-mini'
./course/scripts/run-live-gates.ps1 -BuildDirectory course/reference/build -Trials 3
```

To inspect the exact 15-run plan without a key, network request, or charge:

```powershell
./course/scripts/run-live-gates.ps1 -DryRun -Trials 3
```

## Review and promotion

The runner writes raw, unreviewed material only beneath ignored `course/run/live-gates/`. For every trial, a second person must:

- verify requested and returned models;
- evaluate the case-specific assertions against the JSONL trace;
- distinguish model variability from routing, provider, transport, and harness failure;
- scan both JSONL and console output for credentials, personal paths, and proprietary content;
- record the reviewer and review date;
- retain failures rather than selecting only favorable trials.

Only after all 15 trials are reviewed may a sanitized representative provider trace replace `demos/live_provider_trace_template.jsonl`, and only after both candidates pass preflight may `DELIVERY_GATES.md` call the fallback tested. Unreviewed output must never be committed.
