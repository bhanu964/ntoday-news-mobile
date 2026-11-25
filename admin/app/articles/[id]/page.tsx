'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ArticleForm from '../ArticleForm';
import { supabase, isConfigured } from '@/lib/supabase';
import { Article } from '@/lib/types';

export default function EditArticlePage() {
  const params = useParams();
  const id = params?.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    if (!isConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
      .then((res: { data: any }) => {
        if (res.data) {
          setArticle(res.data as Article);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0', color: '#71717a' }}>
        Loading article details...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>
        Story not found.
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Edit Story</h1>
        <p style={{ color: '#71717a', fontSize: 13, marginTop: 4 }}>
          Editing story ID: <code>{article.id}</code>
        </p>
      </div>

      <ArticleForm initialData={article} isEdit={true} />
    </div>
  );
}
