"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_PREFS, loadPrefs, savePrefs, type Prefs } from "@/lib/prefs";

const TEXT: { value: Prefs["text"]; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "xl", label: "Extra large" },
];
const THEME: { value: Prefs["theme"]; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function A11yMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
  };

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) setPrefs(loadPrefs());
          setOpen(!open);
        }}
        className="flex h-9 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-sm font-semibold hover:bg-surface-2"
      >
        <span aria-hidden="true">Aa</span>
        <span className="sr-only">Reading and display settings</span>
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Reading and display settings"
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-line bg-surface p-4 shadow-lg"
        >
          <fieldset>
            <legend className="text-sm font-semibold">Text size</legend>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {TEXT.map((t) => (
                <label key={t.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="text-size"
                    className="peer sr-only"
                    checked={prefs.text === t.value}
                    onChange={() => update({ text: t.value })}
                  />
                  <span className="block rounded-md border border-line px-2 py-1.5 text-center text-xs peer-checked:border-leaf peer-checked:bg-leaf-soft peer-checked:font-semibold peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--leaf)]" checked={prefs.easy} onChange={(e) => update({ easy: e.target.checked })} />
            <span>
              <span className="block text-sm font-semibold">Easy-read spacing</span>
              <span className="block text-xs text-muted">More space between letters, words and lines.</span>
            </span>
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Colours</legend>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {THEME.map((t) => (
                <label key={t.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    className="peer sr-only"
                    checked={prefs.theme === t.value}
                    onChange={() => update({ theme: t.value })}
                  />
                  <span className="block rounded-md border border-line px-2 py-1.5 text-center text-xs peer-checked:border-leaf peer-checked:bg-leaf-soft peer-checked:font-semibold peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}
