import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { listLatestSalesRepLocations } from "../api/salesReps";

function SummaryCard({ title, value, subtitle, c, isDark }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c.text, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          marginTop: 8,
          color: isDark ? "#94a3b8" : "#64748b",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFreshness(recordedAt) {
  if (!recordedAt) {
    return { label: "No location", tone: "neutral" };
  }

  const diffMinutes = (Date.now() - new Date(recordedAt).getTime()) / 60000;

  if (diffMinutes < 2) return { label: "Live", tone: "success" };
  if (diffMinutes < 10) return { label: "Stale", tone: "warning" };
  return { label: "Offline", tone: "danger" };
}

function getBadgeStyles(tone, isDark) {
  if (tone === "success") {
    return {
      background: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  if (tone === "warning") {
    return {
      background: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
      color: isDark ? "#fbbf24" : "#856404",
    };
  }

  if (tone === "danger") {
    return {
      background: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
      color: isDark ? "#ff6b6b" : "#721c24",
    };
  }

  return {
    background: isDark ? "rgba(148, 163, 184, 0.2)" : "#eef2f7",
    color: isDark ? "#cbd5e1" : "#475569",
  };
}

export default function SalesRepsLiveMap() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [selectedRepId, setSelectedRepId] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setErr("");
    try {
      const data = await listLatestSalesRepLocations();
      const reps = Array.isArray(data.data || data) ? data.data || data : [];
      setRows(reps);

      setSelectedRepId((current) => {
        if (current && reps.some((rep) => rep.sales_rep_id === current)) {
          return current;
        }

        const firstWithCoords = reps.find(
          (rep) => rep.latitude !== null && rep.latitude !== undefined && rep.longitude !== null && rep.longitude !== undefined
        );

        return firstWithCoords?.sales_rep_id || reps[0]?.sales_rep_id || null;
      });
    } catch (e) {
      setErr(e?.message || "Failed to load live map data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    let live = 0;
    let stale = 0;
    let offline = 0;
    let noLocation = 0;

    for (const rep of rows) {
      const freshness = getFreshness(rep.recorded_at);
      if (freshness.label === "Live") live += 1;
      else if (freshness.label === "Stale") stale += 1;
      else if (freshness.label === "Offline") offline += 1;
      else noLocation += 1;
    }

    return {
      total: rows.length,
      live,
      stale,
      offline,
      noLocation,
    };
  }, [rows]);

  const selectedRep =
    rows.find((rep) => rep.sales_rep_id === selectedRepId) || null;

  const hasCoords =
    selectedRep &&
    selectedRep.latitude !== null &&
    selectedRep.latitude !== undefined &&
    selectedRep.longitude !== null &&
    selectedRep.longitude !== undefined;

  const mapSrc = hasCoords
    ? `https://maps.google.com/maps?q=${selectedRep.latitude},${selectedRep.longitude}&t=k&z=18&output=embed`
    : null;

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: c.textMuted,
          background: c.bg,
          minHeight: "100vh",
        }}
      >
        Loading live map...
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
      <div
        style={{
          marginBottom: 24,
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
              marginTop: 0,
              marginBottom: 5,
              fontSize: 28,
              fontWeight: 700,
              color: c.text,
            }}
          >
            🛰️ Sales Reps Live Map
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Boss view for all reps with latest known location and freshness
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            padding: "10px 16px",
            background: "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Refresh Now
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Total Reps" value={summary.total} subtitle="All sales reps" c={c} isDark={isDark} />
        <SummaryCard title="Live" value={summary.live} subtitle="Updated within 2 minutes" c={c} isDark={isDark} />
        <SummaryCard title="Stale" value={summary.stale} subtitle="Updated within 10 minutes" c={c} isDark={isDark} />
        <SummaryCard title="Offline / No Signal" value={summary.offline + summary.noLocation} subtitle="No recent location" c={c} isDark={isDark} />
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
            color: isDark ? "#ff6b6b" : "#c33",
            padding: 12,
            borderRadius: 6,
            marginBottom: 20,
            border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: c.card,
            borderRadius: 12,
            border: `1px solid ${c.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 14,
              borderBottom: `1px solid ${c.border}`,
              fontSize: 14,
              fontWeight: 700,
              color: c.text,
            }}
          >
            Sales Reps
          </div>

          <div style={{ maxHeight: "700px", overflowY: "auto" }}>
            {rows.length === 0 ? (
              <div style={{ padding: 20, color: c.textMuted }}>
                No sales reps found.
              </div>
            ) : (
              rows.map((rep) => {
                const freshness = getFreshness(rep.recorded_at);
                const badge = getBadgeStyles(freshness.tone, isDark);
                const isSelected = rep.sales_rep_id === selectedRepId;

                return (
                  <div
                    key={rep.sales_rep_id}
                    onClick={() => setSelectedRepId(rep.sales_rep_id)}
                    style={{
                      padding: 14,
                      borderBottom: `1px solid ${c.borderLight}`,
                      background: isSelected ? (isDark ? "rgba(14, 165, 233, 0.12)" : "#e0f2fe") : c.card,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                        {rep.sales_rep_name}
                      </div>

                      <span
                        style={{
                          ...badge,
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {freshness.label}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
                      {rep.phone_number || "No phone"}
                    </div>

                    <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>
                      Last updated: {formatDateTime(rep.recorded_at)}
                    </div>

                    <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 10 }}>
                      {rep.latitude !== null && rep.latitude !== undefined && rep.longitude !== null && rep.longitude !== undefined
                        ? `${Number(rep.latitude).toFixed(6)}, ${Number(rep.longitude).toFixed(6)}`
                        : "No coordinates yet"}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nav(`/sales-reps/${rep.sales_rep_id}`);
                        }}
                        style={{
                          padding: "6px 10px",
                          background: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        View
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nav(`/sales-reps/${rep.sales_rep_id}/track`);
                        }}
                        style={{
                          padding: "6px 10px",
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Track
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          style={{
            background: c.card,
            borderRadius: 12,
            border: `1px solid ${c.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            padding: 12,
            minHeight: 740,
          }}
        >
          {selectedRep ? (
            <>
              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>
                    {selectedRep.sales_rep_name}
                  </div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                    {selectedRep.phone_number || "No phone"}
                  </div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                    Last updated: {formatDateTime(selectedRep.recorded_at)}
                  </div>
                </div>

                <button
                  onClick={() => nav(`/sales-reps/${selectedRep.sales_rep_id}/track`)}
                  style={{
                    padding: "8px 12px",
                    background: "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Open Full Tracking
                </button>
              </div>

              {mapSrc ? (
                <>
                  <iframe
                    title="Sales rep live map"
                    src={mapSrc}
                    width="100%"
                    height="640"
                    style={{ border: 0, borderRadius: 10 }}
                    allowFullScreen
                    loading="lazy"
                  />
                  <div style={{ marginTop: 10 }}>
                    <a
                      href={`https://maps.google.com/?q=${selectedRep.latitude},${selectedRep.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#0ea5e9",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    minHeight: 640,
                    display: "grid",
                    placeItems: "center",
                    color: c.textMuted,
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  No location data yet for this sales rep.
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                minHeight: 640,
                display: "grid",
                placeItems: "center",
                color: c.textMuted,
              }}
            >
              Select a sales rep to view the live map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

