import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthInitializer } from '../components/AuthInitializer';
import { HeaderNav } from '../components/HeaderNav';

export const metadata: Metadata = {
  title: 'Meet2Code v2',
  description: 'Collaborative competitive programming platform rebuilt with Next.js.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--color-background)] text-[var(--color-text)]">
        <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID ?? ''}>
          <AuthInitializer />
          <div className="h-screen overflow-hidden flex flex-col">
            <HeaderNav />
            <main className="flex-1 min-h-0 overflow-hidden px-6 py-8">{children}</main>
          </div>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
