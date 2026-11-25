-- ==============================================================================
-- PHASE 1 SECURITY MIGRATION: Editors Table, Strict RLS, Comment Rate Limits
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

-- 1. Create the `editors` table to store whitelisted editorial staff
CREATE TABLE IF NOT EXISTS public.editors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    channel_id TEXT NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rapid editor lookup
CREATE INDEX IF NOT EXISTS idx_editors_lookup ON public.editors (id, is_active);

-- 2. Helper function to check if the current authenticated user is an active editor
CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.editors
        WHERE id = auth.uid()
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Secure public.articles RLS (Strict Editor-Only Mutations)
-- Remove any legacy broad authenticated policy
DROP POLICY IF EXISTS "Authenticated editors can do anything with articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can read published articles" ON public.articles;
DROP POLICY IF EXISTS "Editors can view all articles" ON public.articles;
DROP POLICY IF EXISTS "Editors can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Editors can update articles" ON public.articles;
DROP POLICY IF EXISTS "Editors can delete articles" ON public.articles;

-- Public / Anonymous can ONLY read published articles
CREATE POLICY "Anyone can read published articles"
    ON public.articles FOR SELECT
    USING (status = 'published');

-- Active Editors can view all articles (including drafts & archived)
CREATE POLICY "Editors can view all articles"
    ON public.articles FOR SELECT
    TO authenticated
    USING (public.is_editor());

-- Only Active Editors can create new articles (Anonymous blocked!)
CREATE POLICY "Editors can insert articles"
    ON public.articles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_editor());

-- Only Active Editors can update existing articles (Anonymous blocked!)
CREATE POLICY "Editors can update articles"
    ON public.articles FOR UPDATE
    TO authenticated
    USING (public.is_editor())
    WITH CHECK (public.is_editor());

-- Only Active Editors can delete articles (Anonymous blocked!)
CREATE POLICY "Editors can delete articles"
    ON public.articles FOR DELETE
    TO authenticated
    USING (public.is_editor());

-- 4. Comment Length Limit and Rate Limiting
-- A. Enforce 1-500 character comment length constraint
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS chk_comment_length;

ALTER TABLE public.comments
ADD CONSTRAINT chk_comment_length CHECK (char_length(content) >= 1 AND char_length(content) <= 500);

-- B. Rate Limiting: Max 3 comments per 60 seconds per user
CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_count
    FROM public.comments
    WHERE user_name = NEW.user_name
      AND created_at > (NOW() - INTERVAL '60 seconds');

    IF recent_count >= 3 THEN
        RAISE EXCEPTION 'Comment rate limit exceeded: Please wait 60 seconds before posting again.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_rate_limit ON public.comments;
CREATE TRIGGER trg_comment_rate_limit
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.check_comment_rate_limit();

-- C. Strict Comment Moderation RLS (Only Active Editors can update/delete comments)
DROP POLICY IF EXISTS "Authenticated editors can moderate comments" ON public.comments;
DROP POLICY IF EXISTS "Editors can moderate comments" ON public.comments;

CREATE POLICY "Editors can moderate comments"
    ON public.comments FOR ALL
    TO authenticated
    USING (public.is_editor())
    WITH CHECK (public.is_editor());

-- 5. Enable RLS on editors table
ALTER TABLE public.editors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated editors can read editors" ON public.editors;
CREATE POLICY "Authenticated editors can read editors"
    ON public.editors FOR SELECT
    TO authenticated
    USING (public.is_editor() OR id = auth.uid());

-- 6. Storage Security: Restrict Article Image uploads to active editors
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Editors can upload article images" ON storage.objects;

CREATE POLICY "Editors can upload article images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'article-images' AND public.is_editor());

DROP POLICY IF EXISTS "Authenticated users can update/delete article images" ON storage.objects;
DROP POLICY IF EXISTS "Editors can update/delete article images" ON storage.objects;

CREATE POLICY "Editors can update/delete article images"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'article-images' AND public.is_editor());
