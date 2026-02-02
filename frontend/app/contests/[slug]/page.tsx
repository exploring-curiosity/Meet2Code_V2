'use client';

import { Client } from '@stomp/stompjs';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  fetchContest,
  fetchContestLeaderboard,
  joinContest,
  bumpContestScore,
} from '../../../lib/api';
import type { Contest } from '../../../lib/types';
import { useAuthStore } from '../../../store/auth';
import { Leaderboard } from '../../../components/Contest/Leaderboard';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';
const wsUrl = backendUrl.replace('http', 'ws').replace('https', 'wss') + '/ws';

export default function ContestPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refresh = useAuthStore((state) => state.refresh);
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<Contest['participants']>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const detail = await fetchContest(slug);
      setContest(detail);
      const board = await fetchContestLeaderboard(slug);
      setLeaderboard(board);
    };
    load().catch((error) => {
      console.error(error);
      router.replace('/contests');
    });
  }, [slug, router]);

  useEffect(() => {
    if (!user) {
      refresh().catch(console.error);
    }
  }, [user, refresh]);

  useEffect(() => {
    if (!slug || clientRef.current) return;
    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      debug: () => undefined,
      webSocketFactory: () => new WebSocket(wsUrl),
      onConnect: () => {
        client.subscribe(`/topic/contests/${slug}`, (message) => {
          const payload = JSON.parse(message.body) as { status: string };
          setContest((prev) => (prev ? { ...prev, status: payload.status as Contest['status'] } : prev));
        });
      },
    });
    client.activate();
    clientRef.current = client;
    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [slug]);

  const ensureJoined = async () => {
    if (!slug) return;
    if (!user) {
      await refresh();
      return;
    }
    try {
      await joinContest(slug);
      const board = await fetchContestLeaderboard(slug);
      setLeaderboard(board);
    } catch (error) {
      console.error(error);
    }
  };

  const addScore = async (problemNumber: number) => {
    if (!slug) return;
    if (!user) {
      await refresh();
      return;
    }
    try {
      await bumpContestScore(slug, problemNumber);
      const board = await fetchContestLeaderboard(slug);
      setLeaderboard(board);
    } catch (error) {
      console.error(error);
    }
  };

  if (!contest) {
    return <div className="text-slate-400">Loading contest…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-100">{contest.name}</h1>
          <p className="text-sm text-slate-500">
            Starts {new Date(contest.startTime).toLocaleString()} · Status {contest.status}
          </p>
        </div>
        <button
          onClick={ensureJoined}
          className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          {user ? 'Join contest' : 'Sign in to join'}
        </button>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Problems</h2>
        <ul className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
          {contest.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Test Score Updates</h2>
          <div className="space-x-2 text-xs">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => addScore(num)}
                className="rounded border border-emerald-500 px-2 py-1 text-emerald-400 hover:bg-emerald-500/10"
              >
                +{num * 10} points
              </button>
            ))}
          </div>
        </div>

        <Leaderboard contestSlug={slug ?? ''} refreshInterval={5000} />
      </div>
    </div>
  );
}
