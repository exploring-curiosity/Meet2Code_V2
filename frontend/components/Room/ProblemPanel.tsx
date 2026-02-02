"use client";

import type { LCProblem } from "../../lib/types";

type Props = {
  problem: LCProblem;
};

export function ProblemPanel({ problem }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div>
          <div className="text-sm uppercase tracking-wide text-slate-400">Problem</div>
          <h2 className="text-lg font-semibold text-slate-100">
            {problem.title} <span className="text-slate-500 text-sm">({problem.difficulty})</span>
          </h2>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="prose prose-invert max-w-none break-words prose-pre:bg-slate-900 prose-pre:whitespace-pre-wrap prose-pre:break-words">
          <div dangerouslySetInnerHTML={{ __html: problem.statement }} />
        </div>

        {problem.sampleTests?.length ? (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sample Tests</div>
            <div className="space-y-3">
              {problem.sampleTests.map((t, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Input</div>
                    <pre className="max-h-36 overflow-auto rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 whitespace-pre-wrap">{t.input}</pre>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Output</div>
                    <pre className="max-h-36 overflow-auto rounded border border-slate-700 bg-slate-950 p-2 text-xs text-emerald-300 whitespace-pre-wrap">{t.output}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
