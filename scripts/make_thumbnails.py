"""
Thumbnail generator for Tycoon Game v2 YouTube Trailer
Creates 3 A/B test variants at 1280x720px
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import math, os, random

OUT = "C:/Users/PC/.paperclip/instances/default/workspaces/tkp-dev-studio/assets/thumbnails"
os.makedirs(OUT, exist_ok=True)
W, H = 1280, 720

# ---------- helpers ----------

def ellipse_with_gradient(draw, cx, cy, rx, ry, inner_color, outer_color, steps=30):
    for i in range(steps, 0, -1):
        t = 1 - i / steps
        r = int(inner_color[0] * t + outer_color[0] * (1 - t))
        g = int(inner_color[1] * t + outer_color[1] * (1 - t))
        b = int(inner_color[2] * t + outer_color[2] * (1 - t))
        alpha = int(255 * (1 - t * 0.6))
        rx_i = rx * (steps - i + 1) / steps
        ry_i = ry * (steps - i + 1) / steps
        draw.ellipse([cx - rx_i, cy - ry_i, cx + rx_i, cy + ry_i],
                     fill=(r, g, b, alpha))

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def load_font(size, bold=False):
    """Try to find a good font."""
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/impact.ttf",
        "C:/Windows/Fonts/verdana.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

def glow_text(img, draw, text, cx, cy, font, color, glow_color, glow_radius=8, glow_alpha=180):
    """Draw text with a soft glow halo."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # halo layers
    for i in range(glow_radius, 0, -1):
        a = int(glow_alpha * (1 - i / glow_radius) * 0.4)
        od.text((cx, cy), text, font=font, anchor="mm", fill=glow_color + (a,))
    od.text((cx, cy), text, font=font, anchor="mm", fill=color)
    # composite
    r, g, b = glow_color
    glow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow_layer).text((cx, cy), text, font=font, anchor="mm", fill=(r, g, b, glow_alpha))
    img = Image.alpha_composite(img, glow_layer)
    # main text
    img.paste(overlay, mask=overlay.split()[3])
    return img

def draw_stars(draw, count=80, color=(255, 255, 255)):
    """Draw random sparkle stars."""
    random.seed(42)
    for _ in range(count):
        x = random.randint(0, W)
        y = random.randint(0, H)
        size = random.choice([1, 1, 2, 2, 3])
        alpha = random.randint(100, 255)
        draw.ellipse([x, y, x+size, y+size], fill=(*color, alpha))

def vignette(img, strength=0.55):
    """Add a dark vignette."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    steps = 40
    for i in range(steps):
        t = i / steps
        alpha = int(strength * 255 * (1 - t ** 1.5))
        rx = W * (1 - t)
        ry = H * (1 - t)
        draw.ellipse([(W-rx)/2, (H-ry)/2, (W+rx)/2, (H+ry)/2],
                     outline=(0, 0, 0, alpha), width=2)
    return Image.alpha_composite(img, overlay)

def paste_shadow(img, foreground, x, y, opacity=120):
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shadow.paste(foreground, (x+4, y+4), mask=foreground.split()[3])
    shadow_arr = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_arr)
    sd.paste((0, 0, 0, opacity), [x+4, y+4, x+foreground.width+4, y+foreground.height+4])
    shadow = Image.alpha_composite(shadow, shadow_arr)
    img = Image.alpha_composite(img, shadow)
    img.paste(foreground, (x, y), mask=foreground.split()[3])
    return img

# ============================================================
# THUMBNAIL A – THE UPGRADE
# Gold, Dark Blue, Neon Green
# ============================================================

def make_thumbnail_a():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # ---- background gradient: dark blue to deep black ----
    for y in range(H):
        t = y / H
        r = int(8 * (1-t) + 2 * t)
        g = int(18 * (1-t) + 5 * t)
        b = int(60 * (1-t) + 20 * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # ---- city skyline silhouette ----
    buildings = [
        (0, 480, 80, 720), (60, 400, 160, 720), (140, 440, 240, 720),
        (220, 360, 320, 720), (300, 420, 400, 720), (380, 340, 480, 720),
        (460, 400, 560, 720), (540, 300, 660, 720), (640, 380, 740, 720),
        (720, 320, 840, 720), (820, 400, 920, 720), (900, 360, 1000, 720),
        (980, 300, 1100, 720), (1080, 380, 1200, 720), (1180, 420, 1280, 720),
    ]
    sky_color_top = (10, 30, 80)
    sky_color_bot = (20, 20, 60)
    for bx1, by1, bx2, by2 in buildings:
        t_top = (by1 - 300) / 420
        r = int(sky_color_top[0] * t_top + sky_color_bot[0] * (1-t_top))
        g = int(sky_color_top[1] * t_top + sky_color_bot[1] * (1-t_top))
        b = int(sky_color_top[2] * t_top + sky_color_bot[2] * (1-t_top))
        draw.rectangle([bx1, by1, bx2, by2], fill=(r, g, b))
        # windows
        for wy in range(by1+10, by2-10, 20):
            for wx in range(bx1+8, bx2-8, 18):
                if random.random() > 0.3:
                    wc = random.choice([(255, 220, 50), (200, 170, 40), (255, 255, 200)])
                    draw.rectangle([wx, wy, wx+8, wy+12], fill=wc)

    # ---- massive gold coin tower (left/center) ----
    # coin colors
    coin_edge = (200, 155, 20)
    coin_face = (255, 210, 40)
    coin_sheen = (255, 240, 120)

    # build tower of overlapping coins from bottom
    coin_r = 55
    coins = [
        (-20, 600), (60, 560), (-100, 520), (20, 480),
        (-60, 440), (80, 400), (-20, 360), (60, 320),
        (-80, 280), (40, 240), (-20, 200),
    ]
    for cx, cy in coins:
        # outer ring shadow
        draw.ellipse([cx-coin_r+2, cy-coin_r+4, cx+coin_r+2, cy+coin_r+4],
                     fill=(120, 80, 5))
        # main coin
        draw.ellipse([cx-coin_r, cy-coin_r, cx+coin_r, cy+coin_r],
                     fill=coin_edge)
        # inner face
        draw.ellipse([cx-coin_r+10, cy-coin_r+10, cx+coin_r-10, cy+coin_r-10],
                     fill=coin_face)
        # dollar sign
        font_s = load_font(50, bold=True)
        draw.text((cx, cy), "$", font=font_s, anchor="mm", fill=(150, 100, 0))

    # ---- player character (stylized) ----
    px, py = 340, 360
    # legs
    draw.rectangle([px-12, py+40, px-4, py+80], fill=(30, 30, 180))
    draw.rectangle([px+4, py+40, px+12, py+80], fill=(30, 30, 180))
    # body
    draw.ellipse([px-18, py-10, px+18, py+45], fill=(60, 100, 220))
    # arms up in triumph
    draw.line([px-14, py+5, px-40, py-30], fill=(220, 180, 120), width=6)
    draw.line([px+14, py+5, px+50, py-30], fill=(220, 180, 120), width=6)
    # head
    draw.ellipse([px-14, py-38, px+14, py-10], fill=(240, 190, 130))
    # hair
    draw.ellipse([px-14, py-44, px+14, py-28], fill=(80, 40, 10))
    # fist glow
    draw.ellipse([px-46, py-38, px-28, py-20], fill=(100, 255, 100))
    draw.ellipse([px+28, py-38, px+46, py-20], fill=(100, 255, 100))

    # ---- sparkles / particles ----
    random.seed(1)
    for _ in range(120):
        x = random.randint(0, W)
        y = random.randint(0, H-100)
        size = random.choice([1, 2, 3, 3, 4])
        alpha = random.randint(100, 255)
        color = random.choice([(255, 210, 40), (255, 240, 120), (200, 255, 100)])
        draw.ellipse([x, y, x+size, y+size], fill=(*color, alpha))

    # ---- trophy stars top-left ----
    star_pts = [(50, 50), (160, 80), (90, 110)]
    for sx, sy in star_pts:
        draw.polygon([(sx, sy-25), (sx+7, sy-7), (sx+25, sy-7),
                      (sx+10, sy+5), (sx+16, sy+25), (sx, sy+13),
                      (sx-16, sy+25), (sx-10, sy+5), (sx-25, sy-7), (sx-7, sy-7)],
                     fill=(255, 210, 40), outline=(200, 150, 0))

    # ---- text: "I Built a MILLION-COIN EMPIRE!" ----
    # bottom bar
    draw.rectangle([0, H-110, W, H], fill=(0, 0, 0, 220))

    # shadowed overlay for text area
    draw.rectangle([0, H-120, W, H], fill=(0, 0, 0))

    font_title = load_font(68, bold=True)
    font_sub = load_font(38, bold=True)

    # gold glow for main text
    gold_glow = (255, 200, 0)
    white = (255, 255, 255)
    black = (0, 0, 0)

    # outline + fill approach
    for dx, dy in [(-2,-2),(-2,2),(2,-2),(2,2)]:
        draw.text((W//2+dx, H-65+dy), "I Built a", font=font_sub, anchor="mm", fill=black)
        draw.text((W//2+dx, H-30+dy), "MILLION-COIN EMPIRE", font=font_title, anchor="mm", fill=black)
    draw.text((W//2, H-65), "I Built a", font=font_sub, anchor="mm", fill=white)
    draw.text((W//2, H-30), "MILLION-COIN EMPIRE", font=font_title, anchor="mm", fill=(255, 210, 30))

    # ---- neon green accent line ----
    draw.rectangle([0, H-115, W, H-112], fill=(0, 255, 130))
    draw.rectangle([0, H-112, W, H-109], fill=(0, 200, 100, 100))

    img = vignette(img, 0.4)
    return img

# ============================================================
# THUMBNAIL B – THE CHALLENGE
# Red vs Blue, Electric Sparks
# ============================================================

def make_thumbnail_b():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # split background: red left, blue right
    for x in range(W):
        t = abs(x - W/2) / (W/2)
        if x < W//2:
            r = int(180 * t + 20)
            g = int(10 * t + 5)
            b = int(10 * t + 5)
        else:
            r = int(10 * t + 5)
            g = int(10 * t + 5)
            b = int(200 * t + 20)
        draw.line([(x, 0), (x, H)], fill=(r, g, b))

    # center clash zone gradient
    for x in range(W//2 - 150, W//2 + 150):
        dist = abs(x - W//2)
        t = 1 - dist / 150
        r = int(255 * t * 0.5 + 100)
        g = int(255 * t * 0.5 + 100)
        b = int(255 * t * 0.5 + 100)
        draw.line([(x, 0), (x, H)], fill=(r, g, b))

    # lightning bolt in center
    bolt_pts = [
        (W//2 - 20, 0), (W//2 + 10, 200), (W//2 - 10, 200),
        (W//2 + 20, H), (W//2 - 10, 480), (W//2 + 5, 480),
    ]
    for i in range(len(bolt_pts)-1):
        draw.line([bolt_pts[i], bolt_pts[i+1]], fill=(255, 255, 200), width=6)
    # glow
    for w in [4, 8, 12]:
        draw.line([bolt_pts[0], bolt_pts[1]], fill=(200, 200, 100, 100), width=w)
        draw.line([bolt_pts[2], bolt_pts[3]], fill=(200, 200, 100, 100), width=w)
        draw.line([bolt_pts[4], bolt_pts[5]], fill=(200, 200, 100, 100), width=w)

    # chaos background particles
    random.seed(2)
    for _ in range(150):
        x = random.randint(0, W)
        y = random.randint(0, H)
        size = random.choice([1, 2, 3])
        alpha = random.randint(80, 200)
        color = random.choice([(255, 60, 60), (60, 60, 255), (255, 255, 100), (255, 255, 255)])
        draw.ellipse([x, y, x+size, y+size], fill=(*color, alpha))

    # ---- Player 1 (left, red team) ----
    p1x, p1y = 240, 300
    # body
    draw.ellipse([p1x-25, p1y-10, p1x+25, p1y+50], fill=(200, 30, 30))
    # head
    draw.ellipse([p1x-20, p1y-45, p1x+20, p1y-5], fill=(240, 180, 130))
    # helmet
    draw.ellipse([p1x-22, p1y-52, p1x+22, p1y-20], fill=(180, 20, 20))
    draw.ellipse([p1x-22, p1y-52, p1x+22, p1y-44], fill=(220, 50, 50))
    # legs
    draw.rectangle([p1x-20, p1y+45, p1x-8, p1y+90], fill=(160, 20, 20))
    draw.rectangle([p1x+8, p1y+45, p1x+20, p1y+90], fill=(160, 20, 20))
    # fist forward
    draw.ellipse([p1x+25, p1y+5, p1x+42, p1y+22], fill=(240, 180, 130))
    # sword/weapon
    draw.line([p1x+35, p1y+10, p1x+120, p1y+10], fill=(200, 200, 255), width=5)
    draw.line([p1x+35, p1y+10, p1x+35, p1y+25], fill=(200, 200, 255), width=5)

    # ---- Player 2 (right, blue team) ----
    p2x, p2y = W - 240, 300
    # body
    draw.ellipse([p2x-25, p2y-10, p2x+25, p2y+50], fill=(30, 30, 200))
    # head
    draw.ellipse([p2x-20, p2y-45, p2x+20, p2y-5], fill=(220, 170, 110))
    # helmet
    draw.ellipse([p2x-22, p2y-52, p2x+22, p2y-20], fill=(20, 20, 180))
    draw.ellipse([p2x-22, p2y-52, p2x+22, p2y-44], fill=(50, 50, 220))
    # legs
    draw.rectangle([p2x-20, p2y+45, p2x-8, p2y+90], fill=(20, 20, 160))
    draw.rectangle([p2x+8, p2y+45, p2x+20, p2y+90], fill=(20, 20, 160))
    # fist forward (going left toward p1)
    draw.ellipse([p2x-42, p2y+5, p2x-25, p2y+22], fill=(220, 170, 110))
    # sword
    draw.line([p2x-35, p2y+10, p2x-120, p2y+10], fill=(200, 200, 255), width=5)
    draw.line([p2x-35, p2y+10, p2x-35, p2y+25], fill=(200, 200, 255), width=5)

    # ---- sparks at clash zone ----
    random.seed(3)
    for _ in range(80):
        cx = W//2 + random.randint(-120, 120)
        cy = random.randint(150, 550)
        sz = random.choice([2, 3, 4])
        draw.line([(cx-sz, cy), (cx+sz, cy)], fill=(255, 255, 100), width=2)
        draw.line([(cx, cy-sz), (cx, cy+sz)], fill=(255, 255, 100), width=2)
        draw.ellipse([cx-sz, cy-sz, cx+sz, cy+sz], fill=(255, 255, 200))

    # ---- VS badge ----
    vs_cx, vs_cy = W//2, 130
    for r in range(60, 20, -4):
        alpha = int(255 * (1 - (r-20)/40))
        draw.ellipse([vs_cx-r, vs_cy-r, vs_cx+r, vs_cy+r],
                     fill=(255, 255, 255, alpha))
    draw.ellipse([vs_cx-22, vs_cy-22, vs_cx+22, vs_cy+22], fill=(255, 255, 255))
    font_vs = load_font(26, bold=True)
    draw.text((vs_cx, vs_cy), "VS", font=font_vs, anchor="mm", fill=(0, 0, 0))

    # ---- bottom text bar ----
    draw.rectangle([0, H-100, W, H], fill=(0, 0, 0, 230))

    # "Can YOU Beat This?" text
    font_main = load_font(80, bold=True)
    font_sub2  = load_font(40, bold=True)
    for dx, dy in [(-2,-2),(-2,2),(2,-2),(2,2)]:
        draw.text((W//2+dx, H-55+dy), "Can YOU", font=font_sub2, anchor="mm", fill=(0,0,0))
        draw.text((W//2+dx, H-22+dy), "Beat This?", font=font_main, anchor="mm", fill=(0,0,0))
    draw.text((W//2, H-55), "Can YOU", font=font_sub2, anchor="mm", fill=(255, 255, 255))
    # red-blue gradient on "Beat This?"
    draw.text((W//2, H-22), "Beat This?", font=font_main, anchor="mm", fill=(255, 80, 80))

    # red/blue side glows
    draw.rectangle([0, H-105, 60, H], fill=(255, 50, 50, 150))
    draw.rectangle([W-60, H-105, W, H], fill=(50, 50, 255, 150))

    img = vignette(img, 0.5)
    return img

# ============================================================
# THUMBNAIL C – THE FLEX
# Purple Glow, Black, Sparkles
# ============================================================

def make_thumbnail_c():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # deep black background with subtle purple radial
    for y in range(H):
        for x in range(0, W, 4):
            dist = math.sqrt((x - W//2)**2 + (y - H//2)**2)
            t = max(0, 1 - dist / (W * 0.75)) ** 1.5
            r = int(60 * t)
            g = int(10 * t)
            b = int(120 * t)
            draw.rectangle([x, y, x+4, y+4], fill=(r, g, b))

    # radial glow behind item
    for r in range(350, 0, -5):
        t = r / 350
        alpha = int(60 * (1 - t ** 1.5))
        draw.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r],
                     fill=(80, 0, 160, alpha))

    # inner glow
    for r in range(200, 0, -4):
        t = r / 200
        alpha = int(100 * (1 - t ** 1.2))
        draw.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r],
                     fill=(120, 0, 200, alpha))

    # ---- the rare item: legendary sword ----
    # blade glow
    draw.ellipse([W//2-130, H//2-20, W//2+130, H//2+20], fill=(150, 50, 255, 60))

    # blade
    blade_pts = [
        (W//2 - 10, H//2 + 120),  # tip at bottom
        (W//2 + 12, H//2 + 120),
        (W//2 + 5,  H//2 - 80),   # top of blade
        (W//2 - 5,  H//2 - 80),
    ]
    draw.polygon(blade_pts, fill=(200, 220, 255), outline=(150, 170, 255))
    # blade shine
    draw.line([W//2 - 3, H//2 + 100, W//2 - 3, H//2 - 70], fill=(255, 255, 255), width=2)

    # guard (crossguard)
    draw.rectangle([W//2 - 60, H//2 + 100, W//2 + 60, H//2 + 115], fill=(255, 200, 50))
    draw.rectangle([W//2 - 60, H//2 + 100, W//2 + 60, H//2 + 108], fill=(255, 230, 100))

    # handle
    draw.rectangle([W//2 - 8, H//2 + 115, W//2 + 8, H//2 + 170], fill=(80, 40, 20))
    # wrap lines on handle
    for hy in range(H//2+118, H//2+170, 10):
        draw.line([W//2-8, hy, W//2+8, hy], fill=(120, 60, 30), width=2)

    # pommel
    draw.ellipse([W//2-16, H//2+165, W//2+16, H//2+200], fill=(255, 200, 50))
    draw.ellipse([W//2-8, H//2+170, W//2+8, H//2+195], fill=(255, 230, 100))

    # ---- gem on guard ----
    gem_cx, gem_cy = W//2, H//2 + 107
    for r in range(18, 0, -2):
        t = r / 18
        color = (int(200*t + 50*(1-t)), int(0*t), int(255*t + 100*(1-t)))
        alpha = int(255 * (0.3 + 0.7 * t))
        draw.ellipse([gem_cx-r, gem_cy-r, gem_cx+r, gem_cy+r],
                     fill=(*color, alpha))

    # ---- price tag ----
    tag_x, tag_y = W - 280, 160
    tag_w, tag_h = 240, 130
    # tag background
    draw.rounded_rectangle([tag_x, tag_y, tag_x+tag_w, tag_y+tag_h],
                           radius=12, fill=(0, 0, 0, 220), outline=(255, 200, 0), width=3)
    # "VALUE:" label
    font_tag = load_font(28, bold=True)
    draw.text((tag_x + tag_w//2, tag_y + 30), "VALUE:", font=font_tag, anchor="mm",
               fill=(200, 200, 200))

    # price
    font_price = load_font(52, bold=True)
    for dx, dy in [(-2,-2),(-2,2),(2,-2),(2,2)]:
        draw.text((tag_x + tag_w//2 + dx, tag_y + 82 + dy),
                  "$9,999,999", font=font_price, anchor="mm", fill=(0,0,0))
    draw.text((tag_x + tag_w//2, tag_y + 82),
              "$9,999,999", font=font_price, anchor="mm", fill=(255, 200, 0))

    # ---- RARE badge top-left ----
    badge_x, badge_y = 60, 50
    draw.rounded_rectangle([badge_x, badge_y, badge_x+200, badge_y+70],
                            radius=10, fill=(120, 0, 200, 230), outline=(180, 80, 255), width=2)
    font_badge = load_font(38, bold=True)
    draw.text((badge_x+100, badge_y+35), "LEGENDARY", font=font_badge, anchor="mm",
               fill=(255, 220, 50))

    # ---- sparkle stars everywhere ----
    random.seed(5)
    star_color = (180, 80, 255)
    for _ in range(200):
        x = random.randint(0, W)
        y = random.randint(0, H)
        sz = random.choice([1, 2, 3, 3, 4, 5])
        alpha = random.randint(80, 255)
        c = random.choice([(255, 220, 50), (200, 100, 255), (255, 255, 255), (255, 180, 50)])
        draw.ellipse([x, y, x+sz, y+sz], fill=(*c, alpha))

    # cross-shaped sparkles
    random.seed(6)
    for _ in range(40):
        x = random.randint(50, W-50)
        y = random.randint(50, H-50)
        sz = random.randint(4, 12)
        alpha = random.randint(100, 220)
        color = random.choice([(255, 220, 50), (200, 100, 255)])
        draw.line([(x-sz, y), (x+sz, y)], fill=(*color, alpha), width=2)
        draw.line([(x, y-sz), (x, y+sz)], fill=(*color, alpha), width=2)

    # ---- bottom text ----
    draw.rectangle([0, H-100, W, H], fill=(0, 0, 0, 220))

    font_main = load_font(68, bold=True)
    font_sub3  = load_font(36, bold=True)
    for dx, dy in [(-2,-2),(-2,2),(2,-2),(2,2)]:
        draw.text((W//2+dx, H-58+dy), "This SHOCKED", font=font_sub3, anchor="mm", fill=(0,0,0))
        draw.text((W//2+dx, H-26+dy), "the Entire Server", font=font_main, anchor="mm", fill=(0,0,0))
    draw.text((W//2, H-58), "This SHOCKED", font=font_sub3, anchor="mm", fill=(255, 255, 255))
    draw.text((W//2, H-26), "the Entire Server", font=font_main, anchor="mm", fill=(200, 80, 255))

    # purple accent line
    draw.rectangle([0, H-106, W, H-103], fill=(150, 0, 255))
    img = vignette(img, 0.45)
    return img


# ============================================================
# SAVE ALL
# ============================================================

print("Generating Thumbnail A – The Upgrade...")
img_a = make_thumbnail_a()
img_a.save(f"{OUT}/thumbnail_A_the_upgrade.png", "PNG")
print(f"  -> {OUT}/thumbnail_A_the_upgrade.png")

print("Generating Thumbnail B – The Challenge...")
img_b = make_thumbnail_b()
img_b.save(f"{OUT}/thumbnail_B_the_challenge.png", "PNG")
print(f"  -> {OUT}/thumbnail_B_the_challenge.png")

print("Generating Thumbnail C – The Flex...")
img_c = make_thumbnail_c()
img_c.save(f"{OUT}/thumbnail_C_the_flex.png", "PNG")
print(f"  -> {OUT}/thumbnail_C_the_flex.png")

print("\nAll 3 thumbnails saved.")
