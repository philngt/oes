# Semantic foundation: compatibility, migration and version notes

## Version notes

This is an unreleased template update. `core`, `knowledge-evidence`, `software-system`, `workflow-process`, `people-relationship` and `cross-domain` move from template metadata version `0.1.0` to `0.2.0`. The new shared `agents` template begins at `0.1.0`. Package/plugin version `0.2.0` is unchanged; this change does not publish or tag a release.

The wire formats remain `oes/v1` and `oes.graph/v1`. All existing type and relation names remain available through their compiled templates. Actor and Person keep parent Entity and their existing required string `name`. Existing relation endpoints, cardinalities, property rules and executable constraints are retained. Six relations are added; the engine and executable source adapters are unchanged.

Template `metadata.version` and graph `metadata.ontologyVersion` are descriptive metadata. The current compiler resolves a literal template ID from its selected registry, without semver resolution or a version lock. Historical fixtures retain their original metadata and remain valid under the current contract; that is not evidence of a general version-aware loader. A consumer requiring reproducibility must pin the OES checkout or full registry and record its compiled schema hash.

## Compatibility matrix

| Consumer or data | Effect | Upgrade action |
| --- | --- | --- |
| Existing four bundled graph fixtures | Supported; types, relation names and evidence references are preserved. | Run both structural and exact-source checks with the complete new registry. |
| Existing meeting/Git adapters and demo trace | Supported; `decidedIn` and `implementsTicket` keep their names and directions. | No adapter or graph rewrite is required. |
| A complete OES CLI checkout | The registry discovers `agents` automatically. | Update the checkout as a unit. |
| A manually assembled registry | Knowledge, workflow and people now depend on `agents`, which depends on core. | Include `templates/agents/ontology.json`; copying only an updated child file is insufficient. |
| A custom template that copies old Actor, Person, Source or relation definitions | Strict composition can reject the copied definition because descriptions and Source properties changed. | Remove redundant copies and inherit the owning template. Review genuinely different meanings instead of weakening collision checks. |
| Source with no `sha256`, `version` or `retrievedAt` | Still structurally valid. | Strict acceptance may separately require a hash with `--require-hash`. |
| Source with those optional fields supplied as strings | Structurally supported. | Source/hash integrity still requires `check-evidence`. |
| Source using numeric/object values for those previously undeclared fields | Now rejected by structural property-type checking. | Inspect the source/provider semantics and migrate to the documented string representation; do not silently coerce unknown data. |
| Raw-template consumers expecting Actor/Person to be declared inline | Definition ownership changes even though graph types remain. | Resolve `extends` or consume the compiled template. |
| Consumers using `extends: ["core@^0.2"]` | Unsupported; the string is treated as an unknown registry ID. | Use literal IDs and pin the registry outside the current DSL. |
| Existing contextd OES handoff | Local paths, evidence structure and assertion statuses are unchanged. | Select the updated complete OES CLI checkout; contextd acceptance rules still apply. |
| Product Graph | No importer or profile is shipped by this change. | Implement the future mapping/proposal contract separately; arbitrary `data` metadata is not validation. |

## Migration plan

1. Preserve the existing graph, sources and exact OES registry/checkout revision.
2. Update the registry as a unit, including `agents`. Compile each custom template before importing or rewriting instance data.
3. If a copied definition collides, identify its owner. Remove a duplicate definition only after confirming equivalent meaning; keep a genuinely different concept under a different reviewed name. Never force a merge based on matching labels.
4. Check supplied Source metadata types. `version` represents a provider revision; `retrievedAt` is a retrieval timestamp convention; neither is validated as a date/version format. Keep original source bytes and references available during any correction.
5. Run `check-graph`, then `check-evidence` against the chosen source snapshot with `--require-hash --warnings-as-errors`. Passing these checks does not approve an identity mapping or verify behavior.
6. Introduce new bridge assertions only when their source evidence supports their exact meaning. Existing `tracks` is not automatically converted into `tracksTask`; `assignedTo` is not automatically converted into `assignedToPerson`; `decidedIn` is not renamed to `implementsDecision`.

For bundled fixtures and adapters, the tests exercise the historical graphs and explicit new bridges without rewriting the historical files. Consumers with additional domains must run their own fixtures; this update does not claim universal compatibility.

## Rollback

For an unchanged historical graph, restore the prior complete registry/checkout and rerun its checks. Graphs using the six new relation types require the new registry. Preserve them as versioned artifacts when rolling a consumer back; load its prior graph snapshot rather than deleting unfamiliar assertions or their evidence.

No database migration, graph rewrite, automatic identity merge or source re-extraction is performed by this change. Future relation renames, required fields, natural-key constraints or temporal policies need their own migration plan and acceptance fixtures.
