/** Day / night appearance. "auto" follows the phone; the choice is saved on this device. */
export type ThemePreference = "auto" | "day" | "night";

export const THEME_STORAGE_KEY = "heritech_theme";

/**
 * Runs in <head> before the first paint, so a saved Night never flashes white.
 * Sets <html data-theme="day|night"> and keeps Auto in step with the phone.
 */
export const THEME_HEAD_SCRIPT = `try{var tk='${THEME_STORAGE_KEY}',tm=matchMedia('(prefers-color-scheme: dark)'),td=document.documentElement;function ta(){var p=localStorage.getItem(tk)||'auto';td.dataset.theme=p==='night'||(p==='auto'&&tm.matches)?'night':'day'}ta();tm.addEventListener('change',ta)}catch(e){}`;

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "day" || value === "night" ? value : "auto";
  } catch {
    return "auto";
  }
}

/** Saves the choice and applies it, easing the colours over only for this switch. */
export function applyThemePreference(preference: ThemePreference) {
  try {
    if (preference === "auto") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* storage blocked: still apply for this visit */
  }
  const night = preference === "night" || (preference === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.dataset.theme = night ? "night" : "day";
  window.setTimeout(() => root.classList.remove("theme-switching"), 300);
}
