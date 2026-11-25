-- ==============================================================================
-- MIGRATION: Add Automated News Ingest Support & Import Logs Table
-- Run this in the Supabase SQL Editor
-- ==============================================================================

-- 1. Add ingest metadata columns to public.articles
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_name TEXT DEFAULT 'NTODAY NEWS',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS import_status TEXT DEFAULT 'none' 
    CHECK (import_status IN ('none', 'imported', 'manual', 'rejected'));

-- 2. Enforce unique source_url per channel to prevent duplicate imports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_articles_channel_source_url'
    ) THEN
        ALTER TABLE public.articles
        ADD CONSTRAINT uq_articles_channel_source_url UNIQUE (channel_id, source_url);
    END IF;
END $$;

-- 3. Create index on source_url and external_id for rapid lookups
CREATE INDEX IF NOT EXISTS idx_articles_source_url ON public.articles (channel_id, source_url);
CREATE INDEX IF NOT EXISTS idx_articles_external_id ON public.articles (channel_id, external_id);
CREATE INDEX IF NOT EXISTS idx_articles_import_status ON public.articles (import_status);

-- 4. Create import_logs table to audit automated ingestion runs
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    run_time TIMESTAMPTZ DEFAULT NOW(),
    fetched INT DEFAULT 0,
    inserted INT DEFAULT 0,
    skipped INT DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering and filtering recent ingest runs
CREATE INDEX IF NOT EXISTS idx_import_logs_channel_time ON public.import_logs (channel_id, run_time DESC);

-- 5. Enable Row Level Security (RLS) on import_logs
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated editors/admins can view import logs
CREATE POLICY "Authenticated editors can read import logs"
    ON public.import_logs FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Service role has full permissions for automated ingestion script
CREATE POLICY "Service role can manage import logs"
    ON public.import_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
