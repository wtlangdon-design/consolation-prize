"""The seven icons of the second pass of objects, moved into the shipping sheet (reference/objects-second-pass/handback.md
section 1; errata 250, 254).

objects-second-pass operation 1 cut seven 60x40 cells into art/ui/item-icons-objects-second-pass.png. They are appended
to art/ui/item-icons.png by tools/art/act3-estate-icons-place.py's own routine, pointed at this sheet, as Act II's five
were. No existing cell moves. No image operation here.

    python3 tools/art/objects-second-pass-icons-place.py
"""
import importlib.util
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('place', os.path.join(ROOT, 'tools/art/act3-estate-icons-place.py'))
place = importlib.util.module_from_spec(spec)
spec.loader.exec_module(place)

place.SMALL = os.path.join(ROOT, 'art/ui/item-icons-objects-second-pass.json')
place.IDS = ['nail', 'oats', 'parsley', 'capital_b', 'pikes_collar', 'button', 'room_key']

if __name__ == '__main__':
    before = json.load(open(place.icons.TABLE))
    place.main()
    table = json.load(open(place.icons.TABLE))
    for key in ('act3Estate', 'act2Papers'):
        if key in before: table[key] = before[key]
    table['objectsSecondPass'] = ('The second pass of objects (doc 121 N-4): nail, oats, parsley, capital_b, pikes_collar, '
                                  'button and room_key, cut by tools/art/objects-second-pass-icons-cut.py '
                                  '(objects-second-pass operation 1) at slot size and moved in by '
                                  'tools/art/objects-second-pass-icons-place.py (errata 254).')
    with open(place.icons.TABLE, 'w') as f:
        f.write(json.dumps(table, indent=2) + '\n')
