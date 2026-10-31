import json
import unittest
from pathlib import Path

from spacebio.quality import validate_seed

SEED = Path(__file__).resolve().parents[1] / 'data' / 'seed' / 'brain_pilot.json'


class GraphQualityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.seed = json.loads(SEED.read_text(encoding='utf-8'))

    def test_seed_internal_links(self):
        self.assertEqual(validate_seed(self.seed), [])

    def test_pilot_contains_both_kinds_of_edge(self):
        papers = self.seed['papers']
        self.assertTrue(any(p['candidate'] for p in papers))
        self.assertTrue(any(p['used'] for p in papers))
        self.assertTrue(any(p['follows'] for p in papers))

    def test_unknown_accession_rejected(self):
        test = json.loads(json.dumps(self.seed))
        test['papers'][0]['used'].append({'id': 'OSD-99999999'})
        self.assertTrue(any('unknown used dataset' in e for e in validate_seed(test)))


if __name__ == '__main__':
    unittest.main()
