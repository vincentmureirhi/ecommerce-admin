import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  getSalesRepById,
  getLatestSalesRepLocation,
} from "../api/salesReps";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getFreshness(recordedAt) {
  if (!recordedAt) {
    return {
      label: "No location",
      color: "#6b7280",
      bgLight: "#f3f4f6",
      bgDark: "rgba(107, 114, 128, 0.16)",
    };
  }

  const diffMs = Date.now() - new Date(recordedAt).getTime();
  const diffMinutes = diffMs / 60000;

  if (diffMinutes < 2) {
    return {
      label: "Live",
      color: "#16a34a",
      bgLight: "#dcfce7",
      bgDark: "rgba(22, 163, 74, 0.16)",
    };
  }

  if (diffMinutes < 10) {
    return {
      label: "Stale",
      color: "#d97706",
      bgLight: "#fef3c7",
      bgDark: "rgba(217, 119, 6, 0.16)",
    };
  }

  return {
    label: "Offline",
    color: "#dc2626",
    bgLight: "#fee2e2",
    bgDark: "rgba(220, 38, 38, 0.16)",
  };
}

function InfoCard({ label, value, c }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: c.textMuted,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: c.text,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function SalesRepTrack() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [rep, setRep] = useState(null);
  const [location, setLocation] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [repRes, locRes] = await Promise.all([
        getSalesRepById(id),
        getLatestSalesRepLocation(id),
      ]);

      setRep(repRes?.data || null);
      setLocation(locRes?.data || null);
      setErr("");
    } catch (e) {
      setErr(e?.message || "Failed to load tracking data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const timer = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(timer);
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          background: c.bg,
          minHeight: "100vh",
          padding: 24,
          color: c.textMuted,
          textAlign: "center",
        }}
      >
        Loading tracking screen...
      </div>
    );
  }

  const freshness = getFreshness(location?.recorded_at);
  const lat = location?.latitude;
  const lng = location?.longitude;
  const hasCoords = lat !== undefined && lat !== null && lng !== undefined && lng !== null;

  const mapSrc = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=18&output=embed`
    : null;

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <button
            onClick={() => nav(`/sales-reps/${id}`)}
            style={{
              marginBottom: 12,
              padding: "8px 12px",
              border: `1px solid ${c.border}`,
              background: c.card,
              color: c.text,
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ← Back to Sales Rep
          </button>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: c.text,
            }}
          >
            📍 {rep?.name || "Sales Rep"} Tracking
          </h1>

          <p
            style={{
              marginTop: 6,
              marginBottom: 0,
              color: c.textMuted,
              fontSize: 13,
            }}
          >
            Last-known or live GPS location with satellite map view
          </p>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: isDark ? freshness.bgDark : freshness.bgLight,
            color: freshness.color,
            border: `1px solid ${c.border}`,
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {freshness.label}
        </div>
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
            color: isDark ? "#ff6b6b" : "#c33",
            padding: 12,
            borderRadius: 10,
            marginBottom: 18,
            border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: 18,
        }}
      >
        <div
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 14,
            padding: 18,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 16,
              color: c.text,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            Latest Location Data
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}
          >
            <InfoCard
              label="Sales Rep"
              value={rep?.name || "—"}
              c={c}
            />

            <InfoCard
              label="Phone"
              value={rep?.phone_number || "—"}
              c={c}
            />

            <InfoCard
              label="Coordinates"
              value={
                hasCoords
                  ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
                  : "No coordinates yet"
              }
              c={c}
            />

            <InfoCard
              label="Last Updated"
              value={formatDateTime(location?.recorded_at)}
              c={c}
            />

            <InfoCard
              label="Accuracy"
              value={
                location?.accuracy_meters !== null &&
                location?.accuracy_meters !== undefined
                  ? `${location.accuracy_meters} m`
                  : "—"
              }
              c={c}
            />

            <InfoCard
              label="Speed"
              value={
                location?.speed_kph !== null &&
                location?.speed_kph !== undefined
                  ? `${location.speed_kph} km/h`
                  : "—"
              }
              c={c}
            />

            <InfoCard
              label="Heading"
              value={
                location?.heading_degrees !== null &&
                location?.heading_degrees !== undefined
                  ? `${location.heading_degrees}°`
                  : "—"
              }
              c={c}
            />

            <InfoCard
              label="Battery"
              value={
                location?.battery_level !== null &&
                location?.battery_level !== undefined
                  ? `${location.battery_level}%`
                  : "—"
              }
              c={c}
            />

            <InfoCard
              label="Source"
              value={location?.source || "—"}
              c={c}
            />
          </div>
        </div>

        <div
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 14,
            padding: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            minHeight: 560,
          }}
        >
          {mapSrc ? (
            <>
              <iframe
                title="Sales rep satellite tracking map"
                src={mapSrc}
                style={{ width: "100%", height: 540, border: 0, borderRadius: 10, display: "block" }}
                allowFullScreen
                loading="lazy"
              />
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
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

                <button
                  onClick={loadData}
                  style={{
                    padding: "8px 12px",
                    background: "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  Refresh Now
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                height: 540,
                display: "grid",
                placeItems: "center",
                color: c.textMuted,
                textAlign: "center",
                padding: 20,
              }}
            >
              No location data yet for map display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
