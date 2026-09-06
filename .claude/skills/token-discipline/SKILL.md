---
name: token-discipline
description: token discipline and context efficiency
---

# SKILL: TOKEN DISCIPLINE & CONTEXT EFFICIENCY

## CONTEXT
Applied globally across all file read/write mutations and execution tool logs to minimize token consumption and maximize efficiency on OpenRouter endpoints.

## RULES
1. **Anti-Redundant Reading:** The agent must not repeatedly execute read commands on large static source files within the same active session if the file contents have not changed. Rely strictly on cached context memory.
2. **Strict Diff Patching Only:** When mutating source code, the agent must output minimal, highly localized line differences (Diff Patches). Rewriting entire 300+ line files to resolve localized bugs is completely forbidden.
3. **Context Pruning & Summarization:** When the system context window approaches maximum density, the agent must proactively summarize core logical agreements and prune historical conversational metadata before processing the next instruction block.
