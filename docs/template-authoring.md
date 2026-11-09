# Template authoring guide

## 1. Start with competency questions

Write 5–10 concrete questions the domain model must answer. Examples: "Which decision introduced this configuration?" or "Which actor approved this step?"

Determine the minimum entity types and relations required. Prefer domain vocabulary over infrastructure jargon.

Record an expected answer and a counterexample for each question. The bundled [template contracts](template-contracts.md) link questions to source-grounded fixtures and tests. Keep questions in documentation or test cases for now: a top-level `competencyQuestions` field is not preserved or executed by the current compiler.

## 2. Create a template

Create `templates/<id>/ontology.json`:

~~~json
{
  "apiVersion": "oes/v1",
  "kind": "OntologyTemplate",
  "metadata": {"id": "custom-domain", "version": "0.1.0", "description": "My domain"},
  "extends": ["core"],
  "entityTypes": {
    "Asset": {"parent": "Entity", "description": "A tracked item",
      "properties": {"serial": {"type": "string", "required": true}}}
  },
  "relationTypes": {
    "describedBy": {"from": ["Asset"], "to": ["Source"],
      "description": "The source contains a description of the asset; this does not establish that every source statement is true.",
      "cardinality": "many-to-many"}
  },
  "constraints": []
}
~~~

An `EntityType` supports `parent`, `description` and `properties`. Property types currently supported: string, integer, number, boolean, array, object; rule options: `required` and `enum`.

A `RelationType` has `from`, `to` (arrays of allowed type names, or wildcard `*`), optional `description`, `properties`, `inverse`, `symmetric`, `allowSelf` and `cardinality`. `inverse` requires reciprocal declarations, but does not synthesize inverse instances.

For bundled templates, a nonempty relation description is an authoring requirement checked by the contract tests. It remains optional in the engine's DSL for compatibility. Describe direction, evidence expectations and what the relation does not establish. Preserve the distinction between an identity key, a display label and required semantic data: do not require a redundant `name` on every type.

`Source` declares optional string properties `sha256`, `version` and `retrievedAt`. `sha256` is checked against local raw bytes by `check-evidence`; `--require-hash` makes it mandatory at that gate. `version` is a provider/source revision, not an ontology version. `retrievedAt` uses an ISO 8601 timestamp convention, but the structural engine checks only its string type. `Event.occurredAt` also has no format validator. Unknown properties currently remain allowed and are not warned about.

## 3. Cardinality convention

The cardinality name is interpreted from **source to target**:
- `many-to-one`: each source has at most one target.
- `one-to-many`: each target has at most one source.
- `one-to-one`: both limits hold.
- `many-to-many`: neither limit applies.

No global uniqueness, temporal cardinality or disjointness checks are implemented.

The implementation counts edges, not distinct targets, across the whole graph. Multiple evidence records should normally be attached to one assertion via `evidenceIds`; two separate assertions to the same target still count twice. Non-overlapping `validFrom`/`validTo` intervals do not exempt an edge from cardinality. Do not use these limits to claim historical assignment or RACI validation.

## 4. Build a graph

~~~json
{
  "apiVersion": "oes.graph/v1",
  "template": "custom-domain",
  "metadata": {"id": "example"},
  "nodes": [
    {"id": "s", "type": "Source", "properties": {"uri": "file.md"}},
    {"id": "e", "type": "Evidence", "properties": {"sourceId": "s", "locator": "L1"}},
    {"id": "a", "type": "Asset", "properties": {"serial": "DEMO-01"}}
  ],
  "edges": [
    {"id": "r", "type": "describedBy", "from": "a", "to": "s",
     "assertionStatus": "asserted", "evidenceIds": ["e"]}
  ]
}
~~~

**Evidence reference:** `Evidence.properties.sourceId` must point to a Source node. Edge `evidenceIds` must identify Evidence nodes. Avoid raw secrets or personal data in `excerpt`.

## 5. Constraints and composition

Only `requiresEdge` is currently executable:

~~~json
{"id": "claim-traceability", "kind": "requiresEdge",
 "nodeType": "Claim", "edgeType": "supportedBy",
 "direction": "out", "severity": "warning"}
~~~

To compose templates, set `extends` to multiple IDs. The compiler rejects differing definitions of same-named entity/relation types instead of silently overriding them. Rename ambiguous terms or prepare an explicit alignment review.

Reuse `agents` for Actor and Person instead of redeclaring them. `extends: ["agents"]` works through the normal registry; `extends: ["agents@^0.1"]` is unsupported. Pin the selected OES checkout and record template versions/compiled schema hashes in the consuming workflow when reproducibility is required. Metadata alone does not enforce a dependency lock.

## 6. Verify and evolve

~~~bash
node bin/oes.mjs check-template custom-domain
node bin/oes.mjs check-graph examples/your-graph.graph.json
npm test
~~~

Keep stable identities and review breaking semantic changes. Version the template and provide fixture migrations. Adding a relation type is easier than changing the meaning of an existing one.

Descriptions participate in collision checks, so even documentation refinements inside JSON can conflict with downstream copies of definitions. Follow the [semantic-foundation compatibility plan](semantic-foundation-compatibility.md) when upgrading a custom registry. Never substitute a similarly named relation without reviewing its meaning and evidence.

