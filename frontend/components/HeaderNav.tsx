'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/auth';
import { ThemeCustomizer } from './ThemeCustomizer';

export function HeaderNav() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
      <div>
        <Link href="/" className="text-2xl font-semibold text-slate-100">
          Meet2Code v2
        </Link>
        <nav className="mt-2 flex gap-4 text-sm text-slate-400">
          <Link href="/rooms">Rooms</Link>
          <Link href="/contests">Contests</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <ThemeCustomizer />
        {user ? (
          <>
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="avatar" className="h-8 w-8 rounded-full" />
            ) : null}
            <div className="text-right">
              <div className="text-slate-200">{user.displayName ?? user.login}</div>
              <button
                onClick={() => signOut().catch(console.error)}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
