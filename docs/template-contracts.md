# Template semantic contracts

Status: the current checkout adds a bounded semantic foundation for the existing templates. It defines relationship meaning and explicit attribution/work bridges, with synthetic fixtures and regression tests. It does not add a reasoner, a query language, an identity resolver or a Product Graph importer.

The normative vocabulary is in `core/ontology.json` and `templates/*/ontology.json`. Each relation has a `description`, allowed endpoints and cardinality. This document supplies interpretation examples, competency questions and current limits. Passing structural or source-integrity checks does not establish semantic entailment or truth.

## Shared identity and domain ownership

| Template | Owns | Boundary |
| --- | --- | --- |
| `core` | Entity, Source, Evidence, Claim, Event | Portable identity, provenance and statements. Attribution belongs to a domain that knows the participant model. |
| `agents` | Actor, Person, `representsPerson` | Actor is a source-facing participant or work owner; Person is an individual human. They are sibling Entity types, not aliases or subclasses of one another. |
| `knowledge-evidence` | Conversation, Message, Topic, Decision, ActionItem, Ticket | Recorded speech, decisions and follow-up records. A speaker, proposer, decision maker and assignee can be different actors. |
| `software-system` | Source/code, service, interface, event, storage, configuration and deployment concepts | A declaration or static dependency is distinguishable from an observed execution through its source evidence. |
| `workflow-process` | Process, Step, Task, Role, Team, Policy, interaction concepts | Process definitions and assignments do not establish execution or completion. |
| `people-relationship` | Group, Organization, personal relations and life-event concepts | Relationship meanings are contextual; no identity or inverse edge is inferred from a name or label. |
| `cross-domain` | Bridges between knowledge, software and workflow records | Related records remain distinct. A trace is only as strong as the evidence for each of its assertions. |

Knowledge, workflow and people templates inherit Actor and Person from `agents`. A complete registry can compose all of them without the former duplicate-Person collision. The compiler still rejects genuinely different same-named definitions; it has not been relaxed.

Actor can represent a human, organization or software participant. `representsPerson` is used only for an explicitly established human mapping in the cited context. Use separate scoped Actor identities when the source contexts do not support a shared identity; do not reuse an anonymous speaker ID across meetings for different people. Its many-to-one limit applies to the whole Actor node in the supplied graph, not separately by source, time or context. Role, Team and Organization remain in their existing domains; this is not a complete organization ontology.

## Relations that cross meaning boundaries

| Relation and direction | Supported interpretation | Counterexample or limit |
| --- | --- | --- |
| `Claim --statedIn--> Message` | The message states or quotes the claim. Follow `authoredBy` to identify the message author. | The message author may quote someone else or disagree. Neither original authorship nor endorsement is implied. |
| `Decision --decidedBy--> Actor` | The cited record explicitly names the actor as making or adopting the decision. | Being the speaker, recorder, proposer, commit author or action assignee is insufficient. |
| `Actor --representsPerson--> Person` | The source explicitly links a participant identity to an individual. | Matching `name` values, avatars or embedding similarity do not establish identity. The edge is not `sameAs`. |
| `ActionItem --realizedAsTask--> Task` | A distinct task has been created to realize or decompose the follow-up work. | A task may be open. The edge does not say the action has been completed. |
| `Ticket --tracksTask--> Task` | The ticket tracks a task. | Ticket and Task are not the same entity; neither assignment nor completion follows automatically. |
| `Decision --motivatesPolicy--> Policy` | A decision provides rationale for a governing policy statement. | Rationale alone does not show adoption, enforcement or compliance. |
| `Commit --decidedIn--> Decision` | The commit is linked to recorded decision context or rationale. This existing name and direction are retained. | Do not rename it to `implementsDecision` without reviewing the stronger meaning and evidence. |
| `Commit --implementsTicket--> Ticket` | The source explicitly claims that the change implements work described by the ticket. | A bare ticket mention does not establish this relation. Even an implementation declaration does not prove complete ticket acceptance. |
| `Commit --fulfillsStep--> Step` | Evidence supports the assertion that the commit satisfies the recorded requirements of that step. | A commit merely mentioning a review step does not establish fulfillment. |
| `Service --callsService--> Service` | Evidence supports a call dependency, with its declaration or observation basis visible in the source. | A source-code comment or configured URL is not proof of a runtime call. |
| `Step --performedByRole--> Role` | The process defines a role responsible for performing the step. | This is not a particular person, a step execution or a complete RACI model. |
| `Step --precedes--> Step` | The process declares intended order. | The current validator does not check cycles or execution order. A workflow loop needs an explicitly chosen transition model. |

All other relation meanings are described in their owning JSON template. There are 54 relation definitions across core and the six templates; the authoring test checks that every one has a description. That test checks the presence of the contract, not the correctness of its prose.

### Identity, display and semantic requirements

Use stable graph IDs, scoped provider references and reviewable mappings. A display label is not an identity key. Different types use different useful labels: Commit has a SHA, Method has a signature, Claim has a statement and Source has a URI. No new global `name` requirement is introduced.

Graph ID uniqueness is enforced. Natural-key uniqueness, cross-source identity resolution and temporal identity are not. A future natural-key contract must define scope; a ticket key alone is not unique across providers or projects. An explicit mapping is still an assertion requiring evidence.

### Definitions that remain deliberately limited

`DecisionGate`, `Handoff` and `RelationshipKind` remain available for compatibility. They can be documented or linked through generic provenance relations, but they do not yet provide a gate-evaluation model, a full handoff execution model or parameterized relationship semantics. `Handoff` is an event concept; `handsOffTo` links steps. These are different modeling levels.

`friendOf` declares symmetry, and `parentOf`/`childOf` declare inverse meanings. There is no automatic materialization, no requirement to store duplicate assertions, and no declared `friendOf` subproperty of `knows`. Domain policy must settle such inferences before adding a reasoning pass.

## Competency questions and evidence

The catalog below is implemented by bounded Node test cases in [semantic-foundation.test.mjs](../tests/semantic-foundation.test.mjs). Tests traverse actual fixture edges and include missing-link, unsupported identity, attribution or integrity controls. The paths below describe the questions in prose; they are not a new DSL accepted by the CLI.

| ID | Template focus and question | Fixture and expected answer |
| --- | --- | --- |
| SF-CQ1 | Core: which exact source supports decision D1? | `cross-domain.graph.json`: D1 cites `ev:decision-statement`, which identifies `source:cross-domain` and its exact line span. |
| SF-CQ2 | Agents: which person is explicitly represented by actor Binh? | The cross-domain fixture maps `actor:binh` to `person:binh`; the unrelated same-name person is excluded. |
| SF-CQ3 | Knowledge: who authored the decision message, made the decision and received the action? | The cross-domain fixture records An as message author and decision maker, and Binh as action assignee. These roles are followed through distinct edges. |
| SF-CQ4 | Workflow/work tracking: which task realizes action A1, which ticket tracks it and who owns it? | The cross-domain fixture links `action:a1` and `ticket:rel-42` to `task:42`, assigned to `person:binh`. |
| SF-CQ5 | Software/cross-domain: which commit explicitly links the decision, ticket and service? | `commit:c1` has the explicit trace to D1, REL-42 and `service:orders-consumer`. The bare-mention `commit:c2` has no implementation edge. |
| SF-CQ6 | Cross-domain/policy: which policy is motivated by D1 and governs the process? | The cross-domain fixture identifies `policy:pol1` and `process:proc1`; it does not establish policy compliance. |
| SF-CQ7 | Workflow compatibility: who is assigned the existing approval task? | `approval-workflow.graph.json` retains the explicit assignment to Linh. |
| SF-CQ8 | Software compatibility: which configuration and service are linked to the commit, and which event/topic are declared? | `software-kafka.graph.json` retains the authored commit/config/service and service/event/topic paths. No runtime processing is inferred. |
| SF-CQ9 | People compatibility: which family relations are explicitly stored? | `family.graph.json` retains Lan/Mai parent/child edges, including the manually authored inferred inverse. The query does not manufacture an omitted inverse. |
| SF-CQ10 | Knowledge compatibility: who owns the existing meeting action? | `kafka-meeting.graph.json` assigns the action to Binh without inventing message authorship or a decision-maker edge. |

The new [static graph](../examples/cross-domain.graph.json) cites the [synthetic source](../examples/sources/cross-domain.md). Its commit identifiers and work records are synthetic declarations. It supplies no real Git changes, deployment evidence, task-completion evidence or test-run result. The separate [executable demo](../demo/README.md) still creates actual local Git commits from synthetic content.

Run the bounded tests and integrity gate:

```bash
node --test tests/semantic-foundation.test.mjs
node bin/oes.mjs check-evidence examples/cross-domain.graph.json \
  --source-root . --require-hash --warnings-as-errors --json
```

A query returning no linked answer means the fixture/source scope has no supported path. It does not establish that the relationship is false in the real world. A type-correct edge with a matching quotation can still be semantically wrong; the generic validator does not decide whether the quotation entails that edge.

## Source and assertion contract

Source `uri` is required. Optional `sha256`, `version` and `retrievedAt` are strings. The exact local evidence checker verifies raw bytes, hash and full-span excerpts; structural validation alone checks the property types. Source version is provider metadata, and retrieval time has no enforced timestamp format. Preserve immutable source snapshots when producing reviewed artifacts.

Claim lifecycle (`proposed`, `accepted`, `rejected`, `superseded`) is distinct from assertion status (`asserted`, `verified`, `inferred`, `hypothesis`). In the static fixture, the decision is accepted, while implementation links remain asserted and task execution is unverified. No check promotes an assertion to `verified`.

Cardinality currently counts edges across the supplied graph, even if they point to the same target or have non-overlapping validity intervals. Only ISO calendar-date syntax/order is checked on `validFrom`/`validTo`. There is no natural-key uniqueness, closed-property warning, relation inheritance, temporal cardinality or general cycle constraint.

## Next bounded outcome: Product Graph handoff

This foundation is a prerequisite for a future `product-system` profile, not that profile or its importer. The next slice should add only the requirement/criterion/test execution semantics needed for one real feature, then preserve IDs, assertion status and evidence through a versioned mapping and a proposal with a base graph revision.

Product Graph should own the applied product model; OES should supply ontology/evidence artifacts and checks. Definition-versus-execution must be explicit before claiming that a feature has been verified. `contextd` continues to consume local evidence-bearing `oes.graph/v1` through its existing boundary; it does not become the canonical product model.

See [compatibility and version notes](semantic-foundation-compatibility.md) for upgrading existing consumers and [the roadmap](roadmap.md) for deferred capabilities.
