'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';

type CollaborativeDocumentProps = {
  doc: Y.Doc;
  readOnly?: boolean;
};

export function CollaborativeDocument({ doc, readOnly = false }: CollaborativeDocumentProps) {
  const text = useMemo(() => doc.getText('notes'), [doc]);
  const [value, setValue] = useState(text.toString());

  useEffect(() => {
    const observer = () => {
      setValue(text.toString());
    };
    text.observe(observer);
    return () => {
      text.unobserve(observer);
    };
  }, [text]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const next = event.target.value;
    doc.transact(() => {
      text.delete(0, text.length);
      text.insert(0, next);
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="border-b border-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">Notes</div>
      <textarea
        className="h-64 w-full resize-none rounded-b-xl border-0 bg-transparent px-4 py-3 text-sm text-slate-100 focus:outline-none"
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder="Capture shared notes or plan your strategy..."
      />
    </div>
  );
}
