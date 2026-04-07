# Campaign Launch Checklist — TKPA-5979

## Pre-Launch (Week -1 to -2)

### Account Setup
- [ ] Create/verify TikTok for Business account (`business.tiktok.com`)
- [ ] Create/verify Google Ads account linked to YouTube
- [ ] Create/verify Meta Business Suite (Instagram Ads)
- [ ] Create Snapchat Business account
- [ ] Set up TikTok Pixel on all landing pages
- [ ] Set up Google Ads Conversion Tag via GTM
- [ ] Set up Meta Pixel (Instagram)
- [ ] Verify all pixels fire correctly (use test mode)

### Conversion Tracking
- [ ] Define conversion events: PlaySession, SignUp, ClientInquiry
- [ ] Set up attribution windows (7-day click, 1-day view)
- [ ] Connect Google Analytics 4 to Google Ads
- [ ] Create custom dashboards (TikTok Analytics, Google Ads, GA4)
- [ ] Set up automated weekly reports via email

### Budget & Billing
- [ ] Confirm $1M/month budget approved
- [ ] Set up payment methods for all platforms
- [ ] Configure spend caps per platform
- [ ] Assign budget allocation per campaign (see BUDGET_ALLOCATION.md)

### Creative Assets
- [ ] Source gameplay footage from 3 game projects
- [ ] Produce 12 TikTok video creatives (4 per game)
- [ ] Produce 8 YouTube video creatives (3 trailers, 5 clips)
- [ ] Produce 8 Instagram Reels
- [ ] Create thumbnail variations for discovery ads
- [ ] Get branded audio sting from Graphic Designer
- [ ] Upload all assets to platform libraries

---

## Launch Week (Week 1)

### Day 1 — Platform Setup
- [ ] Launch TikTok Discovery campaigns (Roblox Players + Mobile Gamers)
- [ ] Launch YouTube Discovery campaigns (Casual Gamers + Game Dev)
- [ ] Set initial bids at recommended targets
- [ ] Verify pixel firing on all landing pages

### Day 2-3 — Monitoring
- [ ] Check impressions and early CTR
- [ ] Verify audience targeting is correct
- [ ] Confirm budget pacing (should be ~50% by Day 3)
- [ ] Watch for pixel errors in Events Manager

### Day 4-7 — First Optimization
- [ ] Pause any creatives with CTR < 0.3%
- [ ] Scale any creatives with CTR > 2% (+20% budget)
- [ ] Check frequency on retargeting campaigns (cap at 3/week)
- [ ] Review video completion rates (TikTok VTR, YouTube VTR)
- [ ] First look at CPI by Day 7

---

## Weekly Optimization Cycle (Ongoing)

### Every Monday
```
□  Pull previous week performance report
□  Calculate: CPI, CPV, CTR, ROAS vs targets
□  Identify top 3 and bottom 3 creatives
□  Plan budget reallocation for coming week
```

### Every Thursday
```
□  Refresh trending audio for TikTok (Creative Center)
□  Update thumbnails on bottom performers
□  Check for any policy violations (rejected ads)
□  Review audience overlap / frequency caps
```

### Every Month
```
□  Full performance review vs KPIs
□  Comprehensive creative refresh (new hooks)
□  Budget reallocation across campaigns
□  Competitive analysis (what's working in market)
□  Report to CMO: metrics, learnings, next month plan
```

---

## OKR-5 Metrics Tracking

| KR | Metric | Target | Current |
|----|--------|--------|---------|
| KR5.2 | TikTok Followers | 100K | TBD |
| KR5.2 | YouTube Subscribers | 50K | TBD |
| KR5.3 | New Paid Client Projects | 1 | TBD |
| KR5.1 | App Installs (via paid) | TBD | TBD |
| KR5.1 | Brand Awareness Lift | 20% | TBD |

---

## Escalation Triggers

Stop / Escalate to CMO if:
- CPI exceeds $5.00 for 3 consecutive days
- ROAS drops below 0.5x for 7 consecutive days
- Any campaign flagged for policy violation
- Budget pacing > 130% or < 70% at week midpoint
- Brand safety incident (ad appearing on inappropriate content)

---

## Required Tools & Access

| Tool | URL | Access Needed |
|------|-----|--------------|
| TikTok Ads Manager | business.tiktok.com | Admin |
| Google Ads | ads.google.com | Admin |
| Meta Business Suite | business.facebook.com | Admin |
| Snapchat Ads Manager | ads.snapchat.com | Admin |
| Google Analytics 4 | analytics.google.com | Edit |
| Google Tag Manager | tagmanager.google.com | Publish |
| TikTok Creative Center | creativecenter.tiktok.com | View |
| Google Trends | trends.google.com | View |

---

## Files Reference

All campaign planning documents are located at:
```
ads-campaign/
  TIKTOK_ADS_SETUP.md        — TikTok campaign architecture
  YOUTUBE_ADS_SETUP.md       — YouTube campaign architecture
  BUDGET_ALLOCATION.md       — $1M/month budget breakdown
  AD_CREATIVE_SPECS.md       — Creative production guide
  CAMPAIGN_CHECKLIST.md      — This file (launch checklist)
```
