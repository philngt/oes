# Roadmap

## P0 — delivered in this starter kit

- Shared evidence-first primitives and reusable typed relationship contracts.
- Four domain templates and one cross-domain composition.
- Twelve agent skills with explicit inputs, procedures, quality gates and handoffs.
- Deterministic template/graph validation and synthetic grounded fixtures.
- DOT and JSON-LD assertion-record export; tests for composition conflicts and invalid graphs.

## P1 — next

- CLI scaffolding and JSON Schema validation for every DSL document.
- Schema compatibility/change classification and versioned migration bundles.
- Deterministic source adapters with source fingerprinting and stable IDs.
- Human review queue for entity resolution and contradictory claims.
- Incremental re-extraction per changed source span.

## P2 — advanced

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

