---
name: db-diagnostics
description: automated database diagnostics (anti-blind)
---

# SKILL: AUTOMATED DATABASE DIAGNOSTICS (ANTI-BLIND - SUPABASE EDITION)

## CONTEXT
Triggered when encountering synchronization defects, PostgREST API runtime errors, Row Level Security (RLS) violations, or unhandled exceptions when connecting with the Supabase client backend.

## RULES

1. **Anti-Guessing Protocol:** In the event of a 400 (Bad Request), 401 (Unauthorized), 403 (RLS Forbidden), or 500 status code, or when data states fail to mutate, the agent is strictly prohibited from altering frontend state logic based on assumptions.

2. **Diagnostic Script Execution:** The agent must autonomously instantiate a temporary Node.js diagnostic script (e.g., `debug-supabase.js`) utilizing native `@supabase/supabase-js` queries to fetch the latest 5 records or verify the exact remote table columns, data types, and policies from the cloud instance.

3. **Local State Evaluation:** Output the fetched payload or error object into a local `db_debug.json` file. Evaluate this JSON file locally to map out structural differences between frontend mutation payloads, PostgreSQL constraints, and table definitions. Explain the defect clearly to the user, apply the precision fix to the codebase, and cleanly delete all temporary diagnostic files before finalizing.

4. **Stop-and-Reconsider Rule (do not loop):** If a fix attempt fails after 2-3 tries, STOP retrying the same approach. Reconsider: try a different diagnostic method, re-check the actual schema/policies (not what you assume they are), or inspect relevant logs. Supabase issues are not always solved by retrying the same command, and the answer is not always in the logs — but logs are worth checking before proceeding further.

5. **Known Supabase Gotchas — check these FIRST for the matching status code, before writing a custom diagnostic script:**

   - **Silent UPDATE failures (0 rows changed, no error):** `UPDATE` requires a `SELECT` policy on the table in addition to an `UPDATE` policy. Without a matching `SELECT` policy, Supabase silently returns 0 affected rows — no error is thrown. If a mutation "succeeds" but nothing changes, check for a missing `SELECT` policy before assuming a frontend bug.
   - **Views silently bypassing RLS:** Views do not inherit RLS from their base tables by default. Set `security_invoker = true` on the view so RLS policies are actually enforced against the querying user, not the view owner.
   - **Storage upload/replace silently failing:** Storage `upsert` requires `INSERT` + `SELECT` + `UPDATE` policies together. Granting only `INSERT` makes file replacement silently fail with no visible error.
   - **403 / RLS Forbidden on a table that "should" be accessible:** RLS controls which *rows* are visible once a table is reachable — it does NOT control whether the table is exposed to the Data (REST) API at all. Check the Data API table-exposure setting separately from RLS policies; a SQL-created table may not be auto-exposed, and `anon`/`authenticated` roles may need explicit `GRANT` access even when RLS policies look correct.
   - **401 after deleting/banning a user:** Deleting a user does NOT invalidate their existing JWT/access token. If testing a "removed access" scenario, explicitly revoke sessions — do not assume the old token stops working on its own.
   - **Never expose `service_role` key on the frontend.** In Next.js/Vite, any env var prefixed for client exposure (e.g. `NEXT_PUBLIC_*`, `VITE_*`) is shipped to the browser. Double-check no `service_role` or other secret key is assigned to a client-exposed env var during diagnosis.

6. **Verify against current docs, not memory:** Supabase changes frequently. Before concluding a diagnosis based on remembered behavior, quickly check the current Supabase docs/changelog for the relevant feature (RLS, Storage, Auth) rather than relying purely on training data, since config options and API conventions shift between versions.