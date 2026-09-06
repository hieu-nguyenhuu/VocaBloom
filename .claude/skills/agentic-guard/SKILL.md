---
name: agentic-guard
description: agentic guard and automation workflow
---

# SKILL: AGENTIC GUARD & AUTOMATION WORKFLOW

## CONTEXT
Activated throughout the entire engineering lifecycle (Planning, Coding, and Debugging) to enforce production safety, atomic version control, and rigorous state synchronization.

## RULES

### 1. Git Awareness Guard
- You are strictly FORBIDDEN from executing `git add`, `git commit`, `git push`, or any history-mutating Git commands automatically. 
- Leave all version control operations to the user. Your only job is to ensure the code compiles successfully (`npm run build` returns a green status) before marking a task as completed.

### 2. Micro-Task Isolation (Anti-Drift)
Never attempt to resolve a broad milestone in a single massive code injection.

Break down the active implementation block into micro-steps (2-5 minutes of work each). Complete one step, test it via the terminal, commit it via Git, and only then proceed to the next micro-step.

### 3. Active Memory Synchronization
Do not wait for the end of the session to update your brain state.

Every time a significant design choice is locked in, or an unexpected architectural hurdle is bypassed, immediately perform a silent sync update to memory-bank/activeContext.md and memory-bank/progress.md to prevent context amnesia during accidental session restarts.
