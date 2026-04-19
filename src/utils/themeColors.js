export const getThemeColors = (isDark) => {
  if (isDark) {
    return {
      bg: '#0f172a',
      card: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      textLight: '#64748b',
      border: '#334155',
      borderLight: '#475569',
      headerBg: '#1a1f2e',
      rowBg1: '#1e293b',
      rowBg2: '#232f3f',
      inputBg: '#0f172a',
      buttonBg: '#334155',
      buttonHover: '#475569',
    };
  }
  return {
    bg: '#f8f9fa',
    card: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#666',
    textLight: '#999',
    border: '#ddd',
    borderLight: '#eee',
    headerBg: '#f8f9fa',
    rowBg1: '#fff',
    rowBg2: '#f9f9f9',
    inputBg: '#fff',
    buttonBg: '#f3f4f6',
    buttonHover: '#e5e7eb',
  };
};
