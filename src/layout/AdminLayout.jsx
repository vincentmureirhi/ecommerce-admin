import React, { useState } from "react";
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
    { path: "/regions", label: "Regions", icon: "🌍" },
    { path: "/locations", label: "Locations", icon: "📍" },
    { path: "/customers", label: "Customers", icon: "👥" },
    { path: "/route-customer-applications", label: "New Route Applications", icon: "📝" },
    { path: "/route-customer-access", label: "Route Portal Access", icon: "🔐" },
    { path: "/buying-customers", label: "Buying Customers", icon: "💰" },
    { path: "/flash-sales", label: "Flash Sales", icon: "⚡" },
    { path: "/sales-reps", label: "Sales Reps", icon: "👤" },
    { path: "/sales-reps/live-map", label: "Live Rep Map", icon: "🛰️" },
    { path: "/inventory", label: "Inventory", icon: "📈" },
    { path: "/orders", label: "Orders", icon: "🛒" },
    { path: "/payments", label: "Payments", icon: "💳" },
    { path: "/price-tiers", label: "Price Tiers", icon: "💰" },
    { path: "/pricing-rules", label: "Pricing Rules", icon: "🏷️" },
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

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
      <div
        style={{
          width: sidebarOpen ? 250 : 80,
          background: c.sidebar,
          color: "white",
          transition: "width 0.3s ease",
          overflowY: "auto",
          padding: "20px 0",
          position: "fixed",
          height: "100vh",
          zIndex: 1000,
          boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
          flexShrink: 0,
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
          }}
          onClick={() => nav("/")}
        >
          {sidebarOpen ? "🛍️ Admin" : "🛍️"}
        </div>

        <nav style={{ flex: 1 }}>
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
                onClick={() => nav(item.path)}
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
                <div style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
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
      </div>

      <div
        style={{
          marginLeft: sidebarOpen ? 250 : 80,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "margin-left 0.3s ease",
          width: "100%",
        }}
      >
        <div
          style={{
            background: c.topbar,
            borderBottom: `1px solid ${c.topbarBorder}`,
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: c.text,
              padding: 0,
            }}
          >
            ☰
          </button>

          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: c.textMuted }}>
              👋 Welcome back, {user?.email || "Admin"}!
            </div>

            <button
              onClick={toggleTheme}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: c.text,
                padding: "6px 10px",
                borderRadius: "6px",
              }}
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px",
            width: "100%",
            boxSizing: "border-box",
            background: c.bg,
          }}
        >
          <div style={{ width: "100%", boxSizing: "border-box" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}