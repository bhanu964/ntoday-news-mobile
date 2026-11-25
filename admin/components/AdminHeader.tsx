'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isConfigured } from '@/lib/supabase';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editorRole, setEditorRole] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!isConfigured || !client || pathname === '/login') {
      setUserEmail(null);
      setEditorRole(null);
      return;
    }

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        client
          .from('editors')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) setEditorRole(data.role);
          });
      } else {
        setUserEmail(null);
        setEditorRole(null);
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
      } else {
        setUserEmail(null);
        setEditorRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  const isLoginPage = pathname === '/login';

  return (
    <header
      style={{
        backgroundColor: '#141417',
        borderBottom: '1px solid #27272a',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                backgroundColor: '#e50914',
                color: '#ffffff',
                fontWeight: 900,
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 13,
                letterSpacing: 1,
              }}>
              NTODAY
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#f4f4f5' }}>
              Editorial Portal
            </span>
          </Link>
        </div>

        {/* Nav Links & Logout */}
        {!isLoginPage && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              href="/"
              style={{
                color: pathname === '/' ? '#ffffff' : '#a1a1aa',
                fontSize: 14,
                fontWeight: 600,
                transition: 'color 0.15s',
              }}>
              Articles
            </Link>
            <Link
              href="/comments"
              style={{
                color: pathname === '/comments' ? '#ffffff' : '#a1a1aa',
                fontSize: 14,
                fontWeight: 600,
                transition: 'color 0.15s',
              }}>
              Comments
            </Link>
            <Link href="/articles/new" className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>
              + New Story
            </Link>

            {userEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                <span style={{ fontSize: 12, color: '#a1a1aa' }}>
                  {userEmail}{' '}
                  {editorRole && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: '#27272a',
                        color: '#38bdf8',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        marginLeft: 4,
                      }}>
                      {editorRole}
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #3f3f46',
                    color: '#ef4444',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  Logout
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
