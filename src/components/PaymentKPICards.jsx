import React from 'react';

export default function PaymentKPICards({ metrics, isDark }) {
  const colors = {
    light: { bg: '#ffffff', text: '#1a1a1a', muted: '#666', border: '#e5e7eb' },
    dark: { bg: '#1e293b', text: '#f1f5f9', muted: '#94a3b8', border: '#334155' }
  };
  const c = isDark ? colors.dark : colors.light;

  const kpis = [
    {
      label: 'Total Collected',
      value: `KSh ${metrics.totalCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: '💰',
      color: '#10b981',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'
    },
    {
      label: 'Completed',
      value: metrics.completed,
      icon: '✅',
      color: '#10b981',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'
    },
    {
      label: 'Pending',
      value: metrics.pending,
      icon: '⏳',
      color: '#f59e0b',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)'
    },
    {
      label: 'Failed',
      value: metrics.failed,
      icon: '❌',
      color: '#dc2626',
      bgColor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)'
    },
    {
      label: 'Success Rate',
      value: `${metrics.successRate}%`,
      icon: '📊',
      color: '#667eea',
      bgColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.05)'
    },
    {
      label: 'Refunded',
      value: metrics.refunded,
      icon: '↩️',
      color: '#8b5cf6',
      bgColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'
    },
    {
      label: 'Unmatched',
      value: metrics.unmatched,
      icon: '⚠️',
      color: '#ec4899',
      bgColor: isDark ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.05)'
    },
    {
      label: 'STK Success',
      value: `${metrics.stkSuccessRate}%`,
      icon: '📱',
      color: '#06b6d4',
      bgColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.05)'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '30px'
    }}>
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
            <span style={{ fontSize: '12px', color: c.muted, fontWeight: 500 }}>{kpi.label}</span>
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: kpi.color,
            marginBottom: '8px'
          }}>
            {kpi.value}
          </div>
          <div style={{
            height: '4px',
            background: kpi.bgColor,
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: kpi.color,
              width: '60%'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
