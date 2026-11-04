---
name: ontology-discover
description: Discover candidate concepts, relations and competency questions from a bounded domain or evidence corpus.
---

# ontology-discover

**Use when:** A user brings an unfamiliar domain, mixed notes, product requirements, or a new collection of raw sources.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Domain purpose and explicit scope/non-goals
- Versioned source inventory with allowed access
- Five or more competency questions or questions to elicit

## Procedure

1. List authoritative and secondary sources, versions, owners and access constraints; label unknown sources rather than guessing.
2. Extract a concept inventory with term, definition, synonym, negative example, tentative entity/relation classification and a pinpoint source locator.
3. Separate *what the source says* from *what the analyst concludes*; record contradictions and ambiguous terms as unresolved claims.
4. Formulate 5–10 competency questions that a typed knowledge graph must answer, and test each against representative evidence.
5. Recommend domain boundaries and a handoff to ontology-select; do not choose storage technology yet.

## Deliverables

- concept-inventory.md
- competency-questions.md
- source-register.json
- ambiguities.md

## Acceptance gates

- Every nontrivial discovered claim has a retrievable source/locator.
- No inferred person or service identities are accepted without review.
- Scope excludes unnecessary personal or sensitive data.

**Next:** ontology-select or ontology-model. Use only the necessary skills; avoid rigid full-pipeline reruns.
