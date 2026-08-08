# Buggy calculator fixture

This deliberately small project contains two defects:

1. A compile error in `src/calculator.cpp`.
2. A behavioral error in division that becomes visible after the compile error is fixed.

The workshop agent should use build and test evidence rather than guessing.

An optional extension is to add a `median` operation for a non-empty vector of doubles.

