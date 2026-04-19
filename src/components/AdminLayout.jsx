import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminLayout({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/products", label: "Products", icon: "📦" },
    { path: "/categories", label: "Categories", icon: "🏷️" },
    { path: "/departments", label: "Departments", icon: "🏢" },
    { path: "/customers", label: "Customers", icon: "👥" },
    { path: "/orders", label: "Orders", icon: "🛒" },
    { path: "/payments", label: "Payments", icon: "💳" },
    { path: "/price-tiers", label: "Price Tiers", icon: "💰" },
    { path: "/inventory", label: "Inventory", icon: "📈" },
  ];

  const isActive = (path) => loc.pathname.startsWith(path);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: sidebarOpen ? 260 : 60,
          background: "linear-gradient(180deg, #1a1f3a 0%, #2d3561 100%)",
          padding: sidebarOpen ? 20 : 10,
          color: "white",
          transition: "all 0.3s ease",
          overflowY: "auto",
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 30,
            cursor: "pointer",
          }}
          onClick={() => nav("/dashboard")}
        >
          <div style={{ fontSize: 24, fontWeight: 700 }}>📱</div>
          {sidebarOpen && (
            <div style={{ fontSize: 18, fontWeight: 700, marginLeft: 10 }}>
              Admin
            </div>
          )}
        </div>

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            width: "100%",
            padding: 10,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 20,
            fontSize: 16,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {/* MENU */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              style={{
                padding: "12px 16px",
                background: isActive(item.path)
                  ? "rgba(102, 126, 234, 0.3)"
                  : "transparent",
                border: isActive(item.path)
                  ? "2px solid #667eea"
                  : "2px solid transparent",
                color: "white",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: sidebarOpen ? 14 : 12,
                fontWeight: isActive(item.path) ? 600 : 500,
                display: "flex",
                alignItems: "center",
                gap: sidebarOpen ? 12 : 0,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                transition: "all 0.2s",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive(item.path)
                  ? "rgba(102, 126, 234, 0.3)"
                  : "transparent";
              }}
              title={item.label}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* LOGOUT */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            nav("/login");
          }}
          style={{
            width: "100%",
            marginTop: "auto",
            padding: "12px 16px",
            background: "#dc3545",
            border: "none",
            color: "white",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: sidebarOpen ? 12 : 0,
            justifyContent: sidebarOpen ? "flex-start" : "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#c82333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#dc3545";
          }}
        >
          <span>🚪</span>
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            background: "white",
            padding: "16px 24px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ margin: 0, color: "#1a1a1a", fontSize: 18, fontWeight: 600 }}>
            Welcome back! 👋
          </h2>
          <div style={{ fontSize: 14, color: "#999" }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {/* CONTENT */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
