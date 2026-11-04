# Adapter playbooks (not executable connectors)

Adapters describe how to transform inputs into **candidate** entities, claims and evidence spans. They do not claim to implement automatic ingestion.

- [conversation](conversation.md): meeting notes, chat, email, tickets.
- [source-code](source-code.md): repos, ASTs, APIs, config, broker topology.
- [workflow](workflow.md): SOP, process definitions, tickets and human interactions.
- [people](people.md): personal relationships, groups and life events.

Shared adapter contract: `sourceId`, `sourceVersion`, `locator`, `text/span`, `extractedAt`, `candidateTypes`, `confidence`, `reviewStatus`. Map that into Source, Evidence, node and edge artifacts, then validate. Use stable IDs and never collapse incompatible identities automatically.

