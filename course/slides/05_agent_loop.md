# Slide outline 5 — Agent loop

Last verified: 2026-08-08 | Target: 10 slides

1. **Prediction:** what must happen after the first read result?
2. **Minimal loop:** seven-line pseudocode, not implementation.
3. **Causal history invariant:** assistant call precedes correlated result.
4. **Four limits:** iterations, tools, consecutive repeat, wall clock.
5. **Prediction:** should a repeated file read always stop the run?
6. **Progress-sensitive repeat:** consecutive signature counter reset.
7. **Repair trace A:** inspect → configure → compile failure → syntax edit.
8. **Repair trace B:** build pass → test failure → behavior edit → test pass.
9. **Pathologies:** premature completion, thrashing, empty final, provider failure.
10. **Exit evidence:** final text beside latest build/test results.

Record a deterministic trace; label live paths as examples rather than scripts.
