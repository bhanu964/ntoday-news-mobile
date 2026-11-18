# NTODAY NEWS — Editorial Admin Portal 📰

A high-productivity content management system built with **Next.js (App Router)** and **Supabase**, purpose-built for the NTODAY editorial team.

---

## 🌟 Key Features

1. **Story Publishing & Editing:**
   - Create and update authentic Telugu headlines, summaries, and full news articles.
   - Dual-language support: add optional English translations (`title_en`, `summary_en`, `content_en`) for live bilingual toggling in the mobile app.
   - Categorize into one of 11 news beats (Politics, Crime, Weather, Telangana, Cinema, etc.).
   - Toggle **Breaking News (🚨)** flag to push stories to the Live ticker and top priority banners.
   - Attach `.mp4` video streaming links.

2. **Supabase Storage Image Uploader:**
   - Upload cover photos directly into the Supabase `article-images` public storage bucket.
   - Automatically generates CDN public URLs with instant card preview.
   - Fallback input for pasting direct Unsplash or external photo URLs.

3. **Status Control & Workflow:**
   - Switch between **Draft** and **Published** with a single click.
   - Unreleased drafts remain invisible to mobile readers through Row Level Security (RLS).

4. **Comment Moderation Queue:**
   - Review all reader comments submitted from the mobile app.
   - Filter by `Approved`, `Pending`, or `Rejected`.
   - 1-click Approve, Reject, or Delete actions.

---

## 🚀 Quick Setup & Run

### 1. Navigate to the admin directory
```bash
cd admin
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_CHANNEL_ID=ntoday-news
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔒 Supabase Authentication

- You can invite or register editors under **Supabase Dashboard > Authentication > Users**.
- Editors can log in via `/login`.
- If running in offline or local demo mode without Supabase keys, click **"Skip to Dashboard (Demo / Preview Mode)"** to preview the dashboard with local sample data.
