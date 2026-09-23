"use client";

// Port of assets/components/Worker/WorkerTerminatedScreen.js — end-of-contract
// (resignation OR termination) detail via GetWorkerEndContractDetails.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";

export default function WorkerTerminatedScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId") || searchParams.get("id");
  const router = useRouter();

  const [terminationData, setTerminationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (workerId) fetchTerminationDetails();
    else {
      setErrorMsg("Worker routing parameters missing.");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const fetchTerminationDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = await storage.getItem("userToken");

      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerEndContractDetails/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTerminationData({
          worker: {
            name: data.workerName,
            role: data.workerSkill,
            address: data.workerAddress,
            phone: data.workerPhone,
            experience: "Active Job Record",
            avatar: data.workerPicture ? `${SERVER_BASE}${data.workerPicture}` : "/images/default-user.png",
          },
          details: {
            status: data.status,
            date: data.date,
            reason: data.reason,
          },
          client: {
            name: data.clientName,
            address: data.clientAddress,
            avatar: data.clientPicture ? `${SERVER_BASE}${data.clientPicture}` : "/images/default-user.png",
          },
        });
      } else if (response.status === 404) {
        setErrorMsg("No contract exit status found for this worker.");
      } else {
        setErrorMsg("Failed to fetch job data from backend server.");
      }
    } catch (error) {
      setErrorMsg("Network connectivity error.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#2C3BE0", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMsg || !terminationData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 20, fontFamily: "system-ui" }}>
        <Icon name="alert-circle-outline" size={60} color="#FF3D00" />
        <div style={{ fontSize: 16, color: "#333", textAlign: "center", margin: "15px 0 20px" }}>{errorMsg}</div>
        <button type="button" onClick={() => router.back()} style={{ background: "#2C3BE0", padding: "10px 20px", borderRadius: 8, border: "none", color: "#FFF", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Go Back
        </button>
      </div>
    );
  }

  const isResigned = terminationData.details.status === "Resigned";

  return (
    <div style={{ minHeight: "100vh", background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, left: -40, width: 150, height: 150, borderRadius: 75, background: "#E3F2FD", zIndex: 0 }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px 20px", position: "relative", zIndex: 1 }}>
          <button type="button" onClick={() => router.back()} style={{ padding: 5, background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" size={24} color="#555" />
          </button>
          <span style={{ fontSize: 16, color: "#666" }}>
            Contract &gt; Worker <span style={{ color: "#2C3BE0", fontWeight: 700 }}>{terminationData.details.status}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
        </div>

        <div style={{ padding: "0 15px 30px", position: "relative", zIndex: 1 }}>
          {/* Warning Banner */}
          <div style={{ display: "flex", alignItems: "center", background: "#F0F4C3", padding: 15, borderRadius: 12, border: "1px solid #D4E157", marginBottom: 20 }}>
            <Icon name="alert" size={30} color="#FF3D00" />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#000", marginLeft: 15 }}>
              {isResigned ? "WORKER RESIGNED" : "WORKER TERMINATED"}
            </span>
          </div>

          {/* Worker Details Section */}
          <div style={{ border: "1px solid #999", borderRadius: 8, background: "#FFF", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", padding: 10, borderBottom: "1px solid #999" }}>
              <Icon name="account" size={20} color="#999" />
              <span style={{ fontSize: 16, color: "#666", marginLeft: 10, fontWeight: 500 }}>WORKER DETAILS</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", padding: 15 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={terminationData.worker.avatar} alt="" style={{ width: 100, height: 100, borderRadius: 50, border: "1px solid #EEE", objectFit: "cover" }} />
              <div style={{ marginLeft: 15, flex: 1 }}>
                <div style={{ fontSize: 14, color: "#666", marginBottom: 2 }}>Name: <b style={{ color: "#000" }}>{terminationData.worker.name}</b></div>
                <div style={{ fontSize: 14, color: "#666", marginBottom: 2 }}>Job Role: {terminationData.worker.role}</div>
                <div style={{ fontSize: 14, color: "#666", marginBottom: 2 }}>Address: {terminationData.worker.address}</div>
                <div style={{ fontSize: 14, color: "#666" }}>Phone: {terminationData.worker.phone}</div>
              </div>
            </div>

            <div style={{ height: 1, background: "#EEE", margin: "0 15px" }} />

            <div style={{ padding: 15 }}>
              <div style={{ fontSize: 16, color: "#333", marginBottom: 8 }}><b>Status :</b> {terminationData.details.status}</div>
              <div style={{ fontSize: 16, color: "#333", marginBottom: 8 }}><b>Date:</b> {terminationData.details.date}</div>
              <div style={{ fontSize: 16, color: "#333" }}><b>Reason:</b> {terminationData.details.reason}</div>
            </div>
          </div>

          <div style={{ fontSize: 14, color: "#999", textAlign: "center", margin: "15px 0" }}>
            {isResigned ? "Worker has resigned and contract is closed." : "You have terminated this worker."}
          </div>
          <div style={{ padding: "0 10px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#333", fontStyle: "italic", marginBottom: 2 }}>• No further active duties under this handshake profile</div>
            <div style={{ fontSize: 12, color: "#333", fontStyle: "italic", marginBottom: 2 }}>• Historic logs preserved into matching database tables successfully</div>
          </div>

          {/* Client Details Section */}
          <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 15 }}>Client Details</div>
          <div style={{ display: "flex", alignItems: "center", padding: 15, borderRadius: 25, border: "1px solid #DDD", background: "#FFF", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={terminationData.client.avatar} alt="" style={{ width: 80, height: 80, borderRadius: 40, objectFit: "cover" }} />
            <div style={{ marginLeft: 15 }}>
              <div style={{ color: "#2C3BE0", fontWeight: 700, fontSize: 14, marginBottom: 5 }}>
                {isResigned ? "Worker Left Job Profile" : "Client Terminated Worker"}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>Name: <b style={{ color: "#000" }}>{terminationData.client.name}</b></div>
              <div style={{ fontSize: 14, color: "#666" }}>Address: {terminationData.client.address}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
