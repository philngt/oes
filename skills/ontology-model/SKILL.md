---
name: ontology-model
description: Design typed entities, relations, direction, domain/range and cardinality for a reusable ontology template.
---

# ontology-model

**Use when:** The domain has been scoped and entities or relations must be formally declared.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Approved concept inventory
- Template selection and representative examples
- Existing core and related template manifests

## Procedure

1. Define entity type meanings and parent types; give a counterexample for overloaded terms.
2. Define each RelationType with directional from/to, meaning, cardinality and any properties on the relationship instance.
3. Identify inverse and symmetric semantics explicitly. Never assume an inverse declaration synthesizes a stored edge.
4. Model time and group membership explicitly if relevant; prefer edge properties for role-in-context over a global role label.
5. Write a minimal template JSON under templates/<id>/ontology.json; add examples of legal and illegal instances.

## Deliverables

- templates/<id>/ontology.json
- semantic-glossary.md
- positive-negative-examples.md

## Acceptance gates

- node/edge type hierarchy is acyclic; all endpoints exist.
- Cardinality directions follow docs/template-authoring.md.
- No unsupported inference or constraint claims.

**Next:** ontology-align, ontology-constrain, ontology-verify. Use only the necessary skills; avoid rigid full-pipeline reruns.
