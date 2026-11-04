# Workflow and human-interaction adapter

Input: versioned SOP/BPMN/tickets/approval records, participant roles, decision gates and known execution logs.

1. Split process definitions from execution instances. A role permitted to approve is not proof that a person approved.
2. Discover Process, Step, Task, Role, Team, Policy, DecisionGate, Handoff and Interaction concepts.
3. Define transition order, preconditions, exceptions and responsibility boundaries with clear domain/range.
4. Attach evidence to observed handoffs; derive task ownership from explicit assignments only.
5. Preserve effective dates of policies and versions of processes.
6. Send ambiguous role synonyms to ontology-align rather than silently merging them.

Risk: treating historical workflows as current, confusing accountability with responsibility, and assuming approval from missing rejection.

