"""The square's L, assembled from pieces already drawn (errata 163 A4). No image operation here.

town-01 and town-02 both drew the east arm but dropped Main Street's long row. Tyler, 2026-11-08: "Raise the
cap or build from pieces you already have. Whatever creates the best final product." So the L is built in
town-01's input coordinates (the shipping map's town at 2x, tools/art/town-map-edit.py TOWN_REGION):
  1. the long row loses the saloon (x 308-505), whose place the row's eastern buildings close up into,
     and its small last building (x 1088-1170), so it ends at x 878;
  2. the ground they leave, east to the loop road, is refilled from the open square (the Lane's road band
     above it from the Lane's own road);
  3. town-01's east arm (the saloon with its balcony, the hotel and the small office, x 815-1045,
     y 290-765 of town-01's source) is set down the square's east side at 0.85, so it fits between the
     Lane's road and the square's south edge, feathered into the mud.
The seams this leaves are blended by one edit (town-03), which keeps every building where this puts it.

Usage: town-map-l.py <out.png>   (writes art/staging/town-map/town-03/input.png when given that path)
"""
import numpy as np, sys
from PIL import Image
cur=np.asarray(Image.open('art/staging/town-map/town-01/input.png').convert('RGB')).copy()
src=Image.open('art/staging/town-map/town-01/source.png').convert('RGB')
out=cur.copy()
# 1. vacate the row east of the saloon and the far-east strip: lane-road band, then mud
out[372:386, 878:1190] = cur[372:386, 566:878]
mud = cur[612:792, 600:912]                          # 180 rows of open square
out[386:566, 878:1190] = mud
out[566:612, 878:1190] = cur[612:658, 600:912]
# 2. the row without the saloon (x 308-505) and without its small last building (1088-1170)
out[380:612, 310:878] = cur[380:612, 512:1080]
# 3. the east arm from town-01, at 0.85, down the square's east side, feathered into the mud
arm = src.crop((815, 290, 1045, 765))
k = 0.85
arm = np.asarray(arm.resize((round(arm.width*k), round(arm.height*k)), Image.LANCZOS)).astype(float)
h, w = arm.shape[:2]
X, Y = 1150 - w, 395
f = 6
a = np.ones((h, w))
for i in range(f):
    t = (i + 1) / (f + 1)
    a[i, :] = np.minimum(a[i, :], t); a[-1 - i, :] = np.minimum(a[-1 - i, :], t)
    a[:, i] = np.minimum(a[:, i], t); a[:, -1 - i] = np.minimum(a[:, -1 - i], t)
dst = out[Y:Y+h, X:X+w].astype(float)
out[Y:Y+h, X:X+w] = (arm * a[..., None] + dst * (1 - a[..., None])).round().astype(np.uint8)
print('arm at', X, Y, w, h)
Image.fromarray(out).save(sys.argv[1])
