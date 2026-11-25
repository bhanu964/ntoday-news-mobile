'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isConfigured } from '@/lib/supabase';
import { Editor } from '@/lib/types';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [unauthorizedError, setUnauthorizedError] = useState<string | null>(null);

  useEffect(() => {
    // Login page does not require auth guard
    if (pathname === '/login') {
      setChecking(false);
      return;
    }

    const client = supabase;
    if (!isConfigured || !client) {
      setChecking(false);
      setUnauthorizedError(
        'Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in admin/.env.local to access the editorial portal.'
      );
      return;
    }

    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession();

        if (sessionError || !session?.user) {
          router.replace('/login');
          return;
        }

        // Verify active editor status in the editors table
        const { data: editorData, error: editorError } = await client
          .from('editors')
          .select('*')
          .eq('id', session.user.id)
          .eq('is_active', true)
          .single();

        if (editorError || !editorData) {
          setUnauthorizedError(
            `Access Denied: Account (${session.user.email}) is authenticated, but is not listed as an active editor in the 'editors' table. Only registered editors can access editorial tools.`
          );
        }
      } catch {
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();

    // Subscribe to auth state changes (e.g. sign out in another tab)
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a1a1aa',
          gap: 12,
        }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #27272a',
            borderTopColor: '#e50914',
            borderRadius: '50%',
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Verifying editorial credentials...</span>
      </div>
    );
  }

  if (unauthorizedError) {
    return (
      <div
        style={{
          maxWidth: 540,
          margin: '80px auto',
          padding: 32,
          backgroundColor: '#18181b',
          border: '1px solid #ef4444',
          borderRadius: 12,
          textAlign: 'center',
        }}>
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            width: 52,
            height: 52,
            borderRadius: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            margin: '0 auto 16px',
          }}>
          🛡️
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
          Editorial Access Restricted
        </h2>
        <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 24 }}>
          {unauthorizedError}
        </p>
        <button
          onClick={async () => {
            if (supabase) await supabase.auth.signOut();
            router.push('/login');
          }}
          className="btn-primary"
          style={{ padding: '8px 24px', fontSize: 13 }}>
          Sign Out & Return to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
