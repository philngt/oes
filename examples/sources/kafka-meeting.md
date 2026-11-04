# Kafka delivery review
Meeting date: 2026-10-20
Participants: An, Binh
Decision: Increase producer delivery.timeout.ms to 300000 after lost writes investigation.
Binh will implement a configuration proof of concept.
Evidence: incident notes link the missing records to swallowed consumer DB timeouts; the producer change does not by itself fix lost writes.
