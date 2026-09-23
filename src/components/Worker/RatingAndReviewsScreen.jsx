"use client";

// Port of assets/components/Worker/RatingAndReviewsScreen.js — worker's own
// reviews ("Your Overall Rating").

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";

export default function RatingAndReviewsScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");
  const initialRating = searchParams.get("initialRating") || "0.0";
  const initialReviewCount = searchParams.get("initialReviewCount") || 0;
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(initialRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        // If no workerId was passed, resolve from storage (self view).
        let id = workerId;
        if (!id) {
          id = await storage.getItem("workerId");
        }
        if (!id) {
          setIsLoading(false);
          return;
        }
        const token = await storage.getItem("userToken");
        const response = await fetch(`${API_DASHBOARD}/GetWorkerReviews/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setReviews(Array.isArray(data.reviews) ? data.reviews : []);
          setAverageRating(data.averageRating?.toString() || "0.0");
          setReviewCount(data.reviewCount || 0);
        } else {
          console.error("Failed to fetch reviews");
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  return (
    <div style={{ minHeight: "100vh", background: "#F3F6FC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF", padding: "10px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button type="button" onClick={() => router.back()} style={{ padding: 4, marginRight: 8, background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="arrow-left" size={24} color="#1F2937" />
            </button>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: -0.3 }}>Rating &amp; Reviews</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="logo" style={{ width: 110, height: 90, objectFit: "contain" }} />
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E75EB", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ marginTop: 10, fontSize: 16, color: "#1E75EB" }}>Loading your reviews...</div>
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            {/* Overall Rating Header Card */}
            <div style={{ background: "#FFF", borderRadius: 25, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: 20, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 10 }}>Your Overall Rating</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: "#1E4A84", marginRight: 15 }}>{averageRating}</span>
                <div style={{ display: "flex" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Icon key={i} name={i <= Math.round(parseFloat(averageRating)) ? "star" : "star-outline"} size={30} color={i <= Math.round(parseFloat(averageRating)) ? "#FFD700" : "#E0E0E0"} />
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 16, color: "#888", marginTop: 5 }}>Based on {reviewCount} Reviews</div>
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              reviews.map((item) => (
                <div key={item.id} style={{ background: "#FFF", borderRadius: 15, padding: 15, marginBottom: 15, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                        onClick={() => {
                          if (item.clientId) router.push(`/client/client-profile?clientId=${item.clientId}`);
                          else console.warn("Client ID is missing for this review.");
                        }}
                      >
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>{item.name}</span>
                      </button>
                      <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                        <Icon name="calendar-range" size={14} color="#888" />
                        <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>{item.date}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex" }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Icon key={i} name={i <= Math.round(item.rating) ? "star" : "star-outline"} size={18} color={i <= Math.round(item.rating) ? "#FFD700" : "#E0E0E0"} />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#555", fontStyle: "italic", lineHeight: "18px" }}>"{item.comment}"</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Icon name="message-draw" size={50} color="#DDD" />
                <div style={{ marginTop: 10, fontSize: 16, color: "#999", fontStyle: "italic" }}>You don&apos;t have any reviews yet.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
