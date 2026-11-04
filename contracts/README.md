# Output contracts

These JSON Schema 2020-12 documents describe concrete graph envelopes, CLI diagnostics and Git adapter reports. They are exchange contracts for consumers, not an ontology compiler or a new runtime dependency. The Node CLI checks domain semantics with the existing engine and source bytes with the local evidence checker. It does not claim to implement a general JSON Schema interpreter.

Use any conforming external JSON Schema validator for contract-level checks. Domain/range, cross-reference integrity, provenance paths and source matching require the OES CLI; the envelope schema alone is deliberately insufficient.
