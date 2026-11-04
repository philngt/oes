# Source-code adapter

Input: git revision, repository metadata, language, build artifacts, manifest files and optional verified runtime observations.

1. Pin a commit SHA and file path/line ranges; never analyze a moving branch without recording revision.
2. Prefer AST, symbol resolution, build/config manifests and deployment descriptors for deterministic edges.
3. Use service boundaries, interfaces, events and message topics as domain entities; avoid promoting every local variable to a high-level architectural concept.
4. Mark an edge as observed only when a direct artifact supports it. A method name resembling a topic is not proof of Kafka production.
5. Separate declared topology (config, annotations) from runtime execution (telemetry). Record telemetry with its own Source and timestamp.
6. Cross-link commits/tickets/decisions only when shared issue IDs or explicit evidence justify the bridge.

Risk: polymorphic/dynamic calls, reflection, dependency injection, generated code, feature flags, branch-specific configs. Keep uncertainty and scope.

