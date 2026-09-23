"use client";

// Port of assets/components/Client/ResignationsScreen.js — list of worker
// resignation notices with pull-to-refresh equivalent (reload button).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";

export default function ResignationsScreen() {
  const [resignations, setResignations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchResignations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResignations = async () => {
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_DASHBOARD}/GetClientResignations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setResignations(data);
      }
    } catch (error) {
      console.error("Error fetching resignations:", error);
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
            <span style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Worker Resignations</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="logo" style={{ width: 90, height: 70, objectFit: "contain" }} />
        </div>

        <div style={{ padding: 16 }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading…</div>
          ) : resignations.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Icon name="file-document-outline" size={60} color="#9CA3AF" />
              <div style={{ color: "#6B7280", marginTop: 12 }}>No resignation notices received yet.</div>
            </div>
          ) : (
            resignations.map((item) => (
              <div key={item.resignationId} style={{ background: "#FFF", borderRadius: 18, border: "1px solid #FED7AA", padding: 16, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/default-user.png" alt="" style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{item.workerName}</span>
                      <span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Resigned</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{item.workerRole || "Worker"}</div>
                    <div style={{ fontSize: 12, color: "#4B5563", marginTop: 4 }}>
                      <b>Reason for Leaving:</b> {item.reason}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#E91E63" }}>
                    <Icon name="calendar-clock" size={16} color="#E91E63" /> Last Day: {item.lastWorkingDate}
                  </span>
                  <button type="button" onClick={() => router.push(`/client/resignation-detail?resignationId=${item.resignationId}`)} style={{ display: "flex", alignItems: "center", gap: 4, background: "#1E64D3", border: "none", color: "#FFF", padding: "8px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    View Detail <Icon name="chevron-right" size={18} color="#FFF" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
