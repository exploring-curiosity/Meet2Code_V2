const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';
const yjsUrl = process.env.NEXT_PUBLIC_YJS_URL ?? 'ws://localhost:1234/yjs';
const peerUrl = process.env.NEXT_PUBLIC_PEER_URL ?? 'http://localhost:8080/ws';

async function fetchBackendHealth() {
  try {
    const res = await fetch(`${backendUrl}/api/health`, { next: { revalidate: 0 } });
    if (!res.ok) {
      return { status: 'DOWN', detail: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (error) {
    return { status: 'UNKNOWN', detail: (error as Error).message };
  }
}

export default async function HomePage() {
  const health = await fetchBackendHealth();

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Kick-start the Modern Meet2Code stack</h2>
        <p className="text-slate-400">
          This Next.js frontend will interface with the Spring Boot API, collaborative Yjs server, and the Go-based WebRTC
          signaling node.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/30">
          <h3 className="text-xl font-semibold">Backend health</h3>
          <p className="text-sm text-slate-400">Reading from <code className="text-slate-300">{backendUrl}</code></p>
          <pre className="mt-4 rounded-lg bg-black/40 p-4 text-sm text-emerald-300">
{JSON.stringify(health, null, 2)}
          </pre>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-xl font-semibold">Service endpoints</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <span className="font-medium text-slate-100">Yjs WebSocket server:</span> {yjsUrl}
            </li>
            <li>
              <span className="font-medium text-slate-100">Peer signaling endpoint:</span> {peerUrl}
            </li>
          </ul>
        </article>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-xl font-semibold">Jump in</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>
            ➜ <a href="/rooms" className="text-emerald-400">Browse rooms</a> to host collaborative sessions backed by the new Spring Boot APIs.
          </li>
          <li>
            ➜ <a href="/contests" className="text-emerald-400">Monitor contests</a> and track live scoreboards powered by PostgreSQL + WebSockets.
          </li>
          <li>
            ➜ Open the LeetCode picker inside rooms to load full statements and sample tests.
          </li>
        </ul>
      </div>
    </section>
  );
}
