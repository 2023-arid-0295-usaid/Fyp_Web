"use client";

// Port of assets/components/Client/ActiveRequestScreen.js — interview list with
// All/Pending/Approved tabs, approve (CreateHiring) and delete.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function ActiveRequestScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [interactingIds, setInteractingIds] = useState([]);

  const router = useRouter();
  const toast = useToast();

  const sortRequestsByInterviewIdDesc = (list = []) =>
    [...list].sort((a, b) => Number(b.interviewId || b.id || 0) - Number(a.interviewId || a.id || 0));

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const clientId = await storage.getItem("clientId");
      const token = await storage.getItem("userToken");
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetActiveRequests/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(sortRequestsByInterviewIdDesc(Array.isArray(data) ? data : []));
      }
    } catch (error) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Failed to load requests." });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, addressPayload) => {
    if (interactingIds.includes(requestId)) return;
    setInteractingIds((prev) => [...prev, requestId]);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/CreateHiring`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ InterviewId: requestId, WorkerDecision: "Pending", HiringDecision: "Pending", Address: addressPayload || "" }),
      });
      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Interview Approved! Job Offer sent to worker." });
        setRequests((prev) => sortRequestsByInterviewIdDesc(prev.map((r) => (r.interviewId === requestId ? { ...r, workerDecision: "Accepted", hiring: { ...(r.hiring || {}), hiringDecision: "Accepted" } } : r))));
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.show({ type: "error", text1: "Error ❌", text2: errData.message || "Failed to approve request." });
      }
    } catch (error) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Connection error occurred during approval." });
    } finally {
      setInteractingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const handleDelete = async (requestId) => {
    if (interactingIds.includes(requestId)) return;
    setInteractingIds((prev) => [...prev, requestId]);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/DeleteInterviewRequest/${requestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Request removed successfully." });
        setRequests((prev) => prev.filter((req) => req.interviewId !== requestId));
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to delete request." });
      }
    } catch (error) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Connection error occurred." });
    } finally {
      setInteractingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const filteredRequests = requests.filter((item) => {
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch = !searchValue || item.workerName?.toLowerCase().includes(searchValue) || item.workerSkill?.toLowerCase().includes(searchValue);
    if (!matchesSearch) return false;

    const itemStatus = (item.status || item.workerDecision || "").toString().toLowerCase().trim();
    const isResigned = itemStatus.includes("resign");
    const isTerminated = itemStatus.includes("terminate");
    const isRejected = itemStatus.includes("reject");
    const isApproved = item.hiring?.hiringDecision === "Accepted";
    const isFinalRecord = isApproved || isResigned || isTerminated || isRejected;

    if (activeTab === "Pending") return !isFinalRecord;
    if (activeTab === "Approved") return isApproved;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F3F6FC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFF", padding: "10px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button type="button" onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, marginRight: 8 }}>
              <Icon name="arrow-left" size={24} color="#1F2937" />
            </button>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Interview List</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="logo" style={{ width: 90, height: 70, objectFit: "contain" }} />
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 28, padding: "0 16px", height: 50, border: "1px solid #E5E7EB", marginBottom: 16 }}>
            <Icon name="magnify" size={22} color="#6B7280" style={{ marginRight: 8 }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or skills" style={{ flex: 1, border: "none", outline: "none", fontSize: 15 }} />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {["All", "Pending", "Approved"].map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ padding: "10px 22px", borderRadius: 22, border: `1px solid ${activeTab === tab ? "#1E64D3" : "#D1D5DB"}`, background: activeTab === tab ? "#1E64D3" : "#FFF", color: activeTab === tab ? "#FFF" : "#374151", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: activeTab === tab ? "0 3px 8px rgba(30,100,211,0.35)" : "none" }}>
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading…</div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Icon name="folder-open-outline" size={60} color="#9CA3AF" />
              <div style={{ color: "#6B7280", marginTop: 12 }}>No active requests found.</div>
            </div>
          ) : (
            filteredRequests.map((item) => {
              const isProcessing = interactingIds.includes(item.interviewId);
              const hiringDecision = item.hiring?.hiringDecision;
              const rawStatus = (item.status || item.workerDecision || "").toString().trim();
              const norm = rawStatus.toLowerCase();
              const isResigned = norm.includes("resign");
              const isTerminated = norm.includes("terminate");
              const isRejected = norm.includes("reject");
              const isApproved = hiringDecision === "Accepted";

              let badgeLabel = "Pending";
              let badgeBg = "#EAB308";
              let badgeColor = "#fff";
              let subtext = "Worker response pending";
              let subtextColor = "#EF4444";
              let canApprove = false;
              let showDelete = true;

              if (isResigned) {
                badgeLabel = "Resigned";
                badgeBg = "#8B5CF6";
                subtext = "Contract Resigned";
                subtextColor = "#8B5CF6";
                showDelete = false;
              } else if (isTerminated) {
                badgeLabel = "Terminated";
                badgeBg = "#EF4444";
                subtext = "Contract Terminated";
                subtextColor = "#EF4444";
                showDelete = false;
              } else if (isRejected) {
                badgeLabel = "Rejected";
                badgeBg = "#EF4444";
                subtext = "Worker rejected";
                subtextColor = "#EF4444";
              } else if (isApproved) {
                badgeLabel = "Approved";
                badgeBg = "#22C55E";
                subtext = "Job offer accepted";
                subtextColor = "#22C55E";
                showDelete = false;
              } else if (item.workerDecision === "Accepted") {
                canApprove = true;
                badgeBg = "#3B82F6";
                subtext = "Worker accepted — approve to send offer";
                subtextColor = "#3B82F6";
              }

              return (
                <div key={item.interviewId} style={{ background: "#FFF", borderRadius: 18, border: "1px solid #E5E7EB", padding: "10px 14px 14px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.workerImage && item.workerImage.startsWith("/") ? `${SERVER_BASE}${item.workerImage}` : "/images/default-user.png"} alt="" style={{ width: 68, height: 68, borderRadius: 34, marginRight: 12, objectFit: "cover", border: "2px solid #93C5FD" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{item.workerName || "Worker Profile"}</div>
                      <div style={{ display: "inline-block", background: badgeBg, color: badgeColor, padding: "3px 14px", borderRadius: 14, fontSize: 12, fontWeight: 700, margin: "4px 0 5px" }}>{badgeLabel}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{item.workerSkill || "General"}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: subtextColor }}>{subtext}</div>
                    </div>
                    <div style={{ width: 85, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      {isProcessing ? (
                        <span>Working…</span>
                      ) : (
                        <>
                          {canApprove ? (
                            <button type="button" onClick={() => handleApprove(item.interviewId, item.address)} style={{ background: "#22C55E", border: "none", color: "#fff", borderRadius: 18, padding: "9px 0", width: 82, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                              Approve
                            </button>
                          ) : (
                            <span style={{ background: "#E5E7EB", borderRadius: 18, padding: "9px 0", width: 82, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#9CA3AF" }}>Approve</span>
                          )}
                          {showDelete && (
                            <button type="button" onClick={() => handleDelete(item.interviewId)} style={{ background: "#FFF", border: "1px solid #FECACA", color: "#E53E3E", borderRadius: 18, padding: "8px 0", width: 82, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
