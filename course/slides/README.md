# Facilitator deck

`Coding_Agent_Workshop.pptx` is the release artifact. It contains 70 slides in the planned `6/8/8/8/10/10/6/8/6` chapter allocation and a `[Sources]` block in every notes page.

`build_deck.mjs` is retained as generation provenance for maintainers. It imports `@oai/artifact-tool` from the presentation runtime bundled with OpenAI Codex; that dependency is not declared as a public standalone npm toolchain in this repository. Do not describe the script as a one-command public rebuild. A maintainer with that runtime can export the deck to an absolute `.pptx` path; other contributors should treat the checked-in PowerPoint as canonical.

Before release, render every slide, run an overflow scan, inspect the full-deck montage, and confirm the exact slide/notes counts. The strict course verifier independently opens the PPTX archive and checks those structural counts.
