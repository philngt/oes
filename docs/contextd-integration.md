# OES graphs as contextd inputs

OES provides the **ontology and evidence layer** of the [contextd ecosystem](https://github.com/philngt/contextd). contextd consumes its validated graph artifacts to select relevant workspace documents and deliver context with traceable evidence to agents.

The handoff is a local `oes.graph/v1` JSON file. OES defines and checks the ontology, graph structure and source excerpts. contextd owns workspace isolation, task matching, document priority, context budgets and agent adapters. Both projects remain usable independently.

## Run the integration

Use sibling source checkouts and Node.js 20+ with an OES checkout that supports `check-graph --with-evidence --json`. The contextd checkout must include the OES integration.

```bash
git clone https://github.com/philngt/oes.git
git clone https://github.com/philngt/contextd.git
cd contextd
python3 -m pip install -e .
contextd init

# Inspect the graph and its exact local source evidence with OES.
node ../oes/bin/oes.mjs check-graph \
  workspaces/default/ontology/consumer-recovery.graph.json \
  --with-evidence --source-root workspaces/default \
  --require-hash --warnings-as-errors --json

# Build task context using the validated graph to add relevant documents.
contextd context "Investigate ingest-worker lost writes" --preview --json \
  --oes-graph workspaces/default/ontology/consumer-recovery.graph.json \
  --oes-cli "$PWD/../oes/bin/oes.mjs"

# Inspect why the evidence-linked document was selected.
contextd explain "Investigate ingest-worker lost writes" --text \
  --oes-graph workspaces/default/ontology/consumer-recovery.graph.json \
  --oes-cli "$PWD/../oes/bin/oes.mjs"
```

The synthetic example connects an `ingest-worker` service to a recovery rule and evidence in `decisions/consumer-write-recovery.md`. The graph supplies a document candidate through that evidence chain; contextd then applies its normal selection rules. The resulting context carries the assertion, evidence locator, excerpt and source hash alongside the selected document. It does not load the entire graph into the agent prompt.

The first standalone OES check is useful for inspecting an authored graph. contextd also runs OES validation itself for each graph-enabled build, so a previously successful manual check cannot hide later graph or source changes.

The [consumer guide in contextd](https://github.com/philngt/contextd/blob/main/docs/oes-integration.md) owns detailed output fields, tests and selection behavior. Omit the two OES flags for the ordinary contextd path; that path does not require Node.js or OES.

## Supported handoff contract

| Field | Consumer requirement |
| --- | --- |
| `apiVersion` | `oes.graph/v1` |
| `template` | An ontology template available to the explicitly selected OES CLI |
| `metadata.workspace` | The active contextd workspace name |
| Graph path | Inside the active workspace; a relative `--oes-graph` path resolves from the knowledge root |
| `Source.properties.uri` | A literal path relative to the active workspace, resolving to an existing governed document in contextd's source index |
| `Source.properties.sha256` | Optional recorded raw-byte hash; OES verifies it when present. The bundled demo supplies it for every source |
| `Evidence.properties.sourceId` | ID of the corresponding `Source` node |
| `Evidence.properties.locator` | One-based inclusive line span: `L4` or `L4-L6` |
| `Evidence.properties.excerpt` | The complete, nonempty selected line span; only line endings are normalized |
| Assertion provenance | Stable node/edge/evidence/source IDs, `assertionStatus`, and optional confidence and validity dates remain traceable in the context artifact |

Workspace metadata is a contextd consumer requirement, not an added OES core entity or template. Source paths are interpreted against the active workspace rather than the directory containing the graph. A document accepted by OES's general local-file checker must also be a governed source in contextd before this integration can use it.

Task matching uses descriptive fields on graph entities and follows their incident edges to evidence-linked source documents. A core `supportedBy` edge can use its `Evidence` target directly; other evidence references use `evidenceIds`. This is bounded, deterministic matching with a one-hop evidence projection, not an inference engine or a graph database query language.

## Validation and provenance

contextd reads the graph once and takes source bytes from its existing workspace source snapshot. It places the graph and only governed source bytes in a temporary snapshot, then invokes the real OES CLI:

```text
node <oes-cli> check-graph <graph-snapshot>
  --with-evidence --source-root <source-snapshot>
  --warnings-as-errors --json
```

The graph and source bytes used for selection are the bytes checked by OES. Graph SHA-256, graph identity/template, source hashes, assertion statuses and evidence locators make the handoff inspectable. A failed check stops the graph-enabled build; a graph does not grant access to a new workspace, a remote URL or an arbitrary local file.

Rendered citations pass through contextd's secret redaction. A citation marked `redacted` refers to the original checked bytes through its source hash; its displayed excerpt may therefore differ from those bytes.

Validation keeps three questions separate:

1. **Graph structure:** Are the types, relations, endpoints, required fields and evidence references valid for the ontology?
2. **Source integrity:** Does the cited full line span match the checked local bytes, and does a recorded source hash match?
3. **Meaning:** Does the source actually support the assertion, and is that assertion true? This still requires semantic review or independent verification.

`asserted`, `inferred`, `hypothesis` and `verified` retain their original meanings. A passing check never promotes an assertion to `verified`; an accepted `Claim` is not automatically true. OES's [evidence policy](evidence-policy.md) and [exact source-checking contract](evidence-checking.md) apply throughout.

## Updates and current boundaries

Keep the graph and source documents under version control together. After editing a document, update its locators, excerpts and any recorded source hash, then rerun validation. Regenerate task context after graph/source changes; an old context artifact remains a record of its old snapshot.

This integration supports local, governed workspace documents and exact line evidence. It does not ingest remote sources, discover an ontology automatically, resolve conflicting claims, or import the OES graph as contextd's own lifecycle graph. OES remains the authority for ontology and evidence checks; contextd uses the checked evidence as an additional input to its context build.
