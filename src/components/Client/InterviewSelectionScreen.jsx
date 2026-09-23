"use client";

// Port of assets/components/Client/InterviewSelectionScreen.js — date/time
// pickers + address; POSTs /api/Dashboard/BookInterview.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function InterviewSelectionScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");
  const workerName = searchParams.get("workerName") || "Worker";
  const router = useRouter();
  const toast = useToast();

  const [date, setDate] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [clientAddress, setClientAddress] = useState("");

  useEffect(() => {
    storage.getItem("userAddress").then((addr) => {
      if (addr) setClientAddress(addr);
    });
  }, []);

  const handleConfirmInterview = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 19);

      const response = await fetch(`${SERVER_BASE}/api/Dashboard/BookInterview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ WorkerId: workerId, InterviewDate: localISOTime, Address: clientAddress, Status: "Pending" }),
      });

      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: `Interview request sent to ${workerName}!` });
        router.push("/client/dashboard");
      } else {
        const err = await response.json();
        toast.show({ type: "error", text1: "Error ❌", text2: err.message || "Failed to book interview." });
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Could not connect to server." });
    } finally {
      setIsLoading(false);
    }
  };

  const day = date.toISOString().split("T")[0];
  const time = date.toTimeString().slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FBFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button type="button" onClick={() => router.back()} style={{ padding: 8, background: "#FFF", borderRadius: 20, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <Icon name="arrow-left" size={24} color="#555" />
          </button>
          <span style={{ fontSize: 22, fontWeight: 700, marginLeft: 15 }}>Select Date &amp; Time</span>
        </div>

        <div style={{ fontSize: 16, color: "#555", marginBottom: 20 }}>When do you need to interview {workerName}?</div>

        <div style={{ marginBottom: 25 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Interview Date</div>
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", padding: 15, borderRadius: 15, border: "1px solid #EEE" }}>
            <div style={{ width: 45, height: 45, borderRadius: 23, background: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 15 }}>
              <Icon name="calendar" size={24} color="#1E64D3" />
            </div>
            <input type="date" value={day} onChange={(e) => setDate(new Date(`${e.target.value}T${time}`))} style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontWeight: 700, color: "#333" }} />
          </div>
        </div>

        <div style={{ marginBottom: 25 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Interview Time</div>
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", padding: 15, borderRadius: 15, border: "1px solid #EEE" }}>
            <div style={{ width: 45, height: 45, borderRadius: 23, background: "#F3EDF7", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 15 }}>
              <Icon name="clock-outline" size={24} color="#6750A4" />
            </div>
            <input type="time" value={time} onChange={(e) => setDate(new Date(`${day}T${e.target.value}`))} style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontWeight: 700, color: "#333" }} />
          </div>
        </div>

        <div style={{ marginBottom: 25 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Interview Location</div>
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", padding: 15, borderRadius: 15, border: "1px solid #EEE" }}>
            <div style={{ width: 45, height: 45, borderRadius: 23, background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 15 }}>
              <Icon name="map-marker" size={24} color="#E65100" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>Your Address</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>{clientAddress || "Loading address..."}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 20, background: "#F8FBFF", maxWidth: 640, margin: "0 auto" }}>
        <button type="button" onClick={handleConfirmInterview} disabled={isLoading} style={{ width: "100%", height: 55, borderRadius: 28, background: "#1E64D3", border: "none", color: "#FFF", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
          {isLoading ? "Booking…" : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}
