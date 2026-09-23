"use client";

// Port of assets/components/Client/TerminateContractScreen.js — reason, rating,
// confirm checkbox → POST /api/Dashboard/TerminateContract.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function TerminateContractScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");
  const interviewId = searchParams.get("interviewId");
  const router = useRouter();
  const toast = useToast();

  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rating, setRating] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const fetchWorkerDetails = async () => {
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerDetail/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setWorker(await response.json());
    } catch (error) {
      console.error("Error fetching worker:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!reason.trim()) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please enter a termination reason" });
      return;
    }
    if (rating === 0) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please provide a rating for the worker" });
      return;
    }
    if (!isConfirmed) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please confirm termination by checking the box" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await storage.getItem("userToken");
      const payload = { InterviewId: interviewId, Reason: reason, Remarks: remarks, Rating: rating };
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/TerminateContract`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Contract terminated successfully" });
        router.push("/client/dashboard");
      } else {
        const errorData = await response.json();
        toast.show({ type: "error", text1: "Error ❌", text2: errorData.message || "Termination failed" });
      }
    } catch (error) {
      console.error("Termination error:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Network error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: 60 }}>Loading…</div>;
  }
  if (!worker) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 16px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button type="button" onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 6 }}>
            <Icon name="arrow-left" size={24} color="#666" />
          </button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 700, color: "#111827" }}>Terminate Contract</span>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 18, padding: 16, border: "1px solid #EDF2F7", marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={worker.picture && worker.picture.startsWith("/") ? `${SERVER_BASE}${worker.picture}` : "/images/default-user.png"} alt="" style={{ width: 60, height: 60, borderRadius: 30, marginRight: 14, objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1A202C" }}>{worker.name}</div>
            <div style={{ fontSize: 13, color: "#1E64D3", fontWeight: 600 }}>{worker.role}</div>
            <div style={{ fontSize: 12, color: "#4A5568", marginTop: 4 }}>{worker.location || "N/A"}</div>
          </div>
        </div>

        <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>Reason for Termination *</label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe why you are terminating this contract…" style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, fontSize: 14, boxSizing: "border-box", resize: "none", fontFamily: "inherit", marginBottom: 16 }} />

        <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>Rate the Worker *</label>
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
              <Icon name={star <= rating ? "star" : "star-outline"} size={30} color={star <= rating ? "#FFD700" : "#CBD5E1"} />
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>Remarks (optional)</label>
        <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional comments…" style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, fontSize: 14, boxSizing: "border-box", resize: "none", fontFamily: "inherit", marginBottom: 20 }} />

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#1A202C" }}>
          <input type="checkbox" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} style={{ width: 18, height: 18 }} />
          I confirm that I want to terminate this worker&apos;s contract.
        </label>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 16, background: "#FFF", borderTop: "1px solid #E2E8F0", maxWidth: 640, margin: "0 auto" }}>
        <button type="button" onClick={handleTerminate} disabled={isSubmitting} style={{ width: "100%", height: 52, borderRadius: 26, background: "#E53E3E", border: "none", color: "#FFF", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {isSubmitting ? "Terminating…" : "Confirm Termination"}
        </button>
      </div>
    </div>
  );
}
