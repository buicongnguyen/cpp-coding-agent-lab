# Tool-result transcript worksheet

For each row, copy exact call/result IDs and classify authorization separately from execution outcome.

| Step | Message role | Call ID | Tool/action | Arguments valid? | Authorized? | Executed? | Envelope `ok` | Child exit | Error/stop code | Fresh evidence produced |
|---:|---|---|---|---|---|---|---|---:|---|---|
| 1 | assistant | | | | | | | | | |
| 2 | tool | | | | | | | | | |
| 3 | assistant | | | | | | | | | |
| 4 | tool | | | | | | | | | |

Protocol audit:

- Does every tool result identify exactly one preceding assistant call?
- Does every executed call have exactly one result, including failures?
- Was the assistant call retained in history before its result?
- Did any error disclose an absolute host path or secret?
- Did a write make an earlier read/build/test stale?
- For `ok:true` with nonzero child exit, what succeeded and what failed?
- What exact history is sent on the next model request?

Recovery decision: retry with corrected arguments / choose another approved tool / stop on policy / stop on budget / ask user. Explain using the recorded envelope rather than model prose.
