"use client";

// Port of assets/components/Police/PoliceVerificationPortal.js — search workers
// by CNIC and open the criminal-record filing form.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_POLICE, SERVER_BASE } from "@/lib/config";

export default function PoliceVerificationPortal() {
  const router = useRouter();
  const [searchCnic, setSearchCnic] = useState("");
  const [workers, setWorkers] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkers = async (cnicQuery = "") => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_POLICE}/GetWorkersForVerification?searchCnic=${cnicQuery}`);
      const data = await response.json();
      if (response.ok) {
        setWorkers(data.workers || []);
        setTotalResults(data.totalResults || 0);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (text) => {
    setSearchCnic(text);
    fetchWorkers(text);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "15px 20px 10px" }}>
          <button type="button" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, background: "#EEF2F6", display: "flex", justifyContent: "center", alignItems: "center", marginRight: 12, border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" size={22} color="#1E293B" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>Police Verification Portal</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: 0.5 }}>CRIMINAL RECORD DATABASE</div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", background: "#EEF2F6", borderRadius: 25, margin: "12px 20px", padding: "0 15px", height: 48 }}>
          <Icon name="magnify" size={22} color="#64748B" />
          <input
            style={{ flex: 1, fontSize: 15, color: "#1E293B", border: "none", outline: "none", background: "transparent", marginLeft: 8, fontFamily: "inherit" }}
            placeholder="Search worker by CNIC..."
            inputMode="numeric"
            value={searchCnic}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Subheader */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 10 }}>
          <span style={{ background: "#111E2E", padding: "8px 16px", borderRadius: 20, color: "#FFF", fontWeight: 700, fontSize: 13 }}>All Workers List</span>
          <span style={{ color: "#475569", fontWeight: 700, fontSize: 13 }}>{totalResults} Total Results</span>
        </div>

        {/* Workers List */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#111E2E", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ padding: "0 20px 20px" }}>
            {workers.map((item) => {
              const imageUri = item.picture
                ? item.picture.startsWith("http")
                  ? item.picture
                  : `${SERVER_BASE}${item.picture}`
                : "/images/default-user.png";

              return (
                <div key={item.id} style={{ background: "#FFF", borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: "0 2px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUri} alt="" style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{item.name}</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 13, color: "#0284C7", fontWeight: 600 }}>{item.category || item.profession}</span>
                        <span style={{ fontSize: 12, color: "#64748B", marginTop: 3, fontWeight: 500, display: "block" }}>CNIC: {item.cnic}</span>
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={() => router.push(`/police/file-criminal-record?workerId=${item.id}`)} style={{ background: "#111E2E", borderRadius: 10, padding: "12px 0", width: "100%", color: "#FFF", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    REVIEW &amp; FLAG WORKER
                  </button>
                </div>
              );
            })}
            {workers.length === 0 && <div style={{ textAlign: "center", color: "#94A3B8", padding: 30 }}>No workers found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
