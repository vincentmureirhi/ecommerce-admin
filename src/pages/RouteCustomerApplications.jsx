import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  approveRouteCustomerApplication,
  createManualRouteCustomerApplication,
  deleteRouteCustomerApplicationFile,
  downloadRouteCustomerApplicationFile,
  listAdminRouteCustomers,
  listRouteCustomerApplicationEvents,
  listRouteCustomerApplicationFiles,
  listRouteCustomerApplications,
  rejectRouteCustomerApplication,
  saveRouteCustomerApplicationWorkflow,
  uploadRouteCustomerApplicationFile,
} from "../api/routeCustomerAdmin";

function SummaryCard({ title, value, subtitle, colors }) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: colors.textMuted,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: colors.text,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: colors.textMuted,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function StageBadge({ stage, isDark }) {
  const value = String(stage || "received").toLowerCase();

  const styles = {
    received: {
      bg: isDark ? "rgba(234, 88, 12, 0.18)" : "#fff7ed",
      color: isDark ? "#fdba74" : "#c2410c",
      border: isDark ? "rgba(251, 146, 60, 0.28)" : "#fed7aa",
      label: "Received",
    },
    printed: {
      bg: isDark ? "rgba(59, 130, 246, 0.18)" : "#eff6ff",
      color: isDark ? "#93c5fd" : "#1d4ed8",
      border: isDark ? "rgba(96, 165, 250, 0.28)" : "#bfdbfe",
      label: "Printed",
    },
    security_reviewed: {
      bg: isDark ? "rgba(139, 92, 246, 0.18)" : "#f5f3ff",
      color: isDark ? "#c4b5fd" : "#6d28d9",
      border: isDark ? "rgba(167, 139, 250, 0.28)" : "#ddd6fe",
      label: "Security Reviewed",
    },
    finance_reviewed: {
      bg: isDark ? "rgba(14, 165, 233, 0.18)" : "#ecfeff",
      color: isDark ? "#7dd3fc" : "#0369a1",
      border: isDark ? "rgba(56, 189, 248, 0.28)" : "#bae6fd",
      label: "Finance Reviewed",
    },
    admin_reviewed: {
      bg: isDark ? "rgba(245, 158, 11, 0.18)" : "#fffbeb",
      color: isDark ? "#fcd34d" : "#b45309",
      border: isDark ? "rgba(251, 191, 36, 0.28)" : "#fde68a",
      label: "Admin Reviewed",
    },
    approved: {
      bg: isDark ? "rgba(16, 185, 129, 0.16)" : "#ecfdf5",
      color: isDark ? "#86efac" : "#047857",
      border: isDark ? "rgba(74, 222, 128, 0.28)" : "#a7f3d0",
      label: "Approved",
    },
    rejected: {
      bg: isDark ? "rgba(220, 38, 38, 0.16)" : "#fef2f2",
      color: isDark ? "#fca5a5" : "#b91c1c",
      border: isDark ? "rgba(248, 113, 113, 0.28)" : "#fecaca",
      label: "Rejected",
    },
    filed: {
      bg: isDark ? "rgba(34, 197, 94, 0.16)" : "#f0fdf4",
      color: isDark ? "#86efac" : "#166534",
      border: isDark ? "rgba(74, 222, 128, 0.28)" : "#bbf7d0",
      label: "Filed",
    },
  };

  const s = styles[value] || styles.received;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {s.label}
    </span>
  );
}

function ComplianceBadge({ count, isDark }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: isDark ? "rgba(220,38,38,0.16)" : "#fef2f2",
        color: isDark ? "#fca5a5" : "#b91c1c",
        border: `1px solid ${isDark ? "rgba(248,113,113,0.28)" : "#fecaca"}`,
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {count} Compliance {count === 1 ? "Issue" : "Issues"}
    </span>
  );
}

function WarningPill({ text, isDark }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: 999,
        background: isDark ? "rgba(220,38,38,0.16)" : "#fff1f2",
        color: isDark ? "#fca5a5" : "#be123c",
        border: `1px solid ${isDark ? "rgba(248,113,113,0.28)" : "#fecdd3"}`,
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
}

function emptyManualForm() {
  return {
    applicant_name: "",
    business_name: "",
    email: "",
    phone: "",
    requested_credit_limit: "",
    form_reference: "",
    handwritten_summary: "",
  };
}

function buildDefaultReviewForm(application) {
  return {
    customer_id: "",
    username: "",
    temporary_password: "",
    credit_limit:
      application?.requested_credit_limit === null ||
      application?.requested_credit_limit === undefined
        ? "0.00"
        : String(application.requested_credit_limit),
    credit_notes: "",
    admin_notes: application?.admin_notes || "",
  };
}

function toLocalDateTimeInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildDefaultWorkflowForm(application) {
  return {
    is_printed: Boolean(application?.is_printed),
    security_reviewed: Boolean(application?.security_reviewed),
    finance_reviewed: Boolean(application?.finance_reviewed),
    admin_reviewed: Boolean(application?.admin_reviewed),
    physically_filed: Boolean(application?.physically_filed),
    digitally_archived: Boolean(application?.digitally_archived),
    workflow_notes: application?.workflow_notes || "",
    filed_reference: application?.filed_reference || "",
    admin_notes: application?.admin_notes || "",
    received_email_subject: application?.received_email_subject || "",
    received_email_from: application?.received_email_from || "",
    received_on_email_at: toLocalDateTimeInputValue(application?.received_on_email_at),
    digital_file_name: application?.digital_file_name || "",
    digital_file_reference: application?.digital_file_reference || "",
  };
}

function parseApplicationDetails(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const pairs = [];

  for (const line of lines) {
    const colonIndex = line.indexOf(":");

    if (colonIndex === -1) {
      pairs.push({
        label: "Note",
        value: line,
      });
      continue;
    }

    const label = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    pairs.push({
      label: label || "Detail",
      value: value || "-",
    });
  }

  return pairs;
}

function DetailGrid({ application, colors, isDark }) {
  const details = parseApplicationDetails(application.address);

  if (!details.length) {
    return (
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          background: isDark ? "#0f172a" : "#f8fafc",
          border: `1px solid ${colors.border}`,
          color: colors.textMuted,
          fontSize: 14,
        }}
      >
        No structured application details recorded yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      {details.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          style={{
            padding: 12,
            borderRadius: 12,
            background: isDark ? "#0f172a" : "#f8fafc",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: colors.textMuted,
              marginBottom: 6,
            }}
          >
            {item.label}
          </div>

          <div
            style={{
              color: colors.text,
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function checklistMark(value) {
  return value ? "☑" : "☐";
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getFileTypeLabel(type) {
  const value = String(type || "").toLowerCase();

  if (value === "received_form") return "Received Form";
  if (value === "signed_form") return "Signed Form";
  if (value === "supporting_document") return "Supporting Document";
  return type || "Unknown";
}

function getComplianceIssues(application) {
  const issues = [];
  const status = String(application.status || "").toLowerCase();
  const submittedVia = String(application.submitted_via || "").toLowerCase();

  const hasEmailEvidence =
    Boolean(String(application.received_email_subject || "").trim()) &&
    Boolean(String(application.received_email_from || "").trim()) &&
    Boolean(application.received_on_email_at);

  const hasArchiveEvidence =
    Boolean(String(application.digital_file_name || "").trim()) &&
    Boolean(String(application.digital_file_reference || "").trim());

  if (status === "approved" && !application.digitally_archived) {
    issues.push({
      code: "approved_missing_archive",
      label: "Approved but not digitally archived",
    });
  }

  if (status === "approved" && !application.physically_filed) {
    issues.push({
      code: "approved_missing_file",
      label: "Approved but not physically filed",
    });
  }

  if (application.physically_filed && !String(application.filed_reference || "").trim()) {
    issues.push({
      code: "filed_missing_reference",
      label: "Filed but missing filed reference",
    });
  }

  if (application.digitally_archived && !String(application.digital_file_name || "").trim()) {
    issues.push({
      code: "archived_missing_filename",
      label: "Archived but missing digital file name",
    });
  }

  if (application.digitally_archived && !String(application.digital_file_reference || "").trim()) {
    issues.push({
      code: "archived_missing_reference",
      label: "Archived but missing digital file reference",
    });
  }

  if (submittedVia === "email" && !hasEmailEvidence) {
    issues.push({
      code: "missing_email_evidence",
      label: "Email intake missing sender, subject, or received time",
    });
  }

  if (
    (application.security_reviewed ||
      application.finance_reviewed ||
      application.admin_reviewed) &&
    !String(application.workflow_notes || "").trim()
  ) {
    issues.push({
      code: "missing_workflow_notes",
      label: "Reviewed but missing workflow notes",
    });
  }

  if (
    application.is_printed &&
    !application.security_reviewed &&
    !application.finance_reviewed &&
    !application.admin_reviewed
  ) {
    const createdAt = application.created_at ? new Date(application.created_at) : null;
    const ageHours =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
        : 0;

    if (ageHours >= 24) {
      issues.push({
        code: "printed_stalled",
        label: "Printed but stalled with no review progress",
      });
    }
  }

  if (status === "rejected" && !String(application.admin_notes || "").trim()) {
    issues.push({
      code: "rejected_missing_reason",
      label: "Rejected but missing admin reason",
    });
  }

  if (application.digitally_archived && !hasArchiveEvidence) {
    issues.push({
      code: "archive_evidence_incomplete",
      label: "Digitally archived but evidence details are incomplete",
    });
  }

  return issues;
}

function getEventBadgeColors(eventType, isDark) {
  const value = String(eventType || "").toLowerCase();

  if (value === "application_received") {
    return {
      bg: isDark ? "rgba(234,88,12,0.18)" : "#fff7ed",
      color: isDark ? "#fdba74" : "#c2410c",
      border: isDark ? "rgba(251,146,60,0.28)" : "#fed7aa",
    };
  }

  if (value === "workflow_updated") {
    return {
      bg: isDark ? "rgba(59,130,246,0.18)" : "#eff6ff",
      color: isDark ? "#93c5fd" : "#1d4ed8",
      border: isDark ? "rgba(96,165,250,0.28)" : "#bfdbfe",
    };
  }

  if (value === "application_approved") {
    return {
      bg: isDark ? "rgba(16,185,129,0.16)" : "#ecfdf5",
      color: isDark ? "#86efac" : "#047857",
      border: isDark ? "rgba(74,222,128,0.28)" : "#a7f3d0",
    };
  }

  if (value === "application_rejected") {
    return {
      bg: isDark ? "rgba(220,38,38,0.16)" : "#fef2f2",
      color: isDark ? "#fca5a5" : "#b91c1c",
      border: isDark ? "rgba(248,113,113,0.28)" : "#fecaca",
    };
  }

  if (value === "file_uploaded") {
    return {
      bg: isDark ? "rgba(14,165,233,0.18)" : "#ecfeff",
      color: isDark ? "#7dd3fc" : "#0369a1",
      border: isDark ? "rgba(56,189,248,0.28)" : "#bae6fd",
    };
  }

  if (value === "file_deleted") {
    return {
      bg: isDark ? "rgba(245,158,11,0.18)" : "#fffbeb",
      color: isDark ? "#fcd34d" : "#b45309",
      border: isDark ? "rgba(251,191,36,0.28)" : "#fde68a",
    };
  }

  return {
    bg: isDark ? "rgba(100,116,139,0.18)" : "#f8fafc",
    color: isDark ? "#cbd5e1" : "#475569",
    border: isDark ? "rgba(148,163,184,0.28)" : "#cbd5e1",
  };
}

function EventTypeBadge({ eventType, label, isDark }) {
  const style = getEventBadgeColors(eventType, isDark);

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {label || eventType || "Event"}
    </span>
  );
}

function summarizeEventMetadata(event) {
  const meta = event?.metadata_json;

  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "";

  if (event.event_type === "file_uploaded" || event.event_type === "file_deleted") {
    const parts = [];
    if (meta.file_type) parts.push(getFileTypeLabel(meta.file_type));
    if (meta.original_name) parts.push(meta.original_name);
    if (meta.file_size != null) parts.push(`${meta.file_size} bytes`);
    return parts.join(" · ");
  }

  if (event.event_type === "application_approved") {
    const parts = [];
    if (meta.username) parts.push(`Username: ${meta.username}`);
    if (meta.credit_limit != null) parts.push(`Credit limit: KES ${formatMoney(meta.credit_limit)}`);
    if (meta.approved_customer_id != null) parts.push(`Customer ID: ${meta.approved_customer_id}`);
    return parts.join(" · ");
  }

  if (event.event_type === "workflow_updated") {
    const after = meta.after || {};
    const parts = [];
    if (after.review_stage) parts.push(`Stage: ${after.review_stage}`);
    if (after.filed_reference) parts.push(`Filed ref: ${after.filed_reference}`);
    if (after.digital_file_name) parts.push(`Archive file: ${after.digital_file_name}`);
    return parts.join(" · ");
  }

  if (event.event_type === "application_received") {
    const parts = [];
    if (meta.submitted_via) parts.push(`Source: ${meta.submitted_via}`);
    if (meta.requested_credit_limit != null) {
      parts.push(`Requested: KES ${formatMoney(meta.requested_credit_limit)}`);
    }
    return parts.join(" · ");
  }

  try {
    const text = JSON.stringify(meta);
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  } catch {
    return "";
  }
}

function TimelineSection({
  events,
  loading,
  colors,
  isDark,
  title = "Audit Timeline",
  showPrintFriendly = false,
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: isDark ? "#111827" : "#ffffff",
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          color: colors.text,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      {loading ? (
        <div style={{ color: colors.textMuted }}>Loading timeline...</div>
      ) : events.length === 0 ? (
        <div style={{ color: colors.textMuted }}>No audit events recorded yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {events.map((event) => {
            const metadataSummary = summarizeEventMetadata(event);

            return (
              <div
                key={event.id}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 12,
                  background: isDark ? "#0f172a" : "#f8fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <EventTypeBadge
                    eventType={event.event_type}
                    label={event.event_label}
                    isDark={isDark}
                  />

                  <div style={{ color: colors.textMuted, fontSize: 12, fontWeight: 700 }}>
                    {formatDateTime(event.created_at)}
                  </div>
                </div>

                <div style={{ color: colors.text, fontWeight: 700, marginBottom: 4 }}>
                  {event.actor_user_email || "System / Public"}
                </div>

                {event.event_notes ? (
                  <div
                    style={{
                      color: colors.text,
                      lineHeight: 1.6,
                      marginBottom: metadataSummary ? 6 : 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {event.event_notes}
                  </div>
                ) : null}

                {metadataSummary ? (
                  <div
                    style={{
                      color: colors.textMuted,
                      fontSize: 13,
                      lineHeight: 1.6,
                      whiteSpace: showPrintFriendly ? "pre-wrap" : "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {metadataSummary}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RouteCustomerApplications() {
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputText: isDark ? "#f8fafc" : "#0f172a",
    dangerBg: isDark ? "rgba(127,29,29,0.22)" : "#fef2f2",
    dangerBorder: isDark ? "rgba(239,68,68,0.4)" : "#fecaca",
    dangerText: isDark ? "#fca5a5" : "#b91c1c",
    successBg: isDark ? "rgba(20,83,45,0.22)" : "#f0fdf4",
    successBorder: isDark ? "rgba(34,197,94,0.4)" : "#bbf7d0",
    successText: isDark ? "#86efac" : "#166534",
    infoBg: isDark ? "rgba(29,78,216,0.16)" : "#eff6ff",
    infoBorder: isDark ? "rgba(96,165,250,0.28)" : "#bfdbfe",
    infoText: isDark ? "#bfdbfe" : "#1d4ed8",
    warningBg: isDark ? "rgba(234,88,12,0.18)" : "#fff7ed",
    warningBorder: isDark ? "rgba(251,146,60,0.28)" : "#fed7aa",
    warningText: isDark ? "#fdba74" : "#c2410c",
  };

  const [rows, setRows] = useState([]);
  const [routeCustomers, setRouteCustomers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManualForm());
  const [savingManual, setSavingManual] = useState(false);

  const [openReviewId, setOpenReviewId] = useState(null);
  const [printApplicationId, setPrintApplicationId] = useState(null);

  const [reviewForms, setReviewForms] = useState({});
  const [workflowForms, setWorkflowForms] = useState({});

  const [applicationFiles, setApplicationFiles] = useState({});
  const [loadingFilesById, setLoadingFilesById] = useState({});
  const [uploadingById, setUploadingById] = useState({});
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  const [applicationEvents, setApplicationEvents] = useState({});
  const [loadingEventsById, setLoadingEventsById] = useState({});

  const [fileDrafts, setFileDrafts] = useState({});
  const [fileInputKeys, setFileInputKeys] = useState({});

  const [savingReview, setSavingReview] = useState(false);
  const [savingWorkflow, setSavingWorkflow] = useState(false);

  async function loadData() {
    setLoading(true);
    setPageError("");

    try {
      const [applicationsRes, routeCustomersRes] = await Promise.all([
        listRouteCustomerApplications(statusFilter),
        listAdminRouteCustomers(),
      ]);

      setRows(applicationsRes?.data?.applications || []);
      setRouteCustomers(routeCustomersRes?.data?.customers || []);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load route customer applications"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    function handleAfterPrint() {
      setPrintApplicationId(null);
    }

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  function getReviewForm(application) {
    return {
      ...buildDefaultReviewForm(application),
      ...(reviewForms[application.id] || {}),
    };
  }

  function updateReviewForm(applicationId, application, patch) {
    setReviewForms((prev) => {
      const current = {
        ...buildDefaultReviewForm(application),
        ...(prev[applicationId] || {}),
      };

      return {
        ...prev,
        [applicationId]: {
          ...current,
          ...patch,
        },
      };
    });
  }

  function getWorkflowForm(application) {
    return {
      ...buildDefaultWorkflowForm(application),
      ...(workflowForms[application.id] || {}),
    };
  }

  function updateWorkflowForm(applicationId, application, patch) {
    setWorkflowForms((prev) => {
      const current = {
        ...buildDefaultWorkflowForm(application),
        ...(prev[applicationId] || {}),
      };

      return {
        ...prev,
        [applicationId]: {
          ...current,
          ...patch,
        },
      };
    });
  }

  function getFileDraft(applicationId) {
    return (
      fileDrafts[applicationId] || {
        file_type: "received_form",
        file: null,
      }
    );
  }

  function updateFileDraft(applicationId, patch) {
    setFileDrafts((prev) => {
      const current = prev[applicationId] || {
        file_type: "received_form",
        file: null,
      };

      return {
        ...prev,
        [applicationId]: {
          ...current,
          ...patch,
        },
      };
    });
  }

  function resetFileInput(applicationId) {
    setFileInputKeys((prev) => ({
      ...prev,
      [applicationId]: (prev[applicationId] || 0) + 1,
    }));
  }

  async function loadApplicationFiles(applicationId, force = false) {
    if (!force && Object.prototype.hasOwnProperty.call(applicationFiles, applicationId)) {
      return;
    }

    if (loadingFilesById[applicationId]) return;

    setLoadingFilesById((prev) => ({ ...prev, [applicationId]: true }));

    try {
      const response = await listRouteCustomerApplicationFiles(applicationId);
      setApplicationFiles((prev) => ({
        ...prev,
        [applicationId]: response?.data?.files || [],
      }));
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load application files"
      );
    } finally {
      setLoadingFilesById((prev) => ({ ...prev, [applicationId]: false }));
    }
  }

  async function loadApplicationEvents(applicationId, force = false) {
    if (!force && Object.prototype.hasOwnProperty.call(applicationEvents, applicationId)) {
      return;
    }

    if (loadingEventsById[applicationId]) return;

    setLoadingEventsById((prev) => ({ ...prev, [applicationId]: true }));

    try {
      const response = await listRouteCustomerApplicationEvents(applicationId);
      setApplicationEvents((prev) => ({
        ...prev,
        [applicationId]: response?.data?.events || [],
      }));
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load application timeline"
      );
    } finally {
      setLoadingEventsById((prev) => ({ ...prev, [applicationId]: false }));
    }
  }

  async function handleOpenReview(applicationId) {
    const next = openReviewId === applicationId ? null : applicationId;
    setOpenReviewId(next);

    if (next) {
      await Promise.all([
        loadApplicationFiles(applicationId),
        loadApplicationEvents(applicationId),
      ]);
    }
  }

  async function handleCreateManualApplication(e) {
    e.preventDefault();
    if (savingManual) return;

    setSavingManual(true);
    setPageError("");
    setPageSuccess("");

    try {
      const applicantName = String(manualForm.applicant_name || "").trim();
      const email = String(manualForm.email || "").trim();
      const phone = String(manualForm.phone || "").trim();
      const businessName = String(manualForm.business_name || "").trim();
      const formReference = String(manualForm.form_reference || "").trim();
      const handwrittenSummary = String(manualForm.handwritten_summary || "").trim();
      const creditRaw = String(manualForm.requested_credit_limit || "").trim();

      if (!applicantName) throw new Error("Applicant name is required");
      if (!email) throw new Error("Email is required");
      if (!phone) throw new Error("Phone is required");

      await createManualRouteCustomerApplication({
        applicant_name: applicantName,
        business_name: businessName || null,
        email,
        phone,
        address: handwrittenSummary || null,
        requested_credit_limit: creditRaw === "" ? 0 : Number(creditRaw),
        form_reference: formReference || null,
      });

      setPageSuccess("Received handwritten/email application registered successfully.");
      setManualForm(emptyManualForm());
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to register received application"
      );
    } finally {
      setSavingManual(false);
    }
  }

  async function handleSaveWorkflow(application) {
    if (savingWorkflow) return;

    const form = getWorkflowForm(application);

    setSavingWorkflow(true);
    setPageError("");
    setPageSuccess("");

    try {
      await saveRouteCustomerApplicationWorkflow(application.id, {
        is_printed: Boolean(form.is_printed),
        security_reviewed: Boolean(form.security_reviewed),
        finance_reviewed: Boolean(form.finance_reviewed),
        admin_reviewed: Boolean(form.admin_reviewed),
        physically_filed: Boolean(form.physically_filed),
        digitally_archived: Boolean(form.digitally_archived),
        workflow_notes: String(form.workflow_notes || "").trim() || null,
        filed_reference: String(form.filed_reference || "").trim() || null,
        admin_notes: String(form.admin_notes || "").trim() || null,
        received_email_subject: String(form.received_email_subject || "").trim() || null,
        received_email_from: String(form.received_email_from || "").trim() || null,
        received_on_email_at: form.received_on_email_at || null,
        digital_file_name: String(form.digital_file_name || "").trim() || null,
        digital_file_reference: String(form.digital_file_reference || "").trim() || null,
      });

      setPageSuccess("Workflow and archive tracking saved successfully.");
      await Promise.all([
        loadData(),
        loadApplicationEvents(application.id, true),
      ]);
      setOpenReviewId(application.id);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save workflow tracking"
      );
    } finally {
      setSavingWorkflow(false);
    }
  }

  async function handleApprove(application) {
    if (savingReview) return;

    const form = getReviewForm(application);
    const safeUsername = String(form.username || "").trim();
    const safeTemporaryPassword = String(form.temporary_password || "").trim();
    const safeCreditNotes = String(form.credit_notes || "").trim();
    const safeAdminNotes = String(form.admin_notes || "").trim();
    const safeCreditLimitRaw = String(form.credit_limit || "").trim();

    setSavingReview(true);
    setPageError("");
    setPageSuccess("");

    try {
      await approveRouteCustomerApplication(application.id, {
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        username: safeUsername || null,
        temporary_password: safeTemporaryPassword || null,
        credit_limit: safeCreditLimitRaw === "" ? 0 : Number(safeCreditLimitRaw),
        credit_notes: safeCreditNotes || null,
        admin_notes: safeAdminNotes || null,
      });

      setPageSuccess("Application approved successfully.");
      await Promise.all([
        loadData(),
        loadApplicationEvents(application.id, true),
      ]);
      setOpenReviewId(null);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to approve application"
      );
    } finally {
      setSavingReview(false);
    }
  }

  async function handleReject(application) {
    if (savingReview) return;

    const form = getReviewForm(application);
    const safeAdminNotes = String(form.admin_notes || "").trim();

    setSavingReview(true);
    setPageError("");
    setPageSuccess("");

    try {
      await rejectRouteCustomerApplication(application.id, {
        admin_notes: safeAdminNotes || null,
      });

      setPageSuccess("Application rejected successfully.");
      await Promise.all([
        loadData(),
        loadApplicationEvents(application.id, true),
      ]);
      setOpenReviewId(null);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to reject application"
      );
    } finally {
      setSavingReview(false);
    }
  }

  async function handleUploadFile(application) {
    const applicationId = application.id;
    const draft = getFileDraft(applicationId);

    if (uploadingById[applicationId]) return;

    if (!draft.file) {
      setPageError("Choose a file before uploading.");
      return;
    }

    setUploadingById((prev) => ({ ...prev, [applicationId]: true }));
    setPageError("");
    setPageSuccess("");

    try {
      await uploadRouteCustomerApplicationFile(
        applicationId,
        draft.file_type,
        draft.file
      );

      setPageSuccess("Application file uploaded successfully.");

      updateFileDraft(applicationId, {
        file_type: draft.file_type,
        file: null,
      });

      resetFileInput(applicationId);

      await Promise.all([
        loadApplicationFiles(applicationId, true),
        loadApplicationEvents(applicationId, true),
        loadData(),
      ]);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to upload application file"
      );
    } finally {
      setUploadingById((prev) => ({ ...prev, [applicationId]: false }));
    }
  }

  async function handleDownloadFile(applicationId, fileRecord) {
    if (downloadingFileId) return;

    setDownloadingFileId(fileRecord.id);
    setPageError("");
    setPageSuccess("");

    try {
      await downloadRouteCustomerApplicationFile(
        applicationId,
        fileRecord.id,
        fileRecord.original_name || "downloaded-file"
      );
      setPageSuccess("File download started.");
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to download application file"
      );
    } finally {
      setDownloadingFileId(null);
    }
  }

  async function handleDeleteFile(application, fileRecord) {
    if (deletingFileId) return;

    const confirmed = window.confirm(
      `Delete file "${fileRecord.original_name}"? This removes both the database record and the stored file.`
    );

    if (!confirmed) return;

    setDeletingFileId(fileRecord.id);
    setPageError("");
    setPageSuccess("");

    try {
      await deleteRouteCustomerApplicationFile(application.id, fileRecord.id);
      setPageSuccess("Application file deleted successfully.");

      await Promise.all([
        loadApplicationFiles(application.id, true),
        loadApplicationEvents(application.id, true),
        loadData(),
      ]);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to delete application file"
      );
    } finally {
      setDeletingFileId(null);
    }
  }

  async function handlePrint(applicationId) {
    await Promise.all([
      loadApplicationFiles(applicationId, true),
      loadApplicationEvents(applicationId, true),
    ]);

    setPrintApplicationId(applicationId);

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 120);
    });
  }

  const enrichedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      complianceIssues: getComplianceIssues(row),
    }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!complianceFilter) return enrichedRows;

    return enrichedRows.filter((row) => {
      const codes = row.complianceIssues.map((issue) => issue.code);

      switch (complianceFilter) {
        case "has_issues":
          return row.complianceIssues.length > 0;
        case "approved_missing_archive":
          return codes.includes("approved_missing_archive");
        case "filed_missing_reference":
          return codes.includes("filed_missing_reference");
        case "missing_email_evidence":
          return codes.includes("missing_email_evidence");
        case "archive_evidence_incomplete":
          return (
            codes.includes("archived_missing_filename") ||
            codes.includes("archived_missing_reference") ||
            codes.includes("archive_evidence_incomplete")
          );
        case "approved_incomplete":
          return (
            codes.includes("approved_missing_archive") ||
            codes.includes("approved_missing_file")
          );
        default:
          return true;
      }
    });
  }, [enrichedRows, complianceFilter]);

  const summary = useMemo(() => {
    return {
      total: enrichedRows.length,
      received: enrichedRows.filter((r) => (r.review_stage || "received") === "received").length,
      printed: enrichedRows.filter((r) => Boolean(r.is_printed)).length,
      securityReviewed: enrichedRows.filter((r) => Boolean(r.security_reviewed)).length,
      financeReviewed: enrichedRows.filter((r) => Boolean(r.finance_reviewed)).length,
      archived: enrichedRows.filter((r) => Boolean(r.digitally_archived)).length,
      filed: enrichedRows.filter((r) => Boolean(r.physically_filed)).length,
      approved: enrichedRows.filter((r) => r.status === "approved").length,
      withIssues: enrichedRows.filter((r) => r.complianceIssues.length > 0).length,
      approvedIncomplete: enrichedRows.filter((r) =>
        r.complianceIssues.some((issue) =>
          ["approved_missing_archive", "approved_missing_file"].includes(issue.code)
        )
      ).length,
      missingEmailEvidence: enrichedRows.filter((r) =>
        r.complianceIssues.some((issue) => issue.code === "missing_email_evidence")
      ).length,
      archiveEvidenceIncomplete: enrichedRows.filter((r) =>
        r.complianceIssues.some((issue) =>
          ["archived_missing_filename", "archived_missing_reference", "archive_evidence_incomplete"].includes(issue.code)
        )
      ).length,
    };
  }, [enrichedRows]);

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontWeight: 700,
    fontSize: 13,
    color: colors.text,
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    boxSizing: "border-box",
    background: colors.inputBg,
    color: colors.inputText,
  };

  const textareaStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    boxSizing: "border-box",
    resize: "vertical",
    background: colors.inputBg,
    color: colors.inputText,
  };

  const selectStyle = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.inputBg,
    color: colors.inputText,
    cursor: "pointer",
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          color: colors.textMuted,
          background: colors.bg,
          minHeight: "100vh",
        }}
      >
        Loading route customer applications...
      </div>
    );
  }

  return (
    <div
      className="route-customer-applications-page"
      style={{ background: colors.bg, minHeight: "100vh", padding: 20 }}
    >
      <style>{`
        .route-customer-applications-page input::placeholder,
        .route-customer-applications-page textarea::placeholder {
          color: ${isDark ? "#94a3b8" : "#64748b"};
          opacity: 1;
        }

        .route-customer-applications-page input,
        .route-customer-applications-page textarea,
        .route-customer-applications-page select {
          outline: none;
        }

        .route-customer-applications-page input:focus,
        .route-customer-applications-page textarea:focus,
        .route-customer-applications-page select:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px ${
            isDark ? "rgba(102,126,234,0.18)" : "rgba(102,126,234,0.12)"
          };
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .route-customer-applications-page,
          .route-customer-applications-page * {
            visibility: hidden !important;
          }

          .application-card.print-target,
          .application-card.print-target * {
            visibility: visible !important;
          }

          .application-card {
            display: none !important;
          }

          .application-card.print-target {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #111827 !important;
            z-index: 999999 !important;
            page-break-inside: avoid !important;
          }

          .no-print {
            display: none !important;
          }

          .print-text {
            color: #111827 !important;
          }
        }
      `}</style>

      <div
        className="no-print"
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
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: colors.text }}>
            🗂️ Route Customer Manual Review Register
          </h1>
          <p
            style={{
              marginTop: 6,
              marginBottom: 0,
              color: colors.textMuted,
              fontSize: 14,
            }}
          >
            Internal register for emailed handwritten forms, printed review, department sign-off, approval, filing, compliance control, file custody, and audit timeline.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            style={{
              padding: "11px 16px",
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {showCreateForm ? "Close Register Form" : "+ Register Received Form"}
          </button>

          <button
            type="button"
            onClick={loadData}
            style={{
              padding: "11px 16px",
              background: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        className="no-print"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Total Records" value={summary.total} subtitle="All records" colors={colors} />
        <SummaryCard title="Received" value={summary.received} subtitle="Newly received" colors={colors} />
        <SummaryCard title="Printed" value={summary.printed} subtitle="Printed by admin" colors={colors} />
        <SummaryCard title="Security Reviewed" value={summary.securityReviewed} subtitle="Security checked" colors={colors} />
        <SummaryCard title="Finance Reviewed" value={summary.financeReviewed} subtitle="Finance checked" colors={colors} />
        <SummaryCard title="Archived" value={summary.archived} subtitle="Digital copy archived" colors={colors} />
        <SummaryCard title="Filed" value={summary.filed} subtitle="Physically filed" colors={colors} />
        <SummaryCard title="Approved" value={summary.approved} subtitle="Approved records" colors={colors} />
      </div>

      <div
        className="no-print"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Records With Issues" value={summary.withIssues} subtitle="Need admin cleanup" colors={colors} />
        <SummaryCard title="Approved Incomplete" value={summary.approvedIncomplete} subtitle="Approved but not fully closed" colors={colors} />
        <SummaryCard title="Missing Email Evidence" value={summary.missingEmailEvidence} subtitle="Sender/subject/time incomplete" colors={colors} />
        <SummaryCard title="Archive Evidence Weak" value={summary.archiveEvidenceIncomplete} subtitle="Missing file name/reference" colors={colors} />
      </div>

      {(pageError || pageSuccess) && (
        <div
          className="no-print"
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 14,
            border: `1px solid ${pageError ? colors.dangerBorder : colors.successBorder}`,
            background: pageError ? colors.dangerBg : colors.successBg,
            color: pageError ? colors.dangerText : colors.successText,
            fontWeight: 600,
          }}
        >
          {pageError || pageSuccess}
        </div>
      )}

      {showCreateForm && (
        <div
          className="no-print"
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            padding: 20,
            boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, color: colors.text }}>
            Register Received Handwritten / Emailed Form
          </h3>

          <form onSubmit={handleCreateManualApplication}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label style={labelStyle}>Applicant Name *</label>
                <input
                  type="text"
                  value={manualForm.applicant_name}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, applicant_name: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Business Name</label>
                <input
                  type="text"
                  value={manualForm.business_name}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, business_name: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  type="text"
                  value={manualForm.phone}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Requested Credit Limit (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualForm.requested_credit_limit}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      requested_credit_limit: e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email / Form Reference</label>
                <input
                  type="text"
                  value={manualForm.form_reference}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, form_reference: e.target.value }))
                  }
                  placeholder="Email subject, sender reference, or printed reference"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Admin Intake Notes / Handwritten Summary</label>
              <textarea
                rows={5}
                value={manualForm.handwritten_summary}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    handwritten_summary: e.target.value,
                  }))
                }
                placeholder="Type the key details seen on the handwritten form or scanned attachment"
                style={textareaStyle}
              />
            </div>

            <button
              type="submit"
              disabled={savingManual}
              style={{
                padding: "12px 18px",
                background: "#0f766e",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {savingManual ? "Saving..." : "Register Received Form"}
            </button>
          </form>
        </div>
      )}

      <div
        className="no-print"
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
          boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 800, color: colors.text }}>Filter by Status</div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All</option>
            <option value="pending">Received</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div style={{ fontWeight: 800, color: colors.text, marginLeft: 12 }}>
            Compliance Filter
          </div>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Records</option>
            <option value="has_issues">Any Compliance Issue</option>
            <option value="approved_missing_archive">Approved but Not Archived</option>
            <option value="approved_incomplete">Approved but Incomplete</option>
            <option value="filed_missing_reference">Filed but Missing Reference</option>
            <option value="missing_email_evidence">Missing Email Evidence</option>
            <option value="archive_evidence_incomplete">Archive Evidence Incomplete</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setComplianceFilter("");
            }}
            style={{
              padding: "10px 14px",
              background: "#64748b",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Clear Filters
          </button>
        </div>

        {complianceFilter ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: colors.warningBg,
              border: `1px solid ${colors.warningBorder}`,
              color: colors.warningText,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Compliance filter is active. You are viewing only records matching the selected problem type.
          </div>
        ) : null}
      </div>

      {filteredRows.length === 0 ? (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            padding: 28,
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          No route customer application records found for this filter.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filteredRows.map((application) => {
            const reviewForm = getReviewForm(application);
            const workflowForm = getWorkflowForm(application);
            const isPrintTarget = printApplicationId === application.id;
            const stage =
              application.review_stage ||
              (application.status === "approved"
                ? "approved"
                : application.status === "rejected"
                ? "rejected"
                : "received");

            const hasLoadedFiles = Object.prototype.hasOwnProperty.call(
              applicationFiles,
              application.id
            );
            const filesForApplication = hasLoadedFiles
              ? applicationFiles[application.id]
              : [];

            const hasLoadedEvents = Object.prototype.hasOwnProperty.call(
              applicationEvents,
              application.id
            );
            const eventsForApplication = hasLoadedEvents
              ? applicationEvents[application.id]
              : [];

            const fileDraft = getFileDraft(application.id);
            const isLoadingFiles = Boolean(loadingFilesById[application.id]);
            const isUploadingFile = Boolean(uploadingById[application.id]);
            const isLoadingEvents = Boolean(loadingEventsById[application.id]);
            const fileInputKey = fileInputKeys[application.id] || 0;

            return (
              <div
                key={application.id}
                className={`application-card ${isPrintTarget ? "print-target" : ""}`}
                style={{
                  background: colors.card,
                  border: `1px solid ${
                    application.complianceIssues.length > 0
                      ? isDark
                        ? "rgba(248,113,113,0.35)"
                        : "#fecaca"
                      : colors.border
                  }`,
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  className="print-text"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: colors.text }}>
                      {application.business_name || application.applicant_name}
                    </div>

                    <div style={{ marginTop: 6, color: colors.textMuted, fontSize: 14 }}>
                      Applicant: {application.applicant_name} · Email: {application.email} · Phone: {application.phone}
                    </div>

                    <div style={{ marginTop: 6, color: colors.textMuted, fontSize: 13 }}>
                      Reference: {application.form_reference || "—"} · Source: {application.submitted_via || "manual"} · Received:{" "}
                      {application.created_at ? formatDateTime(application.created_at) : "—"}
                    </div>
                  </div>

                  <div
                    className="no-print"
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}
                  >
                    <StageBadge stage={stage} isDark={isDark} />
                    {application.complianceIssues.length > 0 ? (
                      <ComplianceBadge count={application.complianceIssues.length} isDark={isDark} />
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handlePrint(application.id)}
                      style={{
                        padding: "10px 14px",
                        background: "#334155",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      Print Review Sheet
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReview(application.id)}
                      style={{
                        padding: "10px 14px",
                        background: "#1d4ed8",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      {openReviewId === application.id ? "Close Review" : "Open Review"}
                    </button>
                  </div>
                </div>

                {application.complianceIssues.length > 0 ? (
                  <div
                    className="no-print"
                    style={{
                      marginBottom: 16,
                      padding: 14,
                      borderRadius: 14,
                      background: isDark ? "rgba(127,29,29,0.22)" : "#fff7f7",
                      border: `1px solid ${isDark ? "rgba(248,113,113,0.35)" : "#fecaca"}`,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color: isDark ? "#fca5a5" : "#b91c1c",
                        marginBottom: 10,
                      }}
                    >
                      Compliance Warnings
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {application.complianceIssues.map((issue) => (
                        <WarningPill key={issue.code} text={issue.label} isDark={isDark} />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div
                  className="print-text"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Requested Credit
                    </div>
                    <div style={{ marginTop: 4, color: colors.text, fontWeight: 700 }}>
                      KES {formatMoney(application.requested_credit_limit)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Region
                    </div>
                    <div style={{ marginTop: 4, color: colors.text, fontWeight: 700 }}>
                      {application.region_name || "—"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Location
                    </div>
                    <div style={{ marginTop: 4, color: colors.text, fontWeight: 700 }}>
                      {application.location_name || "—"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Workflow Stage
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <StageBadge stage={stage} isDark={isDark} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div
                    className="print-text"
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: colors.text,
                      marginBottom: 12,
                    }}
                  >
                    Applicant / Business Details
                  </div>

                  <DetailGrid application={application} colors={colors} isDark={isDark} />
                </div>

                <div
                  className="print-text"
                  style={{
                    marginTop: 8,
                    padding: 16,
                    borderRadius: 14,
                    border: `1px dashed ${colors.border}`,
                    background: isDark ? "#0f172a" : "#fcfcfd",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: colors.text,
                      marginBottom: 12,
                    }}
                  >
                    Internal Manual Review Sheet
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 14,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Paper Workflow Checklist
                      </div>

                      <div style={{ color: colors.text, lineHeight: 1.85, fontSize: 14 }}>
                        {checklistMark(application.is_printed)} Printed by admin
                        <br />
                        {checklistMark(application.security_reviewed)} Security reviewed / signed / stamped
                        <br />
                        {checklistMark(application.finance_reviewed)} Finance reviewed / signed / stamped
                        <br />
                        {checklistMark(application.admin_reviewed)} Admin reviewed / signed / stamped
                        <br />
                        {checklistMark(application.physically_filed)} Physical form filed
                        <br />
                        {checklistMark(application.digitally_archived)} Signed copy digitally archived
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Internal Sign-Off Lines
                      </div>

                      <div style={{ color: colors.text, lineHeight: 2.1, fontSize: 14 }}>
                        Security Dept: ______________________________
                        <br />
                        Finance Dept: _______________________________
                        <br />
                        Admin Review: _______________________________
                        <br />
                        Date: ______________________________________
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Received Email Subject
                      </div>
                      <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                        {application.received_email_subject || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Received From
                      </div>
                      <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                        {application.received_email_from || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Email Received At
                      </div>
                      <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                        {formatDateTime(application.received_on_email_at)}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Received By
                      </div>
                      <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                        {application.received_by_email || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Digital File Name
                      </div>
                      <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                        {application.digital_file_name || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Digital File Reference
                      </div>
                      <div
                        style={{
                          color: colors.text,
                          lineHeight: 1.7,
                          minHeight: 24,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {application.digital_file_reference || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Archived By
                      </div>
                      <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                        {application.archived_by_email || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isDark ? "#111827" : "#ffffff",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                        Archived At
                      </div>
                      <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                        {formatDateTime(application.archived_at)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: isDark ? "#111827" : "#ffffff",
                      border: `1px solid ${colors.border}`,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: colors.text, marginBottom: 8 }}>
                      Attached Files
                    </div>

                    {filesForApplication.length > 0 ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        {filesForApplication.map((file) => (
                          <div
                            key={file.id}
                            style={{
                              border: `1px solid ${colors.border}`,
                              borderRadius: 10,
                              padding: 10,
                            }}
                          >
                            <div style={{ fontWeight: 700, color: colors.text }}>
                              {file.original_name}
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                              {getFileTypeLabel(file.file_type)} · {file.mime_type} · {file.file_size} bytes
                            </div>
                            <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                              Uploaded: {formatDateTime(file.created_at)} · By: {file.uploaded_by_email || "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: colors.textMuted }}>
                        No uploaded files recorded for this application.
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <TimelineSection
                      events={eventsForApplication}
                      loading={isLoadingEvents}
                      colors={colors}
                      isDark={isDark}
                      title="Audit Timeline"
                      showPrintFriendly
                    />
                  </div>

                  {application.complianceIssues.length > 0 ? (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#be123c", marginBottom: 6 }}>
                        Compliance Warnings
                      </div>
                      <div style={{ color: "#881337", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {application.complianceIssues.map((issue) => `• ${issue.label}`).join("\n")}
                      </div>
                    </div>
                  ) : null}

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: isDark ? "#111827" : "#ffffff",
                      border: `1px solid ${colors.border}`,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                      Workflow Notes
                    </div>
                    <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                      {application.workflow_notes || "No workflow notes recorded yet."}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: isDark ? "#111827" : "#ffffff",
                      border: `1px solid ${colors.border}`,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                      Filed Reference
                    </div>
                    <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 24 }}>
                      {application.filed_reference || "No filed reference recorded yet."}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: isDark ? "#111827" : "#ffffff",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                      Admin Remarks
                    </div>
                    <div style={{ color: colors.text, lineHeight: 1.7, minHeight: 30 }}>
                      {application.admin_notes || "No admin remarks recorded yet."}
                    </div>
                  </div>
                </div>

                {openReviewId === application.id && (
                  <div
                    className="no-print"
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: colors.text,
                        marginBottom: 12,
                      }}
                    >
                      Workflow Tracking
                    </div>

                    <div
                      style={{
                        marginBottom: 14,
                        padding: 12,
                        borderRadius: 12,
                        background: colors.infoBg,
                        border: `1px solid ${colors.infoBorder}`,
                        color: colors.infoText,
                        fontSize: 13,
                        lineHeight: 1.7,
                        fontWeight: 600,
                      }}
                    >
                      These checkboxes and archive fields save to the database. The compliance warnings above will keep exposing incomplete records until they are fixed.
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      <label style={{ display: "flex", gap: 8, alignItems: "center", color: colors.text, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(workflowForm.is_printed)}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              is_printed: e.target.checked,
                            })
                          }
                        />
                        Printed by admin
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center", color: colors.text, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(workflowForm.security_reviewed)}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              security_reviewed: e.target.checked,
                            })
                          }
                        />
                        Security reviewed
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center", color: colors.text, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(workflowForm.finance_reviewed)}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              finance_reviewed: e.target.checked,
                            })
                          }
                        />
                        Finance reviewed
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center", color: colors.text, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(workflowForm.admin_reviewed)}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              admin_reviewed: e.target.checked,
                            })
                          }
                        />
                        Admin reviewed
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center", color: colors.text, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(workflowForm.physically_filed)}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              physically_filed: e.target.checked,
                            })
                          }
                        />
                        Physically filed
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center", color: colors.text, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(workflowForm.digitally_archived)}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              digitally_archived: e.target.checked,
                            })
                          }
                        />
                        Digitally archived
                      </label>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Received Email Subject</label>
                        <input
                          type="text"
                          value={workflowForm.received_email_subject || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              received_email_subject: e.target.value,
                            })
                          }
                          style={inputStyle}
                          placeholder="Example: Route customer application - James Mwangi"
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Received From Email</label>
                        <input
                          type="text"
                          value={workflowForm.received_email_from || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              received_email_from: e.target.value,
                            })
                          }
                          style={inputStyle}
                          placeholder="Example: mwangi@example.com"
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Received On Email At</label>
                        <input
                          type="datetime-local"
                          value={workflowForm.received_on_email_at || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              received_on_email_at: e.target.value,
                            })
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Digital File Name</label>
                        <input
                          type="text"
                          value={workflowForm.digital_file_name || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              digital_file_name: e.target.value,
                            })
                          }
                          style={inputStyle}
                          placeholder="Example: RA-2026-001-James-Mwangi.pdf"
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Digital File Reference</label>
                        <input
                          type="text"
                          value={workflowForm.digital_file_reference || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              digital_file_reference: e.target.value,
                            })
                          }
                          style={inputStyle}
                          placeholder="Example: uploads/route-customer-applications/12/1710000000-abc123.pdf"
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Workflow Notes</label>
                        <textarea
                          rows={4}
                          value={workflowForm.workflow_notes || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              workflow_notes: e.target.value,
                            })
                          }
                          style={textareaStyle}
                          placeholder="Printed, handed to security, returned from finance, archived scan done, etc."
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Filed Reference</label>
                        <input
                          type="text"
                          value={workflowForm.filed_reference || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              filed_reference: e.target.value,
                            })
                          }
                          style={inputStyle}
                          placeholder="Example: FILE-APR-2026-001"
                        />

                        <div style={{ height: 12 }} />

                        <label style={labelStyle}>Workflow Admin Remarks</label>
                        <textarea
                          rows={3}
                          value={workflowForm.admin_notes || ""}
                          onChange={(e) =>
                            updateWorkflowForm(application.id, application, {
                              admin_notes: e.target.value,
                            })
                          }
                          style={textareaStyle}
                          placeholder="Internal review remarks"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 22 }}>
                      <button
                        type="button"
                        onClick={() => handleSaveWorkflow(application)}
                        disabled={savingWorkflow}
                        style={{
                          padding: "12px 16px",
                          background: "#0f766e",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        {savingWorkflow ? "Saving Workflow..." : "Save Workflow & Archive Tracking"}
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: colors.text,
                        marginBottom: 12,
                      }}
                    >
                      Application Files
                    </div>

                    <div
                      style={{
                        marginBottom: 14,
                        padding: 12,
                        borderRadius: 12,
                        background: colors.infoBg,
                        border: `1px solid ${colors.infoBorder}`,
                        color: colors.infoText,
                        fontSize: 13,
                        lineHeight: 1.7,
                        fontWeight: 600,
                      }}
                    >
                      Upload the real scanned documents here. Typed archive references are not enough if the actual file is missing.
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "220px 1fr auto",
                        gap: 12,
                        alignItems: "end",
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <label style={labelStyle}>File Type</label>
                        <select
                          value={fileDraft.file_type}
                          onChange={(e) =>
                            updateFileDraft(application.id, {
                              file_type: e.target.value,
                            })
                          }
                          style={{ ...selectStyle, width: "100%" }}
                        >
                          <option value="received_form">Received Form</option>
                          <option value="signed_form">Signed Form</option>
                          <option value="supporting_document">Supporting Document</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Choose File</label>
                        <input
                          key={fileInputKey}
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          onChange={(e) =>
                            updateFileDraft(application.id, {
                              file: e.target.files?.[0] || null,
                            })
                          }
                          style={inputStyle}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUploadFile(application)}
                        disabled={isUploadingFile}
                        style={{
                          padding: "12px 16px",
                          background: "#1d4ed8",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        {isUploadingFile ? "Uploading..." : "Upload File"}
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: 14,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => loadApplicationFiles(application.id, true)}
                        disabled={isLoadingFiles}
                        style={{
                          padding: "10px 14px",
                          background: "#334155",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        {isLoadingFiles ? "Refreshing..." : "Refresh Files"}
                      </button>

                      <button
                        type="button"
                        onClick={() => loadApplicationEvents(application.id, true)}
                        disabled={isLoadingEvents}
                        style={{
                          padding: "10px 14px",
                          background: "#475569",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        {isLoadingEvents ? "Refreshing..." : "Refresh Timeline"}
                      </button>

                      <div style={{ color: colors.textMuted, fontSize: 13 }}>
                        {hasLoadedFiles
                          ? `${filesForApplication.length} file(s) loaded`
                          : "Files not loaded yet"}
                      </div>

                      <div style={{ color: colors.textMuted, fontSize: 13 }}>
                        {hasLoadedEvents
                          ? `${eventsForApplication.length} event(s) loaded`
                          : "Timeline not loaded yet"}
                      </div>
                    </div>

                    <div
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        marginBottom: 22,
                      }}
                    >
                      {isLoadingFiles ? (
                        <div
                          style={{
                            padding: 16,
                            color: colors.textMuted,
                            background: colors.card,
                          }}
                        >
                          Loading files...
                        </div>
                      ) : filesForApplication.length === 0 ? (
                        <div
                          style={{
                            padding: 16,
                            color: colors.textMuted,
                            background: colors.card,
                          }}
                        >
                          No files uploaded for this application yet.
                        </div>
                      ) : (
                        filesForApplication.map((file) => (
                          <div
                            key={file.id}
                            style={{
                              padding: 14,
                              borderBottom: `1px solid ${colors.border}`,
                              background: colors.card,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, color: colors.text }}>
                                  {file.original_name}
                                </div>
                                <div style={{ marginTop: 4, color: colors.textMuted, fontSize: 13 }}>
                                  {getFileTypeLabel(file.file_type)} · {file.mime_type} · {file.file_size} bytes
                                </div>
                                <div style={{ marginTop: 4, color: colors.textMuted, fontSize: 13 }}>
                                  Uploaded: {formatDateTime(file.created_at)} · By: {file.uploaded_by_email || "—"}
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(application.id, file)}
                                  disabled={downloadingFileId === file.id}
                                  style={{
                                    padding: "10px 14px",
                                    background: "#0f766e",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 12,
                                    cursor: "pointer",
                                    fontWeight: 800,
                                  }}
                                >
                                  {downloadingFileId === file.id ? "Downloading..." : "Download"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(application, file)}
                                  disabled={deletingFileId === file.id}
                                  style={{
                                    padding: "10px 14px",
                                    background: "#b91c1c",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 12,
                                    cursor: "pointer",
                                    fontWeight: 800,
                                  }}
                                >
                                  {deletingFileId === file.id ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: colors.text,
                        marginBottom: 12,
                      }}
                    >
                      Audit Timeline
                    </div>

                    <div
                      style={{
                        marginBottom: 14,
                        padding: 12,
                        borderRadius: 12,
                        background: colors.infoBg,
                        border: `1px solid ${colors.infoBorder}`,
                        color: colors.infoText,
                        fontSize: 13,
                        lineHeight: 1.7,
                        fontWeight: 600,
                      }}
                    >
                      This is the accountability layer. It shows who touched the application, what happened, and when.
                    </div>

                    <div style={{ marginBottom: 22 }}>
                      <TimelineSection
                        events={eventsForApplication}
                        loading={isLoadingEvents}
                        colors={colors}
                        isDark={isDark}
                        title="Application Event History"
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: colors.text,
                        marginBottom: 10,
                      }}
                    >
                      Approval / Rejection
                    </div>

                    <div
                      style={{
                        marginBottom: 14,
                        padding: 12,
                        borderRadius: 12,
                        background: colors.warningBg,
                        border: `1px solid ${colors.warningBorder}`,
                        color: colors.warningText,
                        fontSize: 13,
                        lineHeight: 1.7,
                        fontWeight: 600,
                      }}
                    >
                      Use this section for account issuance and final decision. Save workflow, archive tracking, uploads, and timeline-backed evidence first where relevant.
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <label style={labelStyle}>
                          Link to Existing Route Customer (optional only if already in system)
                        </label>

                        <select
                          value={reviewForm.customer_id || ""}
                          onChange={(e) =>
                            updateReviewForm(application.id, application, {
                              customer_id: e.target.value,
                            })
                          }
                          style={{
                            ...selectStyle,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="">Create new customer from this application</option>
                          {routeCustomers.map((customer) => (
                            <option
                              key={customer.id}
                              value={customer.id}
                              disabled={Boolean(customer.username)}
                            >
                              {customer.name}
                              {customer.username ? " — already has portal access" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Username (optional)</label>
                        <input
                          type="text"
                          value={reviewForm.username || ""}
                          onChange={(e) =>
                            updateReviewForm(application.id, application, {
                              username: e.target.value,
                            })
                          }
                          placeholder="Leave blank to auto-generate"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Temporary Password (optional)</label>
                        <input
                          type="text"
                          value={reviewForm.temporary_password || ""}
                          onChange={(e) =>
                            updateReviewForm(application.id, application, {
                              temporary_password: e.target.value,
                            })
                          }
                          placeholder="Leave blank to auto-generate"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Approved Credit Limit (KES)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={reviewForm.credit_limit || ""}
                          onChange={(e) =>
                            updateReviewForm(application.id, application, {
                              credit_limit: e.target.value,
                            })
                          }
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={labelStyle}>Credit Notes</label>
                      <textarea
                        rows={2}
                        value={reviewForm.credit_notes || ""}
                        onChange={(e) =>
                          updateReviewForm(application.id, application, {
                            credit_notes: e.target.value,
                          })
                        }
                        style={textareaStyle}
                        placeholder="Internal credit-related remarks"
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Final Admin Remarks</label>
                      <textarea
                        rows={4}
                        value={reviewForm.admin_notes || ""}
                        onChange={(e) =>
                          updateReviewForm(application.id, application, {
                            admin_notes: e.target.value,
                          })
                        }
                        style={textareaStyle}
                        placeholder="Decision notes, approval reasons, or rejection reasons"
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleApprove(application)}
                        disabled={savingReview}
                        style={{
                          padding: "12px 16px",
                          background: "#047857",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        {savingReview ? "Processing..." : "Approve & Issue Access"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(application)}
                        disabled={savingReview}
                        style={{
                          padding: "12px 16px",
                          background: "#b91c1c",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        {savingReview ? "Processing..." : "Reject Application"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

