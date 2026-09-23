"use client";

// Port of assets/components/Client/ClientProfileScreen.js — public client
// profile with reviews from workers. (Fixes the original's stray `Toast.show`
// by using the toast hook.)

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE, API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function ClientProfileScreen() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || searchParams.get("id");
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (clientId) fetchClientProfile();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchClientProfile = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    try {
      const token = await storage.getItem("userToken");
      const res = await fetch(`${API_DASHBOARD}/GetClientDetail/${clientId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: `Failed to fetch client profile: ${res.status}` });
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching client profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60, fontFamily: "system-ui" }}>Loading…</div>;
  }
  if (!profile) {
    return <div style={{ textAlign: "center", padding: 60, fontFamily: "system-ui", color: "#888" }}>Client profile unavailable.</div>;
  }

  const displayedReviews = showAllReviews ? profile.reviews || [] : (profile.reviews || []).slice(0, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #EEE" }}>
          <button type="button" onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="arrow-left" size={24} color="#111" />
          </button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 600, color: "#111" }}>Client Profile</span>
          <div style={{ width: 28 }} />
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.picture?.startsWith("/") ? `${SERVER_BASE}${profile.picture}` : "https://cdn-icons-png.flaticon.com/512/3135/3135768.png"}
              alt=""
              style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 12, objectFit: "cover" }}
            />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{profile.name}</div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
              <Icon name="map-marker" size={14} color="#666" /> {profile.address || "Location Not Specified"}
            </div>
            <div style={{ display: "flex", alignItems: "center", background: "#FFF9E6", padding: "6px 12px", borderRadius: 20, marginTop: 10 }}>
              <Icon name="star" size={18} color="#FFD700" />
              <span style={{ marginLeft: 6, fontSize: 15, fontWeight: 700, color: "#111" }}>
                {profile.rating > 0 ? profile.rating.toFixed(1) : "New"}{" "}
                <span style={{ fontSize: 13, fontWeight: 400, color: "#666" }}>({profile.reviewCount || 0} reviews)</span>
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: "#EFEFEF", margin: "15px 0" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 12 }}>Reviews from Workers</div>

          {displayedReviews.length === 0 ? (
            <div style={{ fontStyle: "italic", color: "#888", textAlign: "center" }}>No reviews have been left for this client yet.</div>
          ) : (
            displayedReviews.map((item) => (
              <div key={item.id} style={{ background: "#F9FAFB", borderRadius: 10, padding: 12, marginBottom: 10, border: "1px solid #EEE" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.reviewerImage?.startsWith("/") ? `${SERVER_BASE}${item.reviewerImage}` : "/images/default-user.png"} alt="" style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, objectFit: "cover" }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{item.reviewerName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Icon name="star" size={14} color="#FFD700" />
                    <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 3, color: "#333" }}>{item.rating}</span>
                  </div>
                </div>
                <div style={{ color: "#444", margin: "6px 0", fontSize: 13, lineHeight: 1.5 }}>{item.comment}</div>
                <div style={{ color: "#999", fontSize: 11 }}>{item.date}</div>
              </div>
            ))
          )}

          {profile.reviews && profile.reviews.length > 2 && !showAllReviews && (
            <button type="button" onClick={() => setShowAllReviews(true)} style={{ marginTop: 8, padding: 12, width: "100%", background: "#E8F0FE", border: "none", borderRadius: 8, color: "#1E64D3", fontWeight: 600, cursor: "pointer" }}>
              View All ({profile.reviews.length}) Reviews
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
