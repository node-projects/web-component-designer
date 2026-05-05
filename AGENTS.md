## Project Agent Instructions

- AI agents must store memories under the repository [memories/](memories) directory.

## Why These Guidelines Exist

- Agents may make unchecked assumptions, hide confusion, and skip clarifications.
- Agents may overengineer solutions with unnecessary abstractions and code bloat.
- Agents may accidentally modify unrelated code or comments as side effects.

## Core Principles

### 1. Think Before Coding

- State assumptions explicitly; if uncertain, ask instead of guessing.
- Surface ambiguity and tradeoffs rather than silently choosing one interpretation.
- Push back when a simpler and safer approach exists.
- Stop and ask for clarification when confusion remains.

### 2. Simplicity First

- Implement the minimum code needed to solve the requested problem.
- Do not add speculative features, configurability, or abstractions not requested.
- Avoid handling impossible scenarios just to look complete.
- If a solution can be significantly simpler, prefer the simpler version.

### 3. Surgical Changes

- Touch only code required by the task.
- Do not refactor or restyle adjacent code that is unrelated to the request.
- Match existing project style and patterns.
- If you see unrelated dead code, mention it; do not remove it unless asked.
- Remove only unused artifacts created by your own changes.

### 4. Goal-Driven Execution

- Define concrete success criteria before implementation.
- Prefer verifiable outcomes, usually with tests or explicit checks.
- For multi-step tasks, use a short plan where each step includes a verification check.
- Continue iterating until criteria are met or a real blocker is identified.

## Success Signals

- Diffs contain only requested changes.
- Solutions are simple and avoid unnecessary rewrites.
- Clarifying questions happen before implementation when needed.
- Pull requests stay minimal and focused.

## Tradeoff

- These rules prioritize caution and correctness over raw speed on non-trivial tasks.
- For obvious small changes, use proportional rigor.