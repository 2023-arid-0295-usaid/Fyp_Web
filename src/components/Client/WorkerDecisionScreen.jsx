"use client";

// Port of assets/components/Client/WorkerDecisionScreen.js — job-offer
// handshake tracking; finalize hiring when a worker accepts.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD, SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const API_BASE = API_DASHBOARD;

export default function WorkerDecisionScreen() {
  const [decisions, setDecisions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchDecisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDecisions = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/GetClientWorkerDecisions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDecisions(Array.isArray(data) ? data : []);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to fetch decision tracking records." });
      }
    } catch (error) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Network connection failure." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeHiring = async (hiringId) => {
    setSubmittingId(hiringId);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/FinalizeHiringDecision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ HiringId: hiringId, HiringDecision: "Accepted" }),
      });
      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Hiring decision finalized successfully." });
        await fetchDecisions();
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to update final hiring state." });
      }
    } catch (error) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Network failure processing handshake." });
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredDecisions = decisions.filter(
    (item) =>
      item.workerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.workerSkill?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F3F6FC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFF", padding: "10px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button type="button" onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, marginRight: 8 }}>
              <Icon name="arrow-left" size={24} color="#1F2937" />
            </button>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Worker Decision</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="logo" style={{ width: 90, height: 70, objectFit: "contain" }} />
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 28, padding: "0 16px", height: 50, border: "1px solid #E5E7EB", marginBottom: 16 }}>
            <Icon name="magnify" size={22} color="#9CA3AF" style={{ marginRight: 8 }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Worker name" style={{ flex: 1, border: "none", outline: "none", fontSize: 15 }} />
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading…</div>
          ) : filteredDecisions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Icon name="comment-question-outline" size={60} color="#BDC3C7" />
              <div style={{ color: "#718096", marginTop: 12 }}>No pending active worker job offer decisions located.</div>
            </div>
          ) : (
            filteredDecisions.map((item) => {
              const isAccepted = item.workerDecision === "Accepted";
              const isRejected = item.workerDecision === "Rejected";
              const isFinalized = item.hiringDecision === "Accepted";
              const canFinalize = isAccepted && item.hiringDecision === "Pending";

              return (
                <div key={item.hiringId} style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${isAccepted ? "#BEE3F8" : isRejected ? "#FECACA" : "#E5E7EB"}`, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isAccepted ? "#0284C7" : isRejected ? "#B91C1C" : "#92400E", marginBottom: 10 }}>
                    {isAccepted ? "Worker Accepted!" : isRejected ? "Worker Rejected!" : "Offer Pending"}
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.workerImage ? (item.workerImage.startsWith("http") ? item.workerImage : `${SERVER_BASE}${item.workerImage}`) : "/images/default-user.png"}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{item.workerName}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: isAccepted ? "#DCFCE7" : isRejected ? "#FEE2E2" : "#FEF3C7", color: isAccepted ? "#15803D" : isRejected ? "#B91C1C" : "#92400E", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                        <Icon name={isAccepted ? "account-check" : isRejected ? "account-cancel" : "account-clock"} size={13} color={isAccepted ? "#15803D" : isRejected ? "#B91C1C" : "#92400E"} />
                        {isAccepted ? "Acceptance Confirm" : isRejected ? "Rejected" : "Offer Pending"}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "10px 0" }}>
                    {item.hiringDate && (
                      <div style={{ fontSize: 13, color: "#4B5563" }}>
                        <b>Decision Date:</b> {new Date(item.hiringDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "#4B5563" }}>
                      <b>Job Role</b>: {item.workerSkill}
                    </div>
                    <div style={{ fontSize: 13, color: "#4B5563" }}>
                      <b>Address</b>: {item.address}
                    </div>
                    <div style={{ fontSize: 13, color: "#6B7280", fontStyle: "italic", marginTop: 6 }}>
                      {isAccepted ? `${item.workerName} is excited to start.` : isRejected ? `${item.workerName} has chosen another offer . Your other worker are below.` : "Awaiting worker response."}
                    </div>
                  </div>

                  {canFinalize && (
                    <button type="button" disabled={submittingId === item.hiringId} onClick={() => handleFinalizeHiring(item.hiringId)} style={{ width: "100%", background: "#1E64D3", border: "none", color: "#FFF", borderRadius: 14, padding: "12px 0", fontWeight: 700, cursor: "pointer" }}>
                      {submittingId === item.hiringId ? "Finalizing…" : "Finalize Hiring"}
                    </button>
                  )}
                  {isFinalized && (
                    <div style={{ textAlign: "center", color: "#15803D", fontWeight: 700, padding: 12, background: "#DCFCE7", borderRadius: 14 }}>✓ Hiring Finalized</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
