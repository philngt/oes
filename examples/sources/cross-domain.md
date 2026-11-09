# Cross-domain reliability trace (synthetic)
All people, conversations, tickets, tasks and commit records below are fictional fixtures. Commit SHA strings are illustrative identifiers, not resolved Git objects.
Snapshot: cross-domain-v1. Recorded decisions are source assertions, not evidence of deployed or successful behavior.
Conversation M1 is the fictional Database retry proof-of-concept review.
Message MSG1 says: Keep database-write failures eligible for retry in the proof of concept.
Conversation M1 contains Message MSG1.
Message MSG1 was spoken by Actor A-AN (name: An).
Decision D1 states: Keep database-write failures eligible for retry in the proof of concept.
Actor A-AN adopted Decision D1; the decision lifecycle is accepted. This records the decision maker, not task completion.
Decision D1 is stated in Message MSG1.
Decision D1 is recorded in Conversation M1.
Actor A-AN explicitly represents Person P-AN (name: An Tran).
Actor A-BINH (name: Binh) explicitly represents Person P-BINH (name: Binh Le).
Person P-OTHER (name: Binh Le) is distinct from P-BINH; no actor-to-person link is supplied for P-OTHER.
ActionItem A1 is: Prepare the database-timeout proof of concept.
ActionItem A1 is recorded in Conversation M1.
ActionItem A1 is assigned to Actor A-BINH; assignment does not make Binh the speaker or decision maker.
Ticket REL-42 explicitly tracks ActionItem A1.
ActionItem A1 is realized as Task TASK-42 (Prepare the database-timeout proof of concept).
Ticket REL-42 explicitly tracks Task TASK-42.
Task TASK-42 is assigned to Person P-BINH.
Task TASK-42 remains open and uncompleted; no runtime observation or test result is recorded.
Policy POL1 states: A failed database write must remain eligible for retry in the proof of concept.
Decision D1 motivates Policy POL1.
Process PROC1 (Proof-of-concept review) is governed by Policy POL1.
Process PROC1 has Step STEP1 (Prepare the proof of concept).
Step STEP1 creates Task TASK-42.
Synthetic commit record C1 has illustrative sha 1111111111111111111111111111111111111111.
Synthetic commit record C1 explicitly declares that it implements Ticket REL-42; this declaration is unverified.
Synthetic commit record C1 explicitly identifies Decision D1 as its recorded decision context.
Synthetic commit record C1 explicitly declares changes to Service orders-consumer; no running deployment is asserted.
Synthetic commit record C2 has illustrative sha 2222222222222222222222222222222222222222.
C2 has message "docs: discuss REL-42"; it only mentions the ticket and declares no implementation or decision link.
