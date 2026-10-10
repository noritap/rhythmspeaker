import pathlib
import sys
import unittest
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from instructor_form_link_guard import validate, validate_page, validate_public_files


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

    def test_comments_and_computed_reassignments(self):
        valid = "window.RS_INSTRUCTOR_FORM_URL = 'https://forms.gle/AbCd123';"
        self.assertTrue(validate("/** Instructions */\n" + valid + "\n// end")[0])
        self.assertFalse(validate("/* " + valid + " */")[0])
        self.assertFalse(validate(valid + "\nwindow.RS_INSTRUCTOR_FORM_URL = 'https://' + 'docs.google.com/edit';")[0])
        self.assertFalse(validate(valid + "\nwindow['RS_INSTRUCTOR_FORM_URL'] = 'unsafe';")[0])

    def test_ports_and_url_ambiguity(self):
        for url in [
            'https://docs.google.com:bad/forms/d/e/abc/viewform',
            'https://docs.google.com:443/forms/d/e/abc/viewform',
            'https://forms.gle:8443/abc',
            'https://user@forms.gle/abc',
            'https://forms.gle/abc#section',
            'https://forms.gle/abc?email=private',
            'https://forms.gle/abc\t',
            'https://[invalid/abc',
        ]:
            with self.subTest(url=url):
                self.assertFalse(self.check(url))

    def test_html_activation_contract(self):
        page = '<script src="./form-config.js"></script><a id="form-link" href="#" hidden>Submit</a>'
        self.assertTrue(validate_page(page)[0])
        self.assertFalse(validate_page(page.replace(' hidden', ''))[0])
        self.assertFalse(validate_page(page.replace('href="#"', 'href="https://docs.google.com/forms/d/abc/edit"'))[0])
        self.assertFalse(validate_page(page + '<a id="form-link" href="#" hidden>Duplicate</a>')[0])

    def test_google_urls_outside_configuration(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / 'index.html').write_text('<script src="./form-config.js"></script><a id="form-link" href="#" hidden>Submit</a>')
            self.assertTrue(validate_public_files(root)[0])
            for url in ['https://docs.google.com/forms/d/abc/edit', 'https://docs.google.com/spreadsheets/d/private/edit', 'https://forms.gle/abc']:
                (root / 'extra.js').write_text('const url = "' + url + '";')
                self.assertFalse(validate_public_files(root)[0])


if __name__ == "__main__":
    unittest.main()
