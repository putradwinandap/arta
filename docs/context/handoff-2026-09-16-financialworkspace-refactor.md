# Handoff: FinancialWorkspace Refactor

Last updated: 2026-09-16

## Task context

Issue #52 asks to refactor the web financial workspace into focused components while preserving routes, API contracts, offline behavior, capture semantics, and user-visible behavior. The intended approach follows `docs/development/coding-principles.md`: KISS, YAGNI, pragmatic SOLID, explicit domain rules, focused modules, and incremental verification.

## Repository state

- Current branch: `issue-50-budget-evolution`
- Current HEAD: `4dd30f5 chore: format budget overview integration test`
- The refactor commits were intentionally removed from local and remote history at the user's request.
- All refactor and documentation changes remain uncommitted in the working tree.
- Do not reset, restore, or discard the working tree without explicit confirmation.

## Uncommitted changes

- `docs/development/coding-principles.md`: pragmatic coding rules for the repository.
- `AGENTS.md`: points agents to the coding principles.
- `.github/pull_request_template.md`: mandatory coding-principles review checklist.
- `docs/context/current-state.md`: records Issue #50 as complete/closed.
- `apps/web/src/FinancialWorkspace.tsx`: thin one-line facade exporting the container.
- `apps/web/src/pages/FinancialPages.tsx`: imports the workspace through the feature boundary.
- `apps/web/src/components/financial/`: feature folder structure and extracted components.

## Current financial feature structure

```text
apps/web/src/components/financial/
├── summary/
│   └── index.ts
├── transactions/
│   └── index.ts
├── wallets/
│   └── index.ts
└── workspace/
    ├── FinancialHeader.tsx
    ├── FinancialWorkspace.tsx
    └── FinancialWorkspaceContainer.tsx
```

`FinancialSummary.tsx` is currently located at `apps/web/src/components/financial/FinancialSummary.tsx`; `summary/index.ts` re-exports it. `FinancialHeader.tsx` is a real extracted component. The wallet and transaction folders currently contain only placeholder index files and still need real components.

## Important current size

- `apps/web/src/FinancialWorkspace.tsx`: 1 line facade.
- `apps/web/src/components/financial/workspace/FinancialWorkspaceContainer.tsx`: now a small composition/layout boundary.

State, effects, cache fallback, household switching, CRUD, transaction creation, and transfer actions now live in `useFinancialWorkspace.ts`; feature markup lives in focused wallet and transaction components.

## Required next work

1. Add focused tests for extracted components/hooks where behavior is non-trivial.
6. Preserve all existing selectors, routes, API payloads, offline behavior, and household isolation.
7. Run `npm run typecheck:web`, `npm run test:web`, and `npm run build:web` after each coherent extraction.
8. Do not commit until the user explicitly asks; the user wants the current work preserved as uncommitted changes for now.

## Previous verification

The latest frontend verification before this handoff passed:

- Typecheck passed.
- 5 test files passed, 13 tests passed.
- Production PWA build passed.

`make server-check` also passed earlier using Git Bash's `sh.exe` and a task-specific temporary `GOCACHE`; the global Go cache had a Windows file/path conflict.

## Latest verification

- `npm.cmd run typecheck`: passed.
- `npm.cmd test -- --run`: 5 files and 13 tests passed.
- `npm.cmd run build`: production PWA build passed.

## Guardrails

- Use `apply_patch` for file edits.
- Do not create pass-through wrappers or empty folders as a substitute for actual decomposition.
- Do not change product/domain semantics during this refactor.
- Do not use floating point for monetary calculations.
- Do not discard existing uncommitted changes.
- Update this handoff if the next agent materially changes the refactor state.
