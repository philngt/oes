---
name: ontology-select
description: Choose and safely compose ontology domain templates using competency questions, not file formats alone.
---

# ontology-select

**Use when:** There are competency questions and source types, but no agreed ontology template boundary.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Concept inventory and competency questions
- Existing templates in templates/*/ontology.json
- Cross-domain query and ownership requirements

## Procedure

1. Match the *meaning* of competency questions to knowledge-evidence, software-system, workflow-process or people-relationship.
2. Prefer one template; compose through extends only when a consumer needs cross-domain traversal such as meeting → ticket → commit.
3. Use core only for universal identity/evidence primitives. Avoid putting Person, Topic, Step or Service into core.
4. Check every shared type/relation for identical semantics, domain/range, inverse and cardinality. Rename homonyms (e.g., Topic vs BrokerTopic) rather than silently overriding.
5. Record why each template was chosen, what is explicitly excluded, and what bridges require additional evidence.

## Deliverables

- selection.md
- composition-plan.json
- compatibility-risks.md

## Acceptance gates

- No ambiguous vocabulary collisions.
- Every bridge relation has a concrete competency question.
- No template dependency cycle.

**Next:** ontology-model and ontology-align. Use only the necessary skills; avoid rigid full-pipeline reruns.
