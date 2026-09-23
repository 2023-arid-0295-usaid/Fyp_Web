"use client";

// Port of assets/components/Worker/JobConfirmationScreen.js — worker-side job
// offers: accept/reject/delete handshake cards.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const API_BASE = `${SERVER_BASE}/api/Dashboard`;

export default function JobConfirmationScreen() {
  const router = useRouter();
  const toast = useToast();

  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobConfirmations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobConfirmations = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const res = await fetch(`${API_BASE}/GetWorkerJobConfirmations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to fetch job offers." });
        return;
      }
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.show({ type: "error", text1: "Error ❌", text2: "Server error." });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (hiringId) => {
    try {
      const token = await storage.getItem("userToken");
      const res = await fetch(`${API_BASE}/WorkerAcceptJobOffer/${hiringId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Job accepted!" });
        fetchJobConfirmations(false);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Error accepting job." });
      }
    } catch {
      toast.show({ type: "error", text1: "Error ❌", text2: "Network Error" });
    }
  };

  const handleRejectJob = async (hiringId) => {
    try {
      const token = await storage.getItem("userToken");
      const res = await fetch(`${API_BASE}/WorkerRejectJobOffer/${hiringId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Job offer rejected." });
        fetchJobConfirmations(false);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Error rejecting job." });
      }
    } catch {
      toast.show({ type: "error", text1: "Error ❌", text2: "Network Error" });
    }
  };

  const handleDeleteJob = async (hiringId) => {
    try {
      const token = await storage.getItem("userToken");
      const res = await fetch(`${API_BASE}/ClientDismissWorkerRejection/${hiringId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Job request removed." });
        setJobs((prev) => prev.filter((j) => j?.id !== hiringId));
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to remove request." });
      }
    } catch {
      toast.show({ type: "error", text1: "Error ❌", text2: "Network Error" });
    }
  };

  const filteredJobs = (Array.isArray(jobs) ? jobs : []).filter((job) => job?.clientName?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, left: -50, width: 200, height: 200, borderRadius: 100, background: "#E3F2FD", zIndex: 0 }} />

        <div style={{ padding: 20, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 15 }}>
            <button type="button" onClick={() => router.back()} style={{ padding: 5, background: "none", border: "none", cursor: "pointer", marginRight: 10 }}>
              <Icon name="arrow-left" size={24} color="#555" />
            </button>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#000" }}>Job Confirmation</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 25, border: "1px solid #CCC", padding: "0 15px", height: 45 }}>
            <Icon name="magnify" size={24} color="#666" />
            <input
              placeholder="Search by client name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, fontSize: 14, color: "#000", border: "none", outline: "none", marginLeft: 10, fontFamily: "inherit" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ padding: "0 15px 20px" }}>
            {filteredJobs.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: 40, fontStyle: "italic", color: "#999" }}>No job confirmations available.</div>
            ) : (
              filteredJobs.map((item) => <JobCard key={item.id} item={item} router={router} onAccept={handleAcceptJob} onReject={handleRejectJob} onDelete={handleDeleteJob} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ item, router, onAccept, onReject, onDelete }) {
  const { id, clientId, clientName, clientImage, clientRating, date, role, address, message, type, status } = item;
  const hiringId = id;

  const pendingWorker = type === "offered";
  const rawStatus = status ? status.toString() : "";
  const statusLower = rawStatus.toLowerCase();
  const rejectedByClient = statusLower.includes("unable") || statusLower.includes("sorry") || statusLower.includes("rejected");
  const rejectedWorker = type === "rejected" || rejectedByClient;
  const acceptedWorker = type === "accepted" && !rejectedByClient;
  const finalized = type === "final";
  const terminated = type === "terminated";

  let borderColor = "#1E64D3";
  let statusBg = "#E3F2FD";
  let statusTextColor = "#1E64D3";
  let statusHeaderText = "Job Offer";

  if (rejectedWorker) {
    borderColor = "#FF5252";
    statusBg = "#FFCDD2";
    statusTextColor = "#D32F2F";
    statusHeaderText = "Job Rejected";
  } else if (finalized) {
    borderColor = "#4CAF50";
    statusBg = "#C8E6C9";
    statusTextColor = "#388E3C";
    statusHeaderText = "Hired!";
  } else if (pendingWorker) {
    borderColor = "#FF9800";
    statusBg = "#FFE0B2";
    statusTextColor = "#E65100";
    statusHeaderText = "New Job Offer";
  } else if (acceptedWorker) {
    borderColor = "#90A4AE";
    statusBg = "#ECEFF1";
    statusTextColor = "#455A64";
    statusHeaderText = "Accepted";
  } else if (terminated) {
    borderColor = "#FF5252";
    statusBg = "#FFCDD2";
    statusTextColor = "#D32F2F";
    statusHeaderText = "Contract Terminated";
  }

  const displayStatus = rejectedWorker ? "Rejected" : terminated ? "Contract Terminated" : acceptedWorker ? "Accepted" : status || "Pending";

  const avatarUri = clientImage && clientImage.startsWith("/") ? `${SERVER_BASE}${clientImage}` : "/images/default-user.png";

  return (
    <div style={{ background: "#FFF", borderRadius: 15, padding: 15, marginBottom: 20, border: `1px solid ${borderColor}`, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: borderColor }}>{statusHeaderText}</div>

      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUri} alt="" style={{ width: 60, height: 60, borderRadius: 30, background: "#EEE", objectFit: "cover" }} />
          <span style={{ position: "absolute", bottom: -2, right: -2, background: "#FFF", borderRadius: 10, padding: 2, border: "1px solid #CCC" }}>
            <Icon name={rejectedWorker ? "account-cancel" : "account-check"} size={12} color={statusTextColor} />
          </span>
        </div>

        <div style={{ marginLeft: 12, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 }}>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", flex: 1, marginRight: 6, fontFamily: "inherit" }}
              onClick={() => {
                if (clientId) router.push(`/client/client-profile?clientId=${clientId}`);
                else console.warn("Client ID is missing for this job confirmation.");
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 700, color: "#000", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                {clientName || "Client Profile"}
              </span>
            </button>
            <span style={{ display: "flex", alignItems: "center", background: "#FFF9E6", padding: "3px 7px", borderRadius: 10, border: "1px solid #FFE599" }}>
              <Icon name="star" size={13} color="#FFD700" />
              <span style={{ marginLeft: 3, fontSize: 12, fontWeight: 700, color: "#B45309" }}>{clientRating > 0 ? clientRating.toFixed(1) : "N/A"}</span>
            </span>
          </div>
          <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 12, background: statusBg, color: statusTextColor, fontSize: 12, fontWeight: 700 }}>
            {displayStatus}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <div style={{ fontSize: 15, color: "#333", marginBottom: 4 }}>
          <b>Interview Date:</b> {date || "N/A"}
        </div>
        <div style={{ fontSize: 15, color: "#333", marginBottom: 4 }}>
          <b>Job Role:</b> {role || "N/A"}
        </div>
        <div style={{ fontSize: 15, color: "#333", marginBottom: 4 }}>
          <b>Address:</b> {address || "N/A"}
        </div>
        {message ? <div style={{ fontSize: 14, color: "#444", lineHeight: "20px", marginTop: 5 }}>{message}</div> : null}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        {pendingWorker && (
          <>
            <button type="button" onClick={() => onReject(hiringId)} style={{ background: "#CFD8DC", padding: "10px 30px", borderRadius: 20, marginRight: 15, border: "none", color: "#607D8B", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
              Reject
            </button>
            <button type="button" onClick={() => onAccept(hiringId)} style={{ background: "#1E64D3", padding: "10px 30px", borderRadius: 20, border: "none", color: "#FFF", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
              Accept
            </button>
          </>
        )}

        {(rejectedWorker || terminated) && (
          <button type="button" onClick={() => onDelete(hiringId)} style={{ background: "#CFD8DC", padding: "10px 30px", borderRadius: 20, border: "none", color: "#607D8B", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
            Delete
          </button>
        )}

        {acceptedWorker && (
          <button type="button" disabled style={{ background: "#666", opacity: 0.6, padding: "10px 30px", borderRadius: 20, border: "none", color: "#FFF", fontWeight: 700, fontSize: 16, cursor: "not-allowed", fontFamily: "inherit" }}>
            Accepted
          </button>
        )}

        {finalized && (
          <button type="button" disabled style={{ background: "#4CAF50", padding: "10px 30px", borderRadius: 20, border: "none", color: "#FFF", fontWeight: 700, fontSize: 16, cursor: "not-allowed", fontFamily: "inherit" }}>
            Hired
          </button>
        )}
      </div>
    </div>
  );
}
