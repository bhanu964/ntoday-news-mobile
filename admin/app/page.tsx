'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase, isConfigured, CHANNEL_ID } from '@/lib/supabase';
import { Article } from '@/lib/types';

export default function ArticlesDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'imported' | 'breaking'>('all');

  const loadArticles = useCallback(async () => {
    setLoading(true);
    if (!isConfigured || !supabase) {
      setArticles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('channel_id', CHANNEL_ID)
        .order('published_at', { ascending: false });

      if (error || !data) {
        setArticles([]);
      } else {
        setArticles(data as Article[]);
      }
    } catch {
      setArticles([]);
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

  const publishArticle = async (id: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'published' } : a))
    );

    if (isConfigured && supabase) {
      await supabase
        .from('articles')
        .update({ status: 'published' })
        .eq('id', id);
    }
  };

  const rejectArticle = async (id: string) => {
    if (!confirm('Reject and delete this imported story?')) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));

    if (isConfigured && supabase) {
      await supabase.from('articles').delete().eq('id', id);
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
    if (filterStatus === 'imported') {
      const isImported = a.import_status === 'imported' || (a.status === 'draft' && !!a.source_url);
      if (!isImported) return false;
    }
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Stories' },
          { id: 'published', label: 'Published' },
          { id: 'draft', label: 'Drafts' },
          { id: 'imported', label: 'Imported / Draft' },
          { id: 'breaking', label: 'Breaking' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid #27272a',
              backgroundColor: filterStatus === tab.id ? '#ffffff' : '#141417',
              color: filterStatus === tab.id ? '#000000' : '#a1a1aa',
              cursor: 'pointer',
            }}>
            {tab.label}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      {item.is_breaking && <span className="badge badge-breaking">BREAKING</span>}
                      {item.import_status === 'imported' && (
                        <span className="badge" style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}>
                          IMPORTED
                        </span>
                      )}
                      {item.video_url && (
                        <span className="badge" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                          VIDEO
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#71717a' }}>{item.author}</span>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none' }}>
                          ↗ Source
                        </a>
                      )}
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
                    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      {item.status === 'draft' && (
                        <button
                          onClick={() => publishArticle(item.id)}
                          style={{
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                          Publish
                        </button>
                      )}
                      {item.import_status === 'imported' && (
                        <button
                          onClick={() => rejectArticle(item.id)}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                          Reject
                        </button>
                      )}
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
