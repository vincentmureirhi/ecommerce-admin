import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  changeAdminUserRole,
} from "../api/adminUsers";

function badgeStyle(status, isDark) {
  const value = String(status || "").toLowerCase();

  if (["active", "enabled"].includes(value)) {
    return {
      background: isDark ? "rgba(16,185,129,0.20)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#047857",
    };
  }

  if (["inactive", "disabled"].includes(value)) {
    return {
      background: isDark ? "rgba(239,68,68,0.20)" : "#fee2e2",
      color: isDark ? "#fca5a5" : "#b91c1c",
    };
  }

  return {
    background: isDark ? "rgba(148,163,184,0.20)" : "#e2e8f0",
    color: isDark ? "#cbd5e1" : "#475569",
  };
}

function roleBadgeStyle(role, isDark) {
  if (role === "superuser" || role === "superadmin") {
    return {
      background: isDark ? "rgba(245,158,11,0.20)" : "#fef3c7",
      color: isDark ? "#fbbf24" : "#b45309",
    };
  }
  if (role === "admin") {
    return {
      background: isDark ? "rgba(102,126,234,0.20)" : "#ede9fe",
      color: isDark ? "#a78bfa" : "#5b21b6",
    };
  }
  return {
    background: isDark ? "rgba(148,163,184,0.20)" : "#e2e8f0",
    color: isDark ? "#cbd5e1" : "#475569",
  };
}

const EMPTY_FORM = {
  name: "",
  email: "",
  username: "",
  password: "",
  role: "admin",
};

function ModalOverlay({ children, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

export default function AdminManagement() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState("");

  // Role change
  const [roleChangingId, setRoleChangingId] = useState(null);

  // Deactivate confirmation
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  async function loadAdmins() {
    try {
      setLoading(true);
      setErr("");
      const res = await listAdminUsers();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormMode("create");
    setEditingId(null);
    setFormErr("");
    setShowForm(true);
  }

  function openEdit(admin) {
    setForm({
      name: admin.name || "",
      email: admin.email || "",
      username: admin.username || "",
      password: "",
      role: admin.role || "admin",
    });
    setFormMode("edit");
    setEditingId(admin.id);
    setFormErr("");
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormErr("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      role: form.role,
    };

    if (formMode === "create" || form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (formMode === "create") {
        await createAdminUser(payload);
        showSuccess("Admin user created successfully");
      } else {
        await updateAdminUser(editingId, payload);
        showSuccess("Admin user updated successfully");
      }
      setShowForm(false);
      loadAdmins();
    } catch (e) {
      setFormErr(e?.response?.data?.message || e?.message || "Failed to save admin user");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleRoleChange(adminId, newRole) {
    setRoleChangingId(adminId);
    try {
      await changeAdminUserRole(adminId, newRole);
      showSuccess("Role updated");
      loadAdmins();
    } catch (e) {
      setErr(e?.message || "Failed to change role");
    } finally {
      setRoleChangingId(null);
    }
  }

  async function handleDeactivate() {
    if (!deactivatingId) return;
    setDeactivateLoading(true);
    try {
      await updateAdminUser(deactivatingId, { is_active: false, status: "inactive" });
      setDeactivatingId(null);
      showSuccess("Admin user deactivated");
      loadAdmins();
    } catch (e) {
      setErr(e?.message || "Failed to deactivate admin user");
      setDeactivatingId(null);
    } finally {
      setDeactivateLoading(false);
    }
  }

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 30, fontWeight: 800, color: c.text }}>
            👨‍💼 Admin Users
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Manage admin and superuser accounts — superadmin only
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: "#667eea",
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + New Admin User
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div
          style={{
            background: isDark ? "rgba(16,185,129,0.15)" : "#d1fae5",
            color: isDark ? "#4ade80" : "#047857",
            border: `1px solid ${isDark ? "rgba(16,185,129,0.3)" : "#a7f3d0"}`,
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {/* Error */}
      {err && (
        <div
          style={{
            background: isDark ? "rgba(239,68,68,0.10)" : "#fee2e2",
            color: isDark ? "#fca5a5" : "#b91c1c",
            border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#fecaca"}`,
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard
          title="Total Admin Users"
          value={rows.length}
          subtitle="All admin + superuser accounts"
          c={c}
        />
        <SummaryCard
          title="Superusers"
          value={rows.filter((r) => r.role === "superuser" || r.role === "superadmin").length}
          subtitle="Highest access level"
          c={c}
        />
        <SummaryCard
          title="Admins"
          value={rows.filter((r) => r.role === "admin").length}
          subtitle="Standard admin access"
          c={c}
        />
        <SummaryCard
          title="Active"
          value={rows.filter((r) => (r.status || "active") === "active" || r.is_active !== false).length}
          subtitle="Currently active accounts"
          c={c}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
            Loading admin users...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
            No admin users found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead>
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                  <th style={thStyle(c)}>Name / Username</th>
                  <th style={thStyle(c)}>Email</th>
                  <th style={thStyle(c)}>Role</th>
                  <th style={thStyle(c)}>Status</th>
                  <th style={thStyle(c)}>Last Login</th>
                  <th style={{ ...thStyle(c), textAlign: "center" }}>Change Role</th>
                  <th style={{ ...thStyle(c), textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((admin, idx) => {
                  const statusBadge = badgeStyle(admin.status || (admin.is_active === false ? "inactive" : "active"), isDark);
                  const rBadge = roleBadgeStyle(admin.role, isDark);
                  const isActive = admin.is_active !== false && (admin.status || "active") !== "inactive";

                  return (
                    <tr
                      key={admin.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.01)" : "#fafafa",
                      }}
                    >
                      <td style={tdPrimary(c)}>
                        {admin.name || admin.username || "—"}
                        {admin.username && admin.name && (
                          <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 400 }}>
                            @{admin.username}
                          </div>
                        )}
                      </td>

                      <td style={tdMuted(c)}>{admin.email}</td>

                      <td style={tdBase}>
                        <span
                          style={{
                            background: rBadge.background,
                            color: rBadge.color,
                            padding: "5px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-block",
                            textTransform: "capitalize",
                          }}
                        >
                          {admin.role}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span
                          style={{
                            background: statusBadge.background,
                            color: statusBadge.color,
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-block",
                          }}
                        >
                          {isActive ? "active" : "inactive"}
                        </span>
                      </td>

                      <td style={tdMuted(c)}>
                        {admin.last_login
                          ? new Date(admin.last_login).toLocaleDateString()
                          : "Never"}
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <select
                          value={admin.role}
                          disabled={roleChangingId === admin.id}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                          style={{
                            padding: "5px 8px",
                            border: `1px solid ${c.border}`,
                            borderRadius: 6,
                            fontSize: 12,
                            background: c.inputBg,
                            color: c.text,
                            cursor: "pointer",
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="superuser">Superuser</option>
                          <option value="staff">Staff</option>
                        </select>
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            type="button"
                            onClick={() => openEdit(admin)}
                            style={smallBtn("#667eea")}
                          >
                            Edit
                          </button>

                          {isActive && (
                            <button
                              type="button"
                              onClick={() => setDeactivatingId(admin.id)}
                              style={smallBtn("#f59e0b")}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ─── */}
      {showForm && (
        <ModalOverlay onClose={() => setShowForm(false)}>
          <div
            style={{
              background: c.card,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: c.text }}>
                {formMode === "create" ? "👤 New Admin User" : "✏️ Edit Admin User"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: c.textMuted,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {formErr && (
              <div
                style={{
                  background: isDark ? "rgba(239,68,68,0.10)" : "#fee2e2",
                  color: isDark ? "#fca5a5" : "#b91c1c",
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {formErr}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle(c)}>Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  style={inputStyle(c)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle(c)}>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@example.com"
                  style={inputStyle(c)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle(c)}>Username *</label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. johndoe"
                  style={inputStyle(c)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle(c)}>
                  Password {formMode === "edit" && "(leave blank to keep unchanged)"}
                  {formMode === "create" && " *"}
                </label>
                <input
                  required={formMode === "create"}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={formMode === "edit" ? "Leave blank to keep current password" : "Enter password"}
                  style={inputStyle(c)}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle(c)}>Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  style={inputStyle(c)}
                >
                  <option value="admin">Admin</option>
                  <option value="superuser">Superuser</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={btnSecondary(c)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: "10px 20px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: formLoading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    opacity: formLoading ? 0.7 : 1,
                  }}
                >
                  {formLoading
                    ? "Saving..."
                    : formMode === "create"
                    ? "Create User"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ─── Deactivate Confirmation Modal ─── */}
      {deactivatingId && (
        <ModalOverlay onClose={() => setDeactivatingId(null)}>
          <div
            style={{
              background: c.card,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ marginTop: 0, marginBottom: 10, color: c.text }}>
              Deactivate Admin User?
            </h3>
            <p style={{ color: c.textMuted, marginBottom: 24, fontSize: 13 }}>
              The user will no longer be able to log in to the admin dashboard. You can re-activate
              them later by editing their account.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeactivatingId(null)} style={btnSecondary(c)}>
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivateLoading}
                style={{
                  padding: "10px 20px",
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: deactivateLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  opacity: deactivateLoading ? 0.7 : 1,
                }}
              >
                {deactivateLoading ? "Deactivating..." : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, c }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: c.text }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: c.textMuted, marginTop: 8 }}>
        {subtitle}
      </div>
    </div>
  );
}

const tdBase = {
  padding: 14,
  fontSize: 13,
  verticalAlign: "middle",
};

function tdPrimary(c) {
  return { ...tdBase, color: c.text, fontWeight: 700 };
}

function tdMuted(c) {
  return { ...tdBase, color: c.textMuted };
}

function thStyle(c) {
  return {
    padding: 14,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    color: c.textMuted,
  };
}

function smallBtn(bg) {
  return {
    padding: "6px 12px",
    background: bg,
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  };
}

function labelStyle(c) {
  return {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    marginBottom: 5,
  };
}

function inputStyle(c) {
  return {
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 7,
    fontSize: 13,
    background: c.inputBg,
    color: c.text,
    boxSizing: "border-box",
  };
}

function btnSecondary(c) {
  return {
    padding: "10px 18px",
    background: c.buttonBg,
    color: c.text,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  };
}
