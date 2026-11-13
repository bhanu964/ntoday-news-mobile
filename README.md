# NTODAY NEWS — Mobile Application 📱

A high-performance, short-form mobile news application built with **React Native**, **Expo SDK 58**, and **TypeScript**, specifically designed for **NTODAY NEWS** ([ntodaynews.com](https://ntodaynews.com)).

The app delivers an **Instagram Reels-style full-screen, vertically swipeable news experience**, tailored with authentic Telugu journalism, rich media previews (photo & video), TTS audio countdowns, interactive reader comments, and instant feedback submission.

---

## 🌟 Key Features

* **Instagram Reels-Style Vertical Feed:**
  * Strict **1 Swipe = Exactly 1 Story** physics powered by a native paging engine (`disableIntervalMomentum`, `snapToInterval`, and clamped drag boundaries).
  * Smooth, relaxed deceleration rate (`0.998`) for a calm, premium reading experience without skipping multiple cards.
  * Web CSS scroll-snap (`scroll-snap-type: y mandatory`, `scroll-snap-stop: always`) for desktop and mobile browser compatibility.
  * Zero automatic advancement; unread session snapshotting keeps stories anchored while reading.

* **Telugu & English Typography:**
  * Dynamic `[తె A]` language toggle on the navigation bar.
  * Formatted headlines, source attribution strips, time-ago indicators, and author desk tags.

* **Upper Media Section with Curved Borders:**
  * Dynamic photo & video viewer with `borderRadius: 18`.
  * Background image fallback layer prevents blank or black screens even during network lag.
  * Loop, mute/unmute, and play/pause controls powered by `expo-video`.

* **Interactive Top Navigation Bar:**
  * Official **NTODAY NEWS** logo branding.
  * Segmented filter pills: **Latest**, **Unread** (with real-time unread badge counter), and **Feedback**.
  * Quick-access **Bookmarks / Saved Stories** toggle.
  * **Category Filter Modal** supporting 11 news categories (రాజకీయాలు, సినిమా, క్రైమ్, బిజినెస్, విద్య, etc.).

* **Engaging Bottom Sheet Modals:**
  * **Comments Sheet:** Read user discussions and submit new comments in real time.
  * **Feedback Sheet:** Rate experience with stars, select category chips (Bug, Suggestion, Content), and send feedback.
  * **Account Screen:** User profile, bookmarked articles, saved shorts, preferences, and reporter submission portal.

* **Action Toolbar on Every News Card:**
  * Social sharing via native share sheet and WhatsApp deep linking (`whatsapp://send`).
  * Like / Dislike reaction buttons with live counters.
  * TTS Audio Bulletin simulation with animated countdown timer.

* **Explore & Audio Headlines:**
  * Full-text search with instant filtering.
  * "Listen to the news" hands-free audio headline banner.
  * "Top now" numbered leaderboard of trending stories.

---

## 🛠 Tech Stack

* **Framework:** React Native 0.88 & Expo SDK 58
* **Routing:** Expo Router v58 (File-based navigation in `src/app/`)
* **Language:** TypeScript 5.8+ (Strict type-checking)
* **Media & Video:** `expo-video` & `expo-linear-gradient`
* **Icons:** `@expo/vector-icons` (`Ionicons` unified across all platforms)
* **Tunneling:** `@expo/ngrok` (Seamless remote testing on physical devices)

---

## 🚀 Quick Start for Teammates

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Git](https://git-scm.com/)
* [Expo Go](https://expo.dev/go) app installed on your iOS or Android phone (optional, for device testing)

### 2. Clone the Repository
```bash
git clone https://github.com/bhanu964/ntoday-news-mobile.git
cd ntoday-news-mobile
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server

#### Option A: Run with Live Cloud Tunnel (Recommended for Phone Testing)
Enables opening the app on your physical phone over cellular data or remote Wi-Fi via Expo Go or web browser:
```bash
npm run tunnel
```

#### Option B: Run in Web Browser
```bash
npm run web
```
Opens the application at `http://localhost:8081`.

#### Option C: Run on Emulators / Simulators
```bash
npm run android  # Android Emulator
npm run ios      # iOS Simulator (macOS only)
```

---

## 📁 Project Architecture & Directory Structure

```text
ntoday-news-mobile/
├── assets/
│   ├── images/
│   │   ├── ntoday-official-logo.png  # Official NTODAY NEWS logo
│   │   ├── ntoday-logo.png
│   │   └── default.png
│   └── news/                         # Local news image assets
├── src/
│   ├── app/                          # Expo Router file-based screens
│   │   ├── _layout.tsx               # Root layout with DarkTheme & font preloading
│   │   ├── index.tsx                 # Main screen (Home feed, TopHeader, BottomNavBar)
│   │   └── explore.tsx               # Standalone explore screen
│   ├── components/                   # Modular UI components
│   │   ├── ReelsFeed.tsx             # Controlled 1-page vertical paging container
│   │   ├── NewsCard.tsx              # Complete news card with actions & media
│   │   ├── MediaViewer.tsx           # Photo/Video viewer with curved borders & fallback
│   │   ├── TopHeader.tsx             # Navbar with logo, pills, and language toggle
│   │   ├── BottomNavBar.tsx          # 5-tab persistent bottom bar
│   │   ├── ExploreView.tsx           # Search, audio banner & trending stories
│   │   ├── AccountView.tsx           # User profile & settings sheet
│   │   ├── CommentsModal.tsx         # Interactive comments bottom sheet
│   │   ├── FeedbackModal.tsx         # User feedback submission sheet
│   │   ├── CategoryFilterModal.tsx   # 11-category filter dialog
│   │   ├── VideosView.tsx            # Full-screen video section
│   │   └── LiveView.tsx              # Live stream news preview
│   ├── data/
│   │   └── mockNews.ts               # 10 realistic Telugu news stories & top stories
│   ├── types/
│   │   └── news.ts                   # TypeScript interfaces (NewsArticle, Comment, etc.)
│   └── constants/
│       └── theme.ts                  # Brand colors, typography & spacing
├── app.json                          # Expo configuration
├── package.json                      # Project dependencies & scripts
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🧩 Key Architecture Details for Developers

### Vertical Paging Engine (`src/components/ReelsFeed.tsx`)
The feed relies on a controlled, single-item paging engine:
```typescript
// Enforces that one gesture advances at most one story
const handleScrollEndDrag = (e) => {
  const offsetY = e.nativeEvent.contentOffset.y;
  const rawTarget = Math.round(offsetY / containerHeight);
  let targetIndex = rawTarget;
  if (targetIndex > startIndex + 1) targetIndex = startIndex + 1;
  else if (targetIndex < startIndex - 1) targetIndex = startIndex - 1;
  ...
};
```
* **Deceleration Rate:** Set to `"normal"` for smooth gliding instead of aggressive snapping.
* **Momentum Lock:** `disableIntervalMomentum={true}` guarantees the card always stops at the adjacent boundary.
* **Layout Sync:** Height is measured dynamically via `onLayout` on `mainContent` to prevent offset drift across status bar and tab bar changes.

### Unread Feed Stability (`src/app/index.tsx`)
When a user switches to the **Unread** tab, `unreadSessionIds` snapshots the unread list:
* Marking a story as read decrements the unread counter in real-time.
* The story remains mounted in the feed until the user explicitly refreshes or changes tabs, eliminating the infinite auto-scrolling loop.

### Typography & Fonts (`src/app/_layout.tsx`)
* All iconography across the app is unified under **`Ionicons`** (`@expo/vector-icons`).
* `Ionicons.font` is preloaded on startup using `expo-font`'s `useFonts` with error protection to prevent network timeout errors on mobile browsers.

---

## 🧪 Verification & Quality Checks

Run the following commands before committing new features:

```bash
# 1. Typecheck the entire codebase (must report 0 errors)
npx tsc --noEmit

# 2. Verify Expo doctor diagnostics
npx expo-doctor
```

---

## 🤝 Next Steps for the Team
1. **API Integration:** Replace `MOCK_NEWS_ARTICLES` in `src/data/mockNews.ts` with API calls to the NTODAY NEWS backend (`https://ntodaynews.com/api/...`).
2. **Push Notifications:** Configure Expo Notifications (`expo-notifications`) for breaking news alerts.
3. **Authentication:** Connect user login in `src/components/AccountView.tsx` with your backend auth service.
4. **Offline Caching:** Implement local caching using `@react-native-async-storage/async-storage` for offline reading.

---

## 📄 License
Private & Proprietary — Developed for **NTODAY NEWS** ([ntodaynews.com](https://ntodaynews.com)).
