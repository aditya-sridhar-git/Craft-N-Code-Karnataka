import { readJSON, writeJSON } from "./storage";

export interface Prefs {
  theme: "system" | "light" | "dark";
  text: "normal" | "large" | "xl";
  easy: boolean;
}

export const PREFS_KEY = "taproot:prefs";
export const DEFAULT_PREFS: Prefs = { theme: "system", text: "normal", easy: false };

export function loadPrefs(): Prefs {
  return { ...DEFAULT_PREFS, ...(readJSON<Partial<Prefs>>(PREFS_KEY) ?? {}) };
}

export function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  if (p.theme === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", p.theme);
  el.setAttribute("data-text", p.text);
  el.setAttribute("data-easy", p.easy ? "on" : "off");
}

export function savePrefs(p: Prefs) {
  writeJSON(PREFS_KEY, p);
  applyPrefs(p);
}

/** Runs before first paint (inline in <head>) so saved preferences never flash. */
export const PREFS_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${PREFS_KEY}")||"{}");var e=document.documentElement;if(p.theme==="light"||p.theme==="dark")e.setAttribute("data-theme",p.theme);if(p.text)e.setAttribute("data-text",p.text);if(p.easy)e.setAttribute("data-easy","on")}catch(_){}})()`;
