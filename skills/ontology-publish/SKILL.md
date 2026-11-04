---
name: ontology-publish
description: Publish validated versioned ontology artifacts, export provenance-rich graphs and document integration contracts.
---

# ontology-publish

**Use when:** A reviewed ontology and graph must be made available to a consumer or versioned registry.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../docs/architecture.md), and the [evidence policy](../../docs/evidence-policy.md) before mutating a graph.

## Required inputs

- Validated compiled template and graph
- Version/compatibility notes
- Consumer format and access-control requirements

## Procedure

1. Run check-template and check-graph; stop on errors and record unresolved warnings.
2. Publish template ID/version and immutable or content-addressed graph snapshot metadata.
3. Export with export-jsonld (reified assertions) or export-dot (visualization), noting the formats' limitations.
4. Include evidence/source references and schema version; redact restricted excerpts before external distribution.
5. Document update and deletion semantics, consumer compatibility and next incremental update boundary.

## Deliverables

- versioned-ontology.json
- validated-graph.json
- export.jsonld or export.dot
- release-notes.md

## Acceptance gates

- No unverified success claim; all exports match validated data.
- Consumer access and privacy rules are respected.
- No implication that JSON-LD export performs OWL/RDF reasoning.

**Next:** downstream consumer or ontology-evolve. Use only the necessary skills; avoid rigid full-pipeline reruns.
