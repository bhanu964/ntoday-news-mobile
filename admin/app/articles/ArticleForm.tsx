'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isConfigured, CHANNEL_ID } from '@/lib/supabase';
import { Article } from '@/lib/types';

interface ArticleFormProps {
  initialData?: Partial<Article>;
  isEdit?: boolean;
}

const CATEGORIES = [
  { id: 'cat-politics', label: 'రాజకీయాలు (Politics)' },
  { id: 'cat-crime', label: 'క్రైమ్ (Crime)' },
  { id: 'cat-weather', label: 'వాతావరణం (Weather)' },
  { id: 'cat-business', label: 'బిజినెస్ (Business)' },
  { id: 'cat-education', label: 'విద్య & ఉద్యోగాలు (Education/Jobs)' },
  { id: 'cat-telangana', label: 'తెలంగాణ (Telangana)' },
  { id: 'cat-cinema', label: 'సినిమా (Cinema)' },
  { id: 'cat-sports', label: 'క్రీడలు (Sports)' },
  { id: 'cat-agriculture', label: 'వ్యవసాయం (Agriculture)' },
  { id: 'cat-tech', label: 'టెక్నాలజీ (Tech/ISRO)' },
  { id: 'cat-andhra', label: 'ఆంధ్రప్రదేశ్ (Andhra Pradesh)' },
];

// Trim text to the nearest full sentence under limit for imported/auto-filled card summaries
function trimToSentenceUnderLimit(text: string, maxChars: number = 380): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars);
  const lastEnd = Math.max(
    sliced.lastIndexOf('.'),
    sliced.lastIndexOf('!'),
    sliced.lastIndexOf('?'),
    sliced.lastIndexOf('\n'),
    sliced.lastIndexOf('।')
  );
  if (lastEnd > 80) {
    return sliced.slice(0, lastEnd + 1).trim();
  }
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trim() + '...';
}

export default function ArticleForm({ initialData = {}, isEdit = false }: ArticleFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData.title || '');
  const [titleEn, setTitleEn] = useState(initialData.title_en || '');
  const [summary, setSummary] = useState(initialData.summary || '');
  const [summaryEn, setSummaryEn] = useState(initialData.summary_en || '');
  const [content, setContent] = useState(initialData.content || '');
  const [contentEn, setContentEn] = useState(initialData.content_en || '');
  const [categoryId, setCategoryId] = useState(initialData.category_id || 'cat-politics');
  const [imageUrl, setImageUrl] = useState(initialData.image_url || '');
  const [videoUrl, setVideoUrl] = useState(initialData.video_url || '');
  const [author, setAuthor] = useState(initialData.author || 'Desk Reporter');
  const [source, setSource] = useState(initialData.source || 'NTODAY NEWS');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(initialData.status || 'published');
  const [isBreaking, setIsBreaking] = useState(Boolean(initialData.is_breaking));

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle uploading image file to Supabase Storage bucket 'article-images'
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isConfigured || !supabase) {
      alert('Supabase keys not configured. Please paste a direct image URL instead.');
      return;
    }

    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filePath = `news/${fileName}`;

      const { data, error } = await supabase.storage
        .from('article-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Retrieve public URL
      const { data: urlData } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setImageUrl(urlData.publicUrl);
      }
    } catch (err: any) {
      alert(`Image upload error: ${err?.message || 'Failed to upload'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !content.trim()) {
      setErrorMsg('Headline and Story Content in Telugu are mandatory.');
      return;
    }

    if (!imageUrl.trim()) {
      setErrorMsg('Please upload an image or provide a valid image URL.');
      return;
    }

    setSaving(true);

    const payload = {
      channel_id: CHANNEL_ID,
      category_id: categoryId,
      title: title.trim(),
      title_en: titleEn.trim() || null,
      summary: summary.trim() ? summary.trim() : (content.trim() ? trimToSentenceUnderLimit(content.trim(), 380) : null),
      summary_en: summaryEn.trim() ? summaryEn.trim() : (contentEn.trim() ? trimToSentenceUnderLimit(contentEn.trim(), 380) : null),
      content: content.trim(),
      content_en: contentEn.trim() || null,
      image_url: imageUrl.trim(),
      video_url: videoUrl.trim() || null,
      source: source.trim() || 'NTODAY NEWS',
      author: author.trim() || 'Desk Reporter',
      status,
      is_breaking: isBreaking,
      published_at: initialData.published_at || new Date().toISOString(),
    };

    if (isConfigured && supabase) {
      try {
        if (isEdit && initialData.id) {
          const { error } = await supabase
            .from('articles')
            .update(payload)
            .eq('id', initialData.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('articles')
            .insert(payload);

          if (error) throw error;
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to save to database');
        setSaving(false);
        return;
      }
    } else {
      console.log('[Demo Mode] Saved article payload:', payload);
    }

    setSaving(false);
    router.push('/');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 840, margin: '0 auto' }}>
      {errorMsg ? (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            fontSize: 14,
          }}>
          {errorMsg}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column: Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Telugu & English Headline */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 800 }}>
                Headline (తెలుగు శీర్షిక) *
              </label>
              <span style={{ fontSize: 12, fontWeight: 600, color: title.length > 80 ? '#f59e0b' : '#a1a1aa' }}>
                {title.length}/80 chars
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ఉదా: హైదరాబాద్ మెట్రో ఫేజ్-2 కు కేంద్ర ఆమోదం"
              style={{
                width: '100%',
                backgroundColor: '#121214',
                border: title.length > 80 ? '1px solid #f59e0b' : '1px solid #27272a',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                outline: 'none',
              }}
            />
            {title.length > 80 && (
              <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, marginBottom: 0 }}>
                ⚠️ Headline exceeds recommended 80 chars ({title.length}/80) — may wrap beyond 2 lines on small cards.
              </p>
            )}

            {/* English Headline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa' }}>
                Headline (English Translation - Optional)
              </label>
              <span style={{ fontSize: 12, fontWeight: 600, color: titleEn.length > 80 ? '#f59e0b' : '#71717a' }}>
                {titleEn.length}/80 chars
              </span>
            </div>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Centre Approves ₹24,000 Cr Hyderabad Metro Phase-2"
              style={{
                width: '100%',
                backgroundColor: '#121214',
                border: titleEn.length > 80 ? '1px solid #f59e0b' : '1px solid #27272a',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
            {titleEn.length > 80 && (
              <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, marginBottom: 0 }}>
                ⚠️ English headline exceeds recommended 80 chars ({titleEn.length}/80).
              </p>
            )}
          </div>

          {/* Card Body / Summary Field (Soft limit: 380 chars, ~10 lines) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 800 }}>
                Card Body / Summary (కార్డు సారాంశం - 1-Swipe Feed)
              </label>
              <span style={{ fontSize: 12, fontWeight: 600, color: summary.length > 380 ? '#f59e0b' : '#a1a1aa' }}>
                {summary.length}/380 chars (about {Math.max(1, Math.ceil(summary.length / 38))} lines)
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>
              This text appears on the news card. Keep it within 10 lines.
            </p>
            <textarea
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="కార్డుపై కనిపించే సంక్షిప్త వార్తను ఇక్కడ నమోదు చేయండి (సుమారు 10 లైన్లు / 380 అక్షరాలు)..."
              style={{
                width: '100%',
                backgroundColor: '#121214',
                border: summary.length > 380 ? '1px solid #f59e0b' : '1px solid #27272a',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
                outline: 'none',
              }}
            />
            {summary.length > 380 && (
              <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, marginBottom: 0 }}>
                ⚠️ Summary exceeds recommended 380 chars ({summary.length}/380, about {Math.ceil(summary.length / 38)} lines) — text beyond 10 lines will show an ellipsis (...).
              </p>
            )}

            {/* English Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa' }}>
                English Card Summary (Optional)
              </label>
              <span style={{ fontSize: 12, fontWeight: 600, color: summaryEn.length > 380 ? '#f59e0b' : '#71717a' }}>
                {summaryEn.length}/380 chars (about {Math.max(1, Math.ceil(summaryEn.length / 38))} lines)
              </span>
            </div>
            <textarea
              rows={4}
              value={summaryEn}
              onChange={(e) => setSummaryEn(e.target.value)}
              placeholder="English summary for the card feed (approx 10 lines)..."
              style={{
                width: '100%',
                backgroundColor: '#121214',
                border: summaryEn.length > 380 ? '1px solid #f59e0b' : '1px solid #27272a',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
                outline: 'none',
              }}
            />
            {summaryEn.length > 380 && (
              <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, marginBottom: 0 }}>
                ⚠️ English summary exceeds recommended 380 chars ({summaryEn.length}/380).
              </p>
            )}
          </div>

          {/* Full Story Content */}
          <div className="card">
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
              Full Story Content (పూర్తి వార్తా కథనం - 'Read More' తెరపై) *
            </label>
            <p style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>
              Full detailed report displayed when readers tap 'Read more...'.
            </p>
            <textarea
              required
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="పూర్తి వార్తా వివరాలను ఇక్కడ నమోదు చేయండి..."
              style={{
                width: '100%',
                backgroundColor: '#121214',
                border: '1px solid #27272a',
                color: '#ffffff',
                padding: '12px 14px',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
                outline: 'none',
              }}
            />

            {/* English Content */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginTop: 14, marginBottom: 6, color: '#a1a1aa' }}>
              Full English Content (Optional)
            </label>
            <textarea
              rows={5}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              placeholder="Enter full English story details..."
              style={{
                width: '100%',
                backgroundColor: '#121214',
                border: '1px solid #27272a',
                color: '#ffffff',
                padding: '12px 14px',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Right Column: Metadata & Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Publishing Controls */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Publishing Settings</h3>

            {/* Status */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 6 }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                style={{
                  width: '100%',
                  backgroundColor: '#121214',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                }}>
                <option value="published">Published</option>
                <option value="draft">Draft (Saved)</option>
              </select>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 6 }}>
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#121214',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                }}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Breaking News Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 10 }}>
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#e50914' }}
              />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f4f4f5' }}>
                🚨 Mark as Breaking News
              </span>
            </label>
          </div>

          {/* Media & Image Upload */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Story Media</h3>

            {/* Live Image Preview */}
            {imageUrl ? (
              <div
                style={{
                  width: '100%',
                  height: 150,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: '#121214',
                  marginBottom: 12,
                  position: 'relative',
                }}>
                <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : null}

            {/* File Upload to Supabase Storage */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 6 }}>
                Upload Image to Storage Bucket
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{ fontSize: 12, color: '#a1a1aa' }}
              />
              {uploadingImage && <p style={{ fontSize: 11, color: '#e50914', marginTop: 4 }}>Uploading to Supabase...</p>}
            </div>

            {/* Or Direct Image URL */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 4 }}>
                Or Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                style={{
                  width: '100%',
                  backgroundColor: '#121214',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            {/* Optional Video URL */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 4 }}>
                Video URL (Optional .mp4 stream)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://.../video.mp4"
                style={{
                  width: '100%',
                  backgroundColor: '#121214',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Author attribution */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Attribution</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 4 }}>
                Reporter Name & Desk
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Prashanth (DESK)"
                style={{
                  width: '100%',
                  backgroundColor: '#121214',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 4 }}>
                Source Credit
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="NTODAY NEWS"
                style={{
                  width: '100%',
                  backgroundColor: '#121214',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
              {saving ? 'Saving...' : isEdit ? 'Update Story' : 'Publish Story'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary"
              style={{ padding: '12px 18px' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
