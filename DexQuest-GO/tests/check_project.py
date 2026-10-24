#!/usr/bin/env python3
"""Sanity checks without requiring the Android SDK."""
import json,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'app/src/main/assets'

class DexQuestGOProject(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        js=(ASSETS/'species.js').read_text()
        cls.items=json.loads(js.split('=',1)[1].rstrip(' ;\n'))
    def test_species_count(self):
        self.assertEqual(len(self.items),1025)
        self.assertEqual([p['id'] for p in self.items],list(range(1,1026)))
    def test_regions_and_anchor_names(self):
        self.assertEqual([sum(p['gen']==i for p in self.items) for i in range(1,10)],
                         [151,100,135,107,156,72,88,96,120])
        for i,name in {25:'Pikachu',129:'Magikarp',386:'Deoxys',493:'Arceus',649:'Genesect',721:'Volcanion',809:'Melmetal',905:'Enamorus',1000:'Gholdengo',1025:'Pecharunt'}.items():
            self.assertEqual(self.items[i-1]['name'],name)
    def test_app_id_and_permissions(self):
        gradle=(ROOT/'app/build.gradle').read_text()
        manifest=(ROOT/'app/src/main/AndroidManifest.xml').read_text()
        self.assertIn("applicationId 'com.dexquest.go'",gradle)
        self.assertIn('android-35', (ROOT/'build-apk.sh').read_text())
        self.assertNotIn('android.permission.ACCESS_FINE_LOCATION',manifest)
        self.assertNotIn('android.permission.QUERY_ALL_PACKAGES',manifest)
    def test_required_controls(self):
        html=(ASSETS/'index.html').read_text()
        for name in ['dex-grid','shiny-grid','goal-form','goals-list','storage-query','export-button','import-file','reset-button']:
            self.assertIn('id="'+name+'"',html)
        self.assertIn('script defer src="app.js"',html)
        self.assertIn('script defer src="species.js"',html)
    def test_storage_safe_negations(self):
        js=(ASSETS/'app.js').read_text()
        self.assertIn("t.push('!3*','!4*')",js)
        self.assertIn("'shiny','legendary','mythical','lucky','favorite','shadow','costume','defender'",js)
    def test_import_separate_from_firered(self):
        js=(ASSETS/'app.js').read_text()
        self.assertIn("raw.app!=='DexQuestGO'",js)
        self.assertNotIn("dexquest-firered-progress.json",js)

if __name__=='__main__':unittest.main()