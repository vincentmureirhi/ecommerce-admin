import React from "react";
import { useTheme } from "../context/ThemeContext";

const COMPANY_NAME = "Xpose Distributors";
const RECEIVING_EMAIL = "vinwambug@gmail.com";

function SectionTitle({ children, colors }) {
  return (
    <div
      style={{
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: `2px solid ${colors.border}`,
        fontSize: 17,
        fontWeight: 800,
        color: colors.text,
      }}
    >
      {children}
    </div>
  );
}

function BlankLine({ height = 42, colors }) {
  return (
    <div
      style={{
        height,
        borderBottom: `1px solid ${colors.border}`,
        marginTop: 6,
      }}
    />
  );
}

function FieldBlock({ label, colors, height = 38 }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.text,
        }}
      >
        {label}
      </div>
      <BlankLine height={height} colors={colors} />
    </div>
  );
}

export default function RouteCustomerApply() {
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#dbe3ee",
    text: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    infoBg: isDark ? "rgba(29,78,216,0.16)" : "#eff6ff",
    infoBorder: isDark ? "rgba(96,165,250,0.28)" : "#bfdbfe",
    infoText: isDark ? "#bfdbfe" : "#1d4ed8",
    warningBg: isDark ? "rgba(234,88,12,0.18)" : "#fff7ed",
    warningBorder: isDark ? "rgba(251,146,60,0.28)" : "#fed7aa",
    warningText: isDark ? "#fdba74" : "#c2410c",
  };

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="route-application-page"
      style={{
        minHeight: "100vh",
        background: colors.bg,
        padding: 24,
      }}
    >
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }

          .print-text {
            color: #111827 !important;
          }

          .print-line {
            border-color: #94a3b8 !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: colors.text,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              📝 Route Customer Application
            </h1>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: colors.textMuted,
                fontSize: 14,
              }}
            >
              Print the blank form, fill it by hand, then send the scanned copy, photo, or PDF to the official receiving email.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#1d4ed8",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Print Blank Form
          </button>
        </div>

        <div
          className="no-print"
          style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 16,
            border: `1px solid ${colors.infoBorder}`,
            background: colors.infoBg,
            color: colors.infoText,
            fontWeight: 600,
            lineHeight: 1.75,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            How this process works
          </div>
          <div>1. Print the blank application form below.</div>
          <div>2. Fill it by hand using clear handwriting.</div>
          <div>3. Sign where required.</div>
          <div>4. Scan it or take a clear photo.</div>
          <div>
            5. Send it to: <strong>{RECEIVING_EMAIL}</strong>
          </div>
          <div>6. Wait for company review, approval or rejection, and credit decision.</div>
        </div>

        <div
          className="no-print"
          style={{
            marginBottom: 18,
            padding: 16,
            borderRadius: 16,
            border: `1px solid ${colors.warningBorder}`,
            background: colors.warningBg,
            color: colors.warningText,
            fontWeight: 600,
            lineHeight: 1.75,
          }}
        >
          This page no longer submits digital applications directly.  
          The handwritten form sent by email is the real intake document.  
          The admin team records and reviews it internally after receipt.
        </div>

        <div
          className="print-card"
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 22,
            padding: 28,
            boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              className="print-text"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: colors.text,
                marginBottom: 6,
              }}
            >
              {COMPANY_NAME.toUpperCase()} ROUTE CUSTOMER CREDIT APPLICATION
            </div>

            <div
              className="print-text"
              style={{
                color: colors.textMuted,
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              Applicant should fill this form by hand and send the completed scanned copy / photo / PDF to{" "}
              <strong>{RECEIVING_EMAIL}</strong>.
              Company departments will review, sign, stamp, and file the document internally.
            </div>
          </div>

          <SectionTitle colors={colors}>1. Applicant & Business Identity</SectionTitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginBottom: 22,
            }}
          >
            <FieldBlock label="Applicant Name" colors={colors} />
            <FieldBlock label="Business Name" colors={colors} />
            <FieldBlock label="Phone Number" colors={colors} />
            <FieldBlock label="Email Address" colors={colors} />
            <FieldBlock label="Physical Address" colors={colors} />
            <FieldBlock label="Nearest Landmark" colors={colors} />
            <FieldBlock label="Town / Area" colors={colors} />
            <FieldBlock label="Business Type" colors={colors} />
          </div>

          <SectionTitle colors={colors}>2. Business Strength & Trade Profile</SectionTitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginBottom: 22,
            }}
          >
            <FieldBlock label="Years in Business" colors={colors} />
            <FieldBlock label="Estimated Monthly Purchase (KES)" colors={colors} />
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldBlock
                label="Main Products Bought / Interested In"
                colors={colors}
                height={64}
              />
            </div>
          </div>

          <SectionTitle colors={colors}>3. Credit Request & Operating Pattern</SectionTitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginBottom: 22,
            }}
          >
            <FieldBlock label="Requested Credit Limit (KES)" colors={colors} />
            <FieldBlock label="Preferred Payment Method" colors={colors} />
            <FieldBlock label="Preferred Visit Days" colors={colors} />
            <FieldBlock label="Reason for Credit Request" colors={colors} />
          </div>

          <SectionTitle colors={colors}>4. Ownership & Verification Contacts</SectionTitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginBottom: 22,
            }}
          >
            <FieldBlock label="Owner Full Name" colors={colors} />
            <FieldBlock label="Owner ID Number" colors={colors} />
            <FieldBlock label="Alternative Contact Name" colors={colors} />
            <FieldBlock label="Alternative Contact Phone" colors={colors} />
            <FieldBlock label="Bank / M-Pesa Account Name" colors={colors} />
            <FieldBlock label="Bank / M-Pesa Number" colors={colors} />
          </div>

          <SectionTitle colors={colors}>5. Additional Business Notes</SectionTitle>

          <div style={{ marginBottom: 24 }}>
            <FieldBlock
              label="Extra Notes / Business Explanation"
              colors={colors}
              height={84}
            />
          </div>

          <SectionTitle colors={colors}>6. Applicant Declaration</SectionTitle>

          <div
            className="print-text"
            style={{
              color: colors.text,
              lineHeight: 1.9,
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            I confirm that the information provided in this application is true and correct to the best of my knowledge.
            I understand that {COMPANY_NAME} may review this application and approve or reject credit access at its discretion.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 18,
              marginBottom: 28,
            }}
          >
            <FieldBlock label="Applicant Signature" colors={colors} />
            <FieldBlock label="Name" colors={colors} />
            <FieldBlock label="Date" colors={colors} />
          </div>

          <SectionTitle colors={colors}>7. Internal Company Review Only</SectionTitle>

          <div
            className="print-text"
            style={{
              display: "grid",
              gap: 18,
              color: colors.text,
            }}
          >
            <div
              style={{
                border: `1px dashed ${colors.border}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Security Department</div>
              <BlankLine height={78} colors={colors} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <FieldBlock label="Checked by" colors={colors} />
                <FieldBlock label="Signature / Stamp" colors={colors} />
                <FieldBlock label="Date" colors={colors} />
              </div>
            </div>

            <div
              style={{
                border: `1px dashed ${colors.border}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Finance Department</div>
              <BlankLine height={78} colors={colors} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <FieldBlock label="Checked by" colors={colors} />
                <FieldBlock label="Signature / Stamp" colors={colors} />
                <FieldBlock label="Date" colors={colors} />
              </div>
            </div>

            <div
              style={{
                border: `1px dashed ${colors.border}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Admin Remarks</div>
              <BlankLine height={96} colors={colors} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <FieldBlock label="Reviewed by" colors={colors} />
                <FieldBlock label="Signature / Stamp" colors={colors} />
                <FieldBlock label="Date" colors={colors} />
              </div>
            </div>
          </div>

          <div
            className="no-print"
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ color: colors.textMuted, fontSize: 13 }}>
              After printing and filling, send the completed form to <strong>{RECEIVING_EMAIL}</strong>.
            </div>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: "#1d4ed8",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Print Blank Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

