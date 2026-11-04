---
name: ontology-link
description: Create typed, evidence-backed edges and cross-domain traceability while preserving uncertain assertions.
---

# ontology-link

**Use when:** Candidate nodes exist but their valid typed connections must be established.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Validated ontology template and resolved node IDs
- Evidence graph with source locators
- Accepted mapping decisions and temporal context

## Procedure

1. For every proposed connection, select an existing RelationType and verify direction, endpoint types and edge properties.
2. Attach evidenceIds, assertionStatus and confidence when defensible; include validFrom/validTo only when grounded.
3. Link decisions to tickets, commits, services and workflow steps only through explicit identifiers or corroborated evidence.
4. Treat inverse and symmetric metadata as semantic descriptions. Do not generate unexplained reverse edges.
5. Keep contradictions and competing claims rather than overriding existing records; run validation and record review needs.

## Deliverables

- typed-edges.json
- bridge-relations.json
- link-review.md

## Acceptance gates

- No dangling edge; no invalid domain/range.
- Every non-verified edge has Evidence linked to Source.
- No invented cross-domain links or fabricated causality.

**Next:** ontology-verify. Use only the necessary skills; avoid rigid full-pipeline reruns.
