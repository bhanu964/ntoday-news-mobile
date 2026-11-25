'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!isConfigured || !supabase) {
      setErrorMsg('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in admin/.env.local.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMsg('Authentication failed. No user record returned.');
        setLoading(false);
        return;
      }

      // Verify the user is registered in the editors table
      const { data: editorData, error: editorError } = await supabase
        .from('editors')
        .select('*')
        .eq('id', data.user.id)
        .eq('is_active', true)
        .single();

      if (editorError || !editorData) {
        await supabase.auth.signOut();
        setErrorMsg('Access Denied: Your account is authenticated, but is not registered as an active editor in the database.');
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#141417',
          padding: 32,
        }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              backgroundColor: '#e50914',
              color: '#ffffff',
              display: 'inline-block',
              fontWeight: 900,
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 16,
              marginBottom: 12,
            }}>
            NTODAY NEWS
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f4f4f5' }}>
            Editor & Reporter Login
          </h1>
          <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
            Sign in to publish breaking stories and moderate reader feedback.
          </p>
        </div>

        {errorMsg ? (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.4,
            }}>
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: '#a1a1aa',
                marginBottom: 6,
              }}>
              Editor Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@ntodaynews.com"
              style={{
                width: '100%',
                backgroundColor: '#1c1c20',
                border: '1px solid #27272a',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: '#a1a1aa',
                marginBottom: 6,
              }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                backgroundColor: '#1c1c20',
                border: '1px solid #27272a',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '12px', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In as Editor'}
          </button>
        </form>
      </div>
    </div>
  );
}
