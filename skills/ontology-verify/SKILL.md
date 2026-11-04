---
name: ontology-verify
description: "Use when the user asks to verify an ontology or graph, audit citations, detect fabricated evidence, review traceability, or decide whether a candidate graph can be published. Run structural and exact source-text checks separately; never equate either with semantic truth."
---

# Verify structure, source integrity, then meaning

Read [AGENTS.md](../../AGENTS.md), [evidence policy](../../docs/evidence-policy.md), and [checker contract](../../docs/evidence-checking.md). Require a graph path, template ID and authorized local snapshot root.

## Gate 1 — structural validity

```bash
node bin/oes.mjs check-template cross-domain
node bin/oes.mjs check-graph /output/graph.json --warnings-as-errors --json
```

Check known types, relation direction, inherited endpoint compatibility, cardinality, required properties, source references and constraints. A cycle or composition conflict must fail. Matching object key order is not required; array order remains significant in structural comparison.

## Gate 2 — source-text integrity

```bash
node bin/oes.mjs check-evidence /output/graph.json \
  --source-root /approved/snapshot --require-hash --warnings-as-errors --json
```

An excerpt must equal the entire `Lx` / `Lx-Ly` span (only line endings normalized). `L999`, invented text, changed source bytes, escaped paths, and unsupported encodings fail. Remote sources are never fetched; skips cause warnings and fail this strict gate. `verified` without evidence also fails under warnings-as-errors.

Expected report shape:

```json
{
  "command": "check-evidence",
  "passed": true,
  "diagnostics": [],
  "evidence": {"checked": 9, "skipped": 0}
}
```

Numbers above describe the bundled Git/meeting demo, not all graphs. See [validation report schema](../../contracts/validation-report.schema.json).

## Gate 3 — semantic review

For each important edge, read the exact span and ask whether it establishes that relation. This is a separate human/agent judgment with explicit uncertainty, not an engine result.

- Task owner ≠ speaker; Git author ≠ approver.
- A ticket mention ≠ implemented requirement.
- A statement in a meeting ≠ verified runtime behavior.
- A limitation ≠ contradiction. Do not fabricate an opposite claim.
- Hash consistency ≠ source authenticity.

If semantic review was not performed, record `semanticReview: not-run` in the narrative report. Never return “verified” merely because both commands exit zero.

## Gate 4 — negative controls and regression

```bash
npm test
node bin/oes.mjs check-all --require-hash --warnings-as-errors --json
node demo/run.mjs
```

The demo runs the real CLI on generated Git-backed sources. It confirms that a bare ticket mention is not linked and that a fabricated quote is rejected. It also produces `answer.json` with precise sources and a `negative-report.json`.

## Deliverables and exit conditions

Save each command's JSON stdout as a validation artifact. Preserve the actual exit code: 0 pass, 1 validation failure, 2 invocation/input error. Do not turn a crash or skipped source into success.

Write `validation-report.md` containing snapshot/revision, commands actually run, pass/fail, warnings/skips, semantic review disposition, unresolved claims, and publication recommendation. Do not invent reviewer names or signoffs.

Stop on errors; either repair the proposed graph from original sources or return a concrete limitation. A narrow proof-of-work pass is not production readiness or an end-to-end agent quality benchmark.
