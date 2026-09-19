import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AdminLayout({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/products", label: "Products", icon: "📦" },
    { path: "/categories", label: "Categories", icon: "🏷️" },
    { path: "/suppliers", label: "Suppliers", icon: "🏢" },
    { path: "/marketplace", label: "Marketplace", icon: "MK" },
    { path: "/vendor-products", label: "Vendor Products", icon: "VP" },
    { path: "/regions", label: "Regions", icon: "🌍" },
    { path: "/route-operations", label: "Route Operations", icon: "RO" },
    { path: "/locations", label: "Locations", icon: "📍" },
    { path: "/customers", label: "Customers", icon: "👥" },
    { path: "/route-customer-applications", label: "New Route Applications", icon: "📝" },
    { path: "/route-customer-access", label: "Route Portal Access", icon: "🔐" },
    { path: "/buying-customers", label: "Buying Customers", icon: "💰" },
    { path: "/flash-sales", label: "Flash Sales", icon: "⚡" },
    { path: "/marketing", label: "Marketing", icon: "MKT" },
    { path: "/sales-reps", label: "Sales Reps", icon: "👤" },
    { path: "/sales-reps/live-map", label: "Live Rep Map", icon: "🛰️" },
    { path: "/inventory", label: "Inventory", icon: "📈" },
    { path: "/orders", label: "Orders", icon: "🛒" },
    { path: "/payments", label: "Payments", icon: "💳" },
    { path: "/price-tiers", label: "Price Tiers", icon: "💰" },
    { path: "/pricing-rules", label: "Pricing Rules", icon: "🏷️" },
    { path: "/pricing-groups", label: "Pricing Groups", icon: "🗂️" },
    { path: "/admin-management", label: "Admin Users", icon: "👨‍💼" },
    { path: "/blog", label: "Blog", icon: "📝" },
    { path: "/terms-conditions", label: "Terms & Conditions", icon: "📜" },
  ];

  const isActive = (path) => {
    if (path === "/") return loc.pathname === "/";
    return loc.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    nav("/login?portal=admin");
  };

  const colors = {
    light: {
      bg: "#f8f9fa",
      sidebar: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      topbar: "#ffffff",
      topbarBorder: "#e0e0e0",
      text: "#1a1a1a",
      textMuted: "#64748b",
    },
    dark: {
      bg: "#0f172a",
      sidebar: "linear-gradient(180deg, #0f172a 0%, #1a1f2e 100%)",
      topbar: "#1e293b",
      topbarBorder: "#334155",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
    },
  };

  const c = isDark ? colors.dark : colors.light;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) setSidebarOpen(false);
  }, [loc.pathname]);

  return (
    <div
      className="admin-shell"
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100dvh",
        background: c.bg,
      }}
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${sidebarOpen ? "is-open" : "is-closed"}`}
        style={{
          width: sidebarOpen ? 250 : 80,
          background: c.sidebar,
          color: "white",
          transition: "width 0.3s ease, transform 0.25s ease",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "20px 0",
          position: "fixed",
          height: "100dvh",
          zIndex: 1000,
          boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
          flexShrink: 0,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            padding: "0 20px",
            marginBottom: 30,
            fontSize: sidebarOpen ? 18 : 20,
            fontWeight: 700,
            textAlign: "center",
            transition: "all 0.3s",
            color: "#667eea",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onClick={() => {
            nav("/");
            if (window.matchMedia("(max-width: 768px)").matches) setSidebarOpen(false);
          }}
        >
          {sidebarOpen ? "🛍️ Admin" : "🛍️"}
        </div>

        <nav>
          {menuItems.map((item) => {
            if (
              item.path === "/admin-management" &&
              user?.role !== "superuser" &&
              user?.role !== "superadmin"
            ) {
              return null;
            }

            return (
              <div
                key={item.path}
                onClick={() => {
                  nav(item.path);
                  if (window.matchMedia("(max-width: 768px)").matches) setSidebarOpen(false);
                }}
                style={{
                  padding: sidebarOpen ? "12px 20px" : "12px 27px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: isActive(item.path) ? "rgba(102, 126, 234, 0.2)" : "transparent",
                  borderLeft: isActive(item.path) ? "3px solid #667eea" : "3px solid transparent",
                  color: isActive(item.path) ? "#667eea" : "#cbd5e1",
                  marginBottom: 4,
                  minHeight: 44,
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#cbd5e1";
                  }
                }}
              >
                <div style={{ fontSize: 18, minWidth: 24, textAlign: "center", flexShrink: 0 }}>
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div
          style={{
            padding: sidebarOpen ? "20px 20px 0" : "20px 0 0",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 20,
            marginTop: 8,
          }}
        >
          <div
            onClick={handleLogout}
            style={{
              padding: sidebarOpen ? "12px 20px" : "12px 27px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 0.2s",
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220, 53, 69, 0.2)";
              e.currentTarget.style.color = "#ff6b6b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#cbd5e1";
            }}
          >
            <div style={{ fontSize: 18 }}>🚪</div>
            {sidebarOpen && <span>Logout</span>}
          </div>
        </div>
      </aside>

      <div
        className="admin-main"
        style={{
          marginLeft: sidebarOpen ? 250 : 80,
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100dvh",
          transition: "margin-left 0.3s ease",
          width: "100%",
        }}
      >
        <header
          className="admin-topbar"
          style={{
            background: c.topbar,
            borderBottom: `1px solid ${c.topbarBorder}`,
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            minHeight: 58,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 900,
          }}
        >
          <button
            type="button"
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-menu-button"
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: c.text,
              padding: "8px",
              minWidth: 44,
              minHeight: 44,
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            ☰
          </button>

          <div className="admin-topbar-right" style={{ display: "flex", gap: 15, alignItems: "center", minWidth: 0 }}>
            <div className="admin-welcome" style={{ fontSize: 12, color: c.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              👋 Welcome back, {user?.email || "Admin"}!
            </div>

            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Light Mode" : "Dark Mode"}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: c.text,
                padding: "6px 10px",
                borderRadius: "6px",
                minWidth: 40,
                minHeight: 40,
                flexShrink: 0,
              }}
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <main
          className="admin-content"
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px",
            width: "100%",
            boxSizing: "border-box",
            background: c.bg,
          }}
        >
          <div className="admin-content-inner" style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
