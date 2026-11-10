"""Act II's five item icons, moved into the shipping sheet (reference/act2-papers/handback.md section 5; errata 245).

act2-papers operation 6 cut five 60x40 cells into art/ui/item-icons-act2-papers.png. They are appended to
art/ui/item-icons.png exactly as tools/art/act3-estate-icons-place.py appended the hen and the coat: that tool's own
routine, pointed at this sheet. The small sheet's ids are doc 118's; `hotel_lamp` and `wreath` are the items' own ids.
No existing cell moves. No image operation here.

    python3 tools/art/act2-papers-icons-place.py
"""
import importlib.util
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('place', os.path.join(ROOT, 'tools/art/act3-estate-icons-place.py'))
place = importlib.util.module_from_spec(spec)
spec.loader.exec_module(place)

place.SMALL = os.path.join(ROOT, 'art/ui/item-icons-act2-papers.json')
place.IDS = ['chalk', 'funeral_notice', 'hotel_lamp', 'hymnal', 'wreath']

if __name__ == '__main__':
    kept = json.load(open(place.icons.TABLE)).get('act3Estate')
    place.main()
    table = json.load(open(place.icons.TABLE))
    table['act3Estate'] = kept
    table['act2Papers'] = ('Act II, the three papers: chalk, funeral_notice, hotel_lamp, hymnal and wreath, cut by '
                           'tools/art/act2-papers-icons-cut.py (act2-papers operation 6) at slot size and moved in by '
                           'tools/art/act2-papers-icons-place.py (errata 245).')
    with open(place.icons.TABLE, 'w') as f:
        f.write(json.dumps(table, indent=2) + '\n')
