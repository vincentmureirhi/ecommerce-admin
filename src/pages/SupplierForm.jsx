import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";

export default function SupplierForm({ initialData = {}, onSave, onCancel, saving = false }) {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [name, setName] = useState(initialData.name || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [contactPerson, setContactPerson] = useState(initialData.contact_person || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [address, setAddress] = useState(initialData.address || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [isActive, setIsActive] = useState(
    initialData.is_active !== undefined ? initialData.is_active : true
  );
  const [paymentTerms, setPaymentTerms] = useState(initialData.payment_terms || "");
  const [leadTimeDays, setLeadTimeDays] = useState(
    initialData.lead_time_days !== undefined && initialData.lead_time_days !== null
      ? initialData.lead_time_days
      : 0
  );
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(initialData.name || "");
    setDescription(initialData.description || "");
    setContactPerson(initialData.contact_person || "");
    setPhone(initialData.phone || "");
    setEmail(initialData.email || "");
    setAddress(initialData.address || "");
    setNotes(initialData.notes || "");
    setIsActive(initialData.is_active !== undefined ? initialData.is_active : true);
    setPaymentTerms(initialData.payment_terms || "");
    setLeadTimeDays(
      initialData.lead_time_days !== undefined && initialData.lead_time_days !== null
        ? initialData.lead_time_days
        : 0
    );
    setErr("");
  }, [initialData]);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: c.card,
    color: c.text,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 600,
    color: c.textMuted,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      setErr("Supplier name is required");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      contact_person: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      is_active: isActive,
      payment_terms: paymentTerms.trim(),
      lead_time_days: Number.isNaN(Number(leadTimeDays)) ? 0 : Number(leadTimeDays),
    };

    onSave(payload);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 2000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: c.text }}>
              {initialData?.id ? "Edit Supplier" : "Add Supplier"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: c.textMuted }}>
              Fill in supplier details below
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              border: "none",
              background: "transparent",
              color: c.textMuted,
              cursor: "pointer",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {err && (
            <div
              style={{
                background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
                color: isDark ? "#ff6b6b" : "#c33",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
                fontSize: 13,
              }}
            >
              ⚠️ {err}
            </div>
          )}

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Supplier Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter supplier name"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <div>
                <label style={labelStyle}>Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Main contact person"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Physical address"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Extra notes about this supplier"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: 90,
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <div>
                <label style={labelStyle}>Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 30"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Lead Time Days</label>
                <input
                  type="number"
                  min={0}
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: c.text,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Supplier is active
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 22,
              paddingTop: 18,
              borderTop: `1px solid ${c.border}`,
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                background: c.card,
                color: c.text,
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#667eea",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 700,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : initialData?.id ? "Update Supplier" : "Save Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

