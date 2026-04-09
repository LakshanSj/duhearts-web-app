// src/hooks/useTheme.js
import { useEffect } from 'react';
import { updateUserProfile } from '../services/userService';

export const THEMES = [
  {
    id: 'paper',
    name: '📜 Paper',
    description: 'Warm & cozy cartoon',
    preview: { bg: '#f4ebd8', card: '#e8cf92', accent: '#e6b265', pink: '#df8b91', border: '#4d3a2b' },
  },
  {
    id: 'midnight',
    name: '🌙 Midnight',
    description: 'Dark & mysterious',
    preview: { bg: '#1a1a2e', card: '#16213e', accent: '#e94560', pink: '#a855f7', border: '#a855f7' },
  },
  {
    id: 'ocean',
    name: '🌊 Ocean',
    description: 'Fresh & breezy',
    preview: { bg: '#e0f7fa', card: '#b2ebf2', accent: '#00acc1', pink: '#f06292', border: '#004d5e' },
  },
];

export const applyTheme = (themeId) => {
  document.documentElement.setAttribute('data-theme', themeId || 'paper');
};

export const useTheme = (userProfile) => {
  useEffect(() => {
    applyTheme(userProfile?.theme || 'paper');
  }, [userProfile?.theme]);

  const setTheme = async (themeId, uid) => {
    applyTheme(themeId);
    if (uid) {
      try {
        await updateUserProfile(uid, { theme: themeId });
      } catch (err) {
        console.error('Failed to save theme:', err);
      }
    }
  };

  return { currentTheme: userProfile?.theme || 'paper', setTheme };
};
