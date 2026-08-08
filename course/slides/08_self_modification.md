# Slide outline 8 — Self-modification capstone

Last verified: 2026-08-08 | Target: 6 slides

1. **Prediction:** does the running agent rewrite its binary?
2. **Ordinary mechanism:** isolated repo read → edit → later build/test.
3. **Vertical feature slice:** schema, adapter, dispatcher, envelope, trace, tests.
4. **Prediction:** is compilation sufficient evidence?
5. **Evidence ladder:** diff → build → existing tests → focused tests → safety tests → human decision.
6. **Capstone rubric:** narrow change, verified behavior, classified failures, keep/amend/discard.

Show the complete solution only after learner diff review; keep a recorded deterministic fallback.
