import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from instructor_form_link_guard import validate


class InstructorFormLinkGuardTests(unittest.TestCase):
    def check(self, url, live=False):
        return validate("window.RS_INSTRUCTOR_FORM_URL = '" + url + "';", live)[0]

    def test_blank_is_safe_until_launch(self):
        self.assertTrue(self.check(""))
        self.assertFalse(self.check("", live=True))

    def test_viewform_is_allowed(self):
        self.assertTrue(self.check("https://docs.google.com/forms/d/e/abc123/viewform"))
        self.assertTrue(self.check("https://forms.gle/AbCd123"))

    def test_edit_and_foreign_hosts_rejected(self):
        self.assertFalse(self.check("https://docs.google.com/forms/d/abc123/edit"))
        self.assertFalse(self.check("https://docs.google.com.evil.example/forms/d/e/abc/viewform"))
        self.assertFalse(self.check("http://forms.gle/abc"))

    def test_missing_or_duplicate_assignment_rejected(self):
        self.assertFalse(validate("const x = 1;")[0])
        self.assertFalse(validate("window.RS_INSTRUCTOR_FORM_URL = '';\nwindow.RS_INSTRUCTOR_FORM_URL = '';")[0])


if __name__ == "__main__":
    unittest.main()
