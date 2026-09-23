"use client";

// Port of assets/components/Client/ResignationScreen.js — resignation detail,
// star rating + remarks, ConfirmResignation POST.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function ResignationScreen() {
  const searchParams = useSearchParams();
  const resignationId = searchParams.get("resignationId");
  const router = useRouter();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(3);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchResignationDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resignationId]);

  const fetchResignationDetail = async () => {
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_DASHBOARD}/GetResignationDetail/${resignationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setData(await response.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_DASHBOARD}/ConfirmResignation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ InterviewId: data.interviewId, Rating: rating, Comment: remarks }),
      });
      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Resignation successfully confirmed." });
        router.push("/client/dashboard");
      } else {
        const err = await response.json();
        toast.show({ type: "error", text1: "Error ❌", text2: err.message || "Failed to confirm." });
      }
    } catch (e) {
      console.error(e);
      toast.show({ type: "error", text1: "Error ❌", text2: "Server error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: 60 }}>Loading…</div>;
  }
  if (!data) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FBFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 20px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button type="button" onClick={() => router.back()} style={{ padding: 8, background: "#FFF", borderRadius: 20, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <Icon name="arrow-left" size={24} color="#555" />
          </button>
          <span style={{ fontSize: 20, fontWeight: 800, marginLeft: 15 }}>Resignation Notice</span>
        </div>

        <div style={{ background: "#FFF", borderRadius: 18, padding: 18, border: "1px solid #EEE", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.workerAvatar && data.workerAvatar.startsWith("/") ? `${API_DASHBOARD.split("/api")[0]}${data.workerAvatar}` : "/images/default-user.png"} alt="" style={{ width: 54, height: 54, borderRadius: 27, marginRight: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{data.workerName}</div>
              <div style={{ fontSize: 13, color: "#6B7280" }}>{data.workerRole}</div>
            </div>
          </div>
          <div style={{ background: "#FEF3C7", padding: 12, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Reason for Resignation</div>
            <div style={{ fontSize: 13, color: "#4B5563" }}>{data.reason}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4B5563" }}>
            <span><b>Last Working Day:</b> {data.lastWorkingDate}</span>
            <span><b>Notice Period:</b> {data.totalNoticeDays} days</span>
          </div>
          <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round((data.progress || 0) * 100)}%`, background: "#EAB308" }} />
          </div>
        </div>

        {!data.isConfirmed && (
          <div style={{ background: "#FFF", borderRadius: 18, padding: 18, border: "1px solid #EEE" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Rate the Worker</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                  <Icon name={star <= rating ? "star" : "star-outline"} size={26} color={star <= rating ? "#FFD700" : "#CBD5E1"} />
                </button>
              ))}
            </div>
            <textarea rows={3} placeholder="Add remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 12, padding: 10, fontSize: 14, boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} />
            <button type="button" onClick={handleConfirm} disabled={isSubmitting} style={{ width: "100%", background: "#1E64D3", border: "none", color: "#FFF", borderRadius: 14, padding: "13px 0", fontWeight: 700, marginTop: 14, cursor: "pointer" }}>
              {isSubmitting ? "Confirming…" : "Confirm & Complete Resignation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
