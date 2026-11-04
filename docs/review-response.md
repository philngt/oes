# Review-driven changes (unreleased)

Target baseline: `19c0e1cc439d56b24233835df80a210596c841d7`.

## Implemented

- Exact local `Lx` / `Lx-Ly` citation verification, optional/required SHA-256, structured diagnostics, strict CI mode, safe root-relative files, explicit remote skips.
- Corrected four graphs: exact spans, no invented Binh authorship, consumer-loss limitation preserved without a false contradiction; an inverse claim is explicitly inferred with a premise.
- Composition compares recursively sorted object keys, keeping array order significant. It is structural comparison, not a semantic-equivalence reasoner. Conflicting inherited constraint IDs also fail instead of silently selecting a definition.
- `requiresEdge` reuses relation/endpoint counts rather than scanning every edge for every node (roughly O(E + C×N), excluding type hierarchy work).
- GitHub-controlled JSON-LD vocabulary namespace; corrected clone-directory instruction.
- One reproducible local-Git proof-of-work demo with deterministic meeting/Git adapters, evidence-bearing trace output, and negative controls.
- Expanded only extract/link/verify with concrete commands, output contracts and rejection cases. No new templates or skills.

## Interpretation corrections

- Reusing an exact source span for several genuinely supported assertions is valid; duplicate evidence nodes per edge are not required.
- `Claim --supportedBy--> Evidence` is a citation, not a logical cycle. Redundant `evidenceIds: [same-target]` is now optional for this relation.
- Missing support cannot be repaired merely by relabeling an edge as inferred.
- A limitation is not automatically a contradiction. The decision and the consumer-loss limitation can coexist.
- A ticket ID in a commit message proves a mention, not implementation. This demo requires explicit declaration trailers and still labels the relationship asserted.

## Not claimed

No full vendor CLI installation test, production readiness, official marketplace publication, actual agent run, human-labeled extraction precision/recall, or semantic verification. More tests increase confidence in the bounded code paths, not in arbitrary agent-generated ontologies.
