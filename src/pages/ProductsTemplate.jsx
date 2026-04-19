import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getThemeColors } from '../utils/themeColors';

export default function Products() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ color: c.text }}>📦 Products</h1>
      <div style={{
        background: c.card,
        borderRadius: '8px',
        padding: '20px',
        border: `1px solid ${c.border}`,
      }}>
        {/* Your content here with colors from c */}
      </div>
    </div>
  );
}
