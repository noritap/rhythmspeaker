#!/usr/bin/env python3
"""Evaluate measured infrastructure candidates from a local CSV; no network or write operations."""
import argparse
import csv
import json
import math
from pathlib import Path

FIELDS = ("system", "monthly_incremental_gross_profit_jpy", "monthly_cost_jpy", "consecutive_months", "expected_lost_margin_jpy", "safety_blocker", "uptime_critical", "evidence")

def numeric(value):
    if value is None or not value.strip():
        return None
    result = float(value)
    if not math.isfinite(result) or result < 0:
        raise ValueError("Nonnegative finite numeric input required")
    return result

def evaluate(row):
    from infrastructure_upgrade_gate import decide
    name = row["system"].strip()
    if not name:
        raise ValueError("system is required")
    values = [numeric(row[k]) for k in ("monthly_incremental_gross_profit_jpy", "monthly_cost_jpy", "consecutive_months", "expected_lost_margin_jpy")]
    evidence = row["evidence"].strip()
    if not evidence or any(v is None for v in values):
        return {"system": name, "decision": "INSUFFICIENT_EVIDENCE", "automatic_purchase": False}
    profit, cost, months, loss = values
    if not months.is_integer():
        raise ValueError("consecutive_months must be an integer")
    if row["safety_blocker"].strip().lower() not in ("true", "false"):
        raise ValueError("safety_blocker must be true or false")
    outcome = decide(profit, cost, int(months), loss, row["safety_blocker"].strip().lower() == "true")
    return {"system": name, **outcome, "uptime_critical": row["uptime_critical"].strip().lower() == "true", "evidence": evidence}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("csv_file", type=Path)
    args = p.parse_args()
    with args.csv_file.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not set(FIELDS).issubset(reader.fieldnames or []):
            p.error("Missing required CSV columns")
        output = [evaluate(row) for row in reader]
    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
