"use client";

// Port of assets/components/Client/WorkerDetailScreen.js. Tabbed profile with
// Overview/Experience/Reviews/Time Slots, trust badges, and the sticky
// "Call For Interview" CTA.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD, SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const API_BASE = API_DASHBOARD;

export default function WorkerDetailScreen() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");
  const router = useRouter();
  const toast = useToast();

  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const horizontalScrollRef = useRef(null);

  const tabs = worker?.isPartTimeAvailable
    ? ["Overview", "Experience", "Reviews", "Time Slots"]
    : ["Overview", "Experience", "Reviews"];

  useEffect(() => {
    fetchWorkerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const fetchWorkerDetails = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const clientId = await storage.getItem("clientId");
      const response = await fetch(`${API_BASE}/GetWorkerDetail/${workerId}?clientIdParam=${clientId || ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWorker(data);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to fetch worker details." });
        router.back();
      }
    } catch (error) {
      console.error("Error fetching worker details:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Could not connect to server." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: 60, fontFamily: "system-ui" }}>Loading worker profile…</div>;
  }
  if (!worker) return null;

  const ctaLabel = ["finalized", "hired", "accepted"].includes((worker.activeInterviewStatus || "").toString().toLowerCase())
    ? "Worker Hired"
    : worker.availability === "NOT AVAILABLE"
      ? "Worker Not Available"
      : worker.hasActiveInterview
        ? "Interview Request Pending"
        : "Call For Interview";

  const ctaDisabled = worker.hasActiveInterview || worker.availability === "NOT AVAILABLE";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 90 }}>
        {/* Header */}
        <div style={{ background: "#FFF", padding: "10px 16px", borderBottom: "1px solid #E2E8F0" }}>
          <button type="button" onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 8 }}>
            <Icon name="arrow-left" size={24} color="#1F2937" />
          </button>

          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={worker.picture && worker.picture.startsWith("/") ? `${SERVER_BASE}${worker.picture}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
              alt={worker.name}
              style={{ width: 70, height: 70, borderRadius: 35, marginRight: 14, objectFit: "cover" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>{worker.name}</div>
              <div style={{ fontSize: 14, color: "#1E64D3", fontWeight: 600, marginBottom: 4 }}>{worker.role}</div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", background: worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked" ? "#FEE2E2" : "#DCFCE7", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, color: worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked" ? "#B91C1C" : "#15803D" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked" ? "#DC2626" : "#16A34A", marginRight: 4, display: "inline-block" }} />
                  {worker.availability === "Available 24/7" ? "AVAILABLE" : worker.availability}
                </span>
                {worker.isPartTimeAvailable && (
                  <span style={{ display: "inline-flex", alignItems: "center", background: "#FEFCBF", padding: "2px 8px", borderRadius: 12, gap: 3, fontSize: 10, fontWeight: 800, color: "#975A16" }}>
                    <Icon name="clock-outline" size={11} color="#975A16" /> PART-TIME AVAILABLE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                {worker.gender ? worker.gender.toUpperCase() : ""} • {worker.age} Y/O
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: 12, padding: "12px 4px" }}>
            <Stat label="RATING" value={`★ ${worker.rating || "0.0"}`} sub={`(${worker.reviewCount || 0})`} flex={0.8} />
            <Divider />
            <Stat label="LOCATION" value={(worker.location || "N/A").toUpperCase()} flex={1.8} />
            <Divider />
            <Stat label="SALARY" value={`Rs.${worker.salary}`} flex={1.1} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", marginTop: 8 }}>
            {tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(index)}
                style={{ flex: 1, padding: "12px 0", border: "none", background: "none", cursor: "pointer", borderBottom: activeTab === index ? "2px solid #1E64D3" : "2px solid transparent", fontSize: 12, fontWeight: activeTab === index ? 700 : 600, color: activeTab === index ? "#1E64D3" : "#64748B" }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          {activeTab === 0 && (
            <OverviewTab worker={worker} workerId={workerId} router={router} />
          )}
          {activeTab === 1 && <ExperienceTab worker={worker} />}
          {activeTab === 2 && <ReviewsTab worker={worker} router={router} />}
          {activeTab === 3 && worker.isPartTimeAvailable && <TimeSlotsTab worker={worker} />}
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#FFF", borderTop: "1px solid #E2E8F0", padding: 16, maxWidth: 640, margin: "0 auto" }}>
        <button
          type="button"
          disabled={ctaDisabled}
          onClick={() => router.push(`/client/interview?workerId=${worker.id}&workerName=${encodeURIComponent(worker.name)}`)}
          style={{ width: "100%", height: 48, borderRadius: 24, background: ctaDisabled ? "#94A3B8" : "#1E64D3", border: "none", color: "#FFF", fontSize: 15, fontWeight: 700, cursor: ctaDisabled ? "not-allowed" : "pointer" }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function OverviewTab({ worker, workerId, router }) {
  return (
    <>
      <SectionTitle>Trust &amp; Verification</SectionTitle>
      <button type="button" onClick={() => router.push(`/client/certification?workerId=${worker.id || workerId}`)} style={{ ...trustBtn, background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
        <Icon name="shield-check" size={22} color="#026597" />
        <div style={{ flex: 1, marginLeft: 10, textAlign: "left" }}>
          <div style={{ color: "#0369A1", fontSize: 13, fontWeight: 700 }}>Verified Training</div>
          <div style={{ color: "#0284C7", fontSize: 11 }}>Certified by {worker.companyName || "Proton Services"}</div>
        </div>
        <Icon name="chevron-right" size={20} color="#026597" />
      </button>

      <button type="button" onClick={() => router.push(`/client/worker-detail?workerId=${workerId}`)} style={{ ...trustBtn, background: "#FEF2F2", border: "1px solid #FECACA" }}>
        <Icon name="shield-alert" size={22} color="#B91C1C" />
        <div style={{ flex: 1, marginLeft: 10, textAlign: "left" }}>
          <div style={{ color: "#991B1B", fontSize: 13, fontWeight: 700 }}>Criminal Background Check</div>
          <div style={{ color: "#B91C1C", fontSize: 11 }}>FIR &amp; verification status is shown by the police portal</div>
        </div>
        <Icon name="chevron-right" size={20} color="#B91C1C" />
      </button>

      <SectionTitle>About Worker</SectionTitle>
      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{worker.bio || "No description provided."}</p>

      <SectionTitle>Primary Skills</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {worker.primarySkills && worker.primarySkills.length > 0 ? (
          worker.primarySkills.map((skill, index) => (
            <span key={index} style={{ background: "#1E64D3", color: "#FFF", padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 700 }}>{skill.toUpperCase()}</span>
          ))
        ) : (
          <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No primary skills listed.</span>
        )}
      </div>

      <SectionTitle>Part-Time Services</SectionTitle>
      {worker.partTimeSkills && worker.partTimeSkills.length > 0 ? (
        worker.partTimeSkills.map((item, index) => (
          <div key={index} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1E64D3", marginBottom: 4 }}>{item.categoryName.toUpperCase()}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {item.skills.map((skill, sIndex) => (
                <span key={sIndex} style={{ background: "#E2E8F0", color: "#334155", padding: "5px 10px", borderRadius: 14, fontSize: 11, fontWeight: 600 }}>{skill.toUpperCase()}</span>
              ))}
            </div>
          </div>
        ))
      ) : (
        <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No part-time skills added.</span>
      )}
    </>
  );
}

function ExperienceTab({ worker }) {
  return (
    <>
      <SectionTitle>Work History</SectionTitle>
      {worker.experiences && worker.experiences.length > 0 ? (
        worker.experiences.map((exp, index) => (
          <div key={index} style={{ display: "flex", marginBottom: 12 }}>
            <div style={{ width: 10, marginRight: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: index === 0 ? "#1E64D3" : "#CBD5E1" }} />
              <div style={{ flex: 1, width: 2, background: "#E2E8F0" }} />
            </div>
            <div style={{ flex: 1, background: "#FFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{exp.title}</span>
                <span style={{ fontSize: 10, color: "#64748B" }}>{exp.period}</span>
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{exp.details}</div>
            </div>
          </div>
        ))
      ) : (
        <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No experience history available.</span>
      )}

      <SectionTitle>Booking Procedure</SectionTitle>
      <div style={{ background: "#FFF", borderRadius: 8, padding: 12, border: "1px solid #E2E8F0" }}>
        <Step step="1" text="Send an interview request with preferred timings." />
        <Step step="2" text="Wait for status confirmation or callback." />
        <Step step="3" text="Finalize details & start service." />
      </div>
    </>
  );
}

function ReviewsTab({ worker, router }) {
  return (
    <>
      <SectionTitle>Client Feedback &amp; Ratings</SectionTitle>
      <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 12, padding: 14, border: "1px solid #E2E8F0", marginBottom: 12 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: "#0F172A" }}>{worker.rating || "0.0"}</span>
        <div style={{ marginLeft: 12 }}>
          <Stars rating={Math.round(worker.rating || 0)} />
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Based on {worker.reviewCount || 0} reviews</div>
        </div>
      </div>

      {worker.reviews && worker.reviews.length > 0 ? (
        worker.reviews.map((rev, index) => (
          <div key={index} style={{ background: "#FFF", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => (rev.clientId ? router.push(`/client/client-profile?clientId=${rev.clientId}`) : console.warn("Client ID is missing for this review."))}
                style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 700, color: "#0F172A", textDecoration: "underline" }}
              >
                {rev.reviewerName}
              </button>
              <Stars rating={rev.rating} size={14} />
            </div>
            <div style={{ fontSize: 10, color: "#94A3B8", margin: "2px 0" }}>{rev.date}</div>
            <div style={{ fontSize: 12, color: "#334155", fontStyle: "italic" }}>"{rev.comment}"</div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: "center", padding: 20, color: "#94A3B8" }}>
          <Icon name="message-outline" size={40} color="#94A3B8" />
          <div style={{ fontSize: 12, marginTop: 8 }}>No reviews submitted yet.</div>
        </div>
      )}
    </>
  );
}

function TimeSlotsTab({ worker }) {
  return (
    <>
      <SectionTitle>Part-Time Available Slots</SectionTitle>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>This worker is within your radius ({worker.distanceKm} km away).</div>
      {worker.timeSlots && worker.timeSlots.length > 0 ? (
        worker.timeSlots.map((slot) => (
          <div key={slot.id} style={{ display: "flex", alignItems: "center", background: "#EBF8FF", padding: 14, borderRadius: 10, marginBottom: 8, border: "1px solid #BEE3F8" }}>
            <Icon name="clock-time-four-outline" size={20} color="#3182CE" />
            <span style={{ color: "#2B6CB0", fontWeight: 700, fontSize: 14, marginLeft: 10 }}>{slot.startTime} - {slot.endTime}</span>
          </div>
        ))
      ) : (
        <div style={{ textAlign: "center", padding: 20, color: "#94A3B8" }}>
          <Icon name="clock-alert-outline" size={36} color="#94A3B8" />
          <div style={{ fontSize: 12, marginTop: 8 }}>No active time slots defined for this worker.</div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, sub, flex }) {
  return (
    <div style={{ flex, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>{value}</div>
      {sub ? <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

const Divider = () => <div style={{ width: 1, height: "70%", background: "#CBD5E1" }} />;

function Stars({ rating, size = 18 }) {
  return (
    <div style={{ display: "flex" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= rating ? "star" : "star-outline"} size={size} color={i <= rating ? "#FFD700" : "#CBD5E1"} />
      ))}
    </div>
  );
}

function Step({ step, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
      <div style={{ width: 20, height: 20, borderRadius: 10, background: "#E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, fontSize: 10, fontWeight: 700, color: "#4338CA" }}>{step}</div>
      <span style={{ fontSize: 12, color: "#334155" }}>{text}</span>
    </div>
  );
}

const SectionTitle = ({ children }) => <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "12px 0 8px" }}>{children}</div>;

const trustBtn = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
  cursor: "pointer",
};
