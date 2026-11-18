'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase, isConfigured, CHANNEL_ID } from '@/lib/supabase';
import { Article } from '@/lib/types';

// Fallback seed data if running prior to Supabase connection
const FALLBACK_ARTICLES: Article[] = [
  {
    id: 'news-1',
    channel_id: 'ntoday-news',
    category_id: 'cat-politics',
    title: 'కర్ణాటక MLC ఎన్నికల్లో NDA గెలుపు',
    title_en: 'NDA Wins 3 of 4 Seats in Karnataka Legislative Council By-polls',
    summary: 'కర్ణాటక శాసనమండలి ఎన్నికల్లో BJP-JDS కూటమి ఘన విజయం సాధించింది.',
    summary_en: 'BJP-JDS alliance records massive victory in Karnataka MLC teacher & graduate seats.',
    content: 'కర్ణాటక శాసనమండలిలోని నాలుగు ఉపాధ్యాయ పట్టభద్రుల స్థానాల్లో BJP-JDS కూటమి గెలిచింది...',
    content_en: 'The BJP-JDS National Democratic Alliance secured a commanding victory...',
    image_url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80',
    video_url: null,
    source: 'NTODAY NEWS',
    author: 'Prashanth (DESK)',
    status: 'published',
    is_breaking: false,
    like_count: 2,
    comment_count: 2,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'news-3',
    channel_id: 'ntoday-news',
    category_id: 'cat-weather',
    title: 'తీరం దాటిన రెండో తుఫాను.. విశాఖపై తీవ్ర ప్రభావం!',
    title_en: 'Cyclone Crosses Coast: High Winds and Heavy Rain Batter Coastal Andhra',
    summary: 'ఉత్తరాంధ్ర తీరంలో భారీ వర్షాలు, మత్స్యకారులను అప్రమత్తం చేసిన వాతావరణ శాఖ.',
    summary_en: 'Severe cyclonic storm lashes coastal districts with gale winds up to 80 kmph.',
    content: 'అరేబియా సముద్రంలో అతి తీవ్ర తుఫానుకి దగ్గర్లోనే కదులుతున్న మరో తుఫాను ప్రభావంతో...',
    content_en: 'A cyclonic storm made landfall along the North Andhra coastline...',
    image_url: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=600&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    source: 'NTODAY NEWS',
    author: 'Suresh (DESK)',
    status: 'published',
    is_breaking: true,
    like_count: 9,
    comment_count: 1,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

export default function ArticlesDashboard() {
  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'breaking'>('all');

  const loadArticles = useCallback(async () => {
    setLoading(true);
    if (!isConfigured || !supabase) {
      setArticles(FALLBACK_ARTICLES);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('channel_id', CHANNEL_ID)
        .order('published_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setArticles(FALLBACK_ARTICLES);
      } else {
        setArticles(data as Article[]);
      }
    } catch {
      setArticles(FALLBACK_ARTICLES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const togglePublishStatus = async (article: Article) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, status: nextStatus } : a))
    );

    if (isConfigured && supabase) {
      await supabase
        .from('articles')
        .update({ status: nextStatus })
        .eq('id', article.id);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    setArticles((prev) => prev.filter((a) => a.id !== id));

    if (isConfigured && supabase) {
      await supabase.from('articles').delete().eq('id', id);
    }
  };

  const filtered = articles.filter((a) => {
    if (filterStatus === 'published' && a.status !== 'published') return false;
    if (filterStatus === 'draft' && a.status !== 'draft') return false;
    if (filterStatus === 'breaking' && !a.is_breaking) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        (a.title_en && a.title_en.toLowerCase().includes(q)) ||
        (a.author && a.author.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="container">
      {/* Supabase Notice Banner if not configured */}
      {!isConfigured && (
        <div
          style={{
            backgroundColor: '#1c1c20',
            border: '1px solid #e50914',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <div>
            <strong style={{ color: '#ffffff' }}>Notice: Supabase keys not set in .env.local</strong>
            <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 2 }}>
              Currently demonstrating using local preview data. Paste your Supabase project keys in{' '}
              <code>admin/.env.local</code> to sync live with your database.
            </p>
          </div>
          <span className="badge badge-breaking">DEMO MODE</span>
        </div>
      )}

      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>Stories & Bulletins</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>
            {articles.length} stories found for channel <strong>{CHANNEL_ID}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search headline or reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: '#141417',
              border: '1px solid #27272a',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              width: 240,
              outline: 'none',
            }}
          />
          <Link href="/articles/new" className="btn-primary">
            + Create New Story
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'published', 'draft', 'breaking'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid #27272a',
              backgroundColor: filterStatus === st ? '#ffffff' : '#141417',
              color: filterStatus === st ? '#000000' : '#a1a1aa',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
            {st}
          </button>
        ))}
      </div>

      {/* Stories Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#141417', borderBottom: '1px solid #27272a' }}>
              <th style={{ padding: '12px 16px', fontSize: 12, color: '#71717a' }}>MEDIA</th>
              <th style={{ padding: '12px 16px', fontSize: 12, color: '#71717a' }}>HEADLINE</th>
              <th style={{ padding: '12px 16px', fontSize: 12, color: '#71717a' }}>CATEGORY</th>
              <th style={{ padding: '12px 16px', fontSize: 12, color: '#71717a' }}>STATUS</th>
              <th style={{ padding: '12px 16px', fontSize: 12, color: '#71717a' }}>ENGAGEMENT</th>
              <th style={{ padding: '12px 16px', fontSize: 12, color: '#71717a', textAlign: 'right' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#71717a' }}>
                  No stories found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #222226',
                    transition: 'background-color 0.1s',
                  }}>
                  {/* Media Thumbnail */}
                  <td style={{ padding: '12px 16px', width: 70 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        overflow: 'hidden',
                        backgroundColor: '#27272a',
                      }}>
                      <img
                        src={item.image_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </td>

                  {/* Headline */}
                  <td style={{ padding: '12px 16px', maxWidth: 380 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {item.is_breaking && <span className="badge badge-breaking">BREAKING</span>}
                      {item.video_url && (
                        <span className="badge" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                          VIDEO
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#71717a' }}>{item.author}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#ffffff' }}>{item.title}</div>
                    {item.title_en && (
                      <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{item.title_en}</div>
                    )}
                  </td>

                  {/* Category */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#d4d4d8' }}>
                    {item.category_id.replace('cat-', '')}
                  </td>

                  {/* Status Toggle */}
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => togglePublishStatus(item)}
                      className={`badge ${
                        item.status === 'published' ? 'badge-published' : 'badge-draft'
                      }`}
                      style={{ border: 'none', cursor: 'pointer' }}>
                      {item.status}
                    </button>
                  </td>

                  {/* Engagement */}
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#a1a1aa' }}>
                    <div>👍 {item.like_count} likes</div>
                    <div style={{ marginTop: 2 }}>💬 {item.comment_count} comments</div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <Link
                        href={`/articles/${item.id}`}
                        style={{
                          backgroundColor: '#27272a',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteArticle(item.id)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
