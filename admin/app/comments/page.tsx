'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import { Comment } from '@/lib/types';

export default function CommentsModerationPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!isConfigured || !supabase) {
      setComments([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          article_id,
          user_name,
          content,
          likes_count,
          status,
          created_at,
          articles (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) {
        setComments([]);
      } else {
        setComments(data as unknown as Comment[]);
      }
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const updateStatus = async (id: string, nextStatus: 'approved' | 'rejected') => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );

    if (isConfigured && supabase) {
      await supabase
        .from('comments')
        .update({ status: nextStatus })
        .eq('id', id);
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setComments((prev) => prev.filter((c) => c.id !== id));

    if (isConfigured && supabase) {
      await supabase.from('comments').delete().eq('id', id);
    }
  };

  const filtered = comments.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Comments Moderation</h1>
        <p style={{ color: '#71717a', fontSize: 13, marginTop: 4 }}>
          Review, approve, flag, or remove reader remarks across all published news stories.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'approved', 'pending', 'rejected'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid #27272a',
              backgroundColor: filter === st ? '#ffffff' : '#141417',
              color: filter === st ? '#000000' : '#a1a1aa',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
            {st} ({comments.filter((c) => (st === 'all' ? true : c.status === st)).length})
          </button>
        ))}
      </div>

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: '#71717a' }}>
            No comments found in this queue.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="card" style={{ padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#f4f4f5' }}>
                    {item.user_name}
                  </span>
                  <span
                    className={`badge ${
                      item.status === 'approved'
                        ? 'badge-published'
                        : item.status === 'rejected'
                        ? 'badge-breaking'
                        : 'badge-draft'
                    }`}>
                    {item.status}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#71717a' }}>
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>

              {/* Story Context */}
              {item.articles?.title && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#e50914',
                    fontWeight: 700,
                    marginBottom: 8,
                  }}>
                  📰 On Story: {item.articles.title}
                </div>
              )}

              {/* Comment Content */}
              <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.5, marginBottom: 14 }}>
                {item.content}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {item.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(item.id, 'approved')}
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                    ✓ Approve
                  </button>
                )}

                {item.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(item.id, 'rejected')}
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                    ✕ Reject / Flag
                  </button>
                )}

                <button
                  onClick={() => deleteComment(item.id)}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
