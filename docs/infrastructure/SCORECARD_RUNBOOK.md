# Infrastructure Scorecard — operating guide
This is a measurement tool, **not** a payment, deployment, allocation or Supabase management tool.

1. Copy `docs/infrastructure/scorecard.template.csv` outside the public repository to a private working file.
2. Fill in verified incremental gross profit, *all-in incremental* monthly cost, consecutive qualifying months, expected lost margin, and evidence reference. Leave unknowns empty. Do not enter customer personal data, passwords, keys or non-public financial detail in a public PR.
3. Run `python tools/infrastructure_scorecard.py /path/to/private-scorecard.csv`. This prints JSON decisions, but makes no external calls or purchases.
4. `INSUFFICIENT_EVIDENCE` means gather data; `CONTINUE_FREE_PILOT` means no upgrade threshold reached; `OWNER_APPROVAL_REQUIRED` means only **request** budget and risk review. It is not authorization to buy.
5. `python -m unittest discover -s tools -p 'test_infrastructure_*.py' -v` runs the gate and scorecard unit tests.

### Guardrails
- Free capacity allocation is a separate architecture decision; scorecard output never authorizes moving a live project.
- Record saved labor hours and maintenance time separately from gross profit; do not invent a cash equivalent.
- Revenue and uptime data must be obtained from actual sources; blanks are not zero.
- If the monthly cost is zero, the paid-upgrade gate returns REVIEW_COST. Do not divide by zero or assert free usage is guaranteed.
- Current production workshop DB and paused guesthouse backend remain untouched.
