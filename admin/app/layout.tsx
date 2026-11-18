import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'NTODAY NEWS — Editorial Admin Portal',
  description: 'Manage articles, breaking tickers, media uploads, and reader comments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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

            {/* Nav Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Link
                href="/"
                style={{
                  color: '#a1a1aa',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'color 0.15s',
                }}>
                Articles
              </Link>
              <Link
                href="/comments"
                style={{
                  color: '#a1a1aa',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'color 0.15s',
                }}>
                Comments
              </Link>
              <Link href="/articles/new" className="btn-primary" style={{ padding: '6px 14px' }}>
                + New Story
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
