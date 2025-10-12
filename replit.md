# PlayCalc

## Overview

PlayCalc is a multifunctional React Native mobile application built with Expo that combines a calculator with real-time currency conversion capabilities. The app features both standard and professional calculator modes, a comprehensive currency converter with live exchange rates, calculation history management, and currency news feeds. Users can save and name calculations, pin favorites, export history to CSV, and perform currency arithmetic with an intuitive interface.

## Recent Changes (October 2025)

### AdMob Integration
- Integrated react-native-google-mobile-ads for monetization
- Production AdMob IDs configured (App ID: ca-app-pub-1825209738194679~8196313817)
- Banner ads display at bottom of calculator screen
- Interstitial ads show after every 6 calculations
- Test ads in development, production ads in release builds

### Bug Fixes
- **Critical History Bug**: Fixed async state issue where deleted/pinned/renamed history items would reappear
  - Root cause: `updateHistoryStorage()` was using stale state due to async React updates
  - Solution: Modified to accept optional parameter with fresh updated array
  - Applied to both Calculator.tsx and ProfessionalCalculator.tsx
- **Calculation Saving**: Improved to match professional calculator behavior
  - No longer saves single numbers without operators
  - Only saves actual calculations
  - Prevents duplicate consecutive calculations
- **Swipe Gestures**: Fixed to work reliably with corrected state management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Platform**
- Built with React Native 0.79.6 and Expo SDK 53
- Uses TypeScript for type safety
- Supports iOS, Android, and Web platforms
- Implements edge-to-edge display on Android with immersive navigation bar handling

**Navigation Structure**
- Bottom tab navigation for main features (Calculator, Currency Converter)
- Native stack navigation for onboarding flow (Dedication → Privacy/Terms → Tutorial)
- Modal-based navigation for currency selection and search screens
- Custom splash screen with Lottie animations

**State Management**
- React Context API for global currency target preferences (`CurrencyContext`)
- Local component state with hooks for UI interactions
- AsyncStorage for persistent data (history, favorites, recent searches, user preferences)

**UI Components & Libraries**
- React Native Paper for material design components
- Custom animated components using React Native Animated API
- Gesture handling via react-native-gesture-handler for swipe-to-delete and interactive elements
- FlashList for optimized currency list rendering
- Lottie for animated splash screens and loading indicators
- Expo Blur for visual effects

**Key Design Patterns**
- **Problem**: Smooth onboarding experience for first-time users
- **Solution**: Multi-step onboarding flow (Dedication → Privacy/Terms → Tutorial) with AsyncStorage flags to track completion
- **Rationale**: Ensures legal compliance and user education before main app access

- **Problem**: Performance with large currency lists
- **Solution**: FlashList for virtualized rendering, alphabetical indexing with quick scroll
- **Rationale**: Handles 50+ currencies efficiently with smooth scrolling

### Calculator Features

**Computation Engine**
- Math.js library for expression evaluation and scientific calculations
- Support for standard arithmetic, scientific functions (sin, cos, tan, log, ln, sqrt)
- Expression parsing and simplification
- Custom formatting with thousand separators

**History Management**
- Persistent history storage in AsyncStorage with fixed state synchronization
- Swipe-to-delete gesture support (swipe left to delete)
- Pin/unpin functionality for important calculations (swipe right to pin)
- Custom naming for history entries
- Search functionality across history
- CSV export capability using expo-file-system and expo-sharing
- Avatar generation for named entries using initials and color hashing
- Professional calculator behavior: only saves calculations with operators, not single numbers
- Prevents duplicate consecutive calculations from being saved

**Screen Orientation**
- Portrait mode for standard calculator
- Dynamic layout adaptation using Dimensions API
- Expo-screen-orientation for orientation locking

### Currency Converter Features

**Exchange Rate Integration**
- ExchangeRate-API integration for real-time conversion rates
- Fallback to local currency data when API unavailable
- Caching mechanism with 24-hour sync interval
- Offline support with cached rates

**Currency Data Management**
- **Problem**: Need for comprehensive currency information with offline capability
- **Solution**: Hybrid approach using local JSON file (currencies.json) merged with API data
- **Pros**: Works offline, fast initial load, comprehensive coverage
- **Cons**: Requires manual updates to local data file

**Currency Selection & Search**
- Geolocation-based regional currency suggestions (expo-location)
- Recent searches tracking
- Favorites system with swipe gestures
- Real-time search filtering
- Alphabetical grouping with section headers
- Long-press to add/remove favorites

**News Integration**
- NewsData.io API for currency-related financial news
- Per-currency news caching in AsyncStorage
- Offline mode with cached news fallback
- Network status detection using @react-native-community/netinfo

**Currency Arithmetic**
- Direct mathematical operations between converted currencies
- Expression evaluation for complex conversions
- Rate history tracking

### Data Storage Strategy

**AsyncStorage Keys**
- `dedicationDone`, `privacyDone`, `tutorialDone` - Onboarding completion flags
- `calcHistory` - Calculator history entries
- `currency_history` - Currency conversion history
- `currency_favorites` - User's favorite currencies
- `recentCurrencySearches` - Recent currency searches
- `currencyMapCache` - Cached currency data
- `currencyMapLastSync` - Last API sync timestamp
- `currencyTargets` - User's selected target currencies for quick conversion
- `news_[currency]` - Cached news per currency

**Data Models**
```typescript
HistoryEntry {
  id: string (timestamp-based)
  input: string
  result: string
  timestamp: string
  pinned: boolean
  name: string
}
```

### Theme & Styling

- Dark theme implementation using React Navigation's DarkTheme
- Dual theme support (light/dark) in currency converter with toggle
- Custom color palette: primary green (#00e676), dark backgrounds (#121212, #1e1e1e)
- Material Community Icons for consistent iconography
- Status bar and navigation bar management for immersive experience

## External Dependencies

### Third-Party APIs

**ExchangeRate-API (v6)**
- Purpose: Real-time currency exchange rates
- Endpoint: `https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{BASE_CURRENCY}`
- Configuration: API key stored in `app.config.js` via environment variable `API_KEY`
- Error Handling: Falls back to local currency data on failure

**NewsData.io API**
- Purpose: Currency-related financial news
- API Key: Hardcoded in NewsFeed component (`pub_de1c59c342574862a457fb9e0ca62653`)
- Endpoint: `https://newsdata.io/api/1/news`
- Query Parameters: Currency keyword, language (en), category (business)

**Google Mobile Ads (AdMob)**
- Banner and interstitial ads integration via react-native-google-mobile-ads (v15.8.0)
- App ID: ca-app-pub-1825209738194679~8196313817
- Banner Ad Unit ID: ca-app-pub-1825209738194679/1794556990
- Interstitial Ad Unit ID: ca-app-pub-1825209738194679/1853394606
- Rewarded Ad Unit ID: ca-app-pub-1825209738194679/1442384967 (not yet implemented)
- Configured in app.config.js with environment variable fallbacks
- Test ads in __DEV__ mode, production ads otherwise
- Non-personalized ads enabled for privacy compliance
- Banner displays at bottom of calculator, interstitials after 6 calculations

### Key Libraries

**Expo Ecosystem**
- expo-file-system: CSV export functionality
- expo-sharing: Share exported files
- expo-location: Geolocation for regional currency suggestions
- expo-navigation-bar: Android navigation bar customization
- expo-screen-orientation: Orientation locking
- expo-splash-screen: Splash screen management
- expo-blur: Visual blur effects

**React Native Extensions**
- @react-native-async-storage/async-storage: Persistent data storage
- @react-native-community/netinfo: Network connectivity detection
- @shopify/flash-list: High-performance list rendering
- react-native-gesture-handler: Gesture interactions
- react-native-paper: Material design components

**Utilities**
- mathjs: Mathematical expression evaluation
- lottie-react-native: Animation rendering

### Build & Deployment

- EAS Build configured for preview (APK) and production (App Bundle/Store) distributions
- Expo owner: "connexa"
- Android package: com.connexa.playcalc
- New Architecture enabled for performance improvements
- Edge-to-edge Android support