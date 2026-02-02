'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { Plus, X } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type CodeTab = {
  id: string;
  name: string;
  language: string;
  yjsKey: string;
};

type MultiTabCodeEditorProps = {
  doc: Y.Doc;
  provider: WebsocketProvider;
  readOnly?: boolean;
};

export function MultiTabCodeEditor({ doc, provider, readOnly = false }: MultiTabCodeEditorProps) {
  const { theme } = useTheme();
  const [tabs, setTabs] = useState<CodeTab[]>([
    { id: '1', name: 'Main', language: 'javascript', yjsKey: 'code-tab-1' },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [isReady, setIsReady] = useState(false);
  
  const bindingsRef = useRef<Map<string, MonacoBinding>>(new Map());
  const editorsRef = useRef<Map<string, monaco.editor.IStandaloneCodeEditor>>(new Map());
  const monacoRef = useRef<typeof monaco | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    return () => {
      bindingsRef.current.forEach((binding) => binding.destroy());
      bindingsRef.current.clear();
      editorsRef.current.clear();
    };
  }, []);

  const addTab = () => {
    const newId = String(Date.now());
    const newTab: CodeTab = {
      id: newId,
      name: `Tab ${tabs.length + 1}`,
      language: 'javascript',
      yjsKey: `code-tab-${newId}`,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const removeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Keep at least one tab
    
    const binding = bindingsRef.current.get(tabId);
    if (binding) {
      binding.destroy();
      bindingsRef.current.delete(tabId);
    }
    
    const editor = editorsRef.current.get(tabId);
    if (editor) {
      editor.dispose();
      editorsRef.current.delete(tabId);
    }

    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const renameTab = (tabId: string, newName: string) => {
    setTabs(tabs.map((t) => (t.id === tabId ? { ...t, name: newName } : t)));
  };

  const changeLanguage = (tabId: string, language: string) => {
    setTabs(tabs.map((t) => (t.id === tabId ? { ...t, language } : t)));
    
    const editor = editorsRef.current.get(tabId);
    const model = editor?.getModel();
    if (model && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(model, language);
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    editorsRef.current.set(activeTab.id, editor);

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
      typeRoots: ['node_modules/@types'],
    });

    // Initialize collaborative editing for this tab
    const text = doc.getText(activeTab.yjsKey);
    const model = editor.getModel();
    if (model) {
      if (!model.getValue()) {
        model.setValue(text.toString());
      }
      
      // Destroy existing binding if any
      const existingBinding = bindingsRef.current.get(activeTab.id);
      if (existingBinding) {
        existingBinding.destroy();
      }

      const binding = new MonacoBinding(text, model, new Set([editor]), provider.awareness);
      bindingsRef.current.set(activeTab.id, binding);

      // Set up awareness coloring for cursors and selections
      provider.awareness.setLocalStateField('user', {
        name: provider.awareness.clientID,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        tab: activeTab.id,
      });
    }

    setIsReady(true);
  };

  useEffect(() => {
    if (editorsRef.current.has(activeTab.id)) {
      const editor = editorsRef.current.get(activeTab.id);
      editor?.updateOptions({ readOnly });
    }
  }, [readOnly, activeTab.id]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 border-r border-slate-800 px-4 py-2 ${
                activeTabId === tab.id
                  ? 'bg-slate-800/60 text-slate-100'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <button
                onClick={() => setActiveTabId(tab.id)}
                className="text-sm font-medium"
              >
                {tab.name}
              </button>
              {tabs.length > 1 && (
                <button
                  onClick={() => removeTab(tab.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-emerald-400"
            title="Add new tab"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-3 px-4 py-2">
          <input
            type="text"
            value={activeTab.name}
            onChange={(e) => renameTab(activeTab.id, e.target.value)}
            className="w-24 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300"
            placeholder="Tab name"
          />
          <select
            value={activeTab.language}
            onChange={(e) => changeLanguage(activeTab.id, e.target.value)}
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
            <option value="ruby">Ruby</option>
            <option value="php">PHP</option>
          </select>
        </div>
      </div>

      {/* Editor */}
      <MonacoEditor
        key={activeTab.id}
        height="600px"
        defaultLanguage={activeTab.language}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
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
