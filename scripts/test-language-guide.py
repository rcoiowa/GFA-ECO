#!/usr/bin/env python3
"""Exercise harmful regressions and required contextual exceptions offline."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('language', Path(__file__).with_name('check-language-guide.py'))
language = importlib.util.module_from_spec(spec)
spec.loader.exec_module(language)

class LanguageRegressionTests(unittest.TestCase):
    def test_retired_roles_are_rejected_across_markup(self):
        for text in ('<h1>Grace Companion</h1>', 'lede="AI peer-support companion"', 'Grace AI Peer Companion'):
            with self.subTest(text=text):
                self.assertTrue(language.inspect_text(text))

    def test_brand_variants_do_not_silently_pass(self):
        for text in ('No shame. No stigma. Just grace.', 'No Shame, No Stigma, Just Grace', 'No Shame No Stigma Just Grace!'):
            with self.subTest(text=text):
                self.assertTrue(language.inspect_text(text))
        self.assertEqual(language.inspect_text(language.TAGLINE), [])

    def test_claim_regressions_are_detected(self):
        for text in ('Real people are one tap away.', 'We re-engineer your brain.', 'Learn how recovery rebuilds it.'):
            with self.subTest(text=text):
                self.assertTrue(language.inspect_text(text))

    def test_contextual_terms_and_self_description_are_preserved(self):
        for text in (
            'The participant said, "I call it relapse."',
            'Alcoholics Anonymous — Online Intergroup',
            'The screening result was positive. The reason for the missed appointment is unknown.',
            'A disabled participant requested an accommodation. Respect their self-description.',
            'Harm reduction, care coordination, and peer support have distinct scopes.',
            'This program requires an eligibility review. Ask about current fees and capacity.',
            'Grace, AI Support Navigator',
        ):
            with self.subTest(text=text):
                self.assertEqual(language.inspect_text(text), [])

if __name__ == '__main__':
    unittest.main()
