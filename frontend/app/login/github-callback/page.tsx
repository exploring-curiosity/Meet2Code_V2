'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/auth';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';

export default function GithubCallbackPage() {
  const router = useRouter();
  const refresh = useAuthStore((state) => state.refresh);
  const params = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasRun.current) return;
    hasRun.current = true;

    const code = params.get('code');
    if (!code) {
      router.replace('/login');
      return;
    }

    const redirectUri = `${window.location.origin}/login/github-callback`;

    const completeLogin = async () => {
      const response = await fetch(
        `${backendUrl}/api/oauth/github/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refresh();
      router.replace('/rooms');
    };

    completeLogin().catch((error) => {
      console.error('GitHub callback error', error);
      router.replace('/login');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-[60vh] items-center justify-center text-slate-300">
      Finalizing GitHub sign-in...
    </div>
  );
}
