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
      // Mock article for offline preview
      setArticle({
        id,
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
      });
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
