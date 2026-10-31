import json
import tempfile
import unittest
from pathlib import Path
from spacebio.site import build_seed_js

ROOT = Path(__file__).resolve().parents[1]


class BrowserBuildTest(unittest.TestCase):
    def test_js_seed_is_generated_from_json(self):
        with tempfile.TemporaryDirectory() as temp:
            generated = Path(temp) / 'seed.js'
            value = build_seed_js(ROOT / 'data/seed/brain_pilot.json', generated)
            self.assertEqual(value, (ROOT/'web/data/seed.js').read_text(encoding='utf-8'))
            self.assertIn('SPACEBIO_SEED', value)

    def test_no_external_runtime_dependencies(self):
        index = (ROOT/'web/index.html').read_text(encoding='utf-8')
        explorer = (ROOT/'web/explorer.html').read_text(encoding='utf-8')
        self.assertIn('src="data/catalog.js"', index)
        self.assertIn('src="map.js"', index)
        self.assertIn('href="map.css"', index)
        self.assertIn('src="catalog-app.js"', explorer)


if __name__ == '__main__':
    unittest.main()
