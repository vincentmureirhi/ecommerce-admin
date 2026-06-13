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
    padding: "11px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: c.bg,
    color: c.text,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 800,
    color: c.textMuted,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      setErr("Supplier name is required");
      return;
    }

    const parsedLeadTime = Number(leadTimeDays);

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
      lead_time_days: Number.isFinite(parsedLeadTime) && parsedLeadTime >= 0 ? parsedLeadTime : 0,
    };

    onSave(payload);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.58)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 2000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "92vh",
          overflowY: "auto",
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          boxShadow: "0 24px 64px rgba(0,0,0,0.24)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <p style={{ margin: "0 0 5px", color: "#0f766e", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
              Supplier record
            </p>
            <h2 style={{ margin: 0, fontSize: 21, color: c.text, fontWeight: 900 }}>
              {initialData?.id ? "Edit supplier" : "Add supplier"}
            </h2>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: c.textMuted }}>
              Maintain contacts, terms, lead times, and operational notes.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close supplier form"
            style={{
              border: `1px solid ${c.border}`,
              background: c.bg,
              color: c.text,
              cursor: saving ? "not-allowed" : "pointer",
              borderRadius: 8,
              fontSize: 18,
              fontWeight: 900,
              width: 34,
              height: 34,
              lineHeight: "30px",
            }}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {err && (
            <div
              style={{
                background: isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)",
                color: isDark ? "#fca5a5" : "#b91c1c",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                border: `1px solid ${isDark ? "rgba(248, 113, 113, 0.34)" : "rgba(239, 68, 68, 0.18)"}`,
                fontSize: 13,
              }}
            >
              {err}
            </div>
          )}

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Supplier name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Supplier or manufacturer name"
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
                placeholder="What this supplier mainly provides"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div>
                <label style={labelStyle}>Contact person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Primary contact"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254..."
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="procurement@example.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Payment terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Cash, Net 7, Net 30..."
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div>
                <label style={labelStyle}>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Physical or delivery address"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Lead time days</label>
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

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reorder pattern, negotiated terms, preferred contact time, delivery constraints..."
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: 100,
                }}
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: `1px solid ${c.border}`,
                background: c.bg,
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                color: c.text,
                fontWeight: 800,
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Supplier is active for procurement and reporting
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
              flexWrap: "wrap",
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
                background: c.bg,
                color: c.text,
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 800,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#0f766e",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 900,
                opacity: saving ? 0.72 : 1,
              }}
            >
              {saving ? "Saving..." : initialData?.id ? "Update supplier" : "Save supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
