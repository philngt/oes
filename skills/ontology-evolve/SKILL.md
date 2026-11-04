---
name: ontology-evolve
description: Plan versioned ontology changes and migrations without losing historical meaning or provenance.
---

# ontology-evolve

**Use when:** A type, relation, constraint or cross-domain mapping must change after data exists.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Old and new ontology versions
- Data usage, consumers, saved queries and extraction pipelines
- Samples of historical graph instances

## Procedure

1. Classify change as additive, compatible refinement or breaking semantic change.
2. Write a mapping for renamed/deprecated types, properties and edges; never reuse an ID for a different meaning.
3. Preserve old assertions and source versions, supporting parallel-read or migration views when needed.
4. Identify consumers and affected queries, tests, permissions and inference assumptions.
5. Run fixtures against both versions and propose rollback; do not re-extract unrelated sources.

## Deliverables

- migration-plan.md
- compatibility-matrix.md
- version-notes.md

## Acceptance gates

- No silent semantic redefinition.
- Historical evidence remains addressable.
- Rollback and consumer impact are documented.

**Next:** ontology-verify and ontology-publish. Use only the necessary skills; avoid rigid full-pipeline reruns.
