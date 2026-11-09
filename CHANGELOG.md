# Changelog

## Unreleased — semantic foundation

- Define the meaning of all 48 existing relations while retaining their names, endpoints and cardinalities.
- Add the shared `agents` template for Actor and Person, fixing the workflow/people composition collision without relaxing the compiler.
- Add six evidence-bearing relations: `representsPerson`, `statedIn`, `decidedBy`, `realizedAsTask`, `tracksTask`, `motivatesPolicy`.
- Declare optional string Source metadata `sha256`, `version` and `retrievedAt`; document the distinction between string validation and source/hash integrity.
- Add a static synthetic cross-domain fixture and bounded competency-question tests, including negative attribution, identity and missing-link controls.
- Document semantic contracts, downstream compatibility, upgrade and rollback. Existing relation renames, required-name changes, reasoning and a Product Graph importer are not part of this update.

Core and the five existing template metadata versions become `0.2.0`; the new agents template starts at `0.1.0`. Package/plugin version and wire-format versions are unchanged. See [compatibility and migration notes](docs/semantic-foundation-compatibility.md), especially copied definitions and previously untyped Source metadata.
