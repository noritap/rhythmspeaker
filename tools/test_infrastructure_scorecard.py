import importlib.util
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
spec = importlib.util.spec_from_file_location("scorecard", pathlib.Path(__file__).with_name("infrastructure_scorecard.py"))
scorecard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scorecard)

def row(**changes):
    base = {"system":"Workshop", "monthly_incremental_gross_profit_jpy":"", "monthly_cost_jpy":"", "consecutive_months":"", "expected_lost_margin_jpy":"", "safety_blocker":"false", "uptime_critical":"true", "evidence":""}
    base.update(changes)
    return base

class ScorecardTests(unittest.TestCase):
    def test_unknown_is_not_zero(self):
        self.assertEqual(scorecard.evaluate(row())["decision"], "INSUFFICIENT_EVIDENCE")
    def test_qualified_requires_approval(self):
        x = scorecard.evaluate(row(monthly_incremental_gross_profit_jpy="12000", monthly_cost_jpy="4000", consecutive_months="3", expected_lost_margin_jpy="0", evidence="verified report"))
        self.assertEqual(x["decision"], "OWNER_APPROVAL_REQUIRED")
        self.assertFalse(x["automatic_purchase"])
    def test_no_evidence_no_upgrade(self):
        x = scorecard.evaluate(row(monthly_incremental_gross_profit_jpy="12000", monthly_cost_jpy="4000", consecutive_months="3", expected_lost_margin_jpy="0"))
        self.assertEqual(x["decision"], "INSUFFICIENT_EVIDENCE")
    def test_negative_rejected(self):
        with self.assertRaises(ValueError):
            scorecard.evaluate(row(monthly_incremental_gross_profit_jpy="-1"))
    def test_nonfinite_rejected(self):
        with self.assertRaises(ValueError):
            scorecard.evaluate(row(monthly_incremental_gross_profit_jpy="nan"))
    def test_fractional_months_rejected(self):
        with self.assertRaises(ValueError):
            scorecard.evaluate(row(monthly_incremental_gross_profit_jpy="12000", monthly_cost_jpy="4000", consecutive_months="2.5", expected_lost_margin_jpy="0", evidence="verified"))
if __name__ == "__main__":
    unittest.main()
