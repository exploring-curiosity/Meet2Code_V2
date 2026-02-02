'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchContests } from '../../lib/api';
import type { Contest } from '../../lib/types';

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests()
      .then((data) => setContests(data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-100">Contests</h1>
        <p className="text-sm text-slate-400">Track collaborative contests and monitor leaderboards in real time.</p>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading contests…</p>
      ) : contests.length === 0 ? (
        <p className="text-slate-500">No contests scheduled. Hosts can create contests from the backend API.</p>
      ) : (
        <ul className="space-y-3">
          {contests.map((contest) => (
            <li key={contest.slug} className="rounded border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">{contest.name}</h2>
                  <p className="text-xs text-slate-500">
                    Starts: {new Date(contest.startTime).toLocaleString()} · Status: {contest.status}
                  </p>
                </div>
                <Link
                  href={`/contests/${contest.slug}`}
                  className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
