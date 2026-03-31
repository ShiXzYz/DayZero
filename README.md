# DayZero - Cybersecurity Incident Intelligence

A real-time cybersecurity incident monitoring platform that aggregates data from SEC filings and security news to keep users informed about breaches, ransomware attacks, and security incidents affecting tracked companies.

## Features

- **Real-Time Incident Feed** - Live stream of security incidents from multiple sources
- **Company Tracking** - Follow companies to receive targeted alerts
- **Multi-Source Aggregation** - Combines SEC filings, security news, and more
- **Check Your Exposure** - Optional email/password breach checking via HIBP

## Data Sources (Priority)

| Source | Cost | Description |
|--------|------|-------------|
| SEC EDGAR | Free | Mandatory 4-day corporate breach disclosures from publicly traded companies |
| DataBreaches.net | Free | RSS feed with early breach reporting within 24-72 hours |
| BleepingComputer | Free | Real-time security news and breach coverage |

## Additional Features (Optional)

| Source | Cost | Description |
|--------|------|-------------|
| HIBP Email Search | ~$3.50/mo | Email-specific breach history (opt-in feature) |
| HIBP Password Check | Free | Password breach lookup via k-anonymity (client-side) |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Threat Intel**: SEC EDGAR API, RSS feeds, HIBP API (optional)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

**Required:**
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `FIREBASE_ADMIN_*` - Firebase admin credentials

**Optional (for HIBP integration):**
- `HIBP_API_KEY` - Have I Been Pwned API key (~3.50/month)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── companies/route.ts    # Company registry
│   │   ├── incidents/route.ts    # Incident aggregation
│   │   ├── follow/route.ts       # Company following
│   │   └── alerts/route.ts       # User alerts
│   ├── companies/                # Company search/follow page
│   ├── alerts/                   # Alert management page
│   ├── check-exposure/          # Optional HIBP email/password check
│   ├── layout.tsx
│   └── page.tsx                  # Main incident feed
├── lib/
│   └── sources/
│       ├── sec-edgar.ts          # SEC 8-K filings (free)
│       └── news.ts               # RSS aggregation (free)
└── types/
    └── index.ts                  # TypeScript definitions
```

## Data Model

### Incident
```json
{
  "id": "string",
  "companyId": "string",
  "companyName": "string",
  "title": "string",
  "summary": "string",
  "severity": "Critical | High | Medium | Low",
  "sources": [{
    "type": "sec_filing | news",
    "sourceName": "string",
    "confidence": 0.95
  }],
  "discoveredAt": "ISO date"
}
```

## Privacy

- No personal data collection
- Email/password checking is optional and client-side
- HIBP API calls are made directly (we don't store results)
- Company following stored in Firebase with user consent

## License

Private - All rights reserved
