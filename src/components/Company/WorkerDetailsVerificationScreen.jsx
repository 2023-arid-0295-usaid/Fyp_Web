"use client";

// Port of assets/components/Company/WorkerDetailsVerificationScreen.js —
// worker details + issue a training certificate (IssueCertificate POST).

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DIRECTORY } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

// Extract base server URL by stripping "/api" suffix (mirrors the original).
const SERVER_BASE = API_DIRECTORY ? API_DIRECTORY.split("/api")[0] : "http://192.168.100.13/Fyp_Backend";

export default function WorkerDetailsVerificationScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");
  const router = useRouter();
  const toast = useToast();

  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [certificateTitle, setCertificateTitle] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");

  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/worker_default.jpg`;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const formattedPath = path.startsWith("/") ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  useEffect(() => {
    if (workerId) fetchWorkerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const fetchWorkerDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_DIRECTORY}/GetWorkerDetails/${workerId}`);
      const data = await response.json();

      if (response.ok) {
        setWorker(data);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: data.message || "Could not load worker details." });
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Server network error." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!certificateTitle.trim()) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please enter a certificate title." });
      return;
    }

    try {
      setIsSubmitting(true);

      let companyIdRaw = (await storage.getItem("companyId")) || (await storage.getItem("userId"));

      if (!companyIdRaw) {
        const userObjStr = await storage.getItem("user");
        if (userObjStr) {
          const parsedUser = JSON.parse(userObjStr);
          companyIdRaw = parsedUser?.companyID || parsedUser?.companyId || parsedUser?.userId || parsedUser?.id;
        }
      }

      const companyId = parseInt(companyIdRaw, 10);

      if (!companyId || isNaN(companyId)) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Session expired: Please log out and log in again." });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        workerId: parseInt(workerId, 10),
        companyId: companyId,
        certificateTitle: certificateTitle.trim(),
        trainingEvaluationNotes: trainingNotes.trim(),
      };

      const response = await fetch(`${API_DIRECTORY}/IssueCertificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: data.message || "Certificate issued successfully!" });
        router.back();
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: data.message || "Failed to issue certificate." });
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Network error issuing certificate." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F8F9FA" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#026597", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const avatarUri = getImageUri(worker?.picture);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Navigation Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#FFF", borderBottom: "1px solid #EFEFEF" }}>
          <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <Icon name="chevron-left" size={32} color="#1A1C1E" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1A1C1E" }}>Worker Details &amp; Certification</span>
          <div style={{ width: 32 }} />
        </div>

        <div style={{ padding: 20 }}>
          {/* Top Profile Summary Card */}
          <div style={{ background: "#FFF", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #F0F0F0" }}>
            <div style={{ position: "relative", marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUri} alt="" style={{ width: 86, height: 86, borderRadius: 43, background: "#E0E0E0", objectFit: "cover" }} />
              <span style={{ position: "absolute", bottom: -2, right: -2, background: "#FFF", borderRadius: 12, padding: 1 }}>
                <Icon name="check-decagram" size={22} color="#026597" />
              </span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1C1E", marginBottom: 2 }}>{worker?.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#026597", letterSpacing: 0.6, marginBottom: 12 }}>{worker?.roleTitle}</div>

            <div style={{ width: "100%", height: 1, background: "#F0F0F0", margin: "12px 0" }} />

            <InfoRow label="CNIC" value={worker?.cnic} />
            <InfoRow label="Phone" value={worker?.phone} />
            <InfoRow label="Address" value={worker?.address} />
          </div>

          {/* Form Section */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8, letterSpacing: 0.5 }}>CERTIFICATE TITLE</div>
          <div style={{ display: "flex", alignItems: "center", background: "#F3F4F6", borderRadius: 14, padding: "0 14px", marginBottom: 20 }}>
            <Icon name="ribbon" size={20} color="#666" />
            <input
              style={{ flex: 1, height: 50, fontSize: 14, color: "#333", border: "none", outline: "none", background: "transparent", marginLeft: 10, fontFamily: "inherit" }}
              placeholder="e.g., Advanced Cleaning Certification"
              value={certificateTitle}
              onChange={(e) => setCertificateTitle(e.target.value)}
            />
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8, letterSpacing: 0.5 }}>TRAINING DETAILS</div>
          <textarea
            rows={4}
            style={{ width: "100%", background: "#F3F4F6", borderRadius: 14, padding: 14, fontSize: 14, color: "#333", border: "none", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 20, fontFamily: "inherit" }}
            placeholder="Type training assessment and evaluation notes here..."
            value={trainingNotes}
            onChange={(e) => setTrainingNotes(e.target.value)}
          />

          {/* Action Button */}
          <button type="button" onClick={handleIssueCertificate} disabled={isSubmitting} style={{ background: "#026597", borderRadius: 14, height: 52, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#FFF", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 3px 5px rgba(2,101,151,0.2)", opacity: isSubmitting ? 0.7 : 1, fontFamily: "inherit" }}>
            {isSubmitting ? "Submitting…" : (<><Icon name="send-outline" size={18} color="#FFF" /> Issue &amp; Publish Certificate</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", margin: "6px 0" }}>
      <span style={{ fontSize: 13, color: "#888", width: 75, fontWeight: 500 }}>{label}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1A1C1E", textAlign: "right" }}>{value}</span>
    </div>
  );
}
