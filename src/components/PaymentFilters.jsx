import React, { useState } from 'react';

export default function PaymentFilters({ onFilterChange, isDark }) {
  const colors = {
    light: { bg: '#ffffff', text: '#1a1a1a', muted: '#666', border: '#e5e7eb', input: '#f3f4f6' },
    dark: { bg: '#1e293b', text: '#f1f5f9', muted: '#94a3b8', border: '#334155', input: '#0f172a' }
  };
  const c = isDark ? colors.dark : colors.light;

  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    dateRange: '7days',
    search: '',
    minAmount: '',
    maxAmount: ''
  });

  const [expandedFilters, setExpandedFilters] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleResetFilters = () => {
    const reset = {
      status: 'all',
      method: 'all',
      dateRange: '7days',
      search: '',
      minAmount: '',
      maxAmount: ''
    };
    setFilters(reset);
    onFilterChange(reset);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="🔍 Search by Order ID, Phone, M-Pesa Code, or Customer Name..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: c.input,
            border: `1px solid ${c.border}`,
            borderRadius: '6px',
            color: c.text,
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Quick Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Status Filter */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '6px' }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: c.input,
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              color: c.text,
              fontSize: '13px',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            <option value="all">All Status</option>
            <option value="completed">✅ Completed</option>
            <option value="pending">⏳ Pending</option>
            <option value="failed">❌ Failed</option>
            <option value="reversed">↩️ Refunded</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '6px' }}>
            Payment Method
          </label>
          <select
            value={filters.method}
            onChange={(e) => handleFilterChange('method', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: c.input,
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              color: c.text,
              fontSize: '13px',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            <option value="all">All Methods</option>
            <option value="mpesa">📱 M-Pesa</option>
            <option value="cash">💵 Cash</option>
            <option value="card">💳 Card</option>
            <option value="bank">🏦 Bank</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '6px' }}>
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: c.input,
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              color: c.text,
              fontSize: '13px',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            <option value="today">📅 Today</option>
            <option value="yesterday">📅 Yesterday</option>
            <option value="7days">📅 7 Days</option>
            <option value="30days">📅 30 Days</option>
            <option value="thismonth">📅 This Month</option>
            <option value="all">📅 All Time</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setExpandedFilters(!expandedFilters)}
        style={{
          background: 'none',
          border: 'none',
          color: '#667eea',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          padding: '0',
          marginBottom: expandedFilters ? '16px' : '0'
        }}
      >
        {expandedFilters ? '▼ Advanced Filters' : '▶ Advanced Filters'}
      </button>

      {/* Advanced Filters */}
      {expandedFilters && (
        <div style={{
          background: c.input,
          border: `1px solid ${c.border}`,
          borderRadius: '6px',
          padding: '16px',
          marginTop: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '6px' }}>
              Min Amount (KSh)
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: '6px',
                color: c.text,
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: c.muted, display: 'block', marginBottom: '6px' }}>
              Max Amount (KSh)
            </label>
            <input
              type="number"
              placeholder="999999"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: '6px',
                color: c.text,
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              onClick={handleResetFilters}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              🔄 Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
