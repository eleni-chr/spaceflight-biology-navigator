import unittest

from spacebio.literature import make_query


class LiteratureTest(unittest.TestCase):
    def test_osdr_and_legacy_identifier(self):
        query = make_query('OSD-352')
        self.assertIn('OSD-352', query)
        self.assertIn('GLDS-352', query)

    def test_disallow_invalid_accession(self):
        with self.assertRaises(ValueError):
            make_query('anything OR 1=1')


if __name__ == '__main__':
    unittest.main()
