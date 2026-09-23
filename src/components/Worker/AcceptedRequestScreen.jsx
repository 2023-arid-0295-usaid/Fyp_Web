"use client";

// Port of assets/components/Worker/AcceptedRequestScreen.js — accepted requests
// with a Reject action (UpdateWorkerDecision).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const API_BASE = API_DASHBOARD;

export default function AcceptedRequestScreen() {
  const router = useRouter();
  const toast = useToast();

  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAcceptedRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAcceptedRequests = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/GetAcceptedWorkerRequests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAcceptedRequests(Array.isArray(data) ? data : []);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to load accepted requests." });
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Could not connect to server." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/UpdateWorkerDecision/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision: "Rejected" }),
      });

      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Request Rejected successfully." });
        setAcceptedRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to reject request." });
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Could not connect to server." });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F6FC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF", padding: "10px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button type="button" onClick={() => router.back()} style={{ padding: 4, marginRight: 8, background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="arrow-left" size={24} color="#1F2937" />
            </button>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: -0.3 }}>Accepted Requests</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="logo" style={{ width: 110, height: 90, objectFit: "contain" }} />
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
            New Accepted Requests ({acceptedRequests.length})
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
              <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : acceptedRequests.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 40, fontStyle: "italic", color: "#999" }}>No accepted requests found.</div>
          ) : (
            acceptedRequests.map((item) => (
              <div key={item.id} style={{ background: "#FFF", borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.08)", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ border: "1px solid #1E64D3", borderRadius: 10, padding: "4px 12px", fontSize: 12, color: "#1E64D3", fontWeight: 600 }}>
                    {item.service}
                  </span>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: "#4CAF50", marginRight: 6 }} />
                    <span style={{ fontSize: 14, color: "#4CAF50", fontWeight: 500 }}>Accepted</span>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                    onClick={() => {
                      if (item.clientId) {
                        router.push(`/client/client-profile?clientId=${item.clientId}`);
                      } else {
                        console.warn("Client ID is missing for this review.");
                      }
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{item.client || "Customer"}</span>
                  </button>
                  <span style={{ display: "flex", alignItems: "center", background: "#FFF9E6", padding: "4px 8px", borderRadius: 12, border: "1px solid #FFE599" }}>
                    <Icon name="star" size={14} color="#FFD700" />
                    <span style={{ marginLeft: 3, fontSize: 13, fontWeight: 700, color: "#B45309" }}>{item.clientRating > 0 ? item.clientRating.toFixed(1) : "N/A"}</span>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <Icon name="map-marker" size={18} color="#E91E63" />
                  <span style={{ fontSize: 14, color: "#666", marginLeft: 8 }}>{item.location}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                  <Icon name="phone" size={18} color="#4CAF50" />
                  <span style={{ fontSize: 14, color: "#666", marginLeft: 8 }}>{item.clientPhone}</span>
                </div>

                <button type="button" onClick={() => handleReject(item.id)} style={{ alignSelf: "flex-end", background: "#F5F5F5", padding: "8px 25px", borderRadius: 20, border: "1px solid #E0E0E0", color: "#9E9E9E", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "block", marginLeft: "auto", fontFamily: "inherit" }}>
                  Reject
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
