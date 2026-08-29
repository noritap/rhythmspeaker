# 3VC — Public booking hardening (2026-08-30)

## Cycle 1 — DOM safety
- eliminate reliance on implicit browser globals for public booking elements
- make all form and display element references explicit

## Cycle 2 — Seat-display policy
- implement the public seat threshold directly in the reservation page
- 4+ seats: `受付中`
- 3/2/1 seats: exact remaining count
- 0 seats: `満席`
- keep exact counts in admin/instructor views

## Cycle 3 — Sold-out UX
- disable sold-out class selection in the public UI
- keep server-side capacity enforcement authoritative
- add a final client-side availability check before submit for clearer feedback
