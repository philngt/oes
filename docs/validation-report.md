# Contextd integration review: validation evidence

Date: 2026-11-04. Baseline: `d99b5482ceffc54044cf712617b925fdfeee77d3`.
This report describes deterministic repository checks, not a production rollout
or a benchmark of agent answers. Semantic review of every fixture assertion was
not performed in this change (`semanticReview: not-run`).

## Findings and repair

The baseline already checks full-span excerpts and source hashes, rejects
invented or partial quotes, canonicalizes object keys for composition, and has
distinct source evidence in the bundled graphs. Those previous review concerns
are covered by the existing regression suite.

A remaining template defect was reproduced: `enum: "open"` accepted the value
`"o"`, while `enum: 1` caused graph evaluation to throw. Both entity and relation
property rules now reject malformed rule objects, unknown types, nonboolean
`required`, malformed enum arrays and values of the wrong declared type before
graph evaluation. Structured enum values compare as JSON, independent of object
key order. No new ontology vocabulary or inference rule was introduced.

## Checks run

| Command | Observed result |
|---|---|
| `npm test` | 90 passed, 0 failed, 0 skipped; includes 28 property-rule regressions |
| `npm run validate` | Passed; 16 evidence records checked, 0 skipped |
| `node bin/oes.mjs check-all --require-hash --warnings-as-errors --json` | `passed: true`, `diagnostics: []`, 16 checked, 0 skipped |
| `npm run demo` | Passed; synthetic records with actual local Git history, 22 nodes, 11 edges, 9 evidence records checked |

The demo's negative controls still reject a fabricated excerpt and refuse to
infer implementation from a bare ticket mention. Its `agentRun` remains false.

## Residual boundaries

- OES validation checks structure and exact source text, not truth, entailment,
  identity correctness or authenticated approval.
- A contextd graph-route miss describes the supplied graph. It does not prove
  absence of project knowledge outside that route.
- The graph JSON Schema describes an interchange envelope; ontology semantics
  still use the bounded OES reference engine.
- Extract, link and verify have concrete executable guidance. The other nine
  skills remain procedural outlines awaiting worked domain examples and
  acceptance artifacts; they were not rewritten or evaluated as agent runs.

The change is suitable for code review with these limits. It does not authorize
publication of a proposed graph or mark any assertion `verified`.
