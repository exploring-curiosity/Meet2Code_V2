'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LCProblem, LCTestCase, RunTestsResponse } from '../../lib/types';
import { fetchQuestionTestCases, runQuestionTests, saveQuestionTestCases } from '../../lib/api';

type Props = {
  problem: LCProblem;
  roomSlug: string;
  code: string;
  language: string;
  disabled?: boolean;
};

export function TestCaseRunner({ problem, roomSlug, code, language, disabled }: Props) {
  const [customCases, setCustomCases] = useState<LCTestCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [savingCases, setSavingCases] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunTestsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleCases = useMemo(() => problem.sampleTests ?? [], [problem.sampleTests]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingCases(true);
      setError(null);
      try {
        const response = await fetchQuestionTestCases(roomSlug, problem.titleSlug);
        if (mounted) {
          setCustomCases(response.testCases ?? []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message ?? 'Failed to load custom testcases');
        }
      } finally {
        if (mounted) {
          setLoadingCases(false);
        }
      }
    };
    if (!disabled) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [problem.titleSlug, roomSlug, disabled]);

  const updateCase = (index: number, field: keyof LCTestCase, value: string) => {
    setCustomCases((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeCase = (index: number) => {
    setCustomCases((prev) => prev.filter((_, i) => i !== index));
  };

  const addCase = () => {
    setCustomCases((prev) => [...prev, { input: '', output: '' }]);
  };

  const persistCases = async () => {
    setSavingCases(true);
    setError(null);
    try {
      await saveQuestionTestCases(roomSlug, problem.titleSlug, customCases);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save custom testcases');
    } finally {
      setSavingCases(false);
    }
  };

  const executeTests = async (testCases: LCTestCase[]) => {
    if (!code.trim()) {
      setError('No code available to run.');
      return;
    }
    setRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const response = await runQuestionTests(code, language, testCases);
      setRunResult(response);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to run tests');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Testcases</div>
          <div className="text-sm text-slate-200">Sample: {sampleCases.length} · Custom: {customCases.length}</div>
        </div>
        <button
          onClick={addCase}
          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600"
          disabled={disabled}
        >
          Add Custom
        </button>
      </div>

      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4">
        {loadingCases ? <div className="text-xs text-slate-500">Loading custom testcases…</div> : null}

        <div className="space-y-3">
          {customCases.map((testCase, index) => (
            <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Custom #{index + 1}</div>
                <button
                  onClick={() => removeCase(index)}
                  className="text-[10px] uppercase tracking-wide text-rose-400 hover:text-rose-300"
                  disabled={disabled}
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 grid gap-2">
                <textarea
                  value={testCase.input}
                  onChange={(e) => updateCase(index, 'input', e.target.value)}
                  placeholder="Input"
                  className="h-16 w-full resize-none rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  disabled={disabled}
                />
                <textarea
                  value={testCase.output}
                  onChange={(e) => updateCase(index, 'output', e.target.value)}
                  placeholder="Expected output"
                  className="h-16 w-full resize-none rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
          {!customCases.length && !loadingCases ? (
            <div className="rounded border border-dashed border-slate-800 p-3 text-xs text-slate-500">
              No custom testcases yet.
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={persistCases}
            className="rounded bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            disabled={disabled || savingCases}
          >
            {savingCases ? 'Saving…' : 'Save Custom'}
          </button>
          <button
            onClick={() => executeTests(sampleCases)}
            className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={disabled || running || sampleCases.length === 0}
          >
            Run Samples
          </button>
          <button
            onClick={() => executeTests(customCases)}
            className="rounded bg-emerald-500/70 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={disabled || running || customCases.length === 0}
          >
            Run Custom
          </button>
          <button
            onClick={() => executeTests([...sampleCases, ...customCases])}
            className="rounded bg-indigo-400 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={disabled || running || sampleCases.length + customCases.length === 0}
          >
            Submit (All)
          </button>
        </div>

        {error ? <div className="text-xs text-rose-400">{error}</div> : null}

        {runResult ? (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span>
                Passed {runResult.passed} / {runResult.total}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Results</span>
            </div>
            <div className="space-y-2">
              {runResult.results.map((result, index) => (
                <div key={index} className="rounded border border-slate-800 bg-black/40 p-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wide">
                    <span className={result.success ? 'text-emerald-400' : 'text-rose-400'}>
                      {result.success ? 'Passed' : 'Failed'}
                    </span>
                    <span className="text-slate-500">{result.executionTimeMs}ms</span>
                  </div>
                  <div className="mt-1 grid gap-2 md:grid-cols-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Expected</div>
                      <pre className="whitespace-pre-wrap text-xs text-emerald-300">{result.expectedOutput}</pre>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Actual</div>
                      <pre className="whitespace-pre-wrap text-xs text-slate-200">{result.actualOutput}</pre>
                    </div>
                  </div>
                  {result.error ? (
                    <div className="mt-2 text-[10px] text-rose-400">{result.error}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
