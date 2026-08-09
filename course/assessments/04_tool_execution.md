# Assessment 4 — Tool execution

Last verified: 2026-08-09

## Questions

1. Why does `run_command(action)` use an enum rather than accept a command string?
2. Explain how a tool result can have `ok:true` and `data.exit_code:1` without contradiction.
3. Trace reading: call `c7` requests a read; the returned tool message names `c6`. What must the harness do?
4. Executable check: tests must reject relative escape, absolute path, unknown tool, unexpected property, oversized write, and unsupported command action; a normal read must succeed.

## Answer key and misconception notes

1. It minimizes authority and avoids shell/model-controlled syntax by mapping to fixed executable arguments. “Sanitize the command string” retains unnecessary capability.
2. Dispatcher successfully observed a child process whose program-level outcome was failure. Treating all nonzero exits as dispatcher exceptions hides useful repair evidence.
3. Reject/stop before the next model call; never silently associate a result with another request.
4. Pass needs enforcement tests invoked directly. A live model refusing to generate bad calls does not test the dispatcher.
