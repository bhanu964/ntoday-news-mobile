# N Today News — Mobile Application 📱

A short-form Telugu & English mobile news application built with **React Native**, **Expo SDK 58**, **Expo Router**, and **TypeScript**, powered by live stories from [ntodaynews.com](https://ntodaynews.com).

The app delivers a full-screen, vertically swipeable **Reels-style news feed** with dynamic live category filtering, instant Telugu-to-English translation, tap-to-toggle immersive chrome, full article reading modals, native splash screens, and ready-to-install Android APK builds via EAS.

---

## 🌟 Implemented Features

- **Cold-Launch Portrait Splash Screen (`LaunchSplashOverlay.tsx` & `expo-splash-screen`)**
  - Uses `#020D23` native splash background with custom Android/iOS launcher icons (`assets/icon.png`) and full-screen portrait startup graphic (`assets/splash.png`, `assets/images/splash-screen.png`) shown strictly once on cold start.
- **Reels-Style Vertical News Feed (`ReelsFeed.tsx`, `NewsCard.tsx`, `src/app/index.tsx`)**
  - Enforces **1 swipe = 1 story** paging (`snapToInterval`, `disableIntervalMomentum`, dynamic container height measurement).
  - **Tap-to-Toggle Immersive Mode**: Top header and bottom navigation bar (`Home`, `News+`, `Reload`) hide by default and smoothly animate in/out on single-tap, while timestamps, page counters, and the symmetric bottom social action bar remain fixed.
  - **Centered WhatsApp CTA & Sharing**: Symmetrical bottom toolbar (`Like`, `Dislike`, enlarged centered `WhatsApp`, `Comments`, menu, and `Share`), plus `FullArticleModal.tsx` (`మరింత చదవండి` / `Read More`).
- **Live Website Scraper & Resilient Caching (`src/services/scraperService.ts`, `articlesService.ts`, `useArticles.ts`)**
  - Scrapes live news, reporter names/bureaus, and images directly from `https://ntodaynews.com/` with request deduplication, `15s` timeout + automatic retry, `https://ntodaynews.com/trending?page_latest=1` fallback, and chronological newest-first sorting.
  - Falls back offline to cached live articles in `@react-native-async-storage/async-storage`, auto-retries on `AppState` foreground resume, and displays an explicit network retry screen (no fake mock articles in live feeds).
- **Dynamic Live Categories & Pagination (`CategoryFilterModal.tsx`)**
  - Dynamically extracts active categories from the live site navigation and performs strict per-category filtering and infinite chronological pagination (`/category/{id}?page={page}`).
- **Live Telugu ↔ English Translation (`TranslationService`, `LanguageContext`)**
  - Header `[తె A]` toggle switches the UI and translates headlines, article snippets, categories, and reporter desks on demand with persistent caching.
- **User Onboarding & Account (`AccountView.tsx`, `AuthService`)**
  - Reader profile management, bookmarks, read history, and 6-digit OTP sign-in verification flow.

---

## 🛠 Tech Stack

- **Framework:** React Native `0.88.0`, React `19.3.0`, Expo SDK `~58.0.20` (`reactCompiler: true`)
- **Routing:** Expo Router (`~58.0.27`, typed routes enabled)
- **Language:** TypeScript (`~6.0.3`, strict mode)
- **Media & UI:** `expo-video`, `expo-image`, `expo-linear-gradient`, `expo-splash-screen`, `@expo/vector-icons` (`Ionicons`)
- **Storage & Networking:** `@react-native-async-storage/async-storage`, optional `@supabase/supabase-js`

---

## 🚀 Quick Start (Teammate Onboarding)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) on Android or iOS for instant device testing

### 2. Clone & Install
```bash
git clone https://github.com/bhanu964/ntoday-news-mobile.git
cd ntoday-news-mobile
npm install
```

### 3. Environment Variables (Optional)
Out of the box, the app scrapes live news directly from `https://ntodaynews.com` with **zero API keys required**.

If you want to connect a Supabase backend, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. (`.env` files are gitignored; for EAS builds, upload env vars with `eas env:create`.)

### 4. Run in Development / Expo Go

```bash
# Recommended on same Wi-Fi LAN (clears Metro cache):
npx expo start -c

# Recommended if Mac and phone are on different networks:
npm run tunnel

# Other targets:
npm run web
npm run android
npm run ios
```
Scan the printed QR code in **Expo Go** (Android) or the Camera app (iOS).

---

## 📦 Building Android APK with EAS (`eas.json`)

The repository uses Expo Application Services (**EAS Build**) and Continuous Native Generation (no manual `android/` or `ios/` folders are committed). [eas.json](./eas.json) configures `development`, `preview` (`distribution: "internal"`, `android.buildType: "apk"`), and `production` profiles.

### Option A: Building under the Existing Shared Expo Project
If your teammate account is added as a collaborator on `@bhanu_cheg/n-today-news`:
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

### Option B: Re-linking to Your Own Expo Account (Independent Build)
If you are building under your own personal or team Expo account:
1. Remove `"owner"` and `"extra.eas.projectId"` from `app.json` (or overwrite them with your own project ID):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init --account <your-expo-account> --force
   ```
2. Trigger the APK build (accept generating a new Android Keystore when prompted):
   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

Once complete, EAS provides a direct `.apk` download link and QR code for Android devices.

---

## 📁 Project Structure

```text
ntoday-news-mobile/
├── assets/
│   ├── icon.png                         # Primary 1024x1024 launcher icon (#020D23 badge)
│   ├── splash.png                       # Portrait launch splash graphic
│   ├── images/                          # Adaptive Android icon layers, logos & splash-screen.png
│   └── news/                            # Local bundled fallback imagery
├── src/
│   ├── app/                             # Expo Router file-based routes
│   │   ├── _layout.tsx                  # Root layout, theme, font preload & LaunchSplashOverlay
│   │   ├── index.tsx                    # Main Reels feed, immersive chrome & error/retry UI
│   │   ├── (tabs)/                      # Tab navigator route variants
│   │   └── news/[id].tsx                # Deep-linked article detail route
│   ├── components/                      # ReelsFeed, NewsCard, CategoryFilterModal, AccountView, etc.
│   ├── config/appConfig.ts              # Channel constants, storage keys & Supabase config helper
│   ├── constants/
│   │   ├── theme.ts                     # Brand colors & typography
│   │   └── translations.ts              # Telugu / English UI copy dictionary
│   ├── context/LanguageContext.tsx      # Persistent Telugu / English state provider
│   ├── data/mockNews.ts                 # Static sample data for playlists/tests
│   ├── hooks/                           # useArticles, useBookmarks, useComments, useLikes
│   ├── services/                        # scraperService, articlesService, translationService, authService, etc.
│   └── types/                           # TypeScript definitions (news, database, user)
├── admin/                               # Next.js editorial admin dashboard (optional)
├── supabase/                            # SQL schema & migrations (optional)
├── app.json                             # Expo app & native splash/icon configuration
├── eas.json                             # EAS Build profiles (APK preview & production)
├── .env.example                         # Template for optional Supabase environment variables
└── package.json                         # Dependencies and npm scripts
```

---

## 🧪 Verification & Pre-Commit Checks

Run before committing or triggering an EAS build:
```bash
# 1. Typecheck (must pass with 0 errors)
npx tsc --noEmit

# 2. Validate Expo app.json schema & dependencies
npx expo config --type introspect > /dev/null
npx expo-doctor
```

---

## 📄 License
Private & Proprietary — Developed for **NTODAY NEWS** ([ntodaynews.com](https://ntodaynews.com)).
