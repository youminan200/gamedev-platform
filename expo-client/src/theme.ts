export type ThemeMode = 'light' | 'dark';

// Retro GameBoy / Playdate Paper Workshop (Light)
const LIGHT_COLORS = {
  background: '#F4EFE6',
  surface: '#FFFFFF',
  pillBg: '#E6DFD3',
  border: '#1E2230',
  text: '#181A24',
  textLight: '#5A6075',
  primary: '#FA5C5C',
  accent: '#181A24',
  shadowDark: '#1E2230',
  shadowLight: '#1E2230',
  error: '#E63946'
};

// Itch.io / Arcade Cabinet Dark Workshop (Default)
const DARK_COLORS = {
  background: '#11131C',
  surface: '#1A1D2B',
  pillBg: '#252A3D',
  border: '#3A415E',
  text: '#F4F4F6',
  textLight: '#9BA3B8',
  primary: '#FF4D6D',
  accent: '#FFD166',
  shadowDark: '#05060A',
  shadowLight: '#3A415E',
  error: '#FF6B81'
};

const getInitialMode = (): ThemeMode => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('devground_theme_mode_v2');
      if (saved === 'dark' || saved === 'light') return saved;
    }
  } catch {}
  return 'dark';
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
        window.localStorage.setItem('devground_theme_mode_v2', currentMode);
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
