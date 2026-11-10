"""The money's icon, moved into the shipping sheet (reference/act3-polish/handback.md; errata 240).

act3-estate-sale operation 3 cut one 60x40 cell into art/ui/item-icons-act3-polish.png. It is appended to
art/ui/item-icons.png exactly as tools/art/act3-estate-icons-place.py appended the hen and the coat: that tool's own
routine, pointed at the other small sheet. No existing cell moves. No image operation here.

    python3 tools/art/act3-polish-icon-place.py
"""
import importlib.util
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('place', os.path.join(ROOT, 'tools/art/act3-estate-icons-place.py'))
place = importlib.util.module_from_spec(spec)
spec.loader.exec_module(place)

place.SMALL = os.path.join(ROOT, 'art/ui/item-icons-act3-polish.json')
place.IDS = ['pratt_money']

if __name__ == '__main__':
    kept = json.load(open(place.icons.TABLE)).get('act3Estate')
    place.main()
    table = json.load(open(place.icons.TABLE))
    table['act3Estate'] = kept.replace(' pratt_money has no cell delivered.', '') if kept else kept
    table['act3Polish'] = ('Act III polish: pratt_money, cut by tools/art/act3-money-icon-cut.py (act3-estate-sale operation 3) '
                           'at slot size and moved in by tools/art/act3-polish-icon-place.py (errata 240).')
    with open(place.icons.TABLE, 'w') as f:
        f.write(json.dumps(table, indent=2) + '\n')
