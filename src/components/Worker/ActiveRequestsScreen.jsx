"use client";

// Port of assets/components/Worker/ActiveRequestsScreen.js — pending interview
// requests for a worker with Accept/Reject (UpdateWorkerDecision).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const API_BASE = API_DASHBOARD;

export default function ActiveRequestsScreen() {
  const router = useRouter();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/GetWorkerRequests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to load requests." });
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Could not connect to server." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, decision) => {
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/UpdateWorkerDecision/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workerDecision: decision }),
      });

      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: `Request ${decision}!` });
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to update status." });
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
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: -0.3 }}>Active Requests</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="logo" style={{ width: 110, height: 90, objectFit: "contain" }} />
        </div>

        <div style={{ padding: "16px 20px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>New Booking Requests ({requests.length})</span>
            <button type="button" onClick={() => router.push("/worker/accepted-requests")} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <span style={{ color: "#1E64D3", fontWeight: 700, fontSize: 14 }}>Goto Accepted</span>
            </button>
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
              <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 40, fontStyle: "italic", color: "#999" }}>No pending requests.</div>
          ) : (
            requests.map((item, index) => {
              const uniqueKey = item.id ? item.id.toString() : index.toString();
              return (
                <div key={uniqueKey} style={{ background: "#FFF", borderRadius: 20, padding: 15, marginBottom: 15, boxShadow: "0 4px 10px rgba(0,0,0,0.08)", border: "1px solid #E5E7EB" }}>
                  {/* Top Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ border: "1px solid #1E64D3", padding: "4px 15px", borderRadius: 10, color: "#1E64D3", fontSize: 12, fontWeight: 700 }}>
                      {item.service || "General Service"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: "#4CAF50", marginRight: 6 }} />
                      <span style={{ fontSize: 12, color: "#888" }}>{item.time || "Just now"}</span>
                    </span>
                  </div>

                  {/* Client Info */}
                  <div style={{ marginBottom: 15 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
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
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Client: {item.client || "Customer"}</span>
                      </button>
                      <span style={{ display: "flex", alignItems: "center", background: "#FFF9E6", padding: "4px 8px", borderRadius: 12, border: "1px solid #FFE599" }}>
                        <Icon name="star" size={14} color="#FFD700" />
                        <span style={{ marginLeft: 3, fontSize: 13, fontWeight: 700, color: "#B45309" }}>{item.clientRating > 0 ? item.clientRating.toFixed(1) : "N/A"}</span>
                      </span>
                    </div>
                    {item.location && (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Icon name="map-marker" size={18} color="#E91E63" />
                        <span style={{ fontSize: 14, color: "#666", marginLeft: 5 }}>{item.location}</span>
                      </div>
                    )}
                    {item.clientPhone && (
                      <div style={{ display: "flex", alignItems: "center", marginTop: 5 }}>
                        <Icon name="phone" size={18} color="#4CAF50" />
                        <span style={{ fontSize: 14, color: "#666", marginLeft: 5 }}>{item.clientPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button type="button" onClick={() => handleStatusUpdate(item.id, "Rejected")} style={{ width: "48%", height: 45, borderRadius: 22.5, background: "#F5F5F5", border: "1px solid #DDD", color: "#666", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Reject
                    </button>
                    <button type="button" onClick={() => handleStatusUpdate(item.id, "Accepted")} style={{ width: "48%", height: 45, borderRadius: 22.5, background: "#4CAF50", border: "none", color: "#FFF", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Accept Booking
                    </button>
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
