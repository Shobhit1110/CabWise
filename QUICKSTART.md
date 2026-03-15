# Quick Start Guide

## Step 1: Finish Node.js Installation

If Node.js installation is still pending from earlier:

```powershell
# Check if Node is now available
node --version
npm --version

# If not found, restart PowerShell with admin privileges first, then:
# choco install nodejs -y
```

## Step 2: Install Dependencies

```bash
cd c:\Users\shobh\CabWise
npm install
```

This will install:
- Expo & React Native
- Zustand (state management)
- React Query (server state)
- TanStack/react-query
- react-native-maps, bottom-sheet, reanimated
- Supabase client, Upstash Redis
- All other dependencies

**Estimated time**: 5-10 minutes

## Step 3: Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your API keys:
# - EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
# - EXPO_PUBLIC_GOOGLE_MAPS_KEY
# - TOMTOM_API_KEY
# - BOLT_API_KEY (if you have it)
# - USE_MOCK=true (recommended for testing)
```

## Step 4: Start the Dev Server

```bash
npm start
```

This will:
1. Start the Expo bundler
2. Display a QR code
3. Scan with **Expo Go app** (iOS/Android) to preview

## Step 5: Test Mock Adapter

With `USE_MOCK=true` in `.env.local`:
- Quotes will load instantly (no real API calls)
- You'll see 4 mock providers: Uber, Bolt, Free Now, Wheely
- Maps will work if you added a Google Maps API key
- All filters & quick-book button will function

## Next Steps

### To integrate real APIs:
1. Create a Supabase project → get URL & anon key
2. Apply for Uber/Bolt/Free Now APIs (1-2 weeks)
3. Get Google Maps API key (5 min)
4. Update .env.local with real keys
5. Swap `USE_MOCK=false`

### To deploy:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android  # or ios
```

### Project structure:
```
app/                 # Screens
components/          # React components
hooks/               # React Query + custom hooks
store/               # Zustand state
services/            # Aggregator logic
adapters/            # Provider API adapters (mock, uber, bolt)
lib/                 # Supabase, Redis clients
utils/               # Helpers
supabase/migrations/ # SQL schema
```

## Common Issues

**npm install fails**: Ensure Node.js 18+ is installed and PATH is updated

**Map not showing**: Add EXPO_PUBLIC_GOOGLE_MAPS_KEY to .env.local

**Quotes not loading**: Set USE_MOCK=true to test with fake data

**Port 8081 already in use**: Kill existing Expo process or use `npm start -- --port 8082`

## Documentation

- Full architecture: [README.md](README.md)
- Setup instructions: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Original design doc: https://claude.ai/share/5db3c267-3fd1-47a3-88fb-58f5bdeafb0a
