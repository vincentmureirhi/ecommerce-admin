import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, getProductById, updateProduct } from "../api/products";
import { listCategories } from "../api/categories";
import { listSuppliers } from "../api/suppliers";
import { useTheme } from "../context/ThemeContext";

const CLOUDINARY_CLOUD_NAME = "dwvmsjgvd";
const CLOUDINARY_UPLOAD_PRESET = "ecommerce_products";

function toSafeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function PageCard({ title, subtitle, children, c }) {
  return (
    <section
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: c.text,
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 13,
              color: c.muted,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FormGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, required, hint, children, c }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: 13,
          fontWeight: 700,
          color: c.text,
        }}
      >
        {label} {required ? <span style={{ color: "#dc2626" }}>*</span> : null}
      </label>

      {children}

      {hint ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: c.muted,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function inputStyle(c, isDark) {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${c.border}`,
    fontSize: 14,
    boxSizing: "border-box",
    background: isDark ? "#0f172a" : "#f8fafc",
    color: c.text,
    outline: "none",
  };
}

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isDark } = useTheme();

  const colors = {
    light: {
      bg: "#f8fafc",
      card: "#ffffff",
      text: "#0f172a",
      border: "#e2e8f0",
      muted: "#64748b",
      soft: "#f8fafc",
      dangerBg: "#fef2f2",
      dangerText: "#b91c1c",
      dangerBorder: "#fecaca",
      primary: "#2563eb",
      secondary: "#e2e8f0",
    },
    dark: {
      bg: "#020617",
      card: "#111827",
      text: "#f8fafc",
      border: "#334155",
      muted: "#94a3b8",
      soft: "#0f172a",
      dangerBg: "rgba(127,29,29,0.22)",
      dangerText: "#fca5a5",
      dangerBorder: "rgba(239,68,68,0.35)",
      primary: "#2563eb",
      secondary: "#334155",
    },
  };

  const c = isDark ? colors.dark : colors.light;

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category_id: "",
    department_id: "",
    retail_price: "",
    wholesale_price: "",
    min_wholesale_qty: "10",
    cost_price: "",
    reorder_level: "10",
    current_stock: "0",
    requires_manual_price: false,
    is_active: true,
    image_url: "",
  });

  const pageTitle = id ? "Edit Product" : "Create Product";
  const pageSubtitle = id
    ? "Update the product profile, pricing, stock and media."
    : "Add a new product to your catalogue with clean pricing and stock data.";

  const profitPreview = useMemo(() => {
    const retail = toSafeNumber(form.retail_price, 0);
    const cost = toSafeNumber(form.cost_price, 0);

    if (retail <= 0 || cost < 0) {
      return {
        marginAmount: 0,
        marginPercent: 0,
      };
    }

    return {
      marginAmount: retail - cost,
      marginPercent: retail > 0 ? ((retail - cost) / retail) * 100 : 0,
    };
  }, [form.retail_price, form.cost_price]);

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    if (!form.name.trim()) {
      setErr("Product name is required.");
      return false;
    }

    if (!form.sku.trim()) {
      setErr("SKU is required.");
      return false;
    }

    if (!form.category_id) {
      setErr("Category is required.");
      return false;
    }

    if (!form.retail_price || Number(form.retail_price) <= 0) {
      setErr("Retail price must be greater than 0.");
      return false;
    }

    const stock = Number(form.current_stock);
    if (!Number.isFinite(stock) || stock < 0) {
      setErr("Current stock cannot be negative.");
      return false;
    }

    const reorder = Number(form.reorder_level);
    if (!Number.isFinite(reorder) || reorder < 0) {
      setErr("Reorder level cannot be negative.");
      return false;
    }

    return true;
  }

  async function loadData() {
    try {
      setLoading(true);
      setErr("");

      const [supplierResponse, categoryResponse] = await Promise.all([
        listSuppliers(),
        listCategories(),
      ]);

      const supplierRows =
        supplierResponse?.data?.data ||
        supplierResponse?.data ||
        [];

      const categoryRows =
        categoryResponse?.data?.data ||
        categoryResponse?.data ||
        [];

      setSuppliers(Array.isArray(supplierRows) ? supplierRows : []);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);

      if (id) {
        const productResponse = await getProductById(id);
        const product =
          productResponse?.data?.data ||
          productResponse?.data ||
          null;

        if (product) {
          setForm({
            name: product.name || "",
            description: product.description || "",
            sku: product.sku || "",
            barcode: product.barcode || "",
            category_id: product.category_id ? String(product.category_id) : "",
            department_id: product.department_id ? String(product.department_id) : "",
            retail_price: product.retail_price != null ? String(product.retail_price) : "",
            wholesale_price:
              product.wholesale_price != null ? String(product.wholesale_price) : "",
            min_wholesale_qty: String(product.min_wholesale_qty || 10),
            cost_price: product.cost_price != null ? String(product.cost_price) : "",
            reorder_level: String(product.reorder_level || 10),
            current_stock: String(product.current_stock || 0),
            requires_manual_price: product.requires_manual_price === true,
            is_active: product.is_active !== false,
            image_url: product.image_url || "",
          });

          if (product.image_url) {
            setUploadedImages([{ url: product.image_url, isMain: true }]);
          }
        }
      }
    } catch (e) {
      setErr(e?.message || "Failed to load product data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles([...e.dataTransfer.files]);
    }
  }

  function handleFileInput(e) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles([...e.target.files]);
    }
  }

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "ecommerce/products");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Image upload failed.");
    }

    const data = await response.json();
    return data.secure_url;
  }

  async function handleFiles(files) {
    setUploading(true);
    setErr("");

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setErr("Only image files are allowed.");
        setUploading(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErr("Each image must be smaller than 10MB.");
        setUploading(false);
        return;
      }

      try {
        const cloudinaryUrl = await uploadToCloudinary(file);

        setUploadedImages((prev) => {
          const nextImages = [
            ...prev,
            { url: cloudinaryUrl, isMain: prev.length === 0 },
          ];

          if (prev.length === 0) {
            setForm((f) => ({ ...f, image_url: cloudinaryUrl }));
          }

          return nextImages;
        });
      } catch (error) {
        setErr(`Failed to upload ${file.name}.`);
        setUploading(false);
        return;
      }
    }

    setUploading(false);
  }

  function setMainImage(url) {
    setForm((prev) => ({ ...prev, image_url: url }));
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isMain: img.url === url,
      }))
    );
  }

  function removeImage(url) {
    const nextImages = uploadedImages.filter((img) => img.url !== url);
    setUploadedImages(nextImages);

    if (form.image_url === url) {
      setForm((prev) => ({
        ...prev,
        image_url: nextImages.length > 0 ? nextImages[0].url : "",
      }));

      if (nextImages.length > 0) {
        nextImages[0].isMain = true;
      }
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sku: form.sku.trim(),
        barcode: form.barcode.trim() || null,
        category_id: parseInt(form.category_id, 10),
        department_id: form.department_id ? parseInt(form.department_id, 10) : null,
        retail_price: Number(form.retail_price),
        wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : null,
        min_wholesale_qty: Number(form.min_wholesale_qty) || 10,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        reorder_level: Math.max(0, Number(form.reorder_level) || 10),
        current_stock: Math.max(0, Number(form.current_stock) || 0),
        requires_manual_price: form.requires_manual_price === true,
        is_active: form.is_active === true,
        image_url: form.image_url || null,
      };

      if (id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }

      nav("/products");
    } catch (e) {
      setErr(e?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 24,
          background: c.bg,
          color: c.muted,
        }}
      >
        Loading product form...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 6px 0",
                fontSize: 28,
                fontWeight: 900,
                color: c.text,
                lineHeight: 1.1,
              }}
            >
              {pageTitle}
            </h1>
            <p
              style={{
                margin: 0,
                color: c.muted,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {pageSubtitle}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
              minWidth: 220,
              flex: "1 1 220px",
              maxWidth: 320,
            }}
          >
            <div
              style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: c.muted, marginBottom: 6 }}>
                Margin Preview
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: c.text }}>
                {profitPreview.marginPercent.toFixed(1)}%
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: c.muted }}>
                Gross margin amount: KES {profitPreview.marginAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </div>

        {err ? (
          <div
            style={{
              padding: 14,
              borderRadius: 16,
              background: c.dangerBg,
              color: c.dangerText,
              border: `1px solid ${c.dangerBorder}`,
              fontWeight: 700,
            }}
          >
            {err}
          </div>
        ) : null}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
          <PageCard
            title="Basic information"
            subtitle="Keep names, SKUs and classification clean so products stay easy to find."
            c={c}
          >
            <FormGrid>
              <Field label="Product name" required c={c}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Example: 2L Cooking Oil"
                  style={inputStyle(c, isDark)}
                />
              </Field>

              <Field label="SKU" required c={c}>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="Example: OIL-2L-001"
                  style={inputStyle(c, isDark)}
                />
              </Field>

              <Field label="Barcode" c={c}>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => updateField("barcode", e.target.value)}
                  placeholder="Optional barcode"
                  style={inputStyle(c, isDark)}
                />
              </Field>

              <Field label="Category" required c={c}>
                <select
                  value={form.category_id}
                  onChange={(e) => updateField("category_id", e.target.value)}
                  style={inputStyle(c, isDark)}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Supplier" c={c}>
                <select
                  value={form.department_id}
                  onChange={(e) => updateField("department_id", e.target.value)}
                  style={inputStyle(c, isDark)}
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </Field>
            </FormGrid>

            <div style={{ marginTop: 14 }}>
              <Field label="Description" c={c}>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Short internal or selling description"
                  style={{ ...inputStyle(c, isDark), resize: "vertical" }}
                />
              </Field>
            </div>
          </PageCard>

          <PageCard
            title="Pricing"
            subtitle="Set the retail and wholesale prices. Products without a pricing rule use retail pricing by default. For volume-based tiered pricing, assign the product in the Volume Tiers section after saving."
            c={c}
          >
            <FormGrid>
              <Field label="Cost price" c={c}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost_price}
                  onChange={(e) => updateField("cost_price", e.target.value)}
                  placeholder="0.00"
                  style={inputStyle(c, isDark)}
                />
              </Field>

              <Field label="Retail price" required c={c}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.retail_price}
                  onChange={(e) => updateField("retail_price", e.target.value)}
                  placeholder="0.00"
                  style={inputStyle(c, isDark)}
                />
              </Field>

              <Field label="Wholesale price" c={c}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.wholesale_price}
                  onChange={(e) => updateField("wholesale_price", e.target.value)}
                  placeholder="0.00"
                  style={inputStyle(c, isDark)}
                />
              </Field>

              <Field
                label="Minimum wholesale quantity"
                hint="Minimum order quantity to qualify for the wholesale price above."
                c={c}
              >
                <input
                  type="number"
                  min="1"
                  value={form.min_wholesale_qty}
                  onChange={(e) => updateField("min_wholesale_qty", e.target.value)}
                  placeholder="10"
                  style={inputStyle(c, isDark)}
                />
              </Field>
            </FormGrid>
          </PageCard>

          <PageCard
            title="Inventory control"
            subtitle="Use realistic reorder levels so the stock status stays useful."
            c={c}
          >
            <FormGrid>
              <Field label="Current stock" c={c}>
                <input
                  type="number"
                  min="0"
                  value={form.current_stock}
                  onChange={(e) => updateField("current_stock", e.target.value)}
                  placeholder="0"
                  style={inputStyle(c, isDark)}
                />
              </Field>

              <Field label="Reorder level" c={c}>
                <input
                  type="number"
                  min="0"
                  value={form.reorder_level}
                  onChange={(e) => updateField("reorder_level", e.target.value)}
                  placeholder="10"
                  style={inputStyle(c, isDark)}
                />
              </Field>
            </FormGrid>
          </PageCard>

          <PageCard
            title="Images"
            subtitle="Upload clean product media. Tap any uploaded image to make it the main image."
            c={c}
          >
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? c.primary : c.border}`,
                borderRadius: 18,
                padding: 24,
                textAlign: "center",
                background: dragActive
                  ? isDark
                    ? "rgba(37,99,235,0.12)"
                    : "#eff6ff"
                  : c.soft,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: "none" }}
                id="product-image-input"
                disabled={uploading}
              />

              <label
                htmlFor="product-image-input"
                style={{ cursor: "pointer", display: "block" }}
              >
                <div
                  style={{
                    fontSize: 34,
                    marginBottom: 8,
                  }}
                >
                  📷
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: c.text,
                    marginBottom: 5,
                  }}
                >
                  {uploading ? "Uploading images..." : "Tap to upload or drag images here"}
                </div>
                <div style={{ fontSize: 12, color: c.muted }}>
                  JPG, PNG or WebP. Maximum 10MB per image.
                </div>
              </label>
            </div>

            {uploadedImages.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: c.muted,
                    marginBottom: 10,
                  }}
                >
                  Uploaded images ({uploadedImages.length})
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  }}
                >
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={`${img.url}-${idx}`}
                      style={{
                        position: "relative",
                        borderRadius: 16,
                        overflow: "hidden",
                        border: `2px solid ${img.isMain ? c.primary : c.border}`,
                        background: c.soft,
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`Product ${idx + 1}`}
                        onClick={() => setMainImage(img.url)}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          cursor: "pointer",
                          display: "block",
                        }}
                      />

                      {img.isMain ? (
                        <div
                          style={{
                            position: "absolute",
                            left: 8,
                            bottom: 8,
                            background: "rgba(37,99,235,0.92)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "6px 8px",
                            borderRadius: 999,
                          }}
                        >
                          Main image
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => removeImage(img.url)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          border: "none",
                          background: "rgba(185,28,28,0.95)",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 900,
                        }}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </PageCard>

          <PageCard
            title="Options"
            subtitle="Toggle product visibility and approval requirements."
            c={c}
          >
            <FormGrid>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: c.text,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                />
                Active product
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: c.text,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.requires_manual_price}
                  onChange={(e) => updateField("requires_manual_price", e.target.checked)}
                />
                Requires manual price approval
              </label>
            </FormGrid>
          </PageCard>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "13px 18px",
                background: c.primary,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 800,
                minWidth: 170,
              }}
            >
              {submitting ? "Saving..." : id ? "Update product" : "Create product"}
            </button>

            <button
              type="button"
              onClick={() => nav("/products")}
              style={{
                padding: "13px 18px",
                background: c.secondary,
                color: c.text,
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 800,
                minWidth: 130,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}