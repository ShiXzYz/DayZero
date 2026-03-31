# DayZero - Cybersecurity Breach Detection

A mobile-first web application that detects user exposure in data breaches and enables immediate, guided response actions without requiring access to user credentials.

## Features

- **Breach Detection** - Check if your email has appeared in known data breaches
- **Risk Scoring Engine** - Calculates risk level based on breach severity, recency, and data exposure
- **One-Tap Security Actions** - Prebuilt action flows with deep links to services
- **Real-time Alerts** - Subscribe to notifications for new breaches
- **Privacy-First** - No passwords stored, email-only authentication

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Breach Data**: Have I Been Pwned API

## Setup

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `FIREBASE_ADMIN_PRIVATE_KEY` - Firebase admin private key
- `FIREBASE_ADMIN_CLIENT_EMAIL` - Firebase admin client email
- `HIBP_API_KEY` - Have I Been Pwned API key (optional, mock data used if not provided)

### 3. Set Up Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a service account for admin access
4. Add the credentials to your `.env.local`

### 4. Get Have I Been Pwned API Key (Optional)

Sign up at [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key) for API access. Without this key, the app uses mock breach data.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── users/route.ts      # User signup/auth
│   │   ├── breaches/route.ts   # Breach checking
│   │   ├── alerts/route.ts     # Alert management
│   │   └── subscribe/route.ts  # Alert subscriptions
│   ├── check-exposure/         # Public breach search
│   ├── get-alerts/             # Alert subscription
│   ├── join-waitlist/          # Waitlist signup
│   ├── layout.tsx
│   └── page.tsx                # Main app entry
├── components/
│   ├── dashboard/              # User dashboard
│   └── onboarding/             # Onboarding flow
├── hooks/
│   └── useUser.ts              # User state management
├── lib/
│   ├── firebase/                # Firebase config
│   ├── hibp.ts                 # Have I Been Pwned integration
│   └── risk-score.ts           # Risk calculation
└── types/
    └── index.ts                # TypeScript types
```

## API Endpoints

### POST /api/users
Create or fetch user by email. Returns breach data and risk score.

### POST /api/breaches
Check breaches for an email address.

### GET /api/alerts
Fetch alerts for a user. Supports `?userId=&unreadOnly=true`.

### POST /api/subscribe
Update notification preferences for a user.

## Database Schema (Firestore)

### users
```json
{
  "id": "string",
  "email": "string",
  "emailHash": "string",
  "riskScore": "number",
  "breachCount": "number",
  "notificationPreferences": {...}
}
```

### userBreaches
```json
{
  "userId": "string",
  "breach": {...},
  "addedDate": "string",
  "isResolved": "boolean"
}
```

### alerts
```json
{
  "userId": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "severity": "string",
  "isRead": "boolean",
  "createdAt": "string"
}
```

### subscriptions
```json
{
  "userId": "string",
  "email": "string",
  "topics": "string[]",
  "severityThreshold": "string",
  "enableEmail": "boolean",
  "isActive": "boolean"
}
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [shadcn/ui](https://ui.shadcn.com)
