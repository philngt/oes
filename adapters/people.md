# People and relationship adapter

Input: authorized personal CRM export, group membership records, explicit relationship statements, life-event participation.

1. Record scope and permission before extraction. Use synthetic data in public fixtures.
2. Distinguish Person identity from an alias, account, role or contact-book row.
3. Keep relationship direction explicit; parentOf and childOf are inverse **definitions**, not materialized instances.
4. Model group membership as a relation with a role property; people can hold different roles in different groups.
5. Model life events separately from long-lived relationships; record validFrom/validTo when provided.
6. Do not infer sensitive traits, kinship or social connections from co-attendance alone.
7. Require evidence for inferred associations and a review path for wrong matches.

Risk: privacy violations, false identity merges, reverse-edge mistakes and context-free labels such as "manager" or "partner".

