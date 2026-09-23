"use client";

// Port of assets/components/Client/RatingAndReviewsScreen.js — worker reviews
// list + aggregate rating (client view).

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";

export default function RatingAndReviewsScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState("0.0");
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (workerId) fetchReviews();
    else setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_DASHBOARD}/GetWorkerReviews/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
          setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverageRating(data.averageRating?.toString() || "0.0");
        setReviewCount(data.reviewCount || 0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F6FC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFF", padding: "10px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button type="button" onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, marginRight: 8 }}>
              <Icon name="arrow-left" size={24} color="#1F2937" />
            </button>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Rating &amp; Reviews</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="logo" style={{ width: 90, height: 70, objectFit: "contain" }} />
        </div>

        <div style={{ padding: 16 }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading reviews…</div>
          ) : (
            <>
              <div style={{ background: "#FFF", borderRadius: 16, padding: 16, border: "1px solid #EDF2F7", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#718096" }}>Overall Rating</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: "#1A202C" }}>{averageRating}</span>
                  <div>
                    <Stars rating={Math.round(parseFloat(averageRating))} />
                    <div style={{ fontSize: 12, color: "#718096" }}>({reviewCount} Reviews)</div>
                  </div>
                </div>
              </div>

              {reviews.length > 0 ? (
                reviews.map((item) => (
                  <div key={item.id} style={{ background: "#FFF", borderRadius: 12, padding: 14, border: "1px solid #EDF2F7", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => (item.clientId ? router.push(`/client/client-profile?clientId=${item.clientId}`) : console.warn("Client ID is missing for this review."))}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}
                      >
                        {item.name}
                      </button>
                      <Stars rating={item.rating} size={14} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#888", margin: "4px 0" }}>
                      <Icon name="calendar-range" size={14} color="#888" /> {item.date}
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", fontStyle: "italic" }}>"{item.comment}"</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "#999" }}>No reviews available yet.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stars({ rating, size = 20 }) {
  return (
    <div style={{ display: "flex" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(rating) ? "star" : "star-outline"} size={size} color={i <= Math.round(rating) ? "#FFD700" : "#E0E0E0"} />
      ))}
    </div>
  );
}
