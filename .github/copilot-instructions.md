- [ ] Install Node.js
- [ ] Run `npm install`
- [ ] Configure environment variables (.env.local)
- [ ] Start dev server with `npm start`
- [ ] Test with mock adapter (USE_MOCK=true)
- [ ] Integrate Supabase schema
- [ ] Test location + map rendering
- [ ] Wire up real provider APIs (when approved)

## Implementation Checklist

### Phase 1: Core App (Current)
- [x] Project scaffold (Expo + TypeScript)
- [x] Store + hooks (Zustand + React Query)
- [x] Mock adapter + aggregator
- [x] Components (Map, RideCard, FilterChips, QuickBook)
- [x] Home screen layout
- [ ] Install dependencies & test build

### Phase 2: Supabase Integration
- [ ] Deploy migrations
- [ ] Test nearby_pickup_points RPC
- [ ] Implement actual data fetching
- [ ] Add search analytics

### Phase 3: Real Provider APIs
- [ ] Integrate Uber adapter (when API approved)
- [ ] Integrate Bolt adapter (already in code)
- [ ] Add Free Now & Wheely adapters
- [ ] Circuit breaker error handling

### Phase 4: Advanced Features
- [ ] Active ride tracking
- [ ] Booking confirmation flow
- [ ] Deep linking to provider apps
- [ ] Surge prediction
- [ ] B2B dashboard

## Setup Instructions

### 1. Install Node.js (Windows)
If you haven't already, install Node.js 18+ from nodejs.org or:
\`\`\`powershell
choco install nodejs -y
\`\`\`

Then restart your terminal and verify:
\`\`\`
node --version
npm --version
\`\`\`

### 2. Install project dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Setup environment
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your API keys
\`\`\`

### 4. Start development
\`\`\`bash
npm start
# Scan QR code with Expo Go app on your phone
\`\`\`

## Troubleshooting

**"npx: command not found"**
→ Node.js not installed or PATH not updated. Restart terminal.

**"EXPO_PUBLIC_* variables missing"**
→ Create .env.local from .env.example and fill in your keys.

**Map not rendering**
→ Ensure Google Maps API key is set and Google Maps SDK enabled in Cloud Console.

**Quotes not loading**
→ Check that USE_MOCK=true is set for development without real API keys.
