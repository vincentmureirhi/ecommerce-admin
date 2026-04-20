import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../api/blog";

const EMPTY_FORM = {
  title: "",
  content: "",
  featured_image_url: "",
  product_id: "",
  status: "draft",
};

function ModalOverlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function statusBadge(status, isDark) {
  if (status === "published") {
    return {
      background: isDark ? "rgba(16,185,129,0.2)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#065f46",
    };
  }
  return {
    background: isDark ? "rgba(245,158,11,0.2)" : "#fef3c7",
    color: isDark ? "#fbbf24" : "#92400e",
  };
}

export default function Blog() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  }

  async function loadPosts() {
    try {
      setLoading(true);
      setErr("");
      const res = await listBlogPosts();
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setPosts(rows);
    } catch (e) {
      setErr(e?.message || "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormMode("create");
    setEditingId(null);
    setFormErr("");
    setShowForm(true);
  }

  function openEdit(post) {
    setForm({
      title: post.title || "",
      content: post.content || "",
      featured_image_url: post.featured_image_url || "",
      product_id: post.product_id ? String(post.product_id) : "",
      status: post.status || "draft",
    });
    setFormMode("edit");
    setEditingId(post.id);
    setFormErr("");
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormErr("Title is required");
      return;
    }
    if (!form.content.trim()) {
      setFormErr("Content is required");
      return;
    }

    setFormLoading(true);
    setFormErr("");

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      featured_image_url: form.featured_image_url.trim() || null,
      product_id: form.product_id ? (Number.isFinite(parseInt(form.product_id, 10)) ? parseInt(form.product_id, 10) : null) : null,
      status: form.status,
    };

    try {
      if (formMode === "create") {
        await createBlogPost(payload);
        showSuccess("Blog post created successfully!");
      } else {
        await updateBlogPost(editingId, payload);
        showSuccess("Blog post updated successfully!");
      }
      setShowForm(false);
      loadPosts();
    } catch (e) {
      setFormErr(e?.message || "Failed to save blog post");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteBlogPost(deletingId);
      setDeletingId(null);
      showSuccess("Blog post deleted");
      loadPosts();
    } catch (e) {
      setErr(e?.message || "Failed to delete blog post");
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const thStyle = {
    padding: "12px 16px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: c.textMuted,
    textAlign: "left",
  };

  const tdStyle = {
    padding: "14px 16px",
    fontSize: 13,
    verticalAlign: "middle",
    color: c.text,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    fontSize: 13,
    boxSizing: "border-box",
    background: c.inputBg || (isDark ? "#0f172a" : "#f8f9fa"),
    color: c.text,
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    marginBottom: 5,
  };

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
          <h1 style={{ margin: "0 0 5px 0", fontSize: 28, fontWeight: 800, color: c.text }}>
            📝 Blog Management
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Create and manage product blog posts — published posts appear on the storefront
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            padding: "10px 18px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          + New Blog Post
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div
          style={{
            background: isDark ? "rgba(16,185,129,0.15)" : "#d1fae5",
            color: isDark ? "#4ade80" : "#065f46",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* Error */}
      {err && (
        <div
          style={{
            background: isDark ? "rgba(239,68,68,0.15)" : "#fee2e2",
            color: isDark ? "#fca5a5" : "#b91c1c",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ⚠️ {err}
        </div>
      )}

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
            Loading blog posts...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
            No blog posts yet. Click "+ New Blog Post" to create one.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Product ID</th>
                  <th style={thStyle}>Image</th>
                  <th style={thStyle}>Created</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, idx) => {
                  const badge = statusBadge(post.status, isDark);
                  return (
                    <tr
                      key={post.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background:
                          idx % 2 === 0
                            ? "transparent"
                            : isDark
                            ? "rgba(255,255,255,0.01)"
                            : "#fafafa",
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {post.title}
                        {post.content && (
                          <div
                            style={{
                              fontSize: 11,
                              color: c.textMuted,
                              marginTop: 2,
                              fontWeight: 400,
                              maxWidth: 320,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {post.content.substring(0, 80)}…
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            ...badge,
                          }}
                        >
                          {post.status === "published" ? "✅ Published" : "📄 Draft"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: c.textMuted }}>
                        {post.product_id || "—"}
                      </td>
                      <td style={tdStyle}>
                        {post.featured_image_url ? (
                          <img
                            src={post.featured_image_url}
                            alt="cover"
                            style={{
                              width: 48,
                              height: 36,
                              objectFit: "cover",
                              borderRadius: 4,
                              border: `1px solid ${c.border}`,
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <span style={{ color: c.textMuted, fontSize: 11 }}>No image</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, color: c.textMuted }}>
                        {post.created_at
                          ? new Date(post.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            onClick={() => openEdit(post)}
                            style={{
                              padding: "5px 12px",
                              background: "#667eea",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(post.id)}
                            style={{
                              padding: "5px 12px",
                              background: "#dc2626",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
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

      {/* Create / Edit Modal */}
      {showForm && (
        <ModalOverlay onClose={() => setShowForm(false)}>
          <div
            style={{
              background: c.card,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 560,
              maxHeight: "90vh",
              overflowY: "auto",
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
                {formMode === "create" ? "📝 New Blog Post" : "✏️ Edit Blog Post"}
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
                <label style={labelStyle}>Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. The Benefits of Vitamin C Serum"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Content *</label>
                <textarea
                  required
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Write the blog post content here..."
                  style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Featured Image URL</label>
                <input
                  type="url"
                  value={form.featured_image_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, featured_image_url: e.target.value }))
                  }
                  placeholder="https://example.com/image.jpg"
                  style={inputStyle}
                />
                {form.featured_image_url && (
                  <img
                    src={form.featured_image_url}
                    alt="preview"
                    style={{
                      marginTop: 8,
                      width: "100%",
                      maxHeight: 120,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: `1px solid ${c.border}`,
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Associated Product ID</label>
                  <input
                    type="number"
                    min="1"
                    value={form.product_id}
                    onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                    placeholder="Optional product ID"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="draft">📄 Draft</option>
                    <option value="published">✅ Published</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "10px 18px",
                    background: isDark ? "#334155" : "#e5e7eb",
                    color: c.text,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
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
                    ? "Create Post"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <ModalOverlay onClose={() => setDeletingId(null)}>
          <div
            style={{
              background: c.card,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 400,
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ marginTop: 0, marginBottom: 10, color: c.text }}>Delete Blog Post?</h3>
            <p style={{ color: c.textMuted, marginBottom: 24, fontSize: 13 }}>
              This action cannot be undone. The blog post will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setDeletingId(null)}
                style={{
                  padding: "10px 20px",
                  background: isDark ? "#334155" : "#e5e7eb",
                  color: c.text,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  padding: "10px 20px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
