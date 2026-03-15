# CabWise — Smart Cab Aggregator for the UK

A React Native Expo app comparing real-time ride prices across Uber, Bolt, Free Now, Wheely, and more.

## Features

- **Real-time price comparison** across multiple cab services
- **Smart pickup suggestions** — nearby pickups that save money when walking distance is worth it
- **Live traffic-aware ETAs** via TomTom
- **Rate-limit handling** with Redis caching & circuit breakers
- **Mock data mode** for development (no API keys needed)
- **Surge pricing badges** with historical data for "best time to book"

## Tech Stack

### Frontend
- **Framework**: Expo (React Native) with TypeScript
- **State**: Zustand (lightweight client state) + React Query (server state + caching)
- **UI**: react-native-maps, @gorhom/bottom-sheet, react-native-reanimated
- **Location**: expo-location

### Backend (Planned)
- **BFF**: Supabase Edge Functions (Node/TypeScript)
- **Database**: PostgreSQL with PostGIS (Supabase managed)
- **Cache**: Upstash Redis
- **Real-time**: Socket.io

### APIs Integrated
- Uber Rides API
- Bolt API
- Free Now API
- Wheely API
- Google Maps (Places, Directions, Roads)
- TomTom Traffic/Routing
- Sentry for error tracking

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g eas-cli`

### Installation

1. Clone the repo:
```bash
git clone <repo-url>
cd cabwise
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Start the dev server:
```bash
npm start
```

5. Run on Android/iOS:
```bash
npm run android  # or
npm run ios
```

## Environment Variables

See [.env.example](.env.example) for all required env vars. Key ones:

- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `EXPO_PUBLIC_GOOGLE_MAPS_KEY` — Google Maps API key
- `TOMTOM_API_KEY` — TomTom Traffic API
- `BOLT_API_KEY`, `UBER_CLIENT_ID`, etc. — Provider API credentials
- `USE_MOCK=true` — Use mock data (no real API calls) for development

## Development

### Mock adapter mode (recommended for getting started)
Set `USE_MOCK=true` in `.env.local` to use mock quotes instead of real API calls.

### Project structure
```
app/                   # Expo Router screens
  (tabs)/
    index.tsx          # Home map + price comparison
    history.tsx        # Ride history (stub)
    account.tsx        # Account (stub)
  ride/
    compare.tsx        # Detailed compare sheet
components/
  map/
    RideMap.tsx        # Google Maps wrapper
  rides/
    RideCard.tsx       # Single ride quote card
    FilterChips.tsx    # Filter tabs
    QuickBookButton.tsx
  shared/
store/
  rideStore.ts         # Zustand state (origin, destination, filters)
hooks/
  useQuotes.ts         # React Query + aggregator
  usePickupPoints.ts   # Nearby pickup scoring
  useLocation.ts       # GPS + permissions
adapters/
  mock.ts              # Mock provider (for dev)
  uber.ts              # Uber API adapter
  bolt.ts              # Bolt API adapter
services/
  aggregator.ts        # Fan-out all providers, dedup, cache
lib/
  supabase.ts          # Supabase client
  redis.ts             # Upstash Redis client
```

## Signups Required (Free Tiers)

1. **Supabase** → supabase.com → Create project
2. **Google Cloud** → Billing + Maps APIs enabled
3. **TomTom Developer** → developer.tomtom.com → Traffic Flow API
4. **Upstash Redis** → upstash.com → Create DB (eu-west-1)
5. **Expo** → eas login
6. **Cab Provider APIs** (apply separately):
   - Uber: developer.uber.com
   - Bolt: partners.bolt.eu (email approval)
   - Free Now: free-now.com/developer
   - Wheely: wheely.com/business

## Build & Deploy

### Local testing
```bash
npm start
# Scan QR code with Expo Go app
```

### EAS build (managed Expo builds)
```bash
eas build:configure
eas build --platform android --local  # or ios
```

### TestFlight / Play Store
```bash
eas submit -p ios  # or android
```

## Next Steps (Post-MVP)

- [ ] Booking deeplink flow (lock quote, open provider app, track)
- [ ] Active ride tracking with live driver location
- [ ] Surge prediction ML model
- [ ] Scheduled ride booking at optimal time
- [ ] Carbon footprint badge + EV filter
- [ ] B2B expense dashboard
- [ ] Loyalty/cashback aggregation

## Architecture Deep Dive

See [Claude conversation](https://claude.ai/share/5db3c267-3fd1-47a3-88fb-58f5bdeafb0a) for:
- Full database schema with PostGIS queries
- Provider adapter pattern implementation
- React Native navigation scaffold
- Supabase Edge Functions setup

## License

MIT
