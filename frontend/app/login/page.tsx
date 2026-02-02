'use client';

import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';

export default function LoginPage() {
  const router = useRouter();
  const refresh = useAuthStore((state) => state.refresh);
  const [error, setError] = useState<string | null>(null);
  const [mockUsername, setMockUsername] = useState('tester');
  const [mockDisplayName, setMockDisplayName] = useState('Tester');

  const handleGitHub = () => {
    const redirectUri = `${window.location.origin}/login/github-callback`;
    const url = `${backendUrl}/api/oauth/github?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google login failed');
      return;
    }
    try {
      const resp = await fetch(`${backendUrl}/api/oauth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      await refresh();
      router.push('/rooms');
    } catch (e) {
      console.error(e);
      setError('Unable to sign in with Google');
    }
  };

  const handleMockLogin = async () => {
    if (!mockUsername.trim()) {
      setError('Enter a mock username');
      return;
    }
    try {
      const params = new URLSearchParams({
        username: mockUsername.trim(),
        displayName: mockDisplayName.trim(),
      });
      const resp = await fetch(`${backendUrl}/api/oauth/mock?${params.toString()}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      await refresh();
      router.push('/rooms');
    } catch (e) {
      console.error(e);
      setError('Unable to sign in with mock user');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-100">Sign in to Meet2Code</h2>
        <p className="text-slate-400 text-sm">
          Connect with your preferred provider and jump back into collaborative sessions.
        </p>
      </div>

      {error ? <p className="rounded border border-rose-500 bg-rose-500/10 p-3 text-rose-200">{error}</p> : null}

      <div className="space-y-4">
        <button
          onClick={handleGitHub}
          className="w-full rounded-lg border border-slate-700 bg-black/40 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-black/60"
        >
          Continue with GitHub
        </button>

        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google login failed')} useOneTap={false} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mock Login (dev)</p>
          <div className="mt-3 grid gap-2">
            <input
              value={mockUsername}
              onChange={(e) => setMockUsername(e.target.value)}
              placeholder="mock username"
              className="w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100"
            />
            <input
              value={mockDisplayName}
              onChange={(e) => setMockDisplayName(e.target.value)}
              placeholder="display name"
              className="w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100"
            />
            <button
              onClick={handleMockLogin}
              className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Continue as Mock User
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Need an account? Authenticate with GitHub or Google above. Learn more about the platform{' '}
        <Link href="https://github.com/exploring-curiosity/Meet2Code" className="text-emerald-400">
          on GitHub
        </Link>
        .
      </p>
    </div>
  );
}
