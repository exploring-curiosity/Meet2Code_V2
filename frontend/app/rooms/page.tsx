'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createRoom, fetchPublicRooms } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

type RoomSummary = {
  slug: string;
  name: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE';
  participantCount: number;
  host: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
};

export default function RoomsPage() {
  const user = useAuthStore((state) => state.user);
  const refresh = useAuthStore((state) => state.refresh);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'PUBLIC',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await fetchPublicRooms();
      setRooms(data ?? []);
    } catch (e) {
      console.error(e);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms().catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) {
      refresh().catch(console.error);
    }
  }, [user, refresh]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createRoom({
        name: form.name,
        description: form.description,
        type: form.type as 'PUBLIC' | 'PRIVATE',
        password: form.type === 'PRIVATE' ? form.password : undefined,
      });
      setForm({ name: '', description: '', type: 'PUBLIC', password: '' });
      await loadRooms();
    } catch (e) {
      console.error(e);
      setError('Could not create room');
    }
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-slate-300">You need to sign in to manage rooms.</p>
        <Link href="/login" className="text-emerald-400">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr,340px]">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-100">Active rooms</h2>
          <button
            onClick={() => loadRooms()}
            className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-500"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="text-slate-400">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="text-slate-500">No public rooms yet. Create one below!</p>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room) => (
              <li
                key={room.slug}
                className="rounded border border-slate-800 bg-slate-900/40 p-4 shadow shadow-slate-950/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{room.name}</h3>
                    <p className="text-xs text-slate-500">
                      Host: {room.host.displayName ?? room.host.username} • Participants:{' '}
                      {room.participantCount} • {room.type.toLowerCase()}
                    </p>
                  </div>
                  <Link
                    href={`/rooms/${room.slug}`}
                    className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                  >
                    Join
                  </Link>
                </div>
                {room.description ? (
                  <p className="mt-3 text-sm text-slate-300">{room.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h3 className="text-lg font-semibold text-slate-100">Create a room</h3>
        <p className="text-xs text-slate-500">
          Host a coding session for your peers. Private rooms require a password.
        </p>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        <form className="mt-4 space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="text-xs text-slate-400">Name</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Description</label>
            <textarea
              className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Access</label>
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          {form.type === 'PRIVATE' ? (
            <div>
              <label className="text-xs text-slate-400">Password</label>
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
          ) : null}
          <button
            type="submit"
            className="w-full rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Create room
          </button>
        </form>
      </aside>
    </div>
  );
}
