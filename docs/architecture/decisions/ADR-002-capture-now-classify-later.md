# ADR-002: Capture Now, Classify Later

- Status: Accepted
- Date: 2026-09-09

## Context

The reliability of household financial data depends on transactions being recorded. Requiring full categorization and metadata at purchase time creates friction, causing family members to postpone entry and later forget transactions.

## Decision

Arta separates transaction capture from transaction classification.

A transaction may enter the system with incomplete information and a review/pending state. The Transaction Inbox provides a later workflow for classification, correction, and confirmation.

The product should optimize common capture flows for minimal effort rather than requiring a complete accounting-style form.

## Consequences

- The domain model must represent incomplete/reviewable captures safely.
- Reporting and budget calculations need explicit rules about which transaction states are trusted.
- Future automatic capture sources can feed the same review workflow.
- Provenance and uncertainty should be preserved instead of silently guessing missing information.
