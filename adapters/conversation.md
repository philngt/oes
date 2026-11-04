# Conversation / meeting / ticket adapter

Input: transcript or document, stable source URI/revision, message IDs and timestamps, actor identities if available.

1. Segment by message, speaker and source offsets, maintaining exact text span references.
2. Identify **statements** separately from Decisions, ActionItems, Questions and Topics.
3. Treat proposed decisions as claims until the record explicitly indicates acceptance.
4. Extract ActionItem owner and due date only if supported by a source span; resolve relative deadlines using the event timestamp, not today's date.
5. Emit Source + Evidence nodes first. Emit candidate graph nodes and edges with evidenceIds, then send to ontology-resolve/verify.
6. Keep conflicting meeting notes and corrections as separate, versioned claims.

Risk: assigning a participant to an action they did not accept; mistaking a question for a decision; inferring intent from sentiment. Avoid all three.

