# Contributing

1. Open a bounded change: new concept, relation, fixture, skill or validator rule. Identify the existing type it extends.
2. Write a clear term definition with positive and negative examples, plus domain/range and cardinality.
3. Reuse `core` and existing domain templates when the semantics match **exactly**. If two types share a name but have different meanings, rename or introduce a reviewed alignment map rather than overriding.
4. Add source-grounded *synthetic* example nodes and edges. All non-verified edges require linked Evidence nodes with Source and locator.
5. Add a negative test for the rule or failure mode.
6. Run `npm test && npm run validate` and document breaking changes, provenance, and limitations.

Avoid claims of inference capabilities or format compliance that the runtime does not implement. Do not submit private data, real people records, credentials, or proprietary documents as fixtures.

The repository intentionally has no default license yet; licensing is an owner decision.

