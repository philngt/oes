# Proof-of-work demo: meeting → ticket → real Git commit

**One bounded example, not a new platform.** This runnable demo creates a new local Git repository, commits meeting/ticket records, makes a real configuration commit, runs two deterministic adapters, validates the resulting graph, and answers:

> Which decision led to this commit, who is recorded as approver, and where is the evidence?

The documents and identities are **synthetic**. The commit objects, diffs and SHA values are **real Git objects** generated from those documents. No Claude/Codex/Antigravity agent is invoked. This demonstrates the deterministic extraction/validation path, not comparative LLM quality.

## Run

Requires Node.js 20+ and Git on PATH; no third-party Node dependencies.

```bash
npm test
npm run validate
npm run demo
# Or retain results in a specific NEW directory:
node demo/run.mjs --out .oes-demo
```

An existing output directory is refused, never deleted or overwritten. With no `--out`, a new temporary directory is created and printed.

The run prints `passed: true`, two real commit SHAs, 22 nodes, 11 edges, **9 exact evidence records checked**, 0 skipped sources, and the expected answer **T42 / D1 / An**. Inspect `answer.json` for the evidence paths, locators, exact excerpts and content digests. Git's author is deliberately named **Demo Engineer**, not An, to make authorship/approval conflation visible.

## What happens

1. `git init` and a real commit record `meetings/review.md`, `tickets/T42.md`, and the original producer config.
2. A second real commit changes `delivery.timeout.ms=120000` to `300000` and includes explicit `Implements: T42` and `Decision: D1` trailers.
3. `adapters/meeting.mjs` parses a documented line grammar into candidate decisions, assignments, approval claims and evidence.
4. `adapters/git.mjs` reads actual Git commit objects, snapshots them, resolves explicit trailers and the ticket file at the referenced revision, and joins them to known decision IDs.
5. The actual `check-graph` and `check-evidence` CLI commands run with warnings treated as failures and source hashes required.
6. `demo/trace.mjs` follows only explicit `decidedIn`/`implementsTicket` edges and displays supporting records. It refuses a graph whose citations fail.

The approval is represented as an ordinary `Claim` with adapter metadata (`recordKind`, `decisionId`, `approver`, `approvalStatus`), not as a new ontology class. The trace checks these metadata against the exact cited approval line. No new template or skill was added.

## Run the individual steps against the generated directory

Substitute the printed output directory and full commit SHA:

```bash
node adapters/meeting.mjs --source-root /path/to/demo \
  --input repo/meetings/review.md --out /path/to/demo/candidates.graph.json
node adapters/git.mjs --repo /path/to/demo/repo --source-root /path/to/demo \
  --graph /path/to/demo/candidates.graph.json --out /path/to/demo/graph.json
node bin/oes.mjs check-graph /path/to/demo/graph.json --warnings-as-errors
node bin/oes.mjs check-evidence /path/to/demo/graph.json \
  --source-root /path/to/demo --require-hash --warnings-as-errors
node demo/trace.mjs --graph /path/to/demo/graph.json \
  --commit FULL_SHA --source-root /path/to/demo
```

The trace script is intentionally a scenario-specific query, not a general `oes trace` engine.

## Negative controls

- The first commit merely mentions `T42` in its subject: **no** `implementsTicket` edge is created.
- Replacing an excerpt with a fabricated Kafka decision makes `check-evidence` exit **1**.
- Tests remove the approval record: the answer becomes **unknown**, never the Git author.
- Tests change the approver metadata without changing its citation: trace refuses the mismatch.
- Tests run the demo twice: fixed fixture bytes and commit metadata produce identical SHAs.

## Adapter scope

Meeting grammar: `Meeting: ID | date=YYYY-MM-DD`, `Decision: ID | statement`, `Approval: decision-ID | person | approved/rejected`, `Action: ID | owner | summary`, `Claim: ID | statement`. Unrecognized prose stays unmodeled. Duplicate IDs and unknown approval targets fail. Actor IDs are source-scoped; equal display names across files are not merged automatically. Explicit decision/ticket IDs are interpreted within this operator-selected project scope. It is not a general meeting-transcription parser.

Git adapter: an operator-selected repository under `sourceRoot`, bounded to 100 commits by default. It uses process argument arrays, never a shell. Only a terminal trailer block with exact `Implements: T42` / `Decision: D1` conventions creates links. Bare mentions do not. An `Implements` link requires `tickets/T42.md` at that commit with a matching `Ticket: T42` header. Missing references are reported, not invented. These conventions are narrow by design.

No source authentication, automatic truth verification, production corpus benchmark, end-to-end LLM run, human-labeled evaluation set, MCP service, Neo4j exporter or video is claimed by this demo. Those are separate follow-up experiments, not prerequisites for proving this smaller path.
