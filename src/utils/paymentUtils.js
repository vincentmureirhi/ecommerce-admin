// Calculate payment metrics
export const calculateMetrics = (payments) => {
  if (!payments || payments.length === 0) {
    return {
      totalCollected: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      successRate: 0,
      refunded: 0,
      unmatched: 0,
      stkSent: 0,
      stkSuccessRate: 0,
    };
  }

  const completed = payments.filter(p => p.status === 'completed').length;
  const pending = payments.filter(p => p.status === 'pending').length;
  const failed = payments.filter(p => p.status === 'failed').length;
  const refunded = payments.filter(p => p.status === 'reversed').length;
  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const unmatched = payments.filter(p => !p.order_id).length;
  const stkSent = payments.filter(p => p.checkout_request_id).length;
  const stkSuccess = payments.filter(p => p.checkout_request_id && p.status === 'completed').length;

  return {
    totalCollected,
    completed,
    pending,
    failed,
    successRate: payments.length > 0 ? ((completed / payments.length) * 100).toFixed(1) : 0,
    refunded,
    unmatched,
    stkSent,
    stkSuccessRate: stkSent > 0 ? ((stkSuccess / stkSent) * 100).toFixed(1) : 0,
  };
};

// Get payment age in minutes
export const getPaymentAge = (createdAt) => {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now - created) / 60000); // minutes
};

// Categorize pending age
export const getPendingAgeCategory = (createdAt) => {
  const age = getPaymentAge(createdAt);
  if (!age) return 'unknown';
  if (age < 2) return 'fresh';
  if (age < 10) return 'warning';
  return 'critical';
};

// Filter payments by date range
export const filterByDateRange = (payments, days) => {
  if (!payments) return [];
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return payments.filter(p => {
    const date = new Date(p.created_at);
    return date >= cutoff;
  });
};

// Search payments
export const searchPayments = (payments, query) => {
  if (!query || !payments) return payments;
  const q = query.toLowerCase();

  return payments.filter(p =>
    (p.order_id?.toString().toLowerCase().includes(q)) ||
    (p.customer_phone?.toLowerCase().includes(q)) ||
    (p.mpesa_receipt?.toLowerCase().includes(q)) ||
    (p.checkout_request_id?.toLowerCase().includes(q)) ||
    (p.merchant_request_id?.toLowerCase().includes(q))
  );
};

// Export CSV
export const exportToCSV = (payments, filename = 'payments.csv') => {
  if (!payments || payments.length === 0) {
    alert('No payments to export');
    return;
  }

  const headers = [
    'ID', 'Order ID', 'Amount', 'Method', 'Status', 'Phone', 'M-Pesa Receipt',
    'Failure Reason', 'Created At', 'Completed At'
  ];

  const rows = payments.map(p => [
    p.id,
    p.order_id || 'N/A',
    p.amount,
    p.method || p.payment_method || 'N/A',
    p.status,
    p.customer_phone || 'N/A',
    p.mpesa_receipt || 'N/A',
    p.failure_reason || 'N/A',
    new Date(p.created_at).toLocaleString(),
    p.completed_at ? new Date(p.completed_at).toLocaleString() : 'N/A'
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};

// Get failure reason display
export const getFailureReasonDisplay = (reason) => {
  const reasons = {
    'cancelled': 'User Cancelled',
    'insufficient': 'Insufficient Balance',
    'wrong_pin': 'Wrong PIN',
    'timeout': 'Timeout',
    'callback_not_received': 'Callback Not Received',
    'validation_error': 'Validation Error',
    'duplicate': 'Duplicate Request',
    'system_error': 'System Error',
  };
  return reasons[reason] || reason || 'Unknown';
};
