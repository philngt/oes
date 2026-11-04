---
name: ontology-query
description: Define competency-question-based semantic query and traversal contracts with provenance and authorization.
---

# ontology-query

**Use when:** An application or agent needs Ask, Trace, Analyze, Explain or impact results from an ontology graph.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Approved competency questions and graph schema
- Validated node/edge examples
- Access-control and provenance requirements

## Procedure

1. State each query's root entities, traversal relations, filters, time scope and maximum depth.
2. Return explanation paths with edge IDs, assertionStatus, evidence references and source versions; label hypotheses separately.
3. Specify deduplication, pagination, stale-source handling, tenancy isolation and unresolved-result behavior.
4. Use JSON graph traversal contracts first. Add SPARQL/Cypher only when a real backend and mapping exist.
5. Prepare golden query results and ensure that inferences are never silently presented as explicit facts.

## Deliverables

- query-contracts.json
- golden-query-cases.json
- consumer-guidance.md

## Acceptance gates

- Queries do not cross access boundaries.
- Every explanatory edge is traceable.
- No claims that the reference CLI implements a query server.

**Next:** ontology-publish or application integration. Use only the necessary skills; avoid rigid full-pipeline reruns.
