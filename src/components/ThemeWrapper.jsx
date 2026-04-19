import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function ThemeWrapper({ children, style = {} }) {
  const { isDark } = useTheme();

  const colors = {
    light: {
      bg: '#f8f9fa',
      card: '#ffffff',
      text: '#1a1a1a',
      textMuted: '#666',
      border: '#ddd',
    },
    dark: {
      bg: '#0f172a',
      card: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
    },
  };

  const c = isDark ? colors.dark : colors.light;

  return (
    <div
      style={{
        background: c.bg,
        minHeight: '100vh',
        color: c.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
