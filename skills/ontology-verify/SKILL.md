---
name: ontology-verify
description: Validate compiled ontology templates and evidence graphs, review conflicts, and report residual risks.
---

# ontology-verify

**Use when:** A template or graph is to be accepted, reviewed, published or used by an AI agent.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Compiled or source ontology template
- Candidate evidence graph and source references
- Required acceptance criteria

## Procedure

1. Run npm test and npm run validate; for local changes run check-template and check-graph with explicit IDs.
2. Inspect all error and warning diagnostics and verify source locators are reachable and access-authorized.
3. Challenge asserted or inferred edges against source meaning; verify contradiction handling, type compatibility and temporal scope.
4. Run at least one negative fixture for the changed semantics and a cross-template compatibility test when composing domains.
5. Record the pass/fail status and residual limitations; do not claim factual truth or OWL compliance from structural validation.

## Deliverables

- validation-report.md
- diagnostics.json
- review-signoff.md

## Acceptance gates

- Zero unexplained errors; warnings have disposition.
- Citations/locators correspond to actual versions of sources.
- Regression tests pass and do not overwrite unrelated data.

**Next:** ontology-publish or ontology-evolve. Use only the necessary skills; avoid rigid full-pipeline reruns.
