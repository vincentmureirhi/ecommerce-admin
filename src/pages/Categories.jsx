import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import client from "../api/client";
import { uploadAdminImage } from "../utils/imageUpload";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://ecommerce-backend-9s3f.onrender.com/api";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function readArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.departments)) return payload.departments;
  return [];
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function generateSlug(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveImageUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${BACKEND_BASE_URL}${url}`;
  return url;
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  status: "active",
  display_order: 0,
  department_id: "",
  parent_category_id: "",
};

export default function Categories() {
  const { isDark } = useTheme();

  const colors = {
    light: {
      bg: "#f8fafc",
      card: "#ffffff",
      panel: "#f1f5f9",
      text: "#111827",
      border: "#e5e7eb",
      muted: "#64748b",
    },
    dark: {
      bg: "#0f172a",
      card: "#1e293b",
      panel: "#111827",
      text: "#f8fafc",
      border: "#334155",
      muted: "#94a3b8",
    },
  };
  const c = isDark ? colors.dark : colors.light;

  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const flashMessage = (message, type = "success") => {
    if (type === "error") {
      setErr(message);
      setSuccessMsg("");
    } else {
      setSuccessMsg(message);
      setErr("");
    }

    window.setTimeout(() => {
      setErr("");
      setSuccessMsg("");
    }, 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");

      const [catsRes, prodsRes] = await Promise.all([
        client.get("/categories"),
        client.get("/products"),
      ]);

      setCategories(readArray(catsRes.data));
      setProducts(readArray(prodsRes.data));

      try {
        const deptsRes = await client.get("/departments");
        setDepartments(readArray(deptsRes.data));
      } catch {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Failed to load categories page data:", error);
      setErr(error.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleFormChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      flashMessage("Please select a valid image file", "error");
      return;
    }

    setImageUploading(true);
    setErr("");

    try {
      const imageUrl = await uploadAdminImage(file, "ecommerce/categories");

      setFormData((prev) => ({
        ...prev,
        image_url: imageUrl,
      }));
      flashMessage("Image uploaded successfully");
    } catch (error) {
      console.error("Category image upload failed:", error);
      flashMessage(
        error.response?.data?.message || error.message || "Category image upload failed",
        "error"
      );
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    slug: formData.slug || generateSlug(formData.name),
    description: formData.description.trim(),
    image_url: formData.image_url.trim() || null,
    status: formData.status || "active",
    display_order: normalizeNumber(formData.display_order, 0),
    department_id: formData.department_id ? Number(formData.department_id) : null,
    parent_category_id: formData.parent_category_id ? Number(formData.parent_category_id) : null,
  });

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      flashMessage("Category name is required", "error");
      return;
    }

    try {
      setSaving(true);
      await client.post("/categories", buildPayload());
      setShowAddModal(false);
      resetForm();
      await loadData();
      flashMessage("Category created successfully");
    } catch (error) {
      console.error("Error creating category:", error);
      flashMessage(error.response?.data?.message || "Error creating category", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!formData.name.trim()) {
      flashMessage("Category name is required", "error");
      return;
    }

    try {
      setSaving(true);
      await client.put(`/categories/${editingId}`, buildPayload());
      setShowEditModal(false);
      resetForm();
      await loadData();
      flashMessage("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      flashMessage(error.response?.data?.message || "Error updating category", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setSaving(true);
      await client.delete(`/categories/${deletingCategory.id}`);
      setShowDeleteModal(false);
      setDeletingCategory(null);
      await loadData();
      flashMessage("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      flashMessage(error.response?.data?.message || "Error deleting category", "error");
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name || "",
      slug: category.slug || generateSlug(category.name),
      description: category.description || "",
      image_url: category.image_url || "",
      status: category.status || "active",
      display_order: category.display_order ?? 0,
      department_id: category.department_id || "",
      parent_category_id: category.parent_category_id || "",
    });
    setShowEditModal(true);
  };

  const getProductsInCategory = (catId) =>
    products.filter((product) => String(product.category_id || "") === String(catId));

  const getProductStock = (product) =>
    normalizeNumber(product.current_stock ?? product.stock_quantity ?? product.stock, 0);

  const getProductReorderLevel = (product) =>
    normalizeNumber(product.reorder_level ?? product.low_stock_threshold, 0);

  const getLowStockProducts = (catId) =>
    getProductsInCategory(catId).filter((product) => {
      const stock = getProductStock(product);
      const reorder = getProductReorderLevel(product);
      return stock > 0 && reorder > 0 && stock <= reorder;
    });

  const getOutOfStockProducts = (catId) =>
    getProductsInCategory(catId).filter((product) => getProductStock(product) === 0);

  const getTotalStock = (catId) =>
    getProductsInCategory(catId).reduce((sum, product) => sum + getProductStock(product), 0);

  const getTotalValue = (catId) =>
    getProductsInCategory(catId).reduce((sum, product) => {
      const stock = getProductStock(product);
      const price = normalizeNumber(product.cost_price ?? product.retail_price ?? product.price, 0);
      return sum + stock * price;
    }, 0);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    return categories
      .filter((category) => {
        const matchesSearch =
          !term ||
          String(category.name || "").toLowerCase().includes(term) ||
          String(category.slug || "").toLowerCase().includes(term) ||
          String(category.description || "").toLowerCase().includes(term);

        const matchesStatus =
          statusFilter === "all" || String(category.status || "active") === statusFilter;

        const matchesDepartment =
          departmentFilter === "all" ||
          String(category.department_id || "") === String(departmentFilter);

        return matchesSearch && matchesStatus && matchesDepartment;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "products":
            return getProductsInCategory(b.id).length - getProductsInCategory(a.id).length;
          case "stock":
            return getTotalStock(b.id) - getTotalStock(a.id);
          case "value":
            return getTotalValue(b.id) - getTotalValue(a.id);
          case "updated":
            return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
          case "order":
            return normalizeNumber(a.display_order, 0) - normalizeNumber(b.display_order, 0);
          case "name":
          default:
            return String(a.name || "").localeCompare(String(b.name || ""));
        }
      });
  }, [categories, products, search, statusFilter, departmentFilter, sortBy]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter(
    (category) => String(category.status || "active") === "active"
  ).length;
  const emptyCategories = categories.filter(
    (category) => getProductsInCategory(category.id).length === 0
  ).length;
  const lowStockCats = categories.filter(
    (category) => getLowStockProducts(category.id).length > 0
  ).length;
  const totalInventoryValue = categories.reduce(
    (sum, category) => sum + getTotalValue(category.id),
    0
  );

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.muted }}>
        Loading categories...
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: c.bg, minHeight: "100vh" }}>
      <div style={{ marginBottom: 30 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 15,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 5px 0", fontSize: 28, fontWeight: 700, color: c.text }}>
              Categories
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: c.muted }}>
              Manage category names, images, storefront grouping and inventory health.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            style={{
              padding: "10px 20px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            + Add Category
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <KPICard badge="CAT" label="Total Categories" value={totalCategories} color="#667eea" c={c} />
          <KPICard badge="OK" label="Active" value={activeCategories} color="#10b981" c={c} />
          <KPICard badge="EMPTY" label="Empty" value={emptyCategories} color="#f59e0b" c={c} />
          <KPICard badge="LOW" label="Low Stock" value={lowStockCats} color="#ff5f57" c={c} />
          <KPICard
            badge="KES"
            label="Inventory Value"
            value={`KSh ${totalInventoryValue.toLocaleString()}`}
            color="#8b5cf6"
            c={c}
          />
        </div>
      </div>

      {err && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 12,
            borderRadius: 6,
            marginBottom: 20,
            border: "1px solid #fecaca",
          }}
        >
          {err}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: 12,
            borderRadius: 6,
            marginBottom: 20,
            border: "1px solid #bbf7d0",
          }}
        >
          {successMsg}
        </div>
      )}

      <div
        style={{
          background: c.card,
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          border: `1px solid ${c.border}`,
        }}
      >
        <input
          type="text"
          placeholder="Search by name, slug or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: c.panel,
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            color: c.text,
            fontSize: 13,
            marginBottom: 12,
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: "all", name: "All Status" },
              { id: "active", name: "Active" },
              { id: "inactive", name: "Inactive" },
              { id: "archived", name: "Archived" },
            ]}
            c={c}
          />
          <FilterSelect
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[
              { id: "all", name: "All Departments" },
              ...departments.map((department) => ({
                id: department.id,
                name: department.name,
              })),
            ]}
            c={c}
          />
          <FilterSelect
            label="Sort By"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { id: "name", name: "Name A-Z" },
              { id: "order", name: "Display Order" },
              { id: "products", name: "Most Products" },
              { id: "stock", name: "Highest Stock" },
              { id: "value", name: "Stock Value" },
              { id: "updated", name: "Recently Updated" },
            ]}
            c={c}
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDepartmentFilter("all");
              setSortBy("name");
            }}
            style={{
              padding: "8px 12px",
              background: c.panel,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 12,
              alignSelf: "end",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        style={{
          background: c.card,
          borderRadius: 8,
          overflowX: "auto",
          border: `1px solid ${c.border}`,
        }}
      >
        <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: c.panel, borderBottom: `2px solid ${c.border}` }}>
              <TableHead label="Name" c={c} />
              <TableHead label="Image" c={c} align="center" />
              <TableHead label="Department" c={c} />
              <TableHead label="Products" c={c} align="center" />
              <TableHead label="Low Stock" c={c} align="center" />
              <TableHead label="Total Stock" c={c} align="right" />
              <TableHead label="Stock Value" c={c} align="right" />
              <TableHead label="Status" c={c} align="center" />
              <TableHead label="Actions" c={c} align="right" />
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: 40, textAlign: "center", color: c.muted }}>
                  No categories found
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => {
                const categoryProducts = getProductsInCategory(category.id);
                const lowStockCount = getLowStockProducts(category.id).length;
                const totalStock = getTotalStock(category.id);
                const totalValue = getTotalValue(category.id);
                const deptName =
                  departments.find(
                    (department) =>
                      String(department.id) === String(category.department_id || "")
                  )?.name || "-";
                const imageUrl = resolveImageUrl(category.image_url);

                return (
                  <tr
                    key={category.id}
                    style={{
                      borderBottom: `1px solid ${c.border}`,
                    }}
                  >
                    <td style={{ padding: 12, color: c.text, fontWeight: 600 }}>
                      <button
                        type="button"
                        onClick={() => setDetailDrawer(category)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          color: c.text,
                          cursor: "pointer",
                          fontWeight: 700,
                          textAlign: "left",
                        }}
                      >
                        {category.name}
                      </button>
                      <div style={{ color: c.muted, fontSize: 11, marginTop: 3 }}>
                        {category.slug || generateSlug(category.name)}
                      </div>
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <CategoryImage src={imageUrl} name={category.name} c={c} compact />
                    </td>
                    <td style={{ padding: 12, color: c.muted, fontSize: 11 }}>{deptName}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <MetricPill color="#667eea">{categoryProducts.length}</MetricPill>
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      {lowStockCount > 0 ? (
                        <MetricPill color="#f59e0b">{lowStockCount}</MetricPill>
                      ) : (
                        <span style={{ color: c.muted }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: "right", color: c.text, fontWeight: 500 }}>
                      {totalStock.toLocaleString()}
                    </td>
                    <td style={{ padding: 12, textAlign: "right", color: c.text, fontWeight: 500 }}>
                      KSh {totalValue.toLocaleString()}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <StatusBadge status={category.status || "active"} />
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <SmallButton c={c} onClick={() => setDetailDrawer(category)}>
                          View
                        </SmallButton>
                        <SmallButton c={c} onClick={() => openEditModal(category)}>
                          Edit
                        </SmallButton>
                        <SmallButton
                          c={c}
                          danger
                          onClick={() => {
                            setDeletingCategory(category);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
                        </SmallButton>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <CategoryModal
          title="Add New Category"
          formData={formData}
          onNameChange={handleNameChange}
          onFormChange={handleFormChange}
          onSave={handleAddCategory}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          departments={departments}
          categories={categories}
          fileInputRef={fileInputRef}
          imageUploading={imageUploading}
          onImageFileChange={handleImageFileChange}
          saving={saving}
          c={c}
          isDark={isDark}
        />
      )}

      {showEditModal && (
        <CategoryModal
          title="Edit Category"
          formData={formData}
          onNameChange={handleNameChange}
          onFormChange={handleFormChange}
          onSave={handleEditCategory}
          onClose={() => {
            setShowEditModal(false);
            resetForm();
          }}
          departments={departments}
          categories={categories.filter((category) => category.id !== editingId)}
          fileInputRef={fileInputRef}
          imageUploading={imageUploading}
          onImageFileChange={handleImageFileChange}
          saving={saving}
          c={c}
          isDark={isDark}
        />
      )}

      {showDeleteModal && deletingCategory && (
        <DeleteConfirmModal
          category={deletingCategory}
          productCount={getProductsInCategory(deletingCategory.id).length}
          saving={saving}
          onConfirm={handleDeleteCategory}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingCategory(null);
          }}
          c={c}
          isDark={isDark}
        />
      )}

      {detailDrawer && (
        <CategoryDetailDrawer
          category={detailDrawer}
          products={getProductsInCategory(detailDrawer.id)}
          lowStockProducts={getLowStockProducts(detailDrawer.id)}
          outOfStockProducts={getOutOfStockProducts(detailDrawer.id)}
          totalStock={getTotalStock(detailDrawer.id)}
          totalValue={getTotalValue(detailDrawer.id)}
          onEdit={() => {
            openEditModal(detailDrawer);
            setDetailDrawer(null);
          }}
          onClose={() => setDetailDrawer(null)}
          departments={departments}
          c={c}
          isDark={isDark}
        />
      )}
    </div>
  );
}

function KPICard({ badge, label, value, color, c }) {
  return (
    <div
      style={{
        background: c.card,
        borderRadius: 8,
        padding: 14,
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          minWidth: 36,
          height: 24,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 5,
          background: `${color}20`,
          color,
          fontSize: 10,
          fontWeight: 800,
          marginBottom: 8,
          padding: "0 6px",
        }}
      >
        {badge}
      </div>
      <div style={{ fontSize: 11, color: c.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function TableHead({ label, c, align = "left" }) {
  return (
    <th
      style={{
        padding: 12,
        textAlign: align,
        fontWeight: 700,
        color: c.muted,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </th>
  );
}

function FilterSelect({ label, value, onChange, options, c }) {
  return (
    <div>
      <label
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: c.muted,
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          background: c.panel,
          border: `1px solid ${c.border}`,
          borderRadius: 6,
          color: c.text,
          fontSize: 12,
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function CategoryImage({ src, name, c, compact = false }) {
  const [failed, setFailed] = useState(false);
  const size = compact ? { width: 54, height: 40 } : { width: "100%", height: 180 };

  if (!src || failed) {
    return (
      <div
        style={{
          ...size,
          borderRadius: compact ? 6 : 10,
          border: `1px dashed ${c.border}`,
          background: c.panel,
          color: c.muted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? 10 : 13,
          fontWeight: 600,
          margin: compact ? "0 auto" : "0 0 16px",
        }}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "Category"}
      onError={() => setFailed(true)}
      style={{
        ...size,
        borderRadius: compact ? 6 : 10,
        objectFit: "cover",
        border: `1px solid ${c.border}`,
        display: "block",
        margin: compact ? "0 auto" : "0 0 16px",
      }}
    />
  );
}

function MetricPill({ children, color }) {
  return (
    <span
      style={{
        background: color,
        color: "white",
        padding: "4px 8px",
        borderRadius: 4,
        fontWeight: 700,
        display: "inline-block",
        minWidth: 24,
      }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "active").toLowerCase();
  const active = normalized === "active";

  return (
    <span
      style={{
        background: active ? "rgba(16, 185, 129, 0.12)" : "rgba(156, 163, 175, 0.15)",
        color: active ? "#10b981" : "#9ca3af",
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {normalized}
    </span>
  );
}

function SmallButton({ children, onClick, c, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 9px",
        background: danger ? "rgba(239, 68, 68, 0.12)" : c.panel,
        color: danger ? "#ef4444" : c.text,
        border: `1px solid ${danger ? "rgba(239, 68, 68, 0.35)" : c.border}`,
        borderRadius: 5,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function CategoryModal({
  title,
  formData,
  onNameChange,
  onFormChange,
  onSave,
  onClose,
  departments,
  categories,
  fileInputRef,
  imageUploading,
  onImageFileChange,
  saving,
  c,
  isDark,
}) {
  const imageUrl = resolveImageUrl(formData.image_url);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: c.bg,
          borderRadius: 8,
          padding: 24,
          maxWidth: 560,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1px solid ${c.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 700, color: c.text }}>
          {title}
        </h2>

        <Field label="Category Name *" c={c}>
          <input
            type="text"
            value={formData.name}
            onChange={onNameChange}
            placeholder="e.g., Lotions"
            style={inputStyle(c, isDark)}
          />
        </Field>

        <Field label="Slug" c={c}>
          <input type="text" value={formData.slug} readOnly style={inputStyle(c, isDark, true)} />
        </Field>

        <Field label="Description" c={c}>
          <textarea
            value={formData.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            placeholder="Category description..."
            rows="3"
            style={{ ...inputStyle(c, isDark), resize: "vertical", fontFamily: "inherit" }}
          />
        </Field>

        <Field label="Category Image" c={c}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={onImageFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading || saving}
              style={{
                padding: "8px 12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: imageUploading || saving ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                opacity: imageUploading || saving ? 0.7 : 1,
              }}
            >
              {imageUploading ? "Uploading..." : "Upload image"}
            </button>
            <button
              type="button"
              onClick={() => onFormChange("image_url", "")}
              disabled={!formData.image_url || saving}
              style={{
                padding: "8px 12px",
                background: c.panel,
                color: c.text,
                border: `1px solid ${c.border}`,
                borderRadius: 6,
                cursor: formData.image_url && !saving ? "pointer" : "not-allowed",
                fontSize: 12,
                fontWeight: 700,
                opacity: formData.image_url && !saving ? 1 : 0.5,
              }}
            >
              Remove
            </button>
          </div>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => onFormChange("image_url", e.target.value)}
            placeholder="Or paste an image URL..."
            style={inputStyle(c, isDark)}
          />
          <div style={{ marginTop: 10 }}>
            <CategoryImage src={imageUrl} name={formData.name} c={c} />
          </div>
        </Field>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 15,
            marginBottom: 15,
          }}
        >
          <Field label="Status" c={c} compact>
            <select
              value={formData.status}
              onChange={(e) => onFormChange("status", e.target.value)}
              style={inputStyle(c, isDark)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </Field>

          <Field label="Department" c={c} compact>
            <select
              value={formData.department_id}
              onChange={(e) => onFormChange("department_id", e.target.value)}
              style={inputStyle(c, isDark)}
            >
              <option value="">None</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Display Order" c={c} compact>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => onFormChange("display_order", e.target.value)}
              min="0"
              style={inputStyle(c, isDark)}
            />
          </Field>

          <Field label="Parent Category" c={c} compact>
            <select
              value={formData.parent_category_id}
              onChange={(e) => onFormChange("parent_category_id", e.target.value)}
              style={inputStyle(c, isDark)}
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || imageUploading}
            style={{
              flex: 1,
              padding: 10,
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: saving || imageUploading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              opacity: saving || imageUploading ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: 10,
              background: c.panel,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ category, productCount, saving, onConfirm, onClose, c, isDark }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: c.bg,
          borderRadius: 8,
          padding: 30,
          maxWidth: 420,
          width: "100%",
          border: `1px solid ${c.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 15px 0", fontSize: 18, fontWeight: 700, color: "#ff5f57" }}>
          Delete Category?
        </h2>
        <p style={{ margin: "0 0 10px 0", fontSize: 13, color: c.muted }}>
          Category: <strong>{category.name}</strong>
        </p>

        {productCount > 0 ? (
          <>
            <div
              style={{
                background: "rgba(255, 95, 87, 0.1)",
                border: "1px solid rgba(255, 95, 87, 0.3)",
                borderRadius: 6,
                padding: 12,
                marginBottom: 15,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: "#ff5f57", fontWeight: 700 }}>
                This category has {productCount} product{productCount === 1 ? "" : "s"}.
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: 12, color: c.muted }}>
                Reassign or delete those products first, then delete the category.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                padding: 10,
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Go Back
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 20px 0", fontSize: 12, color: c.muted }}>
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onConfirm}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: 10,
                  background: "#ff5f57",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: 10,
                  background: isDark ? "#334155" : "#f3f4f6",
                  color: c.text,
                  border: "none",
                  borderRadius: 6,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CategoryDetailDrawer({
  category,
  products,
  lowStockProducts,
  outOfStockProducts,
  totalStock,
  totalValue,
  onEdit,
  onClose,
  departments,
  c,
  isDark,
}) {
  const deptName =
    departments.find((department) => String(department.id) === String(category.department_id || ""))
      ?.name || "-";
  const imageUrl = resolveImageUrl(category.image_url);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: c.bg,
          width: "100%",
          maxWidth: 480,
          maxHeight: "100vh",
          overflowY: "auto",
          boxShadow: "-2px 0 20px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: 20,
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.text }}>
            Category Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close category details"
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: c.muted,
            }}
          >
            x
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <CategoryImage src={imageUrl} name={category.name} c={c} />

          <DetailRow label="Name" value={category.name} c={c} />
          <DetailRow label="Slug" value={category.slug || generateSlug(category.name) || "-"} c={c} />
          <DetailRow label="Description" value={category.description || "-"} c={c} />
          <DetailRow
            label="Status"
            value={category.status || "active"}
            color={String(category.status || "active") === "active" ? "#10b981" : "#9ca3af"}
            c={c}
          />
          <DetailRow label="Department" value={deptName} c={c} />
          <DetailRow label="Display Order" value={category.display_order || "0"} c={c} />
          <DetailRow label="Total Products" value={products.length} color="#667eea" c={c} />
          <DetailRow
            label="Low Stock Products"
            value={lowStockProducts.length}
            color={lowStockProducts.length > 0 ? "#f59e0b" : "#9ca3af"}
            c={c}
          />
          <DetailRow
            label="Out of Stock"
            value={outOfStockProducts.length}
            color={outOfStockProducts.length > 0 ? "#ff5f57" : "#9ca3af"}
            c={c}
          />
          <DetailRow label="Total Stock" value={totalStock.toLocaleString()} c={c} />
          <DetailRow
            label="Stock Value"
            value={`KSh ${totalValue.toLocaleString()}`}
            color="#8b5cf6"
            c={c}
          />
          <DetailRow
            label="Created"
            value={category.created_at ? new Date(category.created_at).toLocaleDateString() : "-"}
            c={c}
          />
          <DetailRow
            label="Updated"
            value={category.updated_at ? new Date(category.updated_at).toLocaleDateString() : "-"}
            c={c}
          />

          {products.length > 0 && (
            <>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: c.text,
                  marginTop: 20,
                  marginBottom: 12,
                }}
              >
                Products in this Category
              </h3>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {products.map((product) => (
                  <div
                    key={product.id || product.sku || product.name}
                    style={{
                      padding: 10,
                      background: isDark ? "#0f172a" : "#f3f4f6",
                      borderRadius: 4,
                      marginBottom: 8,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>
                      {product.name}
                    </div>
                    <div style={{ color: c.muted, fontSize: 11 }}>
                      Stock: {normalizeNumber(product.current_stock ?? product.stock_quantity, 0)} |
                      Price: KSh{" "}
                      {normalizeNumber(product.retail_price ?? product.price, 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            padding: 20,
            borderTop: `1px solid ${c.border}`,
            display: "flex",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onEdit}
            style={{
              flex: 1,
              padding: 10,
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              background: isDark ? "#334155" : "#f3f4f6",
              color: c.text,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, c, compact = false }) {
  return (
    <div style={{ marginBottom: compact ? 0 : 15 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: c.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailRow({ label, value, color, c }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "130px 1fr",
        gap: 12,
        padding: "12px 0",
        borderBottom: `1px solid ${c.border}`,
        fontSize: 13,
      }}
    >
      <span style={{ fontWeight: 700, color: c.muted }}>{label}</span>
      <span style={{ color: color || c.text, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function inputStyle(c, isDark, readOnly = false) {
  return {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    background: isDark ? "#0f172a" : "#f3f4f6",
    color: readOnly ? c.muted : c.text,
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  };
}
