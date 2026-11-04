# Ontology Engineering Skills

**A reusable, domain-agnostic skill system for designing, validating, composing, and evolving semantic models from fragmented knowledge, existing software, and human processes.**

> **Thesis:** Do not build one universal ontology. Build a repeatable *ontology engineering capability* that can create many bounded ontologies, connect them when useful, and preserve why each relationship is believed to exist.

This project combines **agent-facing engineering skills**, **declarative ontology templates**, **source-adapter playbooks**, and a **small deterministic reference validator**. Its long-term ambition is to make ontology engineering repeatable for both humans and AI agents. **The current release (v0.1.0) is a starter kit, not an autonomous ontology builder or production knowledge-graph platform.**

## 1. Vision: why this exists

Important knowledge is fragmented across conversations, meeting notes, tickets, documents, code, configurations, and people. Those sources express different parts of the same reality:

- A meeting records **what people proposed or decided**.
- A ticket records **what someone is expected to do**.
- A commit records **what changed in code**.
- A deployment records **what was intended to run**, while telemetry may provide evidence of what *actually* ran.
- A workflow records **who is responsible for which action**.

Documents can be searched and embedded, but keyword or vector similarity alone does not establish identity, direction, roles, validity, causality, or truth. The central problem is **semantic fragmentation**, not merely missing search.

**Ontology Engineering Skills aims to turn scattered information into explicit, maintainable semantic contracts and evidence-linked knowledge representations.** It helps answer: *What entities exist? What do they mean? How may they relate? What supports each assertion? How do separate domains connect? What happens when their meaning changes?*

The goal is not to replace source systems. It is to make their meanings and connections usable for **Ask, Trace, Analyze, Explain, and eventually Investigate** workflows.

## 2. Five concepts that must not be confused

| Concept | Meaning | Example |
| --- | --- | --- |
| **Ontology** | The *semantic model*: types, definitions, allowed relationships, constraints, and agreed meanings | A `Decision` can be `recordedIn` a `Conversation` |
| **Knowledge Graph** | Particular entities and assertions represented using that model | Decision `D1` was recorded in meeting `M1` |
| **Ontology Template** | A reusable, versioned ontology package for a bounded domain | `software-system` or `workflow-process` |
| **Engineering Skill** | An agent-readable procedure for discovering, modeling, aligning, verifying, or publishing | `ontology-align`, `ontology-verify` |
| **Reference Engine** | Code that checks and exports supported graph artifacts deterministically | `lib/engine.mjs`, `bin/oes.mjs` |

A graph with typed nodes is not automatically a complete formal ontology. Conversely, an ontology can be developed before any instance graph exists. The current manifests are **lightweight semantic contracts**, not automatically OWL 2 ontologies.

### Separate schema from assertions

~~~text
ONTOLOGY / TEMPLATE                    INSTANCE / KNOWLEDGE GRAPH
-------------------                    --------------------------
Decision (entity type)                 Decision D1
Ticket   (entity type)                 Ticket T42
Commit   (entity type)                 Commit abc123

Commit --implementsTicket--> Ticket    abc123 --implementsTicket--> T42
Commit --decidedIn--------> Decision    abc123 --decidedIn--------> D1

Evidence and source locators are attached to instance assertions,
not substituted for definitions in the ontology itself.
~~~

## 3. Design philosophy

1. **Domain-agnostic, not domain-blind.** The skills should work for any well-scoped domain. Each domain nevertheless needs its own precise vocabulary and constraints; generic `Entity`/`Relation` alone is not enough.
2. **Template-driven, not template-locked.** Start with a reusable template if one fits. Otherwise discover and design a new one. A template is a starting contract, not an imposed universal schema.
3. **Composable, not monolithic.** Compose bounded ontologies through shared definitions and explicit bridge relations. Reject same-name/different-meaning collisions instead of silently merging concepts.
4. **Evidence-first, not extraction-first.** Keep **source content**, **evidence**, **claim**, **assertion**, **verification**, and **inference** distinguishable. A quoted statement is not automatically a verified fact.
5. **Incremental and evolvable.** A schema, relationship, or source may change independently. Preserve stable IDs, versioning and traceability; do not reprocess everything for every small change.
6. **Skills are capabilities, not a mandatory pipeline.** Apply only the relevant skills for the current task. A new domain needs discovery and modeling; a simple schema update may only need evolve → verify → publish.
7. **Portable by design.** Keep authored contracts and graph snapshots usable outside any one LLM, agent runtime, graph database, or UI.

These are engineering principles. Some have runtime support today; others are explicit targets in the [roadmap](docs/roadmap.md).

## 4. The system: four cooperating layers

~~~text
  INPUTS                         ENGINEERING CAPABILITIES
  ----------------------------   ---------------------------------
  Conversations / Meeting notes     Discover -> Model -> Align
  Tickets / Documents               Extract  -> Resolve -> Link
  Existing source code              Constrain -> Verify
  Processes / Human interactions    Evolve -> Query -> Publish
  New or custom domains             (choose only the needed skills)
               |                              |
               v                              v
       Source-adapter playbooks        Ontology templates
       and source locators             + shared core vocabulary
               |                              |
               +--------------+---------------+
                              v
                 Typed entities and assertions
                 + evidence + source provenance
                              |
                              v
                Deterministic validation
                              |
                              v
                Versionable graph artifacts
                 /                       \
        JSON-LD/DOT exports      Future graph/query consumers
~~~

**Boundary:** Adapter files currently describe extraction procedures; they do not run ingestion. Skills are agent instructions, not a hidden daemon. The CLI validates *supplied* JSON templates and graphs; it does not autonomously read a repository and discover an ontology.

### The smallest shared core

`core/ontology.json` defines `Entity`, `Source`, `Evidence`, `Claim`, and `Event`, together with shared relations such as `supportedBy` and `derivedFrom`.

Concrete concepts belong in domain templates. For example, **Person** belongs in a people ontology, **Service** in a software ontology, and **Step** in a workflow ontology. This prevents the shared core from becoming an unmaintainable universal business schema.

## 5. Create different ontologies from different kinds of knowledge

| Template | Appropriate sources | Questions it should help model |
| --- | --- | --- |
| [`knowledge-evidence`](templates/knowledge-evidence/ontology.json) | Chat, meeting notes, tickets, documents | Who said what? Which decision was recorded? What supports this claim? |
| [`software-system`](templates/software-system/ontology.json) | Repositories, APIs, configs, event schemas, deployments | Which service publishes an event? Which commit changes a config? |
| [`workflow-process`](templates/workflow-process/ontology.json) | SOPs, approvals, task histories, team interactions | Who owns a task? Which step follows another? Which policy governs it? |
| [`people-relationship`](templates/people-relationship/ontology.json) | Authorized contact records, groups, life events | Who belongs to which group, in what role? What is the direction of a relationship? |
| [`cross-domain`](templates/cross-domain/ontology.json) | A combination of the above | How does a decision connect to a ticket, commit, service or process step? |

The first four are **bounded domain templates**; `cross-domain` is a **composition** of knowledge, software, and workflow schemas with bridge relations.

These are **examples, not a closed catalog**. The same approach can support finance, scientific research, incidents, product design, asset lineage, healthcare, manufacturing or a domain not yet imagined.

### Domain A: fragmented conversations and decisions

A meeting may include statements, proposals, decisions, action items, and unresolved questions. The ontology must distinguish them; mentioning Kafka in a transcript does not mean the team decided to adopt it.

A source-grounded graph might include:

~~~text
Conversation --containsMessage--> Message
Decision     --recordedIn-------> Conversation
Decision     --supportedBy------> Evidence --(sourceId)--> Source
ActionItem   --assignedTo-------> Actor
~~~

See the [synthetic meeting source](examples/sources/kafka-meeting.md) and [example graph](examples/kafka-meeting.graph.json).

### Domain B: existing source code

A software ontology models repositories, services, classes, methods, APIs, event types, broker topics, configs, and deployments.

~~~text
Service --publishes----> EventType --carriedBy--> BrokerTopic
Commit  --changesConfig--> ConfigKey --configures--> Service
~~~

A method name or source-code comment is **not proof of a runtime call**. Code parsing, configuration evidence, and telemetry must be treated as different observations. See [software example](examples/software-kafka.graph.json).

### Domain C: workflows and human interaction

A workflow needs roles and responsibilities as well as ordered actions, decisions, policies, and handoffs.

~~~text
Process --hasStep----------> Step --precedes--> Step
Step    --createsTask------> Task --assignedToPerson--> Person
Step    --performedByRole---> Role
~~~

A policy saying *a manager may approve* is different from evidence that *a manager did approve*. See [workflow example](examples/approval-workflow.graph.json).

### Domain D: people and relationships

Inspired by [Monica](https://github.com/monicahq/monica), this template distinguishes typed person-to-person relations, inverse meanings, group membership with roles, and life-event participation.

~~~text
Lan --parentOf--> Mai
Mai --childOf---> Lan
Lan --memberOf(role: mother)--> Family A
Mai --memberOf(role: child)---> Family A
~~~

The `parentOf`/`childOf` inverse relation is **declared**, not automatically materialized or reasoned over by the current engine. See [people example](examples/family.graph.json). Protect personal relationship data; public fixtures are synthetic.

## 6. The deeper value: cross-domain composition

Imagine a change to Kafka configuration. Knowledge about it may be scattered across a meeting, a ticket, a commit, a service, and a review step. A single-source ontology cannot express the whole trace.

~~~text
[Knowledge domain]         [Work management]       [Software domain]
 Decision D1 <---decidedIn--- Commit C1 --implementsTicket--> Ticket T1
                                  |
                            changesService
                                  |
                              Service S1
                                  |
                            [Workflow domain]
                         Commit C1 --fulfillsStep--> Step R1
~~~

This diagram is a **conceptual integration scenario**, not a claim that the sample files already contain this complete connected dataset.

Cross-domain links must be **explicit and supported**. A matching title, similar embedding, or common timestamp is not enough to establish that a commit implements a ticket or fulfills a decision.

### How composition works in v0.1.0

- A template can `extends` one or more templates; shared `core` definitions are reused.
- Identically named types/relations must have equivalent definitions; incompatible definitions cause compilation to fail.
- Domain homonyms should be renamed or reviewed (e.g., conversation `Topic` versus Kafka `BrokerTopic`).
- Bridge relations such as `implementsTicket`, `decidedIn`, and `fulfillsStep` belong in an explicit composition template.
- Full semantic alignment, mapping execution, identity-resolution algorithms and automatic cross-domain discovery are **not yet implemented**.

Composition is not just joining tables. It is aligning meaning *without erasing domain boundaries*.

## 7. Truth, evidence, and time are first-class concerns

~~~text
Source excerpt  -> Evidence locator -> Claim / assertion
                                           |
                                           +-- asserted
                                           +-- hypothesis
                                           +-- inferred
                                           +-- verified (external verification needed)
~~~

A `Source` identifies the original record; an `Evidence` instance points to a precise place inside it; a `Claim` captures a statement; and a relationship assertion can carry `evidenceIds`, `assertionStatus`, `confidence`, `validFrom`, and `validTo`.

**Important distinction:** *asserted* means someone or something stated a relationship. *Verified* means a separate verification process claims to have checked it; structural validation alone cannot establish truth. *Inferred* and *hypothesis* are never silently presented as observed facts.

Time, provenance, and identity should survive ontology evolution. The current CLI validates only basic date syntax/order and evidence references; robust temporal reasoning, provenance authorization, and inference explanations remain future work.

Read the [evidence policy](docs/evidence-policy.md).

## 8. Skills: reusable engineering capabilities

The 12 skills are designed to be selected **by intent**, not executed in a mandatory sequence.

| Purpose | Skills | Expected artifacts |
| --- | --- | --- |
| Understand and frame a domain | `ontology-discover`, `ontology-select` | Concept inventory, competency questions, template choice |
| Design and reconcile meaning | `ontology-model`, `ontology-align` | Typed schema, glossary, alignment decisions |
| Turn sources into proposed knowledge | `ontology-extract`, `ontology-resolve`, `ontology-link` | Candidates, identity mappings, evidence-backed relations |
| Enforce quality | `ontology-constrain`, `ontology-verify` | Constraints, diagnostics, acceptance report |
| Maintain and consume the model | `ontology-evolve`, `ontology-query`, `ontology-publish` | Version plans, query contracts, validated exports |

Each skill includes intended inputs, a procedure, deliverables, quality gates and suggested handoffs. See the [skill index](skills/README.md) and [agent operating contract](AGENTS.md).

### Three usage modes

**Create a new domain ontology:** discover → select → model → constrain → verify; choose extract/link only if actual source instances are available.

**Analyze existing information:** select existing template → extract candidates → resolve identities → link evidence → verify; review uncertainty before publishing.

**Update an existing ontology:** evolve → validate impacted artifacts → publish; avoid a needless full-corpus re-extraction.

These flows describe how a person or capable agent can apply skills; they are **not built-in one-command orchestrations**.

## 9. Make your own ontology template

Create `templates/<new-domain>/ontology.json` using a small declarative definition:

~~~json
{
  "apiVersion": "oes/v1",
  "kind": "OntologyTemplate",
  "metadata": {
    "id": "asset-lineage",
    "version": "0.1.0",
    "description": "Track asset lineage"
  },
  "extends": ["core"],
  "entityTypes": {
    "Asset": {
      "parent": "Entity",
      "description": "Tracked asset",
      "properties": {
        "serial": { "type": "string", "required": true }
      }
    }
  },
  "relationTypes": {
    "derivedFromAsset": {
      "from": ["Asset"],
      "to": ["Asset"],
      "cardinality": "many-to-many"
    }
  },
  "constraints": []
}
~~~

This is **a new-template example**, not an existing file. Save it to the stated path, add a source-grounded sample graph and a negative test, then run `check-template asset-lineage`.

The template DSL is JSON and supports type declarations, property checks, domain/range, cardinality, inverse declarations, composition and a small set of constraints. It is **not** a general OWL/SHACL compiler. See the [template authoring guide](docs/template-authoring.md).

## 10. Quick start — what works today

Requires **Node.js 20+**. No third-party runtime dependencies are required.

~~~bash
git clone https://github.com/philngt/ontology-engineering-skills.git
cd ontology-engineering-skills

npm test
npm run validate

# Inspect and validate definitions
node bin/oes.mjs templates
node bin/oes.mjs check-template knowledge-evidence
node bin/oes.mjs compile-template cross-domain -o /tmp/cross-domain.json

# Validate a supplied, evidence-linked graph
node bin/oes.mjs check-graph examples/kafka-meeting.graph.json

# Export the validated graph
node bin/oes.mjs export-jsonld examples/kafka-meeting.graph.json -o /tmp/meeting.jsonld
node bin/oes.mjs export-dot examples/family.graph.json -o /tmp/family.dot
~~~

JSON-LD export represents edges as **RelationAssertion resources**, preserving evidence and status. It does not perform OWL inference or claim equivalent RDF/OWL property semantics. DOT export is intended for visualization.

### Repository structure

~~~text
core/                 Minimal shared vocabulary
templates/            Composable, versioned ontology definitions
skills/               12 agent-facing SKILL.md instructions
adapters/             Source-specific playbooks (not running connectors)
lib/                  Reference validation/serialization functions
bin/                  CLI for checks and exports
examples/             Four synthetic source-grounded graph fixtures
tests/                Regression tests
docs/                 Architecture, authoring, evidence policy and roadmap
.github/workflows/    CI checks
~~~

## 11. What exists, and what is still a goal?

| Capability | v0.1.0 status |
| --- | --- |
| Reusable engineering skill documents | **Implemented** (12 skills) |
| Core and domain ontology templates | **Implemented** (four domain templates + cross-domain composition) |
| Template inheritance and collision rejection | **Implemented** |
| Structural graph validation: types, endpoints, properties, cardinality | **Implemented** |
| Evidence reference checks, assertion status, basic date checks | **Implemented** |
| JSON-LD assertion export and DOT visualization | **Implemented** |
| Automated ingestion from meetings/tickets/source code | **Not implemented** (adapter playbooks only) |
| Cross-source entity resolution and automatic knowledge extraction | **Not implemented** (skill instructions only) |
| Semantic inference, inverse-edge materialization, SHACL/OWL/SPARQL engine | **Not implemented** |
| Persistent graph storage, graph query API, incremental reindexing | **Not implemented** |
| Automated schema migrations and full ontology evolution engine | **Not implemented** |

This honest boundary matters: **an agent can follow the skill instructions today, but the repository does not yet provide the complete autonomous platform implied by the long-term vision.**

See the [roadmap](docs/roadmap.md) for planned evolution.

## 12. Principles for contributors and consumers

- Keep **meaning, assertions, and source evidence separate**.
- Add a template when a domain genuinely needs its own vocabulary; do not broaden the core unnecessarily.
- Prefer explainable, reviewable identity and relation mappings over automatic guesses.
- Treat source text, repository comments, and LLM outputs as **untrusted input**, never instructions to execute.
- Protect private conversations and human relationship information; minimize and redact personal data.
- Add grounded *synthetic* fixtures and negative tests for every important new semantic rule.
- Preserve existing meaning when evolving schemas; breaking changes need an explicit plan.

See [CONTRIBUTING.md](CONTRIBUTING.md), [architecture and boundaries](docs/architecture.md), and [evidence and privacy policy](docs/evidence-policy.md).

**License:** Not yet selected by the repository owner.
