---
name: ontology-resolve
description: Resolve instance identities, aliases, duplicate records and ambiguity with an auditable merge policy.
---

# ontology-resolve

**Use when:** Multiple data sources may reference the same person, ticket, API, service or decision.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Candidate nodes with source references and stable identifiers
- Domain-specific identity rules and alias evidence
- Conflicting identity groups requiring review

## Procedure

1. Normalize identifiers without changing their semantic scope (repository/branch, tenant, time, environment, account).
2. Use deterministic keys before probabilistic similarity. Require independent evidence for a high-risk merge.
3. Classify duplicate candidates as same, possibleSame, distinct, or unresolved; never auto-merge on names only.
4. Maintain a merge log with before/after IDs, evidence, reviewer, timestamp and rollback plan.
5. Preserve source record IDs and aliases; provide a stable canonical ID only after sufficient justification.

## Deliverables

- identity-map.json
- merge-review-queue.json
- resolution-report.md

## Acceptance gates

- No cross-tenant or cross-environment identity merge.
- All nontrivial merges are reversible and reviewable.
- Unresolved candidates stay separate.

**Next:** ontology-link or ontology-verify. Use only the necessary skills; avoid rigid full-pipeline reruns.
