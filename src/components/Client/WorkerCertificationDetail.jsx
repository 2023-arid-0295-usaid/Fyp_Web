"use client";

// Port of assets/components/Client/WorkerCertificationDetail.js — the company
// training certificate card for a worker.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DIRECTORY, SERVER_BASE } from "@/lib/config";

export default function WorkerCertificationDetail() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");
  const router = useRouter();

  const [certData, setCertData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCertificate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const fetchCertificate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_DIRECTORY}/GetWorkerCertificateDetail/${workerId}`);
      if (response.ok) {
        setCertData(await response.json());
      } else if (response.status === 404) {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: 60, fontFamily: "system-ui" }}>Loading certificate…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F6F9FF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button type="button" onClick={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, background: "#EDF3FF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrow-left" size={22} color="#0F172A" />
          </button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Worker Certification</span>
          <div style={{ width: 38 }} />
        </div>

        {error || !certData ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Icon name="file-document-outline" size={60} color="#94A3B8" />
            <div style={{ color: "#64748B", margin: "14px 0" }}>No certificate record found for this worker.</div>
            <button type="button" onClick={() => router.back()} style={{ background: "#1E64D3", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              Go Back
            </button>
          </div>
        ) : (
          <div style={{ background: "#FFF", borderRadius: 22, padding: "24px 20px 28px", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid #E6EDF9" }}>
            <div style={{ width: 62, height: 62, borderRadius: 31, background: "#0088CC", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon name="shield-check" size={30} color="#FFF" />
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#0F172A", textAlign: "center", lineHeight: 1.35 }}>{certData.certificateTitle}</div>
            <div style={{ fontSize: 13, color: "#475569", textAlign: "center", marginTop: 8 }}>
              Certified {certData.workerName} • {certData.companyName}
            </div>

            <div style={{ width: "100%", height: 1, background: "#F1F5F9", margin: "20px 0" }} />

            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 0.7, marginBottom: 10 }}>TRAINING EVALUATION NOTES</div>
            <div style={{ fontSize: 14, color: "#334155", textAlign: "center", lineHeight: 1.6 }}>{certData.evaluationNotes || "No notes recorded."}</div>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#64748B" }}>{certData.companyName}</div>
              <div style={{ width: 150, height: 1, background: "#CBD5E1", margin: "6px 0" }} />
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Verification #{certData.certificateId} • Issued {certData.issuedDate}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "#FFF", borderTop: "1px solid #F0F0F0", maxWidth: 560, margin: "0 auto" }}>
        <button type="button" onClick={() => router.back()} style={{ width: "100%", height: 50, borderRadius: 14, background: "#E2E8F0", border: "none", color: "#1E293B", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}
