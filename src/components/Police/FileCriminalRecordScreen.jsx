"use client";

// Port of assets/components/Police/FileCriminalRecordScreen.js — file a warning
// flag or an official FIR against a worker (POST /api/Police/FileCriminalRecord).

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_POLICE, SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const CRIME_TYPES = [
  "Theft / Burglary",
  "Physical Assault",
  "Fraud / Misrepresentation",
  "Property Damage",
  "Substance Abuse",
  "Other Violation",
];

export default function FileCriminalRecordScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId") || 1;
  const router = useRouter();
  const toast = useToast();

  const [policeId, setPoliceId] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [firNumber, setFirNumber] = useState("");
  const [crimeType, setCrimeType] = useState("");
  const [dateOfOffense, setDateOfOffense] = useState(new Date());
  const [flagOnly, setFlagOnly] = useState(true);
  const [details, setDetails] = useState("");

  // Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadSessionAndWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const loadSessionAndWorker = async () => {
    try {
      const storedPoliceId = await storage.getItem("policeId");
      if (storedPoliceId) {
        setPoliceId(parseInt(storedPoliceId, 10));
      }

      const response = await fetch(`${API_POLICE}/GetWorkerDetails/${workerId}`);
      const data = await response.json();
      if (response.ok) {
        setWorker(data);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Failed to load worker profile details." });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlagOnly = (value) => {
    setFlagOnly(value);
    if (value) {
      setFirNumber("");
    }
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!flagOnly && !firNumber.trim()) {
      toast.show({ type: "error", text1: "Error ❌", text2: "FIR Number / Case ID is required when filing an official FIR." });
      return;
    }

    if (!crimeType || !details.trim()) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please complete all required crime report details." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        workerId: workerId,
        policeId: policeId || 0,
        firNumber: flagOnly ? null : firNumber.trim(),
        offenseCategory: crimeType,
        offenseDate: formatDateString(dateOfOffense),
        isFlagged: true,
        isBlocked: !flagOnly,
        caseDetails: details.trim(),
      };

      const response = await fetch(`${SERVER_BASE}/api/Police/FileCriminalRecord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage = flagOnly
          ? "Warning issued and worker profile flagged successfully."
          : "Official FIR filed successfully.";

        toast.show({ type: "success", text1: "Success ✅", text2: successMessage });
        router.back();
      } else {
        const errorMessage = result.error ? `${result.message} - ${result.error}` : result.message || "Failed to submit report.";
        toast.show({ type: "error", text1: "Error ❌", text2: errorMessage });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Server network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E293B", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const avatarUri = worker?.picture
    ? worker.picture.startsWith("http")
      ? worker.picture
      : `${SERVER_BASE}${worker.picture}`
    : "/images/default-user.png";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
          <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="arrow-left" size={24} color="#1E293B" />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1E293B" }}>File Criminal Record</span>
          <div style={{ width: 32 }} />
        </div>

        <div style={{ padding: "0 20px 30px" }}>
          {/* Worker Summary Card */}
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ position: "relative", marginRight: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUri} alt="" style={{ width: 56, height: 56, borderRadius: 28, objectFit: "cover" }} />
              <span style={{ position: "absolute", bottom: -2, right: -2, background: "#FFF", borderRadius: 10 }}>
                <Icon name="check-decagram" size={16} color="#0284C7" />
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{worker?.name || "Worker Profile"}</div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>CNIC: {worker?.cnic || "N/A"}</div>
            </div>
          </div>

          {/* Input: FIR Number */}
          <div style={{ display: "flex", alignItems: "center", background: flagOnly ? "#E2E8F0" : "#FFF", borderRadius: 25, padding: "0 16px", height: 52, marginBottom: 14, border: "1px solid", borderColor: flagOnly ? "#CBD5E1" : "#F1F5F9" }}>
            <Icon name="badge-account-outline" size={20} color={flagOnly ? "#94A3B8" : "#64748B"} />
            <input
              style={{ flex: 1, fontSize: 14, color: flagOnly ? "#64748B" : "#1E293B", border: "none", outline: "none", background: "transparent", marginLeft: 10, fontFamily: "inherit" }}
              placeholder={flagOnly ? "FIR Number (Disabled for Warning)" : "FIR Number / Case ID *"}
              value={firNumber}
              onChange={(e) => setFirNumber(e.target.value)}
              disabled={flagOnly}
            />
          </div>

          {/* Dropdown: Select Crime Type */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF", borderRadius: 25, padding: "0 16px", height: 52, marginBottom: 14, border: "1px solid #F1F5F9", width: "100%", cursor: "pointer", fontFamily: "inherit" }}
            >
              <span style={{ fontSize: 14, color: crimeType ? "#1E293B" : "#94A3B8" }}>{crimeType || "Select Crime Type *"}</span>
              <Icon name="chevron-down" size={22} color="#64748B" />
            </button>
            {showDropdown && (
              <div style={{ position: "absolute", top: 56, left: 0, right: 0, background: "#FFF", borderRadius: 16, padding: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 20 }}>
                {CRIME_TYPES.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCrimeType(item);
                      setShowDropdown(false);
                    }}
                    style={{ padding: "12px 8px", fontSize: 14, color: "#334155", borderBottom: index < CRIME_TYPES.length - 1 ? "1px solid #F1F5F9" : "none", width: "100%", textAlign: "left", background: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Field: Date of Offense */}
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 25, padding: "0 16px", height: 52, marginBottom: 14, border: "1px solid #F1F5F9" }}>
            <Icon name="calendar-month-outline" size={20} color="#64748B" />
            <input
              type="date"
              max={formatDateString(new Date())}
              value={formatDateString(dateOfOffense)}
              onChange={(e) => setDateOfOffense(e.target.value ? new Date(e.target.value) : new Date())}
              style={{ flex: 1, fontSize: 14, color: "#1E293B", border: "none", outline: "none", background: "transparent", margin: "0 10px", fontFamily: "inherit" }}
            />
            <Icon name="calendar" size={20} color="#0284C7" />
          </div>

          {/* System Security Action Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F1F5F9", borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ flex: 1, paddingRight: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", letterSpacing: 0.5 }}>SYSTEM SECURITY ACTION</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", marginTop: 4 }}>
                {flagOnly ? "Flag Only (Warning Badge Only)" : "Official FIR (Flag Profile)"}
              </div>
            </div>
            <ToggleSwitch value={flagOnly} onChange={handleToggleFlagOnly} />
          </div>

          {/* Text Area: Details */}
          <textarea
            rows={5}
            style={{ width: "100%", background: "#FFF", borderRadius: 16, padding: 16, marginBottom: 20, minHeight: 130, fontSize: 14, color: "#1E293B", border: "1px solid #F1F5F9", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            placeholder="Type detailed crime report and official legal investigation specifics here... *"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: flagOnly ? "#D97706" : "#B91C1C", borderRadius: 25, height: 52, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#FFF", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: flagOnly ? "0 3px 5px rgba(217,119,6,0.3)" : "0 3px 5px rgba(185,28,28,0.3)", fontFamily: "inherit" }}
          >
            {submitting ? (
              "Submitting…"
            ) : (
              <>
                <span style={{ width: 24, height: 24, borderRadius: 12, background: "#FFF", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Icon name="alert" size={16} color={flagOnly ? "#D97706" : "#B91C1C"} />
                </span>
                {flagOnly ? "Issue Warning & Flag Profile" : "Submit Official FIR"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 50,
        height: 28,
        borderRadius: 14,
        background: value ? "#38BDF8" : "#CBD5E1",
        position: "relative",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: value ? 24 : 2,
          width: 24,
          height: 24,
          borderRadius: 12,
          background: value ? "#0284C7" : "#F1F5F9",
          transition: "left 0.2s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
