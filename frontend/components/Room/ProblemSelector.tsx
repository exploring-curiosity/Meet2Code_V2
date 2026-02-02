"use client";

import { useEffect, useState } from "react";
import { fetchLeetCodeProblemDetails, fetchLeetCodeQuestions } from "../../lib/api";
import type { LCProblem, LeetCodeQuestion } from "../../lib/types";

type Props = {
  onSelect: (problem: LCProblem) => void;
  onClose: () => void;
};

export function ProblemSelector({ onSelect, onClose }: Props) {
  const tagOptions = [
    "All",
    "Array",
    "String",
    "Hash Table",
    "Dynamic Programming",
    "Greedy",
    "Two Pointers",
    "Binary Search",
    "Graph",
    "Tree",
    "Stack",
    "Heap (Priority Queue)",
    "Math",
    "Backtracking",
  ];
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(["All"]);
  const [difficulty, setDifficulty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [problems, setProblems] = useState<LeetCodeQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    if (tag === "All") {
      setSelectedTags(["All"]);
      return;
    }
    setSelectedTags((prev) => {
      const withoutAll = prev.filter((item) => item !== "All");
      if (withoutAll.includes(tag)) {
        const next = withoutAll.filter((item) => item !== tag);
        return next.length ? next : ["All"];
      }
      return [...withoutAll, tag];
    });
  };

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedTagValues = selectedTags.includes("All")
        ? undefined
        : selectedTags.map((tag) => tag.toLowerCase().replace(/\s+/g, "-")).join(",");
      const data = await fetchLeetCodeQuestions({
        tags: selectedTagValues || undefined,
        difficulty: difficulty || undefined,
        search: searchTerm || undefined,
      });
      setProblems(data.questions ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch LeetCode problems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDetails = async (titleSlug: string) => {
    try {
      const details = await fetchLeetCodeProblemDetails(titleSlug);
      onSelect(details);
    } catch (e) {
      setError("Failed to load problem details");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="text-sm font-semibold text-slate-200">Select a LeetCode Problem</div>
          <button onClick={onClose} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-5">
          <div className="space-y-3 md:col-span-1">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Tags</div>
              <div className="max-h-48 space-y-2 overflow-auto rounded border border-slate-800 bg-black/40 p-2 text-xs text-slate-200">
                {tagOptions.map((tag) => (
                  <label key={tag} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    <span className="text-slate-300">{tag}</span>
                  </label>
                ))}
              </div>
              <div className="mt-1 text-[10px] text-slate-500">All is selected by default.</div>
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Difficulty</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Any</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Search</div>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="title keyword"
                className="w-full rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={search}
              disabled={loading}
              className="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? "Searching..." : "Search"}
            </button>
            {error ? <div className="text-xs text-rose-400">{error}</div> : null}
            <div className="text-[10px] text-slate-500">Found {total} problems (showing up to 50).</div>
          </div>

          <div className="md:col-span-4">
            <div className="max-h-[60vh] overflow-auto rounded border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-900/70 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Difficulty</th>
                    <th className="px-3 py-2">Tags</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {problems.map((p) => (
                    <tr key={p.titleSlug} className="hover:bg-slate-900/40">
                      <td className="px-3 py-2 text-slate-200">{p.title}</td>
                      <td className="px-3 py-2 text-slate-400">{p.difficulty}</td>
                      <td className="px-3 py-2 text-slate-500">{(p.topicTags ?? []).map((t) => t.name).join(", ")}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => loadDetails(p.titleSlug)}
                          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!problems.length && (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={4}>
                        No problems found with current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
