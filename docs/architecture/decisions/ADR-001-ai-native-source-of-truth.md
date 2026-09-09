# ADR-001: Repository as the AI-Native Source of Truth

- Status: Accepted
- Date: 2026-09-09

## Context

Arta is intended to be developed heavily with AI agents. Chat sessions, agent context windows, and model memory are not reliable durable project storage. Without a stable source of truth, different agents may make contradictory assumptions or repeatedly rediscover decisions.

## Decision

The Git repository and GitHub workflow are the durable project brain.

Knowledge is separated by responsibility:

- `AGENTS.md` defines AI working rules.
- `docs/product/` stores accepted product knowledge.
- `docs/architecture/` stores architecture and domain design.
- ADRs store durable decisions and their rationale.
- `docs/context/current-state.md` is a compact project checkpoint.
- `docs/context/assumptions.md` stores unresolved assumptions/questions.
- `docs/planning/` stores roadmap and scope.
- GitHub Issues store executable work and acceptance criteria.
- Pull requests and commits store implementation/change history.

Chat transcripts are not a source of truth. Durable conclusions from conversations must be distilled into repository artifacts.

## Consequences

### Positive

- New AI sessions can recover context from the repository.
- Decisions are reviewable and versioned.
- Project knowledge is portable across AI tools.
- Contradictions can be detected against explicit documentation.

### Costs

- Documentation must be maintained as part of implementation work.
- Agents and humans must distinguish accepted knowledge from brainstorming.
- Stale documentation becomes a risk, so current-state updates must be part of completion criteria when relevant.
