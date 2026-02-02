'use client';

import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';

type ColorTheme = {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
  };
};

const themes: ColorTheme[] = [
  {
    id: 'dark-default',
    name: 'Dark (Default)',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#8b5cf6',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      background: '#000205',
      surface: '#0E111A',
      primary: '#199C95',
      secondary: '#BCF4EF',
      accent: '#03050B',
      text: '#BCF4EF',
      textMuted: '#199C95',
    },
  },
  {
    id: 'light',
    name: 'Light Mode',
    colors: {
      background: '#FFFFFF',
      surface: '#BBBBBB',
      primary: '#575758',
      secondary: '#767676',
      accent: '#949494',
      text: '#575758',
      textMuted: '#767676',
    },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    colors: {
      background: '#EDC7B7',
      surface: '#EEE2DC',
      primary: '#AC3B61',
      secondary: '#123C69',
      accent: '#BAB2B5',
      text: '#123C69',
      textMuted: '#AC3B61',
    },
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    colors: {
      background: '#EAE7DC',
      surface: '#D8C3A5',
      primary: '#E85A4F',
      secondary: '#E98074',
      accent: '#8E8D8A',
      text: '#E85A4F',
      textMuted: '#E98074',
    },
  },
  {
    id: 'neon-green',
    name: 'Neon Green',
    colors: {
      background: '#FCE181',
      surface: '#FEF9E7',
      primary: '#0DEA05',
      secondary: '#026670',
      accent: '#9FEDD7',
      text: '#026670',
      textMuted: '#0DEA05',
    },
  },
];

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('dark-default');

  useEffect(() => {
    // Load saved theme from localStorage
    const saved = localStorage.getItem('m2c-theme');
    if (saved) {
      setSelectedTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-muted', theme.colors.textMuted);

    setSelectedTheme(themeId);
    localStorage.setItem('m2c-theme', themeId);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
        title="Customize theme"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Theme Selector Panel */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-100">Choose Theme</h3>
              <p className="mt-1 text-xs text-slate-400">
                Customize the appearance of your workspace
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto p-3">
              <div className="space-y-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      applyTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedTheme === theme.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-100">
                        {theme.name}
                      </span>
                      {selectedTheme === theme.id && (
                        <span className="text-xs text-emerald-400">✓ Active</span>
                      )}
                    </div>

                    {/* Color Preview */}
                    <div className="mt-2 flex gap-1">
                      <div
                        className="h-6 w-6 rounded border border-slate-700"
                        style={{ backgroundColor: theme.colors.background }}
                        title="Background"
                      />
                      <div
                        className="h-6 w-6 rounded border border-slate-700"
                        style={{ backgroundColor: theme.colors.surface }}
                        title="Surface"
                      />
                      <div
                        className="h-6 w-6 rounded border border-slate-700"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="h-6 w-6 rounded border border-slate-700"
                        style={{ backgroundColor: theme.colors.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="h-6 w-6 rounded border border-slate-700"
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Accent"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 px-4 py-3">
              <p className="text-xs text-slate-500">
                Theme preferences are saved locally
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
