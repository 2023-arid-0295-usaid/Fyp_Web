"use client";

// Port of assets/components/Worker/WorkerTerminationScreen.js — view latest
// termination and optionally submit a review of the client.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function WorkerTerminationScreen() {
  const router = useRouter();
  const toast = useToast();

  const [termination, setTermination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    fetchTerminationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTerminationStatus = async () => {
    try {
      const workerId = await storage.getItem("workerId");
      const token = await storage.getItem("userToken");

      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetLatestTermination/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTermination(data);
      }
    } catch (error) {
      console.error("Error fetching termination status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.show({ type: "error", text1: "Rating Required", text2: "Please provide a star rating for the client." });
      return;
    }

    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/SubmitWorkerReviewToClient`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ InterviewId: termination?.interviewId, Rating: rating, Comment: reviewComment }),
      });

      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Your review has been submitted successfully!" });
        setReviewSubmitted(true);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to submit review." });
      }
    } catch (e) {
      console.error(e);
      toast.show({ type: "error", text1: "Error ❌", text2: "Network connection failed." });
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

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "15px 20px", background: "#FFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <button type="button" onClick={() => router.back()} style={{ position: "absolute", left: 20, background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" size={24} color="#333" />
          </button>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#333" }}>Termination Status</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" style={{ width: 35, height: 35, position: "absolute", right: 20, objectFit: "contain" }} />
        </div>

        <div style={{ padding: 20 }}>
          {!termination ? (
            <div style={{ textAlign: "center", marginTop: 80, padding: "0 20px" }}>
              <div style={{ width: 140, height: 140, borderRadius: 70, background: "#E8F5E9", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 30px" }}>
                <Icon name="check-decagram" size={80} color="#4CAF50" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#2E7D32", marginBottom: 10 }}>Good News!</div>
              <div style={{ fontSize: 16, color: "#666", lineHeight: "24px", marginBottom: 40 }}>
                You currently have no recorded terminations. Your professional record is clean.
              </div>
              <button type="button" onClick={() => router.back()} style={{ background: "#1E64D3", padding: "15px 40px", borderRadius: 30, border: "none", color: "#FFF", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div>
              {/* Status Card */}
              <div style={{ background: "#FFF", borderRadius: 20, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: 25, borderLeft: "8px solid #E63917" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ width: 50, height: 50, borderRadius: 25, background: "#FFEBEE", display: "flex", justifyContent: "center", alignItems: "center", marginRight: 15 }}>
                    <Icon name="alert-octagon" size={30} color="#E63917" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: "#666", fontWeight: 600 }}>Contract Status</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#E63917" }}>Terminated</div>
                  </div>
                </div>
                <div style={{ height: 1, background: "#EEE", margin: "15px 0" }} />
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Icon name="calendar-range" size={20} color="#666" />
                  <span style={{ marginLeft: 10, color: "#555", fontSize: 15, fontWeight: 500 }}>
                    Terminated on:{" "}
                    {new Date(termination.terminatedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Reason Section */}
              <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 15, marginLeft: 5 }}>Reason for Termination</div>
              <div style={{ background: "#E3F2FD", borderRadius: 20, padding: 20, marginBottom: 25, border: "1px solid #BBDEFB" }}>
                <Icon name="format-quote-open" size={24} color="#1E64D3" />
                <div style={{ fontSize: 16, color: "#1E64D3", lineHeight: "24px", fontStyle: "italic", textAlign: "center", margin: "5px 0", fontWeight: 500 }}>
                  {termination.terminatedReason || "No specific reason provided by the client."}
                </div>
                <div style={{ textAlign: "right" }}>
                  <Icon name="format-quote-close" size={24} color="#1E64D3" />
                </div>
              </div>

              {/* Employer Info */}
              <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 15, marginLeft: 5 }}>Employer Details</div>
              <div style={{ display: "flex", alignItems: "center", background: "#FFF", padding: 15, borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 30 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={termination.clientPicture ? `${SERVER_BASE}${termination.clientPicture}` : "/images/default-user.png"}
                  alt=""
                  style={{ width: 60, height: 60, borderRadius: 30, border: "2px solid #EEE", objectFit: "cover" }}
                />
                <div style={{ marginLeft: 15 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#000" }}>{termination.clientName}</div>
                  <div style={{ fontSize: 14, color: "#999", marginTop: 2 }}>Client / Employer</div>
                </div>
              </div>

              {/* Feedback Info Box */}
              <div style={{ display: "flex", background: "#FFF", borderRadius: 15, padding: 15, border: "1px solid #EEE", marginBottom: 30 }}>
                <Icon name="information-outline" size={22} color="#1E64D3" />
                <span style={{ flex: 1, marginLeft: 10, fontSize: 13, color: "#666", lineHeight: "20px" }}>
                  Termination is a part of professional life. Don&apos;t be discouraged! Your profile is now visible for other potential employers.
                </span>
              </div>

              {/* Client Review Section */}
              {!reviewSubmitted && (
                <div style={{ marginBottom: 30, background: "#FFF", padding: 20, borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 15, marginLeft: 5 }}>Rate Your Client</div>
                  <div style={{ display: "flex", justifyContent: "center", margin: "5px 0 15px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: 8 }}>
                        <Icon name={star <= rating ? "star" : "star-outline"} size={40} color="#FFD700" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Share your experience working with this client..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{ width: "100%", border: "1px solid #DDD", borderRadius: 12, padding: 15, minHeight: 100, fontSize: 16, background: "#F9F9F9", resize: "none", boxSizing: "border-box", marginBottom: 15, fontFamily: "inherit" }}
                  />
                  <button type="button" onClick={handleSubmitReview} style={{ background: "#4CAF50", height: 50, borderRadius: 15, width: "100%", border: "none", color: "#FFF", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Submit Review
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
