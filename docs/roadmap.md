# Roadmap

## Current foundation

- Shared evidence-first primitives and reusable typed relationship contracts.
- Four domain templates, a shared agents vocabulary and one cross-domain composition.
- Twelve agent skills with explicit inputs, procedures, quality gates and handoffs.
- Deterministic template/graph validation and synthetic grounded fixtures.
- DOT and JSON-LD assertion-record export; tests for composition conflicts and invalid graphs.
- Described relation meanings, explicit identity/attribution/work bridges and a static cross-domain trace, with bounded competency-question tests. See [template contracts](template-contracts.md).
- Narrow executable meeting/Git adapters and exact local evidence/hash checks.

## P1 — next bounded outcome

- Prove one feature's requirement → implementation → verification trace with explicit definition-versus-execution semantics. Add only the criterion/test-run or step-execution types needed for that question.
- Preserve identity, assertion status and exact evidence through a versioned Product Graph mapping and a reviewable proposal with a base graph revision. No importer is shipped yet.
- Add validator capabilities from failing fixtures: scoped identity keys, unknown-property warnings and temporal cardinality when the trace requires them. Define distinct-target counting, interval boundaries and assertion scope before implementation.
- Keep template compatibility and migrations reviewable; do not rename relations or change required fields silently. The first manual plan is in [compatibility notes](semantic-foundation-compatibility.md).

## P2 — advanced

- CLI scaffolding, a general competency-query runner and complete DSL JSON Schema validation.
- Additional source adapters, a human identity/conflict review queue and incremental re-extraction.
- Broader work-management and organization vocabularies, full RACI or parameterized people relationships when a consumer needs them.
- Query contracts and path trace explainability with access-control propagation.
- SHACL shapes and RDF/OWL import/export mappings with formally documented semantics.
- Rule-based inverse/transitive inference with provenance/explanation and confidence calibration.
- Durable graph storage and temporal queries (including validity intervals).
- Domain-specific eval datasets and regression suites for extraction quality.

## Non-goals

- Replacing a source-of-truth application database.
- Automatically determining truth from LLM output.
- Requiring every team to adopt a single ontology for every domain.
- Making extraction or model generation mandatory for small incremental changes.

Use the shortest skill sequence that solves the actual user task.

