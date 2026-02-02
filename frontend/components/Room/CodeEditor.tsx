'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';
import type { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type CodeEditorProps = {
  doc: Y.Doc;
  provider: WebsocketProvider;
  language?: string;
  readOnly?: boolean;
  onLanguageChange?: (language: string) => void;
};

export function CodeEditor({ doc, provider, language = 'javascript', readOnly = false, onLanguageChange }: CodeEditorProps) {
  const [isReady, setIsReady] = useState(false);
  const [monacoTheme, setMonacoTheme] = useState<'vs' | 'vs-dark'>('vs-dark');
  const bindingRef = useRef<any>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  useEffect(() => {
    const parseColor = (value: string) => {
      const trimmed = value.trim();
      if (trimmed.startsWith('#')) {
        const hex = trimmed.replace('#', '');
        const normalized = hex.length === 3
          ? hex.split('').map((c) => c + c).join('')
          : hex;
        const int = parseInt(normalized, 16);
        return {
          r: (int >> 16) & 255,
          g: (int >> 8) & 255,
          b: int & 255,
        };
      }
      const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (match) {
        return {
          r: Number(match[1]),
          g: Number(match[2]),
          b: Number(match[3]),
        };
      }
      return null;
    };

    const updateTheme = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-background');
      const rgb = parseColor(bg);
      if (!rgb) return;
      const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
      setMonacoTheme(luminance > 0.6 ? 'vs' : 'vs-dark');
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      bindingRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set up language features
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Initialize collaborative editing (lazy import y-monaco to avoid SSR window errors)
    const text = doc.getText('code');
    const model = editor.getModel();
    if (model) {
      if (!model.getValue()) {
        model.setValue(text.toString());
      }
      (async () => {
        const { MonacoBinding } = await import('y-monaco');
        if (!bindingRef.current && editorRef.current) {
          bindingRef.current = new MonacoBinding(text, model, new Set([editorRef.current]), provider.awareness);
          // Set up awareness coloring for cursors and selections
          provider.awareness.setLocalStateField('user', {
            name: provider.awareness.clientID,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          });
        }
      })();
    }

    setIsReady(true);
  };

  // Add support for JSX/TypeScript syntax highlighting
  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current;
      const languageExtensions = {
        javascript: ['js', 'jsx'],
        typescript: ['ts', 'tsx'],
      };

      Object.entries(languageExtensions).forEach(([lang, exts]) => {
        exts.forEach(ext => {
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            jsx: monaco.languages.typescript.JsxEmit.React,
            jsxFactory: 'React.createElement',
            reactNamespace: 'React',
            allowNonTsExtensions: true,
            allowJs: true,
            target: monaco.languages.typescript.ScriptTarget.Latest,
          });
        });
      });
    }
  }, [isReady]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="text-sm font-semibold text-slate-200">Code workspace</div>
        {isReady && (
          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              const model = editorRef.current?.getModel();
              if (model && monacoRef.current) {
                monacoRef.current.editor.setModelLanguage(model, newLang);
              }
              onLanguageChange?.(newLang);
            }}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-300"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
        )}
      </div>
      <MonacoEditor
        height="100%"
        defaultLanguage={language}
        theme={monacoTheme}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          rulers: [80, 100],
          renderWhitespace: 'selection',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          folding: true,
          automaticLayout: true,
          tabSize: 2,
          readOnly,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
}
