// src/hooks/useTheme.js
// Defines all available themes and the applyTheme utility used by Settings.jsx

export const THEMES = [
  {
    id: 'paper',
    name: 'Paper',
    description: 'Warm parchment & cartoon ink — the classic DuoHearts look',
    preview: {
      bg:     '#f4ebd8',
      card:   '#e8cf92',
      accent: '#e6b265',
      pink:   '#df8b91',
      border: '#4d3a2b',
    },
    vars: {
      '--bg-primary':          '#f4ebd8',
      '--bg-secondary':        '#e8cf92',
      '--accent-primary':      '#e6b265',
      '--accent-secondary':    '#df8b91',
      '--accent-hover':        '#c77b80',
      '--text-main':           '#4d3a2b',
      '--text-muted':          '#6b5544',
      '--text-error':          '#cc4d4d',
      '--glass-bg':            '#e8cf92',
      '--glass-border':        '#4d3a2b',
      '--solid-shadow':        '4px 4px 0px rgba(77,58,43,0.2)',
      '--solid-shadow-hover':  '6px 6px 0px rgba(77,58,43,0.3)',
    },
  },
  {
    id: 'night',
    name: 'Midnight',
    description: 'Deep navy & soft glow — easy on the eyes at night',
    preview: {
      bg:     '#1a1b2e',
      card:   '#252641',
      accent: '#7c6af7',
      pink:   '#f07bbd',
      border: '#3d3e60',
    },
    vars: {
      '--bg-primary':          '#1a1b2e',
      '--bg-secondary':        '#252641',
      '--accent-primary':      '#7c6af7',
      '--accent-secondary':    '#f07bbd',
      '--accent-hover':        '#d45ca0',
      '--text-main':           '#e8e8f8',
      '--text-muted':          '#9191b8',
      '--text-error':          '#ff6b6b',
      '--glass-bg':            '#252641',
      '--glass-border':        '#3d3e60',
      '--solid-shadow':        '4px 4px 0px rgba(0,0,0,0.4)',
      '--solid-shadow-hover':  '6px 6px 0px rgba(0,0,0,0.5)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy greens & warm wood tones — calm & natural',
    preview: {
      bg:     '#e8f0e9',
      card:   '#c8ddc9',
      accent: '#5a8a5e',
      pink:   '#c47b5a',
      border: '#3b5e3e',
    },
    vars: {
      '--bg-primary':          '#e8f0e9',
      '--bg-secondary':        '#c8ddc9',
      '--accent-primary':      '#5a8a5e',
      '--accent-secondary':    '#c47b5a',
      '--accent-hover':        '#a4623f',
      '--text-main':           '#2d4a30',
      '--text-muted':          '#5a7a5e',
      '--text-error':          '#c0392b',
      '--glass-bg':            '#c8ddc9',
      '--glass-border':        '#3b5e3e',
      '--solid-shadow':        '4px 4px 0px rgba(43,77,46,0.2)',
      '--solid-shadow-hover':  '6px 6px 0px rgba(43,77,46,0.3)',
    },
  },
  {
    id: 'candy',
    name: 'Candy',
    description: 'Bubblegum brights & pastel pops — playful & sweet',
    preview: {
      bg:     '#fff0f8',
      card:   '#ffd6ee',
      accent: '#ff6bbf',
      pink:   '#b86bff',
      border: '#cc44aa',
    },
    vars: {
      '--bg-primary':          '#fff0f8',
      '--bg-secondary':        '#ffd6ee',
      '--accent-primary':      '#ff6bbf',
      '--accent-secondary':    '#b86bff',
      '--accent-hover':        '#9a44ee',
      '--text-main':           '#5a1a4a',
      '--text-muted':          '#9a5a8a',
      '--text-error':          '#cc2255',
      '--glass-bg':            '#ffd6ee',
      '--glass-border':        '#cc44aa',
      '--solid-shadow':        '4px 4px 0px rgba(170,44,136,0.2)',
      '--solid-shadow-hover':  '6px 6px 0px rgba(170,44,136,0.3)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues & sea-foam greens — fresh and dreamy',
    preview: {
      bg:     '#e8f4fc',
      card:   '#c2e4f5',
      accent: '#2891c8',
      pink:   '#27bfb5',
      border: '#1a6b9a',
    },
    vars: {
      '--bg-primary':          '#e8f4fc',
      '--bg-secondary':        '#c2e4f5',
      '--accent-primary':      '#2891c8',
      '--accent-secondary':    '#27bfb5',
      '--accent-hover':        '#1e9e94',
      '--text-main':           '#0d3a5c',
      '--text-muted':          '#3a7a9c',
      '--text-error':          '#cc3333',
      '--glass-bg':            '#c2e4f5',
      '--glass-border':        '#1a6b9a',
      '--solid-shadow':        '4px 4px 0px rgba(26,107,154,0.2)',
      '--solid-shadow-hover':  '6px 6px 0px rgba(26,107,154,0.3)',
    },
  },
];

/**
 * Applies a theme by setting its CSS variables on :root.
 * @param {string} themeId - One of the THEMES[].id values
 */
export const applyTheme = (themeId) => {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
};

/**
 * Call this once on app load to restore the saved theme.
 * @param {string|undefined} themeId
 */
export const initTheme = (themeId) => {
  applyTheme(themeId || 'paper');
};
