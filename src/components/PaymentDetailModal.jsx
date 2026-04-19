import React from 'react';
import { getPaymentAge, getPendingAgeCategory, getFailureReasonDisplay } from '../utils/paymentUtils';

export default function PaymentDetailModal({ payment, isDark, onClose }) {
  if (!payment) return null;

  const colors = {
    light: { bg: '#ffffff', text: '#1a1a1a', muted: '#666', border: '#e5e7eb', overlay: 'rgba(0,0,0,0.5)' },
    dark: { bg: '#1e293b', text: '#f1f5f9', muted: '#94a3b8', border: '#334155', overlay: 'rgba(0,0,0,0.8)' }
  };
  const c = isDark ? colors.dark : colors.light;

  const paymentAge = getPaymentAge(payment.created_at);
  const ageCategory = getPendingAgeCategory(payment.created_at);

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#dc2626';
      case 'reversed': return '#8b5cf6';
      default: return '#667eea';
    }
  };

  const getAgeCategoryColor = (category) => {
    switch(category) {
      case 'fresh': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#dc2626';
      default: return '#667eea';
    }
  };

  const DetailRow = ({ label, value, highlight = false }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      gap: '20px',
      padding: '12px 0',
      borderBottom: `1px solid ${c.border}`,
      alignItems: 'start'
    }}>
      <span style={{ fontWeight: 600, color: c.muted, fontSize: '13px' }}>{label}</span>
      <span style={{
        color: highlight ? getStatusColor(value) : c.text,
        fontWeight: highlight ? 600 : 400,
        fontSize: '14px',
        wordBreak: 'break-all'
      }}>
        {value || 'N/A'}
      </span>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: c.overlay,
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: c.bg,
        width: '100%',
        maxWidth: '500px',
        maxHeight: '100vh',
        overflowY: 'auto',
        boxShadow: '-2px 0 20px rgba(0,0,0,0.2)',
        animation: 'slideIn 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isDark ? '#0f172a' : '#f8f9fa',
          position: 'sticky',
          top: 0
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: c.text }}>
            Payment Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: c.muted
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1 }}>
          {/* Basic Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Basic Information
            </h3>
            <DetailRow label="Payment ID" value={payment.id} />
            <DetailRow label="Order ID" value={payment.order_id} />
            <DetailRow label="Amount" value={`KSh ${parseFloat(payment.amount).toLocaleString()}`} />
            <DetailRow label="Status" value={payment.status} highlight={true} />
            <DetailRow label="Method" value={payment.method || payment.payment_method} />
          </div>

          {/* Customer Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Customer Information
            </h3>
            <DetailRow label="Phone Number" value={payment.customer_phone} />
          </div>

          {/* M-Pesa Details */}
          {(payment.checkout_request_id || payment.merchant_request_id) && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                M-Pesa Details
              </h3>
              <DetailRow label="Checkout Request ID" value={payment.checkout_request_id} />
              <DetailRow label="Merchant Request ID" value={payment.merchant_request_id} />
              <DetailRow label="M-Pesa Receipt" value={payment.mpesa_receipt || payment.mpesa_receipt_number} />
              {payment.result_code !== null && <DetailRow label="Result Code" value={payment.result_code} />}
              {payment.result_desc && <DetailRow label="Result Description" value={payment.result_desc} />}
            </div>
          )}

          {/* Failure Info */}
          {payment.status === 'failed' && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Failure Details
              </h3>
              <DetailRow label="Failure Reason" value={getFailureReasonDisplay(payment.failure_reason)} />
            </div>
          )}

          {/* Timing Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Timeline
            </h3>
            <DetailRow label="Created At" value={new Date(payment.created_at).toLocaleString()} />
            {payment.initiated_at && <DetailRow label="Initiated At" value={new Date(payment.initiated_at).toLocaleString()} />}
            {payment.callback_received_at && <DetailRow label="Callback Received" value={new Date(payment.callback_received_at).toLocaleString()} />}
            {payment.completed_at && <DetailRow label="Completed At" value={new Date(payment.completed_at).toLocaleString()} />}
            {payment.status === 'pending' && (
              <div style={{
                padding: '12px',
                background: getAgeCategoryColor(ageCategory).match(/green/) ? 'rgba(16, 185, 129, 0.1)' : 
                           getAgeCategoryColor(ageCategory).match(/amber/) ? 'rgba(245, 158, 11, 0.1)' :
                           'rgba(220, 38, 38, 0.1)',
                borderLeft: `4px solid ${getAgeCategoryColor(ageCategory)}`,
                borderRadius: '4px',
                marginTop: '8px'
              }}>
                <span style={{ fontSize: '12px', color: c.text, fontWeight: 500 }}>
                  Pending for {paymentAge} minutes
                  {ageCategory === 'fresh' && ' ✅ (Fresh)'}
                  {ageCategory === 'warning' && ' ⚠️ (Warning)'}
                  {ageCategory === 'critical' && ' 🔴 (Critical)'}
                </span>
              </div>
            )}
          </div>

          {/* Reference Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              References
            </h3>
            <DetailRow label="Transaction ID" value={payment.transaction_id} />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px',
          borderTop: `1px solid ${c.border}`,
          backgroundColor: isDark ? '#0f172a' : '#f8f9fa',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: c.border,
              color: c.text,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px'
            }}
          >
            Close
          </button>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
