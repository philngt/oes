# Architecture and boundaries

## Thesis

Ontology templates are versioned semantic contracts. Source adapters discover candidate instances. An evidence layer distinguishes assertions from verified state. A deterministic verifier guards contract compliance. Skills orchestrate the human/agent workflow.

This is **not** a single giant ontology. Each template defines a bounded domain and composes shared definitions only when their semantics truly match.

## Layers

| Layer | Responsibility | Owns |
| --- | --- | --- |
| Source | Raw meeting, ticket, repository, SOP or relationship record | Source system |
| Adapter | Parse segments, locations, timestamps, stable source IDs | Connector/parser |
| Extractor skill | Propose concepts, claims and relations with cited spans | Agent/human |
| Ontology template | EntityType, parent, RelationType, inverse, cardinality, constraints | Ontology engineer |
| Identity resolver | Link aliases and instances without false merges | Resolver + reviewer |
| Evidence graph | Typed nodes/edges with statement status, origin and locators | Graph service |
| Validator | Detect violations deterministically | OES reference engine |
| Consumer | Query, trace, export, graph visualization, downstream AI agents | Product/runtime |

## Explicit semantic boundary

1. **Source:** immutable/version-addressable material such as a commit, meeting version, or ticket revision.
2. **Evidence:** excerpt or exact location linked to one Source. Excerpts are not automatically true.
3. **Claim:** a statement, optionally accepted, disputed or superseded.
4. **Assertion:** an edge with `assertionStatus`: asserted, verified, inferred or hypothesis.
5. **Verified outcome:** requires external policy, tests or human review; the validator checks structure, **not truth**.

A source-code comment is evidence that *a comment says something*, not proof of runtime behavior. A deployment config is evidence of intent, not proof of a running deployment.

## Vocabulary and domain boundaries

`core` contains only Entity, Source, Evidence, Claim and Event, plus generic relationships. Domain concepts such as Person, Topic, Service or Workflow Step belong in templates.

The shared `agents` template owns Actor and Person. Knowledge, workflow and people templates inherit it rather than copying those definitions. Actor is a source-facing participant or owner; Person is an individual human. `representsPerson` records an explicitly supported contextual identity mapping. It does not make the two nodes equal, merge matching names or assert a workflow role. Role, Team and Organization remain in their existing domains.

Template composition uses `extends`. An identically named concept from two templates must be definition-identical; otherwise compilation **fails**. Example: a meeting Topic is not a message-broker topic, so the latter is named `BrokerTopic`.

The `cross-domain` template combines knowledge-evidence, software-system and workflow-process, then adds bridge types such as `decidedIn`, `implementsTicket`, and `fulfillsStep`. Bridge edges must themselves carry evidence.

`realizedAsTask` and `tracksTask` connect distinct work records; `motivatesPolicy` connects a decision to policy rationale. `statedIn` links a Claim to a Message; `decidedBy` identifies a recorded decision maker independently of a message author or action assignee. None of these bridges establishes completion, enforcement or truth. [Template contracts](template-contracts.md) give positive and negative examples and fixture-backed questions.

## Inverse, symmetric, and time semantics

`parentOf` / `childOf` declare inverse semantics. The current validator verifies *mutual declarations* but does not materialize inverse edges or guarantee reciprocal instances. `friendOf` is marked symmetric but symmetry is not enforced. These require a future reasoning pass with evidence and explanation.

Edges may include `validFrom`, `validTo`, `confidence`, and `assertionStatus`. Date checking only validates ISO day values and order; bitemporal validity, provenance snapshots and event ordering remain roadmap work.

Cardinality currently counts assertion edges across the whole supplied graph, including parallel edges to the same target; it does not filter validity intervals or count distinct targets. `precedes` documents intended order but the engine does not check cycles. Inverse/symmetric declarations do not require a duplicate stored assertion. Semantic constraints must be designed for the relevant relation and scope before extending the engine.

## Templates versus runtime

Agent Skills are prompt-level procedures under `skills/*/SKILL.md`. Template manifests are JSON schema-like contracts. The reference engine executes **only** the constraints documented in README. It is not an RDF store or OWL interpreter.

`export-jsonld` encodes each edge as a RelationAssertion node, preserving provenance. It does not claim RDF schema equivalence, SHACL compliance or semantic entailment.

Template descriptions and the competency-question catalog guide authors and are exercised by bounded fixture tests. They are not an executable query DSL. Template versions are metadata; `extends` resolves literal registry IDs, not version ranges. See [compatibility and upgrade notes](semantic-foundation-compatibility.md) for custom registries and downstream consumers.

## Extension points

- Parser adapters: structured output with source references and confidence.
- Graph storage: pluggable storage with versioned ID upserts, ACLs, soft deletion.
- Reasoner: isolated, explainable inference with explicit derived status.
- Query API: typed traversal, provenance filters, and access control.
- Incremental change detector: only impacted source segments and graph subgraphs.

These are design extension points, **not** implemented features.

