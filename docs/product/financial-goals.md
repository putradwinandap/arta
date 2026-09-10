# Financial Goals

Status: Implemented by Issue #7

Arta financial goals represent money the household has actually set aside, not manually claimed progress.

## MVP behavior

- A goal belongs to one household and currency and has a positive target amount.
- Goal funding reserves existing money from a specific active wallet of the same currency.
- Reservation does not create income, expense, or a wallet transfer and therefore does not consume a spending budget.
- Wallet physical balance remains unchanged by reservation.
- Wallet available-to-spend money is physical balance minus all active goal reservations sourced from that wallet.
- Arta rejects a reservation when the wallet does not have enough unreserved money, preventing the same funds from backing multiple goals.
- Goal progress is derived from append-only reserve/release events.
- Release is explicit and cannot exceed the amount currently reserved from that wallet for that goal.
- `remaining = max(target - reserved, 0)`; a goal may remain overfunded if its target is edited downward.
- Archived goals remain visible. New reservations are rejected; reserved money is not silently released by archival.

## Physical transfers

When a person also moves money between real bank accounts/wallets, that movement is recorded separately as a wallet transfer. The goal reservation records the purpose of money already present in the chosen wallet. This prevents goal funding from being counted twice.

See `docs/architecture/decisions/ADR-007-reserved-fund-financial-goals.md`.
