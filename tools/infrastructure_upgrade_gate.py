#!/usr/bin/env python3
"""Revenue-first infrastructure upgrade gate. Stdlib only; no external calls."""
import argparse
import json

def decide(gross_profit, monthly_cost, consecutive_months, expected_lost_margin, safety_blocker):
    if monthly_cost <= 0:
        return {"decision": "REVIEW_COST", "reason": "All-in incremental monthly cost must be positive"}
    if min(gross_profit, consecutive_months, expected_lost_margin) < 0:
        return {"decision": "INVALID_INPUT", "reason": "Inputs must be nonnegative"}
    triggers = []
    if consecutive_months >= 3 and gross_profit >= 3 * monthly_cost:
        triggers.append("PROFIT_3X_3_MONTHS")
    if expected_lost_margin > monthly_cost:
        triggers.append("EXPECTED_LOST_MARGIN")
    if safety_blocker:
        triggers.append("SAFETY_OR_RELIABILITY")
    return {
        "decision": "OWNER_APPROVAL_REQUIRED" if triggers else "CONTINUE_FREE_PILOT",
        "triggers": triggers,
        "ratio": round(gross_profit / monthly_cost, 2),
        "automatic_purchase": False,
        "note": "Gross profit must be attributable and recurring; saved hours are tracked separately.",
    }

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--gross-profit", type=float, required=True, help="Attributable monthly incremental gross profit in JPY")
    p.add_argument("--monthly-cost", type=float, required=True, help="All-in incremental monthly cost in JPY")
    p.add_argument("--months", type=int, required=True, help="Consecutive months at or above threshold")
    p.add_argument("--expected-lost-margin", type=float, default=0)
    p.add_argument("--safety-blocker", action="store_true")
    a = p.parse_args()
    print(json.dumps(decide(a.gross_profit, a.monthly_cost, a.months, a.expected_lost_margin, a.safety_blocker), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
