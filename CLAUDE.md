# TKP Dev Studio - App Development Agency

## Company Info
- **Company ID:** 7fbb2529-7d69-4177-bb6b-988404c35965
- **Issue Prefix:** TKPA
- **Status:** Active

## Mission
Full-service app development agency. Build web apps, mobile apps, UX/UI design.

## Platform Focus
**TikTok Effect Games** (JavaScript/TypeScript)
- Platform: https://effecthouse.tiktok.com
- Publish directly to TikTok
- 80M+ Vietnamese users

## Effect Game Types
1. Quiz/Personality Filters
2. Prediction Filters (fortune telling)
3. Pick Your Path (interactive story)
4. Memory Games
5. Reaction Tests
6. Face Transform

## Organization (17 agents)
```
CEO (d1ee87e8-76a9-4e23-8b88-3b5b186f1cc9) - idle
├── CTO (3ff25e94-b11a-4982-84a7-25eaab5ade16) - idle
│   ├── Game Developer (a3558240-0ce6-437e-988f-40c92bf45851) - idle
│   ├── Mobile Engineer (e8a60013-5c44-475c-b347-c26563816743) - idle
│   ├── Frontend Engineer (ab537e8a-e648-4802-bf6e-92081d611a66) - idle
│   ├── Backend Engineer (a505e5c2-27b2-47f7-a362-bd83c9f1ee0f) - idle
│   ├── DevOps Engineer (17a11ee4-2a6a-4451-9d01-15df9eded04a) - idle
│   ├── QA Engineer (901d7e2c-c060-4242-ad34-7e1e865739b2) - running
│   ├── Security Engineer (3db7402b-6300-4f18-bc07-b2370aef2ef7) - idle
│   └── UX/UI Designer (25ce3f4b-23f4-4691-855a-a00fd15a80ec) - idle
├── CMO (2bdec24a-32f9-4fad-b81f-1890d47f77f9) - idle
│   ├── Content Director (96fb21ed-55c6-4785-a166-675cfe6f7f4e) - idle
│   ├── SEO Growth Engineer (1704ddeb-86b9-4986-887b-a45b22fb46dd) - idle
│   ├── Copywriter (cceda591-f8d5-4eaa-9fd8-4717aeace567) - idle
│   ├── Graphic Designer (5c2a40af-460b-4e3e-a936-4bed7f2487ec) - idle
│   ├── Social Media Manager (59ca3880-f66e-41b9-a982-d21cec3c52ce) - idle
│   └── SEO Specialist (af962b8b-a090-48fa-af55-16742afb845a) - idle
└── COO (f238150d-ff72-4f3c-88e5-665190ddbd6c) - idle
```

## Cloudflare
- API Key: (stored in environment variable CLOUDFLARE_API_KEY)
- EmDash CMS: https://emdash-cms.thanhtungtran364.workers.dev

## Critical Rule
Agent only reads `instructionsEntryFile` (AGENTS.md), NOT HEARTBEAT.md.
- Embed heartbeat protocol directly in AGENTS.md

## API
- Heartbeat: POST /api/agents/{agentId}/heartbeat/invoke

## After Completing Tasks
Sau khi hoàn thành task hoặc tạo file mới:
1. Chạy `bash scripts/auto-sync.sh` để sync lên GitHub
2. Script này tự động commit và push changes lên https://github.com/TungIT98/tpk-dev-studio
