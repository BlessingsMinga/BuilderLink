"""Generate assets/animations/builderlink-loader.json from assets/images/logo.png.

Traces the logo's navy and orange regions into Bezier paths and builds the
"Building the Connection" Lottie animation (60fps):
  0-36    orange chain links draw in (trimmed outline stroke, then fill)
  36-96   hammer and navy link glide/rotate into place
  96-132  confirmation pulse (scale 100 -> 104 -> 100)
  132-252 breathing loop segment (100 -> 103.5 -> 100)

Usage: python scripts/generate-loader-animation.py
Requires: pip install opencv-python-headless numpy
"""
import json
import math
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'images', 'logo.png')
OUT = os.path.join(ROOT, 'assets', 'animations', 'builderlink-loader.json')
UP, PAD, FPS = 4, 18, 60  # trace at 4x for sub-pixel accuracy; padding leaves room for the pulse
INTRO_END, LOOP_END = 132, 252

im = cv2.imread(SRC, cv2.IMREAD_UNCHANGED).astype(float)
H, W = im.shape[:2]
alpha, rgb = im[..., 3], im[..., 2::-1]
navy_cls = ((rgb - [5, 34, 78]) ** 2).sum(-1) < ((rgb - [247, 114, 19]) ** 2).sum(-1)
CW, CH = W + 2 * PAD, H + 2 * PAD


def brand_color(is_navy):
    sel = (alpha > 250) & (navy_cls == is_navy)
    return np.median(rgb[sel], axis=0).round().astype(int).tolist()


NAVY_C, ORANGE_C = brand_color(True), brand_color(False)


def components(is_navy):
    soft = np.where(navy_cls == is_navy, alpha, 0).astype(np.float32)
    big = cv2.resize(soft, (W * UP, H * UP), interpolation=cv2.INTER_CUBIC)
    mask = (big > 127).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask)
    return [(lab == j).astype(np.uint8) for j in range(1, n) if st[j, 4] > 20 * UP * UP]


def fit(contour):
    """Simplify a contour and fit smooth Catmull-Rom Beziers, keeping sharp corners crisp."""
    pts = cv2.approxPolyDP(contour, 1.6, True)[:, 0, :].astype(float) / UP + PAD
    n = len(pts)
    v, ins, outs = [], [], []
    for k in range(n):
        p0, p1, p2 = pts[k - 1], pts[k], pts[(k + 1) % n]
        a, b = p1 - p0, p2 - p1
        ang = math.degrees(abs(math.atan2(a[0] * b[1] - a[1] * b[0], a @ b)))
        if ang > 50:
            t_in = t_out = np.zeros(2)
        else:
            t = p2 - p0
            t = t / (np.linalg.norm(t) or 1)
            t_in, t_out = -t * np.linalg.norm(a) / 3, t * np.linalg.norm(b) / 3
        v.append([round(p1[0], 2), round(p1[1], 2)])
        ins.append([round(t_in[0], 2), round(t_in[1], 2)])
        outs.append([round(t_out[0], 2), round(t_out[1], 2)])
    return {'c': True, 'v': v, 'i': ins, 'o': outs}


def paths(mask):
    cs, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    return [fit(c) for c in cs if len(c) > 8]


def bbox(m):
    ys, xs = np.nonzero(m)
    return xs.min() / UP, ys.min() / UP, xs.max() / UP, ys.max() / UP


def centroid(masks):
    ys, xs = np.nonzero(sum(masks))
    return (round(xs.mean() / UP + PAD, 1), round(ys.mean() / UP + PAD, 1))


navy, orange = components(True), components(False)

# Group components: hammer (top-left, with orange grip), navy link (upper right),
# orange chain links, and the thin navy shadow that hugs the orange centre link.
orange_grip = max(orange, key=lambda m: bbox(m)[0])
chain = [m for m in orange if m is not orange_grip]
navy_link = max(navy, key=lambda m: (bbox(m)[2] - bbox(m)[0]) if bbox(m)[0] > 100 and bbox(m)[3] < 200 else -1)
chain_mask = sum(chain).astype(np.uint8)
shadow = [m for m in navy if m is not navy_link and int(m.sum()) < 1200 * UP * UP
          and int((cv2.dilate(m, np.ones((25, 25), np.uint8)) & chain_mask).sum()) > 0.3 * int(m.sum())]
hammer_navy = [m for m in navy if m is not navy_link and not any(m is s for s in shadow)]
assert (len(chain), len(shadow), len(hammer_navy)) == (2, 1, 3), (len(chain), len(shadow), len(hammer_navy))

# ---------------------------------------------------------------- Lottie helpers
E_OUT = {'o': 0.33, 'oy': 0, 'i': 0.2, 'iy': 1}   # decelerate into place
E_IO = {'o': 0.42, 'oy': 0, 'i': 0.58, 'iy': 1}   # ease in-out


def anim(keys, ease=E_IO):
    ks = []
    for idx, (t, s) in enumerate(keys):
        s = s if isinstance(s, list) else [s]
        k = {'t': t, 's': s}
        if idx < len(keys) - 1:
            d = len(s)
            k['o'] = {'x': [ease['o']] * d, 'y': [ease['oy']] * d}
            k['i'] = {'x': [ease['i']] * d, 'y': [ease['iy']] * d}
        ks.append(k)
    return {'a': 1, 'k': ks}


def static(v):
    return {'a': 0, 'k': v}


def rgba(c):
    return [round(x / 255, 4) for x in c] + [1]


def transform(anchor, p=None, s=None, r=None, o=None):
    return {
        'a': static([anchor[0], anchor[1], 0]),
        'p': p or static([anchor[0], anchor[1], 0]),
        's': s or static([100, 100, 100]),
        'r': r or static(0),
        'o': o or static(100),
    }


def group(name, masks, color, fill_opacity=None, extra=()):
    items = [{'ty': 'sh', 'nm': f'path{i}', 'ks': static(p)}
             for i, p in enumerate(p for m in masks for p in paths(m))]
    items += list(extra)
    items.append({'ty': 'fl', 'nm': 'fill', 'c': static(rgba(color)), 'o': fill_opacity or static(100), 'r': 2})
    items.append({'ty': 'tr', 'a': static([0, 0]), 'p': static([0, 0]), 's': static([100, 100]),
                  'r': static(0), 'o': static(100), 'sk': static(0), 'sa': static(0)})
    return {'ty': 'gr', 'nm': name, 'it': items}


def layer(ind, name, shapes, ks):
    return {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': name, 'parent': 1, 'sr': 1, 'ks': ks, 'ao': 0,
            'shapes': shapes, 'ip': 0, 'op': LOOP_END, 'st': 0, 'bm': 0}


# Phase 1: orange chain draws in via a trimmed outline stroke, the fill follows.
draw = [
    {'ty': 'st', 'nm': 'outline', 'c': static(rgba(ORANGE_C)), 'o': anim([(30, 100), (44, 0)]),
     'w': static(2.4), 'lc': 2, 'lj': 2},
    {'ty': 'tm', 'nm': 'draw', 's': static(0), 'e': anim([(0, 0), (34, 100)]), 'o': static(0), 'm': 1},
]
cc = centroid(chain)
chain_layer = layer(5, 'orange-chain', [group('chain', chain, ORANGE_C, anim([(16, 0), (40, 100)], E_OUT), draw)],
                    transform(cc))
shadow_layer = layer(4, 'chain-shadow', [group('shadow', shadow, NAVY_C)], transform(cc, o=anim([(24, 0), (40, 100)])))

# Phase 2: hammer glides in from the upper-left, navy link hooks in from the right.
hc = centroid(hammer_navy + [orange_grip])
hammer_layer = layer(3, 'hammer', [group('hammer-navy', hammer_navy, NAVY_C), group('grip', [orange_grip], ORANGE_C)],
                     transform(hc, p=anim([(36, [hc[0] - 34, hc[1] - 26, 0]), (90, [hc[0], hc[1], 0])], E_OUT),
                               r=anim([(36, -9), (90, 0)], E_OUT), o=anim([(36, 0), (54, 100)], E_OUT)))
lc = centroid([navy_link])
link_layer = layer(2, 'navy-link', [group('link', [navy_link], NAVY_C)],
                   transform(lc, p=anim([(46, [lc[0] + 32, lc[1] - 14, 0]), (96, [lc[0], lc[1], 0])], E_OUT),
                             r=anim([(46, 7), (96, 0)], E_OUT), o=anim([(46, 0), (64, 100)], E_OUT)))


# Phase 3 + 4: confirmation pulse, then the breathing loop segment, on a root null.
def sc(v):
    return [v, v, 100]


root = {'ddd': 0, 'ind': 1, 'ty': 3, 'nm': 'root', 'sr': 1, 'ao': 0, 'ip': 0, 'op': LOOP_END, 'st': 0, 'bm': 0,
        'ks': transform((CW / 2, CH / 2), s=anim([(96, sc(100)), (112, sc(104)), (INTRO_END, sc(100)),
                                                    (192, sc(103.5)), (LOOP_END, sc(100))]))}

doc = {'v': '5.7.4', 'fr': FPS, 'ip': 0, 'op': LOOP_END, 'w': CW, 'h': CH, 'nm': 'BuilderLink Loader', 'ddd': 0,
       'assets': [], 'layers': [root, link_layer, hammer_layer, shadow_layer, chain_layer],
       'markers': [{'tm': 0, 'cm': 'intro', 'dr': INTRO_END}, {'tm': INTRO_END, 'cm': 'loop', 'dr': LOOP_END - INTRO_END}]}
with open(OUT, 'w') as f:
    json.dump(doc, f, separators=(',', ':'))


# ---------------------------------------------- verification: fitted Beziers vs source
def raster(masks):
    canvas = np.zeros((CH * UP, CW * UP), np.uint8)
    for m in masks:
        for p in paths(m):
            v, ins, outs = map(np.array, (p['v'], p['i'], p['o']))
            poly = []
            for k in range(len(v)):
                p0, p3 = v[k], v[(k + 1) % len(v)]
                p1, p2 = p0 + outs[k], p3 + ins[(k + 1) % len(v)]
                for t in np.linspace(0, 1, 12, endpoint=False):
                    poly.append(((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3) * UP)
            tmp = np.zeros_like(canvas)
            cv2.fillPoly(tmp, [np.array(poly, np.int32)], 1)
            canvas ^= tmp  # even-odd, matching the fill rule
    return canvas


if __name__ == '__main__':
    for nm, ms in (('navy', navy), ('orange', orange)):
        ref = np.zeros((CH * UP, CW * UP), np.uint8)
        ref[PAD * UP:(PAD + H) * UP, PAD * UP:(PAD + W) * UP] = sum(ms).clip(0, 1)
        got = raster(ms)
        print(f'{nm}: IoU vs source = {(ref & got).sum() / (ref | got).sum():.4f}')
    print('colors', NAVY_C, ORANGE_C, 'canvas', CW, CH, 'bytes', os.path.getsize(OUT))
