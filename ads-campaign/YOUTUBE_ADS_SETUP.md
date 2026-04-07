# YouTube Ads Setup Guide — TKP Dev Studio

## Campaign Architecture ($1M/month Total — YouTube Portion: $300K)

### Account Requirements
- Google Ads account linked to YouTube channel
- Google Analytics 4 for conversion tracking
- Google Tag Manager for event tracking

---

## Audience Segments

| Segment | Targeting | Objective | Budget |
|---------|-----------|-----------|--------|
| **Discovery — Casual Gamers** | Age 18-35, YouTube gaming channels | Awareness | $80K |
| **Discovery — Game Dev Community** | Age 22-40, programming/indie dev | Awareness | $60K |
| **Retargeting — High-Intent Viewers** | Watched 50%+ of TKP videos, site visitors | Consideration | $80K |
| **Conversion — Roblox Fans** | Age 13-25, Roblox subscribers | Install / Play | $80K |

---

## Targeting Parameters

### Casual Gamers (Discovery)
```
Age: 18-35
Placement: YouTube video placements, in-stream
Topics: Video games, mobile games, mobile gaming,
        action/strategy games, free-to-play games
Keywords: "free online games", "browser games", "tycoon games",
          "idle games", "clicker games", "mobile tycoon"
```

### Game Dev Community (Discovery)
```
Age: 22-40
Topics: Software development, game development engines,
        indie game development, app development
Keywords: "make your own game", "game dev tutorial",
          "Roblox development", "Unity mobile game",
          "indie game marketing", "app monetization"
In-market segments: Software Development / Game Development
```

### Roblox Fans (Conversion)
```
Age: 13-25
Placement: YouTube in-stream (gaming content)
Topics: Roblox gaming, online games for kids,
        virtual world games, adventure games
Affinity: Entertainment > Gaming > Casual Gamers
```

---

## Ad Formats & Specifications

### Skippable In-Stream Ads (Primary)
- **Length:** 15-30s (optimal: 15s for completion rate)
- **File:** MP4, H.264, min 1080p
- **Aspect:** 16:9 (1920x1080)
- **Skip button:** Appears after 5s
- **CTA overlay:** "Play Now" / "Learn More" / "Visit Site"
- **Headline:** Max 15 chars visible, 100 chars total
- **Description:** Max 35 chars visible, 200 chars total
- **Companion banner:** 300x250 or 300x60 auto-generated

### Non-Skippable In-Stream Ads (Brand Impact)
- **Length:** 6s (30% cheaper than skippable)
- **Use for:** Game launch week brand bursts
- **Recommended budget:** $30K during launch week only

### Bumper Ads
- **Length:** 6s, no skip
- **Format:** MP4, 16:9 or 1:1
- **Best for:** Brand awareness, reach frequency
- **Budget allocation:** $20K/month

### Video Discovery Ads (Thumbnails + CTA)
- **Thumbnail:** 16:9 (1280x720) or custom thumbnail
- **Headline:** Max 25 chars
- **Description:** Max 35 chars
- **Placement:** YouTube search results, suggested videos
- **Use for:** High-intent searches ("tycoon game download")

### Masthead Ads (Premium — Game Launch)
- **Duration:** 1 day takeover
- **Cost:** ~$150-200K/day (premium)
- **Reserve for:** Major game launch event only
- **Recommended:** 1 masthead per quarter

---

## Ad Creative Strategy

### Hook Framework (First 5 Seconds)
```
Option A — Problem/Solution:
  "Tired of boring tycoon games?" → Show TKP game clip
  "This changes everything."

Option B — Social Proof:
  "500K players can't be wrong..." → Gameplay montage
  "Join them free."

Option C — Curiosity:
  "What if your hobby made you rich?" → Show in-game economy
  "Play TKP Tycoon now."
```

### Video Structure
1. **0-5s:** Hook (stop-the-scroll moment)
2. **5-15s:** Gameplay showcase (3-5 clips, no filler)
3. **15-30s:** Social proof / CTA overlay
4. **End card:** Logo, "Play Free", link

---

## A/B Testing Plan

| Test | Variant A | Variant B | Metric |
|------|-----------|-----------|--------|
| Hook | Emotional/funny | Epic/highlight reel | View rate (0-30s) |
| Length | 15s | 30s | Watch time % |
| CTA | "Play Now" | "Try It Free" | Click-through rate |
| Thumbnail | Gameplay action shot | UI/stats overlay | Discovery CTR |
| Audience | In-market gamers | Custom affinity | Cost/conversion |

**Note:** YouTube's algorithms improve automatically with 3+ variants.

---

## Bidding Strategy

| Campaign Type | Bidding Strategy | Target |
|--------------|-----------------|--------|
| Awareness (Reach) | CPM target | CPM < $8 |
| Video Views (CPV) | Maximize views | CPV < $0.10 |
| Traffic (Clicks) | Target CPA | CPC < $0.50 |
| Conversion (Install) | Target CPA | CPA < $2.00 |
| Retargeting | Target CPA | CPA < $1.50 |

---

## Weekly Optimization Checklist

- [ ] Pause ad groups with view rate < 30%
- [ ] Scale top 20% performers +25% budget
- [ ] Review audience overlap between campaigns
- [ ] Check view-through attribution (28-day window)
- [ ] Update keyword exclusions weekly
- [ ] Refresh thumbnails every 2 weeks
- [ ] Pull Google Ads → YouTube Analytics comparison report
- [ ] Report CTR, VTR, CPA, views to CMO

---

## Key Metrics & Targets

| KPI | Target |
|-----|--------|
| Impressions | 5M+/month |
| View Rate (25%+ watched) | > 25% |
| Watch Page Views | > 50K/month |
| Click-Through Rate | > 0.5% |
| Cost Per View | < $0.10 |
| Subscriber Growth (organic lift) | +10K/month |
| Cost Per Acquisition | < $2.00 |

---

## Conversion Tracking Setup

### Google Ads Conversion Tag
```javascript
// Add to site <head> or via GTM
gtag('config', 'AW-CONVERSION_ID');
gtag('event', 'conversion', {
  'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL',
  'value': 0,
  'currency': 'USD'
});
```

### Key Conversion Actions
1. **PlaySession** — User starts a game session (conversion: $0.10)
2. **SignUp** — Newsletter / account creation (conversion: $1.00)
3. **ClientInquiry** — Contact form submission (conversion: $50.00)
4. **VideoView** — Watched 50%+ of embedded video (conversion: $0.05)

---

## Keyword List — Game Dev Services (Client Acquisition)

### High-Intent Keywords
```
"mobile game development company"
"game studio for hire"
"Robox game developer"
"tycoon game developer"
"mobile game studio near me"
"indie game publisher"
"game development agency"
"build my mobile game"
"game app development cost"
"free mobile game studio"
```

### Long-Tail Keywords
```
"how to make a mobile game for free"
"best free game development tools 2026"
"build a tycoon game"
"mobile game marketing strategy"
```
