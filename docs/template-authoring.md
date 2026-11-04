# Template authoring guide

## 1. Start with competency questions

Write 5–10 concrete questions the domain model must answer. Examples: "Which decision introduced this configuration?" or "Which actor approved this step?"

Determine the minimum entity types and relations required. Prefer domain vocabulary over infrastructure jargon.

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
    "describedBy": {"from": ["Asset"], "to": ["Source"], "cardinality": "many-to-many"}
  },
  "constraints": []
}
~~~

An `EntityType` supports `parent`, `description` and `properties`. Property types currently supported: string, integer, number, boolean, array, object; rule options: `required` and `enum`.

A `RelationType` has `from`, `to` (arrays of allowed type names, or wildcard `*`), optional `description`, `properties`, `inverse`, `symmetric`, `allowSelf` and `cardinality`. `inverse` requires reciprocal declarations, but does not synthesize inverse instances.

## 3. Cardinality convention

The cardinality name is interpreted from **source to target**:
- `many-to-one`: each source has at most one target.
- `one-to-many`: each target has at most one source.
- `one-to-one`: both limits hold.
- `many-to-many`: neither limit applies.

No global uniqueness, temporal cardinality or disjointness checks are implemented.

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

## 6. Verify and evolve

~~~bash
node bin/oes.mjs check-template custom-domain
node bin/oes.mjs check-graph examples/your-graph.graph.json
npm test
~~~

Keep stable identities and review breaking semantic changes. Version the template and provide fixture migrations. Adding a relation type is easier than changing the meaning of an existing one.

