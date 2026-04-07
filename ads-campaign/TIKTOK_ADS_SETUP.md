# TikTok Ads Manager Setup Guide — TKP Dev Studio

## Campaign Architecture ($1M/month Total — TikTok Portion: $400K)

### Account Requirements
- Business account: `ads.tiktok.com`
- Pixel installed on landing pages (tiktok-pixel.js)
- Events Manager configured for conversion tracking

---

## Audience Segments

| Segment | Targeting | Objective | Budget |
|---------|-----------|-----------|--------|
| **Discovery — Roblox Players** | Age 13-25, interest: Roblox, gaming | Awareness / Video views | $120K |
| **Discovery — Mobile Gamers** | Age 18-35, interest: mobile games, casual games | Awareness / Reach | $80K |
| **Retargeting — Site Visitors** | Website visitors (pixel), engaged 30 days | Engagement / Video views | $80K |
| **Conversion — Game Launch** | Age 13-25, engagement with TKP content | Install / Play session | $120K |

---

## Targeting Parameters

### Roblox Player Segment
```
Age: 13-25
Locations: US, UK, CA, AU, BR, MX, KR, JP
Interests: Roblox, gaming, online multiplayer, game development,
           virtual worlds, UEFN, Minecraft
Behaviors: Mobile device users, high-intent gamers
```

### Mobile Game Developer Segment (Client Acquisition)
```
Age: 22-40
Locations: US, UK, CA, DE
Interests: Mobile app development, game dev, indie games,
           Unity, Unreal Engine, app monetization
Job titles: Game developer, mobile developer, indie dev
```

### Custom Audiences (Retargeting)
- Website visitors (last 30 days)
- Video viewers (50%+ watched, last 60 days)
- Engagement audience: liked/commented TKP content (90 days)
- Lookalike: 1% lookalike of converters (US)

---

## Campaign Setup Steps

### 1. Create Ad Account
1. Go to `business.tiktok.com` → Create Ad Account
2. Set currency: USD, timezone: EST
3. Assign admin/analyst roles

### 2. Install TikTok Pixel
```html
<script>
!function(w,d,s,n,i){w[n]=w[n]||{};w[n].queue=w[n].queue||[];
w[n].methods=["track","getTracker","trackLead","trackCustomEvent"];
(function(){function e(t){return function(){w[n].queue.push([t,arguments])}}
var c=["setPv","setUv","setSid","track","trackLead","trackCustomEvent"];
for(var o=0;o<c.length;o++)w[n][e(c[o])]=e(c[o])}());
var a=d.createElement(s),m=d.getElementsByTagName(s)[0];
a.async=1;a.src=i;m.parentNode.insertBefore(a,m)}
(window,document,"script","ttdp","https://analytics.tiktok.com/i18n/pixel/events.js");
ttdp('config', 'YOUR_PIXEL_ID');
</script>
```

### 3. Key Events to Track
- `Browse` — landing page views
- `ClickButton` — CTA clicks
- `CompleteRegistration` — newsletter signup
- `Search` — game search on site
- Custom: `GameLaunch` — when user clicks play
- Custom: `ClientInquiry` — contact form submission

---

## Ad Creative Specifications

### Spark Ads (Organic-Feel)
- Use authentic gameplay footage
- 9:16 vertical format (1080x1920)
- Duration: 15s (optimal) / 30s
- First 1-3s: Hook with game action / funny moment
- Text overlay: Bold hooks ("I can't stop playing this..." / "This game is INSANE")
- CTA: "Play Now" or "Try Free"
- Trending audio: Use viral sounds (check TikTok Creative Center)

### In-Feed Video Ads
- Format: 9:16 vertical
- File: MP4, max 500MB
- Caption: Auto-generated (always enable)
- Aspect: 9:16 preferred

### Carousel Ads (for dev studio services)
- 3-5 cards
- Format: 1:1 or 9:16
- Show: portfolio work, process, client results

### Brand Takeover
- Full-screen static image/video
- 3-5s display
- High impact for game launches

---

## A/B Test Matrix

| Test | Variant A | Variant B | Metric |
|------|-----------|-----------|--------|
| Hook type | Humor/funny moment | Epic gameplay clip | 3s retention rate |
| CTA | "Play Now" | "Try for Free" | Click-through rate |
| Length | 15s | 30s | Watch time |
| Audience | Interest targeting | Custom audience | Conversion rate |
| Creatives | User-generated style | Cinematic trailer | Share rate |

**Minimum:** 3 creatives per ad group, run 7 days before optimizing.

---

## Bidding Strategy

| Campaign Type | Bidding | Target |
|--------------|---------|--------|
| Awareness (Video Views) | Lowest cost, 150K video views/day cap | CPM < $5 |
| Engagement | Lowest cost, target $0.05/video view | CPV < $0.05 |
| Traffic / Clicks | Target Cost, $0.80/click | CPC < $0.80 |
| Conversion (Install) | Target Cost, $1.50/install | CPI < $1.50 |
| Retargeting | Target Cost, $2.00/play | CPP < $2.00 |

---

## Weekly Optimization Checklist

- [ ] Pause creatives with CTR < 0.5%
- [ ] Scale winning creatives +20% budget
- [ ] Refresh audience every 2 weeks
- [ ] Check frequency — cap at 3 impressions/week
- [ ] Review attribution window (7-day click vs 1-day view)
- [ ] Pull TikTok Analytics → Creative Center trending sounds
- [ ] Report CPI, CPV, ROAS to CMO

---

## Key Metrics & Targets

| KPI | Target |
|-----|--------|
| Video Views (V50%) | 10M+/month |
| Click-Through Rate | > 1.5% |
| Cost Per Install | < $1.50 |
| Cost Per Play Session | < $2.00 |
| Follower Growth | +25K/month (organic lift) |
| Engagement Rate | > 5% |

---

## TKPA-2666 Game Footage Reference
Use gameplay footage captured from:
- `projects/roblox-tycoon-game/` — Tycoon gameplay loops
- `projects/roblox-racing-game/` — Racing highlights
- `projects/obby-game/` — Obby challenge moments

Recommended capture: 15-30s loops of engaging moments per game.
