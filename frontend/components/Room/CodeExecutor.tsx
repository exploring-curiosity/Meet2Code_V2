'use client';

import { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

type ExecutionResult = {
  success: boolean;
  output: string;
  error: string;
  executionTimeMs: number;
};

type CodeExecutorProps = {
  code: string;
  language: string;
  onExecute?: (result: ExecutionResult) => void;
};

export function CodeExecutor({ code, language, onExecute }: CodeExecutorProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCode = async () => {
    if (!code.trim()) {
      setResult({
        success: false,
        output: '',
        error: 'No code to execute',
        executionTimeMs: 0,
      });
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';
      const response = await fetch(`${backendUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          language,
          input,
        }),
      });

      if (!response.ok) {
        throw new Error('Execution request failed');
      }

      const data: ExecutionResult = await response.json();
      setResult(data);
      onExecute?.(data);
    } catch (error) {
      console.error('Execution error:', error);
      setResult({
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTimeMs: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="border-b border-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">
        Code Execution
      </div>

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4">
        {/* Input Section */}
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">
            Input (stdin)
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter input for your program..."
            className="h-24 w-full resize-none rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Execute Button */}
        <button
          onClick={executeCode}
          disabled={isExecuting || !code.trim()}
          className="flex w-full items-center justify-center gap-2 rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Code
            </>
          )}
        </button>

        {/* Results Section */}
        {result && (
          <div className="space-y-3">
            {/* Status Header */}
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      Success
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-rose-400" />
                    <span className="text-sm font-medium text-rose-400">
                      Failed
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {result.executionTimeMs}ms
              </div>
            </div>

            {/* Output */}
            {result.output && (
              <div>
                <div className="mb-1 text-xs font-medium text-slate-400">
                  Output
                </div>
                <pre className="max-h-48 overflow-auto rounded border border-slate-700 bg-slate-950 p-3 text-xs text-emerald-300">
                  {result.output}
                </pre>
              </div>
            )}

            {/* Error */}
            {result.error && (
              <div>
                <div className="mb-1 text-xs font-medium text-rose-400">
                  Error
                </div>
                <pre className="max-h-48 overflow-auto rounded border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
