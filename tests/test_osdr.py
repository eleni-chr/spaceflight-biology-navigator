import unittest

from spacebio.osdr import extract_accessions, catalog_snapshot


class OsdrTest(unittest.TestCase):
    def test_accession_extraction(self):
        record = {
            'datasets': [
                {'accession': 'OSD-56', 'url': 'https://example.org/datasets/OSD-56'},
                {'href': '/v2/dataset/OSD-3/'},
                {'accession': 'OSD-56'},
                {'nested': ['GLDS-44', 'OSD-101', {'name': 'OSD-2'}]},
            ]
        }
        self.assertEqual(extract_accessions(record), ['OSD-2', 'OSD-3', 'OSD-56', 'OSD-101'])

    def test_snapshot_marks_coverage_limited(self):
        snap = catalog_snapshot({'accession': 'OSD-12'}, source='fixture')
        self.assertEqual(snap['total_ids_found'], 1)
        self.assertIn('not', snap['coverage_note'])


if __name__ == '__main__':
    unittest.main()
