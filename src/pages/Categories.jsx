import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
  const { isDark } = useTheme();
  const { token } = useAuth();

  const colors = {
    light: { bg: '#f8f9fa', card: '#ffffff', text: '#1a1a1a', border: '#e5e7eb', muted: '#666' },
    dark: { bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', border: '#334155', muted: '#94a3b8' }
  };
  const c = isDark ? colors.dark : colors.light;

  // State
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active",
    display_order: 0,
    department_id: "",
    parent_category_id: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Filter & search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");
      const [catsRes, prodsRes] = await Promise.all([
        fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const catsData = await catsRes.json();
      const prodsData = await prodsRes.json();

      setCategories(Array.isArray(catsData.data) ? catsData.data : []);
      setProducts(Array.isArray(prodsData.data) ? prodsData.data : []);

      // Departments endpoint is optional — gracefully handle 404
      try {
        const deptsRes = await fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } });
        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          setDepartments(Array.isArray(deptsData.data) ? deptsData.data : []);
        }
      } catch {
        // departments endpoint unavailable — continue without it
      }
    } catch (e) {
      setErr("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      setErr("Category name is required");
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug,
          description: formData.description.trim(),
          status: formData.status,
          display_order: parseInt(formData.display_order) || 0,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          parent_category_id: formData.parent_category_id ? parseInt(formData.parent_category_id) : null
        })
      });

      if (response.ok) {
        setSuccessMsg("Category created successfully!");
        setShowAddModal(false);
        resetForm();
        loadData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErr("Failed to create category");
      }
    } catch (e) {
      setErr("Error creating category");
    }
  };

  const handleEditCategory = async () => {
    if (!formData.name.trim()) {
      setErr("Category name is required");
      return;
    }

    try {
      const response = await fetch(`/api/categories/${editingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug,
          description: formData.description.trim(),
          status: formData.status,
          display_order: parseInt(formData.display_order) || 0,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          parent_category_id: formData.parent_category_id ? parseInt(formData.parent_category_id) : null
        })
      });

      if (response.ok) {
        setSuccessMsg("Category updated successfully!");
        setShowEditModal(false);
        resetForm();
        loadData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErr("Failed to update category");
      }
    } catch (e) {
      setErr("Error updating category");
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccessMsg("Category deleted successfully!");
        setShowDeleteModal(false);
        setDeletingCategory(null);
        loadData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErr("Failed to delete category");
      }
    } catch (e) {
      setErr("Error deleting category");
    }
  };

  const openEditModal = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug || "",
      description: category.description || "",
      status: category.status || "active",
      display_order: category.display_order || 0,
      department_id: category.department_id || "",
      parent_category_id: category.parent_category_id || ""
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      status: "active",
      display_order: 0,
      department_id: "",
      parent_category_id: ""
    });
    setEditingId(null);
  };

  const getProductsInCategory = (catId) => {
    return products.filter(p => p.category_id === catId);
  };

  const getLowStockProducts = (catId) => {
    return getProductsInCategory(catId).filter(p => {
      const stock = p.current_stock || 0;
      const reorder = p.reorder_level || 0;
      return stock > 0 && stock <= reorder;
    });
  };

  const getOutOfStockProducts = (catId) => {
    return getProductsInCategory(catId).filter(p => (p.current_stock || 0) === 0);
  };

  const getTotalStock = (catId) => {
    return getProductsInCategory(catId).reduce((sum, p) => sum + (p.current_stock || 0), 0);
  };

  const getTotalValue = (catId) => {
    return getProductsInCategory(catId).reduce((sum, p) => sum + ((p.current_stock || 0) * (p.cost_price || 0)), 0);
  };

  // Filter & sort
  let filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase()) || 
                         (cat.slug && cat.slug.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || cat.status === statusFilter;
    const matchesDept = departmentFilter === "all" || cat.department_id === parseInt(departmentFilter);
    const productCount = getProductsInCategory(cat.id).length;
    
    return matchesSearch && matchesStatus && matchesDept;
  });

  filteredCategories.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "products":
        return getProductsInCategory(b.id).length - getProductsInCategory(a.id).length;
      case "stock":
        return getTotalStock(b.id) - getTotalStock(a.id);
      case "value":
        return getTotalValue(b.id) - getTotalValue(a.id);
      case "updated":
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      default:
        return 0;
    }
  });

  // KPIs
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.status === "active").length;
  const emptyCategories = categories.filter(c => getProductsInCategory(c.id).length === 0).length;
  const lowStockCats = categories.filter(c => getLowStockProducts(c.id).length > 0).length;
  const totalInventoryValue = categories.reduce((sum, c) => sum + getTotalValue(c.id), 0);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: c.muted }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "20px", background: c.bg, minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
          <div>
            <h1 style={{ margin: "0 0 5px 0", fontSize: 28, fontWeight: 700, color: c.text }}>Categories</h1>
            <p style={{ margin: 0, fontSize: 14, color: c.muted }}>Manage product categories and inventory organization</p>
          </div>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} style={{ padding: "10px 20px", background: "#667eea", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            + Add Category
          </button>
        </div>

        {/* KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <KPICard icon="📁" label="Total Categories" value={totalCategories} color="#667eea" c={c} />
          <KPICard icon="✅" label="Active" value={activeCategories} color="#10b981" c={c} />
          <KPICard icon="📭" label="Empty" value={emptyCategories} color="#f59e0b" c={c} />
          <KPICard icon="⚠️" label="Low Stock" value={lowStockCats} color="#ff5f57" c={c} />
          <KPICard icon="💰" label="Inventory Value" value={`KSh ${totalInventoryValue.toLocaleString()}`} color="#8b5cf6" c={c} />
        </div>
      </div>

      {/* MESSAGES */}
      {err && <div style={{ background: "#fee", color: "#c33", padding: 12, borderRadius: 6, marginBottom: 20, border: "1px solid #fdd" }}>{err}</div>}
      {successMsg && <div style={{ background: "#efe", color: "#3c3", padding: 12, borderRadius: 6, marginBottom: 20, border: "1px solid #dfd" }}>{successMsg}</div>}

      {/* FILTERS */}
      <div style={{ background: c.card, borderRadius: 8, padding: 16, marginBottom: 20, border: `1px solid ${c.border}` }}>
        <input type="text" placeholder="Search by name or slug..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: isDark ? "#0f172a" : "#f3f4f6", border: `1px solid ${c.border}`, borderRadius: 6, color: c.text, fontSize: 13, marginBottom: 12, boxSizing: "border-box" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ id: "all", name: "All Status" }, { id: "active", name: "Active" }, { id: "inactive", name: "Inactive" }, { id: "archived", name: "Archived" }]} c={c} isDark={isDark} />
          <FilterSelect label="Department" value={departmentFilter} onChange={setDepartmentFilter} options={[{ id: "all", name: "All Departments" }, ...departments.map(d => ({ id: d.id, name: d.name }))]} c={c} isDark={isDark} />
          <FilterSelect label="Sort By" value={sortBy} onChange={setSortBy} options={[{ id: "name", name: "Name A-Z" }, { id: "products", name: "Most Products" }, { id: "stock", name: "Highest Stock" }, { id: "value", name: "Stock Value" }, { id: "updated", name: "Recently Updated" }]} c={c} isDark={isDark} />
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setDepartmentFilter("all"); setSortBy("name"); }} style={{ padding: "8px 12px", background: isDark ? "#334155" : "#f3f4f6", color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: 12 }}>Reset</button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: c.card, borderRadius: 8, overflow: "hidden", border: `1px solid ${c.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: isDark ? "#0f172a" : "#f8f9fa", borderBottom: `2px solid ${c.border}` }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: c.muted }}>Name</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: c.muted }}>Department</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: c.muted }}>Products</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: c.muted }}>Low Stock</th>
              <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: c.muted }}>Total Stock</th>
              <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: c.muted }}>Stock Value</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: c.muted }}>Status</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: c.muted }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: 40, textAlign: "center", color: c.muted }}>No categories found</td>
              </tr>
            ) : (
              filteredCategories.map((cat) => {
                const prodCount = getProductsInCategory(cat.id).length;
                const lowStockCount = getLowStockProducts(cat.id).length;
                const outOfStockCount = getOutOfStockProducts(cat.id).length;
                const totalStock = getTotalStock(cat.id);
                const totalValue = getTotalValue(cat.id);
                const deptName = departments.find(d => d.id === cat.department_id)?.name || "-";

                return (
                  <tr key={cat.id} style={{ borderBottom: `1px solid ${c.border}`, cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(102, 126, 234, 0.1)" : "rgba(102, 126, 234, 0.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: 12, color: c.text, fontWeight: 500 }} onClick={() => setDetailDrawer(cat)}>{cat.name}</td>
                    <td style={{ padding: 12, color: c.muted, fontSize: 11 }}>{deptName}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <span onClick={() => setDetailDrawer(cat)} style={{ background: "#667eea", color: "white", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
                        {prodCount}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      {lowStockCount > 0 ? (
                        <span style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", padding: "4px 8px", borderRadius: 4, fontWeight: 600 }}>
                          {lowStockCount}
                        </span>
                      ) : (
                        <span style={{ color: c.muted }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: "right", color: c.text, fontWeight: 500 }}>{totalStock}</td>
                    <td style={{ padding: 12, textAlign: "right", color: c.text, fontWeight: 500 }}>KSh {totalValue.toLocaleString()}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <span style={{ background: cat.status === "active" ? "rgba(16, 185, 129, 0.1)" : "rgba(156, 163, 175, 0.1)", color: cat.status === "active" ? "#10b981" : "#9ca3af", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                        {cat.status || "active"}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <ActionMenu cat={cat} onEdit={openEditModal} onDelete={() => { setDeletingCategory(cat); setShowDeleteModal(true); }} c={c} isDark={isDark} prodCount={prodCount} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <CategoryModal
          title="Add New Category"
          formData={formData}
          onNameChange={handleNameChange}
          onFormChange={(key, value) => setFormData({ ...formData, [key]: value })}
          onSave={handleAddCategory}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          departments={departments}
          categories={categories}
          c={c}
          isDark={isDark}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <CategoryModal
          title="Edit Category"
          formData={formData}
          onNameChange={handleNameChange}
          onFormChange={(key, value) => setFormData({ ...formData, [key]: value })}
          onSave={handleEditCategory}
          onClose={() => { setShowEditModal(false); resetForm(); }}
          departments={departments}
          categories={categories}
          c={c}
          isDark={isDark}
        />
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && deletingCategory && (
        <DeleteConfirmModal
          category={deletingCategory}
          productCount={getProductsInCategory(deletingCategory.id).length}
          onConfirm={handleDeleteCategory}
          onClose={() => { setShowDeleteModal(false); setDeletingCategory(null); }}
          c={c}
          isDark={isDark}
        />
      )}

      {/* DETAIL DRAWER */}
      {detailDrawer && (
        <CategoryDetailDrawer
          category={detailDrawer}
          products={getProductsInCategory(detailDrawer.id)}
          lowStockProducts={getLowStockProducts(detailDrawer.id)}
          outOfStockProducts={getOutOfStockProducts(detailDrawer.id)}
          totalStock={getTotalStock(detailDrawer.id)}
          totalValue={getTotalValue(detailDrawer.id)}
          onEdit={() => { openEditModal(detailDrawer); setDetailDrawer(null); }}
          onClose={() => setDetailDrawer(null)}
          departments={departments}
          c={c}
          isDark={isDark}
        />
      )}
    </div>
  );
}

function KPICard({ icon, label, value, color, c }) {
  return (
    <div style={{ background: c.card, borderRadius: 8, padding: 14, border: `1px solid ${c.border}`, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color: c.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color }}>{value}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, c, isDark }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 600, color: c.muted, display: "block", marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: isDark ? "#0f172a" : "#f3f4f6", border: "1px solid transparent", borderRadius: 6, color: c.text, fontSize: 12, cursor: "pointer", boxSizing: "border-box" }}>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </div>
  );
}

function ActionMenu({ cat, onEdit, onDelete, c, isDark, prodCount }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setShowMenu(!showMenu)} style={{ padding: "6px 8px", background: isDark ? "#334155" : "#f3f4f6", color: c.text, border: `1px solid ${c.border}`, borderRadius: 4, cursor: "pointer", fontSize: 14 }}>⋮</button>

      {showMenu && (
        <div style={{ position: "fixed", background: c.card, border: `1px solid ${c.border}`, borderRadius: 6, minWidth: 180, zIndex: 9999, boxShadow: "0 8px 20px rgba(0,0,0,0.4)", right: 30, bottom: 30 }}>
          <MenuItem onClick={() => { onEdit(cat); setShowMenu(false); }} label="Edit" />
          <MenuItem onClick={() => { onDelete(); setShowMenu(false); }} label={prodCount > 0 ? "Delete (has products)" : "Delete"} danger={prodCount > 0} disabled={prodCount > 0} />
        </div>
      )}

      {showMenu && <div onClick={() => setShowMenu(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} />}
    </div>
  );
}

function MenuItem({ onClick, label, danger, disabled }) {
  const [hovering, setHovering] = useState(false);
  return (
    <button onClick={!disabled ? onClick : undefined} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} style={{ display: "block", width: "100%", padding: "8px 12px", background: hovering && !disabled ? "rgba(102, 126, 234, 0.1)" : "transparent", border: "none", color: danger ? "#ff5f57" : "inherit", textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", fontSize: 12, opacity: disabled ? 0.5 : 1, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {label}
    </button>
  );
}

function CategoryModal({ title, formData, onNameChange, onFormChange, onSave, onClose, departments, categories, c, isDark }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: c.bg, borderRadius: 8, padding: 24, maxWidth: 440, width: "92%", maxHeight: "88vh", overflowY: "auto", border: `1px solid ${c.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 700, color: c.text }}>{title}</h2>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 6 }}>Category Name *</label>
          <input type="text" value={formData.name} onChange={onNameChange} placeholder="e.g., Lotions" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${c.border}`, borderRadius: 6, background: isDark ? "#0f172a" : "#f3f4f6", color: c.text, fontSize: 13, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 6 }}>Slug</label>
          <input type="text" value={formData.slug} readOnly style={{ width: "100%", padding: "10px 12px", border: `1px solid ${c.border}`, borderRadius: 6, background: isDark ? "#0f172a" : "#f3f4f6", color: c.muted, fontSize: 13, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 6 }}>Description</label>
          <textarea value={formData.description} onChange={(e) => onFormChange("description", e.target.value)} placeholder="Category description..." rows="3" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${c.border}`, borderRadius: 6, background: isDark ? "#0f172a" : "#f3f4f6", color: c.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 15, marginBottom: 15 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 6 }}>Status</label>
            <select value={formData.status} onChange={(e) => onFormChange("status", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: `1px solid ${c.border}`, borderRadius: 6, background: isDark ? "#0f172a" : "#f3f4f6", color: c.text, fontSize: 12, cursor: "pointer" }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 6 }}>Department</label>
            <select value={formData.department_id} onChange={(e) => onFormChange("department_id", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: `1px solid ${c.border}`, borderRadius: 6, background: isDark ? "#0f172a" : "#f3f4f6", color: c.text, fontSize: 12, cursor: "pointer" }}>
              <option value="">None</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 15, marginBottom: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 6 }}>Display Order</label>
            <input type="number" value={formData.display_order} onChange={(e) => onFormChange("display_order", e.target.value)} min="0" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${c.border}`, borderRadius: 6, background: isDark ? "#0f172a" : "#f3f4f6", color: c.text, fontSize: 12, boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 6 }}>Parent Category</label>
            <select value={formData.parent_category_id} onChange={(e) => onFormChange("parent_category_id", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: `1px solid ${c.border}`, borderRadius: 6, background: isDark ? "#0f172a" : "#f3f4f6", color: c.text, fontSize: 12, cursor: "pointer" }}>
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onSave} style={{ flex: 1, padding: 10, background: "#667eea", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save</button>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: isDark ? "#334155" : "#f3f4f6", color: c.text, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ category, productCount, onConfirm, onClose, c, isDark }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: c.bg, borderRadius: 8, padding: 30, maxWidth: 400, width: "90%", border: `1px solid ${c.border}` }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 15px 0", fontSize: 18, fontWeight: 700, color: "#ff5f57" }}>Delete Category?</h2>
        <p style={{ margin: "0 0 10px 0", fontSize: 13, color: c.muted }}>Category: <strong>{category.name}</strong></p>

        {productCount > 0 ? (
          <>
            <div style={{ background: "rgba(255, 95, 87, 0.1)", border: "1px solid rgba(255, 95, 87, 0.3)", borderRadius: 6, padding: 12, marginBottom: 15 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#ff5f57", fontWeight: 600 }}>Warning: This category has {productCount} product{productCount !== 1 ? "s" : ""}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 12, color: c.muted }}>You must reassign products before deleting this category.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 10, background: "#667eea", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Go Back</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 20px 0", fontSize: 12, color: c.muted }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onConfirm} style={{ flex: 1, padding: 10, background: "#ff5f57", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Delete</button>
              <button onClick={onClose} style={{ flex: 1, padding: 10, background: isDark ? "#334155" : "#f3f4f6", color: c.text, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CategoryDetailDrawer({ category, products, lowStockProducts, outOfStockProducts, totalStock, totalValue, onEdit, onClose, departments, c, isDark }) {
  const deptName = departments.find(d => d.id === category.department_id)?.name || "-";

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: c.bg, width: "100%", maxWidth: 450, maxHeight: "100vh", overflowY: "auto", boxShadow: "-2px 0 20px rgba(0,0,0,0.2)", animation: "slideIn 0.3s ease-out" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.text }}>Category Details</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: c.muted }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <DetailRow label="Name" value={category.name} />
          <DetailRow label="Slug" value={category.slug || "-"} />
          <DetailRow label="Description" value={category.description || "-"} />
          <DetailRow label="Status" value={category.status || "active"} color={category.status === "active" ? "#10b981" : "#9ca3af"} />
          <DetailRow label="Department" value={deptName} />
          <DetailRow label="Display Order" value={category.display_order || "0"} />
          <DetailRow label="Total Products" value={products.length} color="#667eea" />
          <DetailRow label="Low Stock Products" value={lowStockProducts.length} color={lowStockProducts.length > 0 ? "#f59e0b" : "#9ca3af"} />
          <DetailRow label="Out of Stock" value={outOfStockProducts.length} color={outOfStockProducts.length > 0 ? "#ff5f57" : "#9ca3af"} />
          <DetailRow label="Total Stock" value={totalStock} />
          <DetailRow label="Stock Value" value={`KSh ${totalValue.toLocaleString()}`} color="#8b5cf6" />
          <DetailRow label="Created" value={category.created_at ? new Date(category.created_at).toLocaleDateString() : "-"} />
          <DetailRow label="Updated" value={category.updated_at ? new Date(category.updated_at).toLocaleDateString() : "-"} />

          {products.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginTop: 20, marginBottom: 12 }}>Products in this Category</h3>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {products.map((p, idx) => (
                  <div key={idx} style={{ padding: 10, background: isDark ? "#0f172a" : "#f3f4f6", borderRadius: 4, marginBottom: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: c.text, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: c.muted, fontSize: 11 }}>Stock: {p.current_stock || 0} | Price: KSh {(p.retail_price || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: 20, borderTop: `1px solid ${c.border}`, display: "flex", gap: 10 }}>
          <button onClick={() => { onEdit(); onClose(); }} style={{ flex: 1, padding: 10, background: "#667eea", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Edit</button>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: isDark ? "#334155" : "#f3f4f6", color: c.text, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Close</button>
        </div>

        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
      <span style={{ fontWeight: 600, color: "#999" }}>{label}</span>
      <span style={{ color: color || "inherit" }}>{value}</span>
    </div>
  );
}

