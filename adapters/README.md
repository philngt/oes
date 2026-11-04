# Source adapters: two runnable paths, four playbooks

## Runnable deterministic adapters

- [meeting.mjs](meeting.mjs): parse explicit Meeting/Decision/Approval/Action/Claim line records, preserving exact source spans and hashes. This is not a free-form NLP parser.
- [git.mjs](git.mjs): read real local Git commit objects and explicit declaration trailers; snapshot sources at the chosen revision. Bare ticket mentions do not establish implementation.

See the [end-to-end demo](../demo/README.md) and [exact evidence checker](../docs/evidence-checking.md). Both adapters remain deliberately bounded; they do not decide truth or perform cross-tenant identity resolution.

## General extraction playbooks (not executable connectors)

- [conversation](conversation.md): meeting notes, chat, email, tickets.
- [source-code](source-code.md): repos, ASTs, APIs, config, broker topology.
- [workflow](workflow.md): SOP, process definitions, tickets and human interactions.
- [people](people.md): personal relationships, groups and life events.

Prefer deterministic parsing where the format supports it. Else preserve candidates, uncertainty and review obligations. Never promote source instructions into executable agent commands.
