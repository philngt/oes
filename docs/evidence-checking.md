# Deterministic evidence checks

`check-graph` answers **is this graph structurally valid?**
`check-evidence` additionally answers **do these exact excerpts exist at these line locations in these local source bytes?**
Neither command decides whether a source is truthful or a cited statement entails a relationship.

```bash
node bin/oes.mjs check-evidence examples/kafka-meeting.graph.json \
  --source-root . --require-hash --warnings-as-errors --json
```

## Contract

A local `Source.properties.uri` is a **literal, root-relative path**. Its optional `sha256` is the digest of the entire raw file, including line endings. `--require-hash` makes this mandatory. A root is explicitly selected by the operator; it is never read from the graph.

An `Evidence` node requires `sourceId`, a one-based inclusive `locator` (`L4` or `L4-L6`), and a nonempty `excerpt`. The excerpt must equal the **entire selected line span**. Only CRLF/CR line endings are normalized to LF for comparison. No substring matching, trimming, Unicode normalization, case-folding, paraphrase tolerance, or fuzzy matching is performed. A final file newline is not an extra source line.

Example:

```json
{
  "id": "ev-decision",
  "type": "Evidence",
  "properties": {
    "sourceId": "source",
    "locator": "L4",
    "excerpt": "Decision: Increase producer delivery.timeout.ms to 300000 after lost writes investigation."
  }
}
```

An evidence record may support several relationships when the same exact span genuinely supports them. Duplicating it once per edge creates no extra assurance. `Claim --supportedBy--> Evidence` is already a citation and may omit `evidenceIds`; the target is its effective reference, not independent corroboration of itself. Other asserted/inferred/hypothesis edges still require `evidenceIds`.

## Exit codes and reports

- `0`: no errors (and no warnings when `--warnings-as-errors` is set).
- `1`: failed validation.
- `2`: invalid invocation or input could not be loaded.

`--json` emits `{command, passed, diagnostics, evidence: {checked, skipped}}`. `checked` counts **Evidence records**, not edges. Remote HTTP(S) sources are **never fetched**: they produce `external-source` warnings and increment `skipped`. Under `--warnings-as-errors`, they fail the run. A zero-check graph produces a warning rather than a misleading silent pass.

The graph's structural checks also run in `check-evidence`. `check-all` validates every bundled example at both layers. For custom graphs, `--source-root` defaults to the current working directory; for `check-all`, bundled examples use the package root.

```bash
node bin/oes.mjs check-all --require-hash --warnings-as-errors --json
node bin/oes.mjs check-graph my-graph.json --with-evidence --source-root ./snapshot
node bin/oes.mjs export-jsonld my-graph.json -o graph.jsonld \
  --with-evidence --source-root ./snapshot --require-hash --warnings-as-errors
```

### Verified-without-evidence compatibility

An edge marked `verified` without evidence still produces the existing `untraced-verified` **warning**, not a hard schema error. Use `--warnings-as-errors` in acceptance gates. The word `verified` is a source/reviewer assertion, never a status bestowed by the structural or text checker.

## Safety boundaries

The checker rejects absolute paths, parent traversal, URI schemes other than explicit remote skips, encoded paths, and symlink targets outside the chosen root. It accepts regular UTF-8 text files up to 5 MiB, rejects NUL-containing text, and never runs source instructions. It caches a source within one run to avoid repeatedly reading the same file.

Use a stable, operator-controlled snapshot. Realpath and file checks are not a hardened sandbox against an attacker concurrently rewriting the filesystem. A matching hash proves consistency with the recorded digest, **not authenticity**: an attacker who can replace both source and graph can replace both hashes. Git snapshots also need trusted revision provenance if authenticity matters.

## Semantic review remains mandatory

`Binh will implement the PoC` supports assignment; it does not establish that Binh spoke. Changing `authoredBy` from `asserted` to `inferred` does not fix that lack of support. Omit the edge.

A decision to increase a producer timeout and a claim that this alone does not fix lost consumer writes can both be true. Preserve the limitation as a Claim; do not invent a contradiction to make the graph look richer.

A `parentOf` inverse may be authored as `inferred` with its premise edge and rule. The runtime does not generate that inference. A real contradiction requires two incompatible claims under the same scope/time, each with its own source support.
