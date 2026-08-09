# Capstone recovery runbook

This runbook is documentation, not an automatic deletion script.

1. Stop the agent and preserve the bounded trace outside the disposable target.
2. Record stop reason, last accepted baseline, status, and diff. Redact personal paths and secrets.
3. If the baseline was already failing, discard attribution and restart from the supplied clean checkpoint.
4. If a policy boundary was attempted, do not loosen it to make the demo pass. Classify the request and use deterministic fallback evidence.
5. If the diff is coherent but verification fails, keep the isolated copy for bounded diagnosis or reset by creating a new disposable copy from the recorded baseline.
6. If scope, credentials, or host safety are uncertain, quarantine the copy and stop. Do not execute generated code.
7. Prove recovery by running status/build/tests in the fresh copy before resuming.

Recovery evidence:

```text
incident/stop reason:
trace retained at:
baseline identity:
copy retained or discarded:
fresh-copy creation method:
fresh baseline build/test:
next safe step:
```
