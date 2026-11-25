import type { Metadata } from 'next';
import './globals.css';
import AdminHeader from '@/components/AdminHeader';
import AdminAuthGuard from '@/components/AdminAuthGuard';

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
        <AdminHeader />
        <AdminAuthGuard>
          <main>{children}</main>
        </AdminAuthGuard>
      </body>
    </html>
  );
}
