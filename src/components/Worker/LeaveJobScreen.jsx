"use client";

// Port of assets/components/Worker/LeaveJobScreen.js — resign from an active job
// (SubmitResignation then SubmitWorkerReviewToClient).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function LeaveJobScreen() {
  const router = useRouter();
  const toast = useToast();

  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [jobData, setJobData] = useState(null);
  const [lastWorkingDay, setLastWorkingDay] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActiveJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActiveJob = async () => {
    try {
      const workerId = await storage.getItem("workerId");
      const token = await storage.getItem("userToken");

      if (!workerId) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Worker identity not found. Please re-login." });
        router.back();
        return;
      }

      const response = await fetch(`${API_DASHBOARD}/GetActiveJob/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJobData(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.show({ type: "error", text1: "Error ❌", text2: errData.message || "No active job found to resign from." });
        router.back();
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Connection error. Check API configuration." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResign = async () => {
    if (!reason.trim()) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please provide a reason for resignation." });
      return;
    }
    if (rating === 0) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please provide a rating for the client." });
      return;
    }
    if (!jobData || !jobData.interviewId) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Process error: Job data missing." });
      return;
    }

    setSubmitting(true);
    try {
      const token = await storage.getItem("userToken");

      const payload = {
        InterviewId: jobData.interviewId,
        ResignationReason: reason,
        LastWorkingDate: lastWorkingDay.toISOString().split("T")[0],
      };

      const response = await fetch(`${API_DASHBOARD}/SubmitResignation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        try {
          await fetch(`${API_DASHBOARD}/SubmitWorkerReviewToClient`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ InterviewId: jobData.interviewId, Rating: rating, Comment: reviewComment }),
          });
        } catch (e) {
          console.error("Review error", e);
        }

        toast.show({ type: "success", text1: "Success ✅", text2: "Resignation submitted successfully." });
        router.push("/worker/dashboard");
      } else {
        let errorMsg = "Failed to submit resignation.";
        try {
          const rawText = await response.text();
          const errJson = JSON.parse(rawText);
          errorMsg = errJson.message || errorMsg;
        } catch (e) {
          console.log("Could not parse error response:", e.message);
        }
        toast.show({ type: "error", text1: "Error ❌", text2: errorMsg });
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const isoDate = lastWorkingDay.toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, left: -50, width: 200, height: 200, borderRadius: 100, background: "#E3F2FD", zIndex: 0 }} />

        <div style={{ padding: 25, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
            <button type="button" onClick={() => router.back()} style={{ padding: 5, background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="arrow-left" size={24} color="#333" />
            </button>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#333" }}>Resign from Job</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
          </div>

          {jobData && (
            <div style={{ background: "#FFF", borderRadius: 15, padding: 20, marginBottom: 25, boxShadow: "0 4px 10px rgba(0,0,0,0.1)", border: "1px solid #EEE" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#333" }}>{jobData.employerName}</div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{jobData.employerAddress}</div>
              <span style={{ display: "inline-block", background: "#E3F2FD", padding: "5px 10px", borderRadius: 8, marginTop: 15, color: "#1E64D3", fontSize: 12, fontWeight: 700 }}>
                Standard 1-Week Notice
              </span>
            </div>
          )}

          <div style={{ marginBottom: 25 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginBottom: 12 }}>Proposed Last Working Day</div>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #DDD", borderRadius: 12, padding: "0 15px", height: 55, background: "#F9F9F9", cursor: "pointer" }}>
              <span style={{ fontSize: 16, color: "#333" }}>{formatDate(lastWorkingDay)}</span>
              <Icon name="calendar-clock" size={24} color="#1E64D3" />
              <input
                type="date"
                min={isoDate}
                value={isoDate}
                onChange={(e) => setLastWorkingDay(e.target.value ? new Date(e.target.value) : new Date())}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 25 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginBottom: 12 }}>Reason for Leaving</div>
            <textarea
              rows={3}
              placeholder="Please explain why you are leaving..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: "100%", border: "1px solid #DDD", borderRadius: 12, padding: 15, minHeight: 120, fontSize: 16, background: "#F9F9F9", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginBottom: 25 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginBottom: 12 }}>Client Rating</div>
            <div style={{ display: "flex", margin: "5px 0 10px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: 8 }}>
                  <Icon name={star <= rating ? "star" : "star-outline"} size={40} color="#FFD700" />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 25 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginBottom: 12 }}>Client Feedback</div>
            <textarea
              rows={3}
              placeholder="Share your experience working with this client..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              style={{ width: "100%", border: "1px solid #DDD", borderRadius: 12, padding: 15, minHeight: 120, fontSize: 16, background: "#F9F9F9", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <button type="button" onClick={handleResign} disabled={submitting} style={{ background: "#E91E63", height: 55, borderRadius: 15, width: "100%", color: "#FFF", fontSize: 18, fontWeight: 700, border: "none", cursor: "pointer", marginTop: 10, fontFamily: "inherit" }}>
            {submitting ? "Submitting…" : "Submit Resignation Notice"}
          </button>

          <button type="button" onClick={() => router.back()} style={{ marginTop: 20, width: "100%", background: "none", border: "none", padding: 10, cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ color: "#666", fontSize: 16, fontWeight: 500 }}>Keep Current Job</span>
          </button>
        </div>
      </div>
    </div>
  );
}
