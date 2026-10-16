export type ThemeMode = 'light' | 'dark';

const LIGHT_COLORS = {
  background: '#E0E5EC',
  surface: '#E0E5EC',
  pillBg: '#D1D9E6',
  border: '#D1D9E6',
  text: '#334155',
  textLight: '#64748B',
  primary: '#4F46E5',
  accent: '#2563EB',
  shadowDark: '#A3B1C6',
  shadowLight: '#FFFFFF',
  error: '#FF4757'
};

const DARK_COLORS = {
  background: '#0F172A',
  surface: '#1E293B',
  pillBg: '#334155',
  border: '#334155',
  text: '#F8FAFC',
  textLight: '#94A3B8',
  primary: '#38BDF8',
  accent: '#60A5FA',
  shadowDark: '#020617',
  shadowLight: '#334155',
  error: '#FF6B81'
};

const getInitialMode = (): ThemeMode => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('devground_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    }
  } catch {}
  return 'light';
};

let currentMode: ThemeMode = getInitialMode();
const listeners: Array<(mode: ThemeMode) => void> = [];

export const Theme = {
  get mode(): ThemeMode {
    return currentMode;
  },
  get isDark(): boolean {
    return currentMode === 'dark';
  },
  toggleMode(): ThemeMode {
    currentMode = currentMode === 'light' ? 'dark' : 'light';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('devground_theme_mode', currentMode);
      }
    } catch {}
    listeners.forEach((fn) => fn(currentMode));
    return currentMode;
  },
  subscribe(fn: (mode: ThemeMode) => void) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },
  colors: {
    get background() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).background; },
    get surface() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).surface; },
    get pillBg() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).pillBg; },
    get border() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).border; },
    get text() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).text; },
    get textLight() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).textLight; },
    get primary() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).primary; },
    get accent() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).accent; },
    get shadowDark() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).shadowDark; },
    get shadowLight() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).shadowLight; },
    get error() { return (currentMode === 'dark' ? DARK_COLORS : LIGHT_COLORS).error; },
  }
};
