---
name: ontology-constrain
description: Specify verifiable ontology invariants and acceptance criteria without confusing schema checks with truth.
---

# ontology-constrain

**Use when:** An ontology needs required relations, typing, cardinality or data-quality rules.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Ontology template and competency questions
- Positive and negative fixtures
- Business invariants and policy owners

## Procedure

1. Separate structural invariants (known types, required fields, cardinality) from semantic/business assertions and reasoning.
2. Use supported property rules (type, required, enum), RelationType cardinality, inverse declarations and requiresEdge constraints.
3. Set severity intentionally: error for invalid artifacts, warning for incomplete yet usable records.
4. Write negative fixtures that must fail and positive fixtures that must pass. State what the current runtime cannot enforce.
5. Record future SHACL/OWL rule requirements separately; do not put expressions in JSON and pretend they are executable.

## Deliverables

- ontology.json constraints
- negative-tests.md
- constraint-rationale.md

## Acceptance gates

- Every executable rule is supported by lib/engine.mjs.
- No rule silently changes the meaning of existing data.
- Policy-driven constraints have named ownership.

**Next:** ontology-verify. Use only the necessary skills; avoid rigid full-pipeline reruns.
