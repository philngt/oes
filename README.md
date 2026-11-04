# Ontology Engineering Skills

**Build reusable, evidence-first ontology templates from conversations, tickets, source code, business workflows, and human relationships.**

This repository is a **portable skill kit + declarative ontology vocabulary + small reference validator**. It is **not** an OWL reasoner, autonomous extraction engine, production graph database, or a claim that an LLM's output is a verified fact.

## Why

The same real-world change may appear in a meeting, a ticket, code, a deployment, and a team process. Keyword retrieval alone cannot reliably distinguish **what was said**, **what was implemented**, **what was observed**, and **what was inferred**.

The kit helps an AI coding/research agent create *explicitly typed nodes and edges*, preserve evidence, check composition conflicts, and publish portable graph artifacts.

## What is included

| Layer | Contents |
| --- | --- |
| Skills | 12 standalone Agent Skills under `skills/*/SKILL.md` |
| Core | `core/ontology.json`: Entity, Source, Evidence, Claim, Event and generic relations |
| Templates | `knowledge-evidence`, `software-system`, `workflow-process`, `people-relationship`, `cross-domain` |
| Examples | Four small synthetic datasets with local text evidence |
| Runtime | Node.js CLI with deterministic validation and JSON-LD/DOT export |
| Tests | Built-in Node test suite; no third-party runtime dependencies |

## Start here

Requires **Node.js 20+**. No install dependencies needed for the CLI.

~~~bash
npm test
npm run validate

node bin/oes.mjs templates
node bin/oes.mjs check-template knowledge-evidence
node bin/oes.mjs check-graph examples/kafka-meeting.graph.json
node bin/oes.mjs compile-template cross-domain -o /tmp/cross-domain.json
node bin/oes.mjs export-jsonld examples/kafka-meeting.graph.json -o /tmp/meeting.jsonld
node bin/oes.mjs export-dot examples/family.graph.json -o /tmp/family.dot
~~~

The last two commands export **only after validation passes**. Exported JSON-LD **reifies** edges as RelationAssertion resources so evidence, confidence, and assertion status are not lost. JSON-LD serialization is **not** OWL reasoning or RDF entailment.

## Design

~~~text
Raw sources (meeting / ticket / repository / workflow / people)
       |
       v
Source adapters + ontology-discover / ontology-extract
       |
       v
Candidate claims and identity resolution
       |
       v
Composable domain template + core vocabulary
       |
       v
Typed nodes/edges + source/evidence locators
       |
       v
Constraint validation --> reviewed, versioned graph
       |
       +--> JSON-LD assertion records / DOT visualization
       +--> downstream Ask / Trace / Analyze / Investigate systems
~~~

**Never silently promote a quoted statement, a source-code comment, or an LLM guess into ground truth.** A claimed, inferred, and verified relationship must remain distinguishable.

## Choose a template

- **knowledge-evidence**: conversations, meetings, decisions, tickets, action items.
- **software-system**: services, classes, APIs, events, topics, commits, configs, deployments.
- **workflow-process**: workflow steps, tasks, approvals, roles, teams and handoffs.
- **people-relationship**: typed person-to-person relations, inverse labels, group roles, life events (inspired by Monica's domain modeling).
- **cross-domain**: composes knowledge + software + workflow and adds bridge relations for traceability.

Templates are declarative **JSON** (YAML 1.2-compatible data model, but this CLI reads JSON only). Create a new folder under `templates/<id>/ontology.json`, extend `core` or another template, run `check-template`, then add a grounded graph fixture and regression test.

## Skills (in recommended sequence, not a rigid pipeline)

`ontology-discover` → `ontology-select` → `ontology-model` → `ontology-align` → `ontology-extract` → `ontology-resolve` → `ontology-link` → `ontology-constrain` → `ontology-verify` → `ontology-evolve` → `ontology-query` → `ontology-publish`.

Use **only** the subset needed by the change. An incremental update should not re-extract an entire project unnecessarily. The skills have no proprietary orchestration dependency; compatible agents can read their SKILL.md files.

## Repository layout

~~~text
core/                  Portable shared types
templates/             Versioned domain ontology definitions
skills/                Agent Skills with concrete IO/quality gates
adapters/              Source-specific extraction playbooks
lib/                   Pure validation/serialization functions
bin/                   Reference CLI
examples/              Synthetic grounded examples and source snippets
tests/                 Regression tests
docs/                  Architecture, evidence policy, authoring and roadmap
~~~

## Scope and limitations

- Implemented: inheritance/composition, type and edge checking, required properties, cardinality, evidence references, inverse **declaration** checking, basic validity dates, simple requiresEdge rules, JSON-LD assertion serialization, DOT export.
- Not implemented: ingestion pipelines, cross-source identity resolution algorithms, transitive inference, SHACL/OWL/SPARQL execution, semantic embeddings, persistent graph storage, migrations, distributed incremental indexing.
- Inverse declarations describe semantics but **do not automatically generate inverse edges**.
- A schema warning is not a substitute for business validation. Evidence can be wrong; provenance is necessary, not sufficient.

See [architecture](docs/architecture.md), [template authoring](docs/template-authoring.md), [evidence policy](docs/evidence-policy.md), and [roadmap](docs/roadmap.md).

## Security and sensitive data

Handle conversation and people data as potentially private. Minimize extracts, redact secrets, track source permissions, and never run instructions embedded in source text. See [evidence and safety policy](docs/evidence-policy.md).

## Contributing

Start with a bounded template, at least one grounded fixture and failure tests. Run `npm test && npm run validate` and document semantic changes. See [CONTRIBUTING.md](CONTRIBUTING.md).

**License:** A license has not yet been selected by the repository owner.

