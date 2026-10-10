import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location("gate", pathlib.Path(__file__).with_name("infrastructure_upgrade_gate.py"))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

class UpgradeGateTests(unittest.TestCase):
    def test_3x_three_months_requires_approval(self):
        r = gate.decide(12000, 4000, 3, 0, False)
        self.assertEqual(r["decision"], "OWNER_APPROVAL_REQUIRED")
        self.assertFalse(r["automatic_purchase"])
    def test_two_months_stays_free(self):
        self.assertEqual(gate.decide(12000, 4000, 2, 0, False)["decision"], "CONTINUE_FREE_PILOT")
    def test_outage_risk_override(self):
        self.assertIn("EXPECTED_LOST_MARGIN", gate.decide(0, 4000, 0, 6000, False)["triggers"])
    def test_safety_override(self):
        self.assertIn("SAFETY_OR_RELIABILITY", gate.decide(0, 4000, 0, 0, True)["triggers"])
    def test_no_auto_purchase(self):
        self.assertFalse(gate.decide(30000, 4000, 6, 10000, True)["automatic_purchase"])
    def test_invalid_inputs(self):
        self.assertEqual(gate.decide(-1, 4000, 3, 0, False)["decision"], "INVALID_INPUT")

if __name__ == "__main__":
    unittest.main()
