-- ==============================================================================
-- NTODAY NEWS DATABASE SCHEMA & SEED SCRIPT FOR SUPABASE
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running (safe order)
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;

-- ------------------------------------------------------------------------------
-- TABLE: channels
-- ------------------------------------------------------------------------------
CREATE TABLE public.channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- TABLE: categories
-- ------------------------------------------------------------------------------
CREATE TABLE public.categories (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- Telugu Name, e.g. "రాజకీయాలు"
    name_en TEXT NOT NULL,       -- English Name, e.g. "Politics"
    slug TEXT NOT NULL,
    icon TEXT DEFAULT 'apps',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, slug)
);

-- ------------------------------------------------------------------------------
-- TABLE: articles
-- ------------------------------------------------------------------------------
CREATE TABLE public.articles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    channel_id TEXT NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    title_en TEXT,
    summary TEXT,
    summary_en TEXT,
    content TEXT NOT NULL,
    content_en TEXT,
    image_url TEXT NOT NULL,
    video_url TEXT,
    source TEXT DEFAULT 'NTODAY NEWS',
    author TEXT DEFAULT 'Desk Reporter',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    is_breaking BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- TABLE: comments
-- ------------------------------------------------------------------------------
CREATE TABLE public.comments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- TABLE: likes
-- ------------------------------------------------------------------------------
CREATE TABLE public.likes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, device_id)
);

-- ------------------------------------------------------------------------------
-- TABLE: devices
-- ------------------------------------------------------------------------------
CREATE TABLE public.devices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    device_id TEXT NOT NULL UNIQUE,
    platform TEXT CHECK (platform IN ('android', 'ios', 'web', 'unknown')),
    fcm_token TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES for Maximum Query Performance
-- ------------------------------------------------------------------------------
CREATE INDEX idx_articles_channel_status ON public.articles(channel_id, status, published_at DESC);
CREATE INDEX idx_articles_category ON public.articles(category_id);
CREATE INDEX idx_articles_breaking ON public.articles(channel_id, is_breaking) WHERE is_breaking = TRUE;
CREATE INDEX idx_comments_article ON public.comments(article_id, created_at DESC);
CREATE INDEX idx_likes_article_device ON public.likes(article_id, device_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- 1. Channels RLS: Anyone can read channels
CREATE POLICY "Public channels are readable"
    ON public.channels FOR SELECT
    USING (true);

-- 2. Categories RLS: Anyone can read categories
CREATE POLICY "Public categories are readable"
    ON public.categories FOR SELECT
    USING (true);

-- 3. Articles RLS:
-- Public can read only published articles
CREATE POLICY "Anyone can read published articles"
    ON public.articles FOR SELECT
    USING (status = 'published');

-- Authenticated users (admin/editors) can manage all articles
CREATE POLICY "Authenticated editors can do anything with articles"
    ON public.articles FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Comments RLS:
-- Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments"
    ON public.comments FOR SELECT
    USING (status = 'approved');

-- Anyone can submit comments (anonymous / reader input)
CREATE POLICY "Anyone can post a comment"
    ON public.comments FOR INSERT
    WITH CHECK (true);

-- Authenticated editors can moderate (update/delete) comments
CREATE POLICY "Authenticated editors can moderate comments"
    ON public.comments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Likes RLS:
-- Anyone can read likes and insert/delete their own like
CREATE POLICY "Anyone can read likes"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Anyone can toggle likes"
    ON public.likes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can remove their like"
    ON public.likes FOR DELETE
    USING (true);

-- 6. Devices RLS:
-- Anyone can register or update device record
CREATE POLICY "Anyone can register devices"
    ON public.devices FOR ALL
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- TRIGGER FUNCTIONS TO AUTO-INCREMENT COUNTERS
-- ------------------------------------------------------------------------------
-- Comment counter function
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.articles
        SET comment_count = comment_count + 1
        WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.articles
        SET comment_count = GREATEST(0, comment_count - 1)
        WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_article_comment_count();

-- Like counter function
CREATE OR REPLACE FUNCTION update_article_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.articles
        SET like_count = like_count + 1
        WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.articles
        SET like_count = GREATEST(0, like_count - 1)
        WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_like_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION update_article_like_count();

-- ------------------------------------------------------------------------------
-- STORAGE BUCKET CONFIGURATION FOR ARTICLE IMAGES
-- (Run inside Supabase SQL editor to create the public article-images bucket)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access to Article Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can update/delete article images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'article-images');


-- ==============================================================================
-- SEED SCRIPT FOR NTODAY NEWS
-- Inserts NTODAY Channel, 11 Categories, and 10 Full Telugu/English News Articles
-- ==============================================================================

-- 1. Insert Channel
INSERT INTO public.channels (id, name, slug, description)
VALUES (
    'ntoday-news',
    'NTODAY NEWS',
    'ntoday',
    'The Clearcut News — Authentic Telugu Journalism & Live Digital Bulletins'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert 11 News Categories
INSERT INTO public.categories (id, channel_id, name, name_en, slug, icon, sort_order)
VALUES
    ('cat-politics', 'ntoday-news', 'రాజకీయాలు', 'Politics', 'politics', 'megaphone', 1),
    ('cat-crime', 'ntoday-news', 'క్రైమ్', 'Crime', 'crime', 'shield-alert', 2),
    ('cat-weather', 'ntoday-news', 'వాతావరణం', 'Weather', 'weather', 'cloudy-night', 3),
    ('cat-business', 'ntoday-news', 'బిజినెస్', 'Business', 'business', 'trending-up', 4),
    ('cat-education', 'ntoday-news', 'విద్య & ఉద్యోగాలు', 'Jobs & Education', 'education', 'school', 5),
    ('cat-telangana', 'ntoday-news', 'తెలంగాణ', 'Telangana', 'telangana', 'location', 6),
    ('cat-cinema', 'ntoday-news', 'సినిమా', 'Cinema', 'cinema', 'film', 7),
    ('cat-sports', 'ntoday-news', 'క్రీడలు', 'Sports', 'sports', 'football', 8),
    ('cat-agriculture', 'ntoday-news', 'వ్యవసాయం', 'Agriculture', 'agriculture', 'leaf', 9),
    ('cat-tech', 'ntoday-news', 'టెక్నాలజీ', 'Tech & ISRO', 'technology', 'rocket', 10),
    ('cat-andhra', 'ntoday-news', 'ఆంధ్రప్రదేశ్', 'Andhra Pradesh', 'andhra', 'business', 11)
ON CONFLICT (channel_id, slug) DO UPDATE
SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, icon = EXCLUDED.icon;

-- 3. Insert 10 Authentic News Articles
INSERT INTO public.articles (
    id, channel_id, category_id,
    title, title_en,
    summary, summary_en,
    content, content_en,
    image_url, video_url,
    source, author, status, is_breaking,
    like_count, comment_count, published_at
)
VALUES
(
    'news-1', 'ntoday-news', 'cat-politics',
    'కర్ణాటక MLC ఎన్నికల్లో NDA గెలుపు',
    'NDA Wins 3 of 4 Seats in Karnataka Legislative Council By-polls',
    'కర్ణాటక శాసనమండలి ఎన్నికల్లో BJP-JDS కూటమి ఘన విజయం సాధించింది.',
    'BJP-JDS alliance records a massive victory in Karnataka MLC teacher & graduate seats.',
    'కర్ణాటక శాసనమండలిలోని నాలుగు ఉపాధ్యాయ పట్టభద్రుల స్థానాల్లో BJP-JDS కూటమి గెలిచింది. బెంగళూరు టీచర్స్ స్థానంలో ఐదుసార్లు MLCగా గెలిచిన కాంగ్రెస్ నేత పుట్టన్నపై JDS అభ్యర్థి ఏపీ రంగనాథ్ 908 ఓట్ల తేడాతో గెలిచారు. పశ్చిమ పట్టభద్రుల స్థానంలో BJP అభ్యర్థి ఎస్వీ సంకనూర్ గెలుపొందారు. రాష్ట్రంలో కాంగ్రెస్ అధికారంలో ఉన్నప్పటికీ ఈ ఎన్నికల్లో కూటమి ఆధిపత్యం చాటడం ఆ పార్టీకి ఎదురుదెబ్బగా మారింది. ఈ ఫలితాలు రాష్ట్ర రాజకీయాల్లో చర్చనీయాంశంగా మారాయి.',
    'The BJP-JDS National Democratic Alliance (NDA) secured a commanding victory across three out of four Karnataka Legislative Council seats. JDS candidate AP Ranganath defeated five-time MLC Puttanna by 908 votes in Bengaluru Teachers constituency, while BJP candidate SV Sankanur retained his West Graduates constituency. The victory is seen as a strong setback for the ruling Congress government.',
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Prashanth (DESK)', 'published', FALSE,
    2, 2, NOW() - INTERVAL '7 minutes'
),
(
    'news-2', 'ntoday-news', 'cat-crime',
    'ఉద్యోగం కోసం వెళ్లి.. ఆచూకీ లేకుండా!',
    'Youth Missing in Russia After Falling for Lucrative Overseas Job Scam',
    'రష్యాలో భారీ వేతనంతో ఉద్యోగమని చెప్పి టెలిగ్రామ్ ద్వారా యువకుడికి మోసం.',
    'Indian youth tricked by fraudulent overseas Telegram agents with false salary promises.',
    'ఛత్తీస్‌గఢ్‌లోని బిలాస్‌పూర్‌కు చెందిన 21 ఏళ్ల వినీత్ కుమార్ దూబేకు నెలకు ₹లక్ష 14 వేల శాలరీతో రెస్టారెంట్‌లో జాబ్ ఇస్తామని టెలిగ్రామ్ గ్రూప్ ద్వారా ఆఫర్ వచ్చింది. జాబ్ కోసం అతను అక్టోబర్ 1న రష్యా వెళ్లాడు. తనను జాబ్ పేరుతో మోసం చేశారని అక్టోబర్ 6న కుటుంబానికి చెప్పిన వినీత్, మరుసటి రోజు నుంచి అందుబాటులో లేదు. దీనిపై రష్యాలోని ఇండియన్ ఎంబసీని సంప్రదించినట్లు బిలాస్‌పూర్ SP రాజ్‌నేశ్ సింగ్ తెలిపారు.',
    'A 21-year-old youth from Bilaspur went missing in Russia after falling victim to a fake overseas restaurant employment racket operated through Telegram promising a monthly salary of ₹1.14 lakh. Indian diplomatic channels have been alerted to locate his whereabouts.',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Lokesh (DESK)', 'published', FALSE,
    5, 1, NOW() - INTERVAL '10 minutes'
),
(
    'news-3', 'ntoday-news', 'cat-weather',
    'తీరం దాటిన రెండో తుఫాను.. విశాఖపై తీవ్ర ప్రభావం!',
    'Cyclone Crosses Coast: High Winds and Heavy Rain Batter Coastal Andhra',
    'ఉత్తరాంధ్ర తీరంలో భారీ వర్షాలు, మత్స్యకారులను అప్రమత్తం చేసిన వాతావరణ శాఖ.',
    'Severe cyclonic storm lashes coastal districts with gale winds up to 80 kmph.',
    'అరేబియా సముద్రంలో అతి తీవ్ర తుఫానుకి దగ్గర్లోనే కదులుతున్న మరో తుఫాను ప్రభావంతో ఉత్తరాంధ్ర జిల్లాల్లో ఈదురు గాలులతో కూడిన భారీ వర్షాలు కురుస్తున్నాయి. విశాఖ, విజయనగరం, శ్రీకాకుళం తీర ప్రాంతాల్లో 70-80 కి.మీ వేగంతో గాలులు వీస్తున్నాయి. మత్స్యకారులు సముద్రంలోకి వేటకు వెళ్లవద్దని వాతావరణ శాఖ హెచ్చరించింది. తీరప్రాంత ప్రజలను సురక్షిత ప్రాంతాలకు తరలించారు.',
    'A cyclonic storm made landfall along the North Andhra coastline, bringing torrential rains and gale winds touching 70-80 km/h across Visakhapatnam, Vizianagaram, and Srikakulam. The meteorological department has advised fishermen to avoid deep sea voyages.',
    'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'NTODAY NEWS', 'Suresh (DESK)', 'published', TRUE,
    9, 1, NOW() - INTERVAL '15 minutes'
),
(
    'news-4', 'ntoday-news', 'cat-business',
    'వరుసగా 3వ రోజు పెరిగిన బంగారం ధరలు.. కొత్త రికార్డు',
    'Gold Prices Surge for 3rd Consecutive Day, Breaching Historic Highs',
    'తెలుగు రాష్ట్రాల్లో 10 గ్రాముల బంగారం ధర మరో ₹1,100 పెరిగింది.',
    'Global market cues drive domestic 24-carat gold and silver rates to record highs.',
    'తెలుగు రాష్ట్రాల్లో బంగారం ధరలు వరుసగా మూడో రోజు కూడా భారీగా పెరిగాయి. అంతర్జాతీయ మార్కెట్లో ఏర్పడిన పరిణామాలతో 24 క్యారెట్ల 10 గ్రాముల బంగారం ధర ₹1,100 పెరిగి జీవితకాల గరిష్టానికి చేరింది. పెళ్లిళ్ల సీజన్ కావడంతో కొనుగోలుదారులు ఆందోళన చెందుతున్నారు. వెండి ధర కూడా కిలోకు ₹2,000 పెరిగి రికార్డు స్థాయికి చేరింది.',
    'Gold prices across Telangana and Andhra Pradesh climbed for the third consecutive session, rising by ₹1,100 per 10 grams for 24-carat bullion to set a new lifetime high. Silver prices simultaneously surged by ₹2,000 per kilogram.',
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Ravi (SPECIAL)', 'published', FALSE,
    15, 0, NOW() - INTERVAL '25 minutes'
),
(
    'news-5', 'ntoday-news', 'cat-education',
    'టెన్త్‌లో 100% పాస్.. టీచర్లకు విద్యాశాఖ కొత్త టాస్క్!',
    'Telangana Education Department Targets 100% Pass Rate in SSC Exams',
    'వెనుకబడిన విద్యార్థుల కోసం ఉదయం, సాయంత్రం ప్రత్యేక తరగతులు నిర్వహణ.',
    'Special remediation and tracking framework deployed across all government schools.',
    'తెలంగాణ పదో తరగతి పరీక్షల్లో ఈసారి ప్రభుత్వ పాఠశాలల్లో 100 శాతం ఉత్తీర్ణత సాధించడమే లక్ష్యంగా విద్యాశాఖ ప్రత్యేక కార్యాచరణ రూపొందించింది. వెనుకబడిన విద్యార్థుల కోసం ఉదయం, సాయంత్రం వేళల్లో ప్రత్యేక తరగతులు నిర్వహించనున్నారు. ఉపాధ్యాయులకు సబ్జెక్టుల వారీగా బాధ్యతలు అప్పగించారు. ప్రతినెలా విద్యార్థుల పురోగతిని సమీక్షించనున్నారు.',
    'The Telangana Directorate of School Education has unveiled an ambitious program aiming for a 100% pass rate in the forthcoming SSC board exams across state-run schools, instituting dedicated morning and evening remediation classes for challenged students.',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Kavitha (DESK)', 'published', FALSE,
    24, 0, NOW() - INTERVAL '42 minutes'
),
(
    'news-6', 'ntoday-news', 'cat-telangana',
    'హైదరాబాద్ మెట్రో ఫేజ్-2 కు కేంద్ర ఆమోదం.. రూ. 24,000 కోట్లు',
    'Union Cabinet Approves Hyderabad Metro Phase-2 with ₹24,000 Crore Outlay',
    'శంషాబాద్ విమానాశ్రయం మరియు పాతబస్తీ మార్గాల్లో 76 కి.మీ విస్తరణ.',
    'Phase-2 expansion will connect Rajiv Gandhi Airport to Old City and Miyapur to Patancheru.',
    'హైదరాబాద్ మెట్రో రెండో దశ విస్తరణ ప్రాజెక్టుకు కేంద్ర మంత్రివర్గం గ్రీన్ సిగ్నల్ ఇచ్చింది. శంషాబాద్ విమానాశ్రయం నుండి ఓల్డ్ సిటీ, మియాపూర్ నుండి పటాన్‌చెరు మార్గాల్లో మొత్తం 76 కిలోమీటర్ల మేర కొత్త లైన్లు నిర్మించనున్నారు. ప్రాజెక్టును మూడేళ్లలో పూర్తి చేసి ప్రజలకు అందుబాటులోకి తీసుకురావాలని లక్ష్యంగా పెట్టుకున్నారు.',
    'The Union Cabinet has granted clearance for the Hyderabad Metro Rail Phase-2 expansion project budgeted at ₹24,000 crore. Spanning 76 kilometers, the corridors will directly link the Old City to Shamshabad Airport and Miyapur to Patancheru industrial corridor.',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Vamshi (INFRA)', 'published', TRUE,
    42, 0, NOW() - INTERVAL '1 hour'
),
(
    'news-7', 'ntoday-news', 'cat-cinema',
    'బాక్సాఫీస్ వద్ద సరికొత్త చరిత్ర.. మొదటి రోజే రూ. 120 కోట్లు!',
    'Pan-India Blockbuster Creates Box-Office History with ₹120 Crore Day-1 Gross',
    'తెలుగు స్టార్ హీరో చిత్రం ప్రపంచవ్యాప్తంగా రికార్డు కలెక్షన్లు సాధించింది.',
    'Sensational opening numbers recorded across India and North American premieres.',
    'భారీ అంచనాల నడుమ ప్రపంచవ్యాప్తంగా విడుదలైన తెలుగు స్టార్ హీరో పాన్ ఇండియా చిత్రం సరికొత్త బాక్సాఫీస్ రికార్డులను సృష్టించింది. ప్రపంచవ్యాప్తంగా తొలిరోజు ఏకంగా 120 కోట్ల గ్రాస్ సాధించి సినీ విశ్లేషకులను సైతం ఆశ్చర్యపరిచింది. అమెరికా ప్రీమియర్స్ లో కూడా సరికొత్త మైలురాయిని చేరుకుంది. థియేటర్ల వద్ద అభిమానుల సందడి అంబరాన్నంటింది.',
    'The newly released Telugu pan-India action spectacle rewrote box-office records on its premiere day, crossing ₹120 crore gross globally. Exceptional collections were reported across domestic multiplexes and overseas North American theater chains.',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Charan (CINEMA)', 'published', FALSE,
    68, 0, NOW() - INTERVAL '80 minutes'
),
(
    'news-8', 'ntoday-news', 'cat-sports',
    'టీమిండియా యువ సంచలనం విధ్వంసకర సెంచరీ.. సిరీస్ సొంతం',
    'Young Sensation Hits 64-Ball Century as India Clinches ODI Series',
    'ఆస్ట్రేలియాతో జరిగిన నిర్ణయాత్మక మ్యాచ్‌లో 8 సిక్సర్లతో చెలరేగిన యువ ఓపెనర్.',
    'Explosive batting performance seals 2-1 bilateral trophy victory.',
    'ఆస్ట్రేలియాతో జరిగిన నిర్ణయాత్మక వన్డే మ్యాచ్‌లో భారత యువ ఓపెనర్ కేవలం 64 బంతుల్లోనే మెరుపు సెంచరీ నమోదు చేసి జట్టుకు అద్భుత విజయాన్ని అందించాడు. 8 సిక్సర్లు, 10 ఫోర్లతో చెలరేగిన అతను అంతర్జాతీయ స్థాయిలో అనేక రికార్డులను సమం చేశాడు. ఈ విజయంతో భారత జట్టు 2-1 తేడాతో ట్రోఫీని కైవసం చేసుకుంది.',
    'India triumphed in the deciding ODI against Australia, riding on an explosive 64-ball century from its young opener. Smashing 8 sixes and 10 boundaries, his whirlwind innings sealed a 2-1 series victory for Team India.',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Ajay (SPORTS)', 'published', FALSE,
    51, 0, NOW() - INTERVAL '2 hours'
),
(
    'news-9', 'ntoday-news', 'cat-agriculture',
    'రైతులకు ఉచిత విద్యుత్, సబ్సిడీ ఎరువుల పంపిణీ షురూ',
    'Government Disburses Direct Fertilizer Subsidies and 24x7 Free Farm Power',
    'రైతు భరోసా కేంద్రాల ద్వారా పారదర్శకంగా ఎరువులు, విద్యుత్ సరఫరా ప్రారంభం.',
    'Direct benefit transfer initiated to safeguard farmer interests this sowing season.',
    'రాష్ట్రవ్యాప్తంగా అన్నదాతలకు సాగునీటి సరఫరా మరియు నాణ్యమైన 24 గంటల ఉచిత విద్యుత్ అందించేందుకు ప్రభుత్వం ప్రత్యేక నిధులు విడుదల చేసింది. రైతు భరోసా కేంద్రాల ద్వారా డీఏపీ, యూరియా సబ్సిడీతో నేరుగా రైతుల ఖాతాలకే జమ కానున్నాయి. మధ్యవర్తుల ప్రమేయం లేకుండా పారదర్శకంగా పంపిణీ చేయాలని ముఖ్యమంత్రి అధికారులను ఆదేశించారు.',
    'State authorities launched uninterrupted 24-hour agricultural power supply and initiated direct subsidy disbursements for DAP and Urea fertilizers through Rythu Bharosa Kendras, directly benefiting thousands of farming families.',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Satyanarayana (KRISHI)', 'published', FALSE,
    33, 0, NOW() - INTERVAL '150 minutes'
),
(
    'news-10', 'ntoday-news', 'cat-tech',
    'ఇస్రో మరో సంచలనం.. కొత్త తరం కమ్యూనికేషన్ ఉపగ్రహం విజయవంతం',
    'ISRO Achieves Precision Orbit with Next-Gen High-Throughput Satellite',
    'శ్రీహరికోట నుంచి నింగిలోకి సరికొత్త జీశాట్ ఉపగ్రహం, డిజిటల్ కనెక్టివిటీకి ఊతం.',
    'Satellite launch from Sriharikota set to supercharge broadband connectivity across remote villages.',
    'భారత అంతరిక్ష పరిశోధనా సంస్థ (ఇస్రో) శ్రీహరికోట సతీష్ ధావన్ స్పేస్ సెంటర్ నుంచి ప్రయోగించిన సరికొత్త జీశాట్ ఉపగ్రహం విజయవంతంగా నిర్దేశిత కక్ష్యలోకి ప్రవేశించింది. దేశవ్యాప్తంగా హై-స్పీడ్ ఇంటర్నెట్ మరియు సుదూర గ్రామీణ ప్రాంతాలకు డిజిటల్ కనెక్టివిటీ అందించడంలో ఈ ఉపగ్రహం కీలకంగా మారనుంది.',
    'The Indian Space Research Organisation (ISRO) successfully placed its advanced GSAT telecommunications satellite into geostationary transfer orbit from Sriharikota. The mission promises to expand broadband connectivity into isolated rural regions.',
    'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'NTODAY NEWS', 'Srinivas (SCIENCE)', 'published', FALSE,
    77, 0, NOW() - INTERVAL '3 hours'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Initial Seed Comments
INSERT INTO public.comments (id, article_id, user_name, content, likes_count, status, created_at)
VALUES
    ('c-1', 'news-1', 'రామారావు', 'కూటమికి మంచి విజయం దక్కింది. ప్రభుత్వ వ్యతిరేకత స్పష్టంగా కనిపిస్తోంది.', 4, 'approved', NOW() - INTERVAL '5 minutes'),
    ('c-2', 'news-1', 'శేఖర్ రెడ్డి', 'ఉపాధ్యాయుల సమస్యలపై దృష్టి పెట్టాలని ఆశిస్తున్నాం.', 1, 'approved', NOW() - INTERVAL '2 minutes'),
    ('c-3', 'news-2', 'వినోద్', 'ఇలాంటి ఫేక్ విదేశీ జాబ్ స్కామ్‌లపై యువత అప్రమత్తంగా ఉండాలి.', 3, 'approved', NOW() - INTERVAL '6 minutes'),
    ('c-4', 'news-3', 'ఆనంద్ విశాఖ', 'మా ఏరియాలో కరెంట్ పోయింది, గాలులు చాలా తీవ్రంగా ఉన్నాయి.', 5, 'approved', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;
