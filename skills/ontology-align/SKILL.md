---
name: ontology-align
description: Reconcile synonyms, homonyms and cross-domain identities without silent semantic merges.
---

# ontology-align

**Use when:** Two templates, repositories, teams or documents describe similar-looking entities or conflicting terms.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Source concepts and their definitions/locators
- Target ontology types and existing mappings
- Known identity keys and review authority

## Procedure

1. Classify each mapping as exactMatch, broaderThan, narrowerThan, relatedTo or conflict; do not collapse these distinctions.
2. Distinguish same label/different meaning (Kafka Topic vs Discussion Topic), same entity/multiple aliases, and different entities sharing a name.
3. Create an explicit mapping table with source, target, condition, confidence, evidence and reviewer.
4. Run a collision check on all composed schema definitions and reject silent overrides.
5. Send unresolved identity questions to ontology-resolve; submit breaking semantic changes to ontology-evolve.

## Deliverables

- alignment-mapping.json
- mapping-decisions.md
- unresolved-collisions.md

## Acceptance gates

- Exact matches require equivalent meanings and constraints.
- No automatic merge by name or embedding similarity alone.
- Every rejected or deferred mapping has rationale.

**Next:** ontology-resolve or ontology-model. Use only the necessary skills; avoid rigid full-pipeline reruns.
