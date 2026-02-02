'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

type LeaderboardEntry = {
  userId: string;
  username: string;
  displayName?: string;
  score: number;
  rank?: number;
};

type LeaderboardProps = {
  contestSlug: string;
  refreshInterval?: number;
};

export function Leaderboard({ contestSlug, refreshInterval = 10000 }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';
      const response = await fetch(`${backendUrl}/api/contests/${contestSlug}/leaderboard`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      // Add ranks
      const ranked = data.map((entry: LeaderboardEntry, index: number) => ({
        ...entry,
        rank: index + 1,
      }));
      
      setEntries(ranked);
      setError(null);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Auto-refresh leaderboard
    const interval = setInterval(fetchLeaderboard, refreshInterval);

    return () => clearInterval(interval);
  }, [contestSlug, refreshInterval]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-semibold text-slate-500">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 2:
        return 'bg-slate-500/10 border-slate-500/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-slate-800/40 border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Leaderboard</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live updates
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {entries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-700" />
            <p className="mt-4 text-sm text-slate-500">No participants yet</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between border px-6 py-4 transition-colors hover:bg-slate-800/30 ${getRankBgColor(
                entry.rank ?? 0
              )}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex w-12 items-center justify-center">
                  {getRankIcon(entry.rank ?? 0)}
                </div>
                <div>
                  <div className="font-medium text-slate-100">
                    {entry.displayName || entry.username}
                  </div>
                  <div className="text-xs text-slate-500">@{entry.username}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{entry.score}</div>
                <div className="text-xs text-slate-500">points</div>
              </div>
            </div>
          ))
        )}
      </div>

      {entries.length > 0 && (
        <div className="border-t border-slate-800 px-6 py-3 text-center text-xs text-slate-500">
          {entries.length} participant{entries.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
