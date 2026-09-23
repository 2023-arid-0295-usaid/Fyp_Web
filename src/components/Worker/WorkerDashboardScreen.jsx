"use client";

// Port of assets/components/Worker/WorkerDashboardScreen.js — 4-tab worker
// dashboard: Overview (duty/radius/notifications/employment), Time Slots,
// Experience, Reviews.
//
// NOTE: the original called /api/RatingReview/GetWorkerReviews/{id}, which does
// not exist in the backend; the real route is /api/Dashboard/GetWorkerReviews/
// {id} (see backend review), so the clone uses the correct endpoint.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const RADIUS_OPTIONS = ["1 km", "2 km", "3 km", "4 km", "5 km"];
const TABS = ["Overview", "Time Slots", "Experience", "Reviews"];

export default function WorkerDashboardScreen() {
  const router = useRouter();
  const toast = useToast();

  const [isDutyOn, setIsDutyOn] = useState(true);
  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedRadius, setSelectedRadius] = useState("5 km");

  // Time Slots
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [submittingSlot, setSubmittingSlot] = useState(false);

  // Reviews
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    fetchWorkerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWorkerDetails = async () => {
    setIsLoading(true);
    try {
      const workerId = await storage.getItem("workerId");
      const token = await storage.getItem("userToken");

      if (!workerId || !token) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Session not found. Please login again." });
        router.replace("/login");
        return;
      }

      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerDetail/${workerId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setWorker(data);
        setIsDutyOn(data.availableStatus ?? true);
        if (data.radius) setSelectedRadius(`${data.radius} km`);
        fetchTimeSlots(workerId);
        fetchWorkerReviews(workerId);
      } else if (response.status === 401) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Session expired. Please login again." });
        router.replace("/login");
      } else {
        let errorMessage = "Could not fetch dashboard data.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const text = await response.text();
          if (text) errorMessage = text.substring(0, 100);
        }
        toast.show({ type: "error", text1: `Error ${response.status} ❌`, text2: errorMessage });
      }
    } catch (error) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Network error. Verify connection and API IP." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- REVIEWS API HANDLER ---
  const fetchWorkerReviews = async (id) => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerReviews/${id}`);
      if (response.ok) {
        const data = await response.json();
        setReviewsList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // --- TIME SLOTS API HANDLERS ---
  const fetchTimeSlots = async (id) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/GetWorkerTimeSlots/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Fetch slots error:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddTimeSlot = async () => {
    if (!startTime || !endTime) {
      toast.show({ type: "error", text1: "Validation Error", text2: "Please enter start and end times (e.g., 09:00:00)." });
      return;
    }

    setSubmittingSlot(true);
    try {
      const workerId = await storage.getItem("workerId");
      const formatTime = (hhmm) => `${hhmm}:00`; // input type="time" gives HH:MM → append :ss

      const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/AddTimeSlot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: parseInt(workerId),
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
        }),
      });

      if (response.ok) {
        toast.show({ type: "success", text1: "Success ✅", text2: "Time slot added successfully!" });
        setIsSlotModalVisible(false);
        fetchTimeSlots(workerId);
      } else {
        let errorObj;
        try {
          errorObj = await response.json();
        } catch (e) {
          errorObj = { message: (await response.text()) || "Failed to add time slot." };
        }
        toast.show({ type: "error", text1: "Error ❌", text2: errorObj.message || "Failed to add time slot." });
      }
    } catch (error) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Something went wrong while saving the time slot." });
    } finally {
      setSubmittingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const confirmed = typeof window !== "undefined" && window.confirm("Are you sure you want to delete this time slot?");
    if (!confirmed) return;
    try {
      const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/DeleteTimeSlot/${slotId}`, { method: "DELETE" });
      if (response.ok) {
        setTimeSlots((prev) => prev.filter((item) => item.id !== slotId));
      }
    } catch (error) {
      console.error("Delete slot error:", error);
    }
  };

  // --- RADIUS CHANGE HANDLER ---
  const handleRadiusChange = async (rad) => {
    setSelectedRadius(rad); // optimistic UI update
    const radiusVal = parseInt(rad.split(" ")[0]);
    try {
      const workerId = await storage.getItem("workerId");
      const token = await storage.getItem("userToken");

      const response = await fetch(`${SERVER_BASE}/api/Dashboard/UpdateWorkerRadius/${workerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(radiusVal),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Radius update failed:", err.message);
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to update radius: " + (err.message || "") });
      }
    } catch (error) {
      console.error("Radius update error:", error);
    }
  };

  // --- DUTY TOGGLE ---
  const handleDutyToggle = async (value) => {
    setIsDutyOn(value);
    try {
      const workerId = await storage.getItem("workerId");
      const token = await storage.getItem("userToken");

      const response = await fetch(`${SERVER_BASE}/api/Dashboard/UpdateDutyStatus/${workerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        setIsDutyOn(!value);
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to update duty status." });
      }
    } catch (error) {
      setIsDutyOn(!value);
      toast.show({ type: "error", text1: "Error ❌", text2: "Network error." });
    }
  };

  // --- USER HANDLERS ---
  const handleLogout = async () => {
    await storage.clear();
    router.replace("/login");
  };

  const handleEditProfile = () => {
    if (worker) {
      sessionStorage.setItem(
        "editDraft",
        JSON.stringify({
          role: "Worker",
          name: worker.name,
          phone: worker.phone,
          address: worker.location || worker.address,
          email: worker.email,
          bio: worker.bio,
          gender: worker.gender,
          age: worker.age,
          cnic: worker.cnic,
          salary: worker.salary,
          picture: worker.picture || worker.Picture || worker.imageUrl,
          rawExperiences: worker.experiences || [],
        })
      );
    }
    router.push("/signup?isEdit=1");
  };

  const handleOpenMapLocation = () => {
    router.push(
      `/map?userRole=Worker&workerId=${worker?.id || worker?.workerId}` +
        (worker?.latitude && worker?.longitude ? `&lat=${worker.latitude}&lng=${worker.longitude}` : "")
    );
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F8F9FB" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (!worker) return null;

  const imagePath = worker.picture || worker.Picture || worker.imageUrl;
  const profileImageUri = imagePath
    ? imagePath.startsWith("http")
      ? imagePath
      : `${SERVER_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Fixed header info */}
        <div style={{ padding: "16px 16px 0" }}>
          {/* 1. Header with profile picture */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
              {profileImageUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImageUri} alt="" style={{ width: 52, height: 52, borderRadius: 26, marginRight: 12, border: "1.5px solid #1E64D3", objectFit: "cover" }} />
              ) : (
                <span style={{ width: 52, height: 52, borderRadius: 26, background: "#EBF3FF", display: "flex", justifyContent: "center", alignItems: "center", marginRight: 12, border: "1px solid #1E64D3" }}>
                  <Icon name="account" size={32} color="#1E64D3" />
                </span>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: 0.5 }}>GOOD AFTERNOON,</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1E", margin: "1px 0" }}>{worker.name || "Mesam Abbas"}</div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E64D3" }}>{worker.role || "Cleaning"}</span>
                  <span style={{ fontSize: 13, color: "#8E8E93" }}>  •  {worker.age || 45} Years Old</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button type="button" onClick={handleEditProfile} style={{ display: "flex", alignItems: "center", background: "#F0F0F2", padding: "6px 10px", borderRadius: 16, gap: 4, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                <Icon name="square-edit-outline" size={16} color="#555" />
                <span style={{ fontSize: 12, color: "#3A3A3C", fontWeight: 600 }}>Edit</span>
              </button>
              <button type="button" onClick={handleLogout} style={{ background: "#FEE2E2", padding: 7, borderRadius: 16, border: "none", cursor: "pointer" }}>
                <Icon name="logout" size={18} color="#D32F2F" />
              </button>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div style={{ display: "flex", background: "#F0F4F8", borderRadius: 12, padding: 12, marginBottom: 12, alignItems: "center" }}>
            <InfoCol label="RATING" value={`★ ${worker.rating || "0.0"}`} sub={`(${worker.reviewCount || 0})`} />
            <div style={{ width: 1, background: "#D1D1D6", alignSelf: "stretch", margin: "0 4px" }} />
            <div style={{ flex: 2, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#8E8E93", fontWeight: 700, marginBottom: 2 }}>LOCATION</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1E" }}>{worker.location || "RAWALPINDI"}</div>
            </div>
            <div style={{ width: 1, background: "#D1D1D6", alignSelf: "stretch", margin: "0 4px" }} />
            <InfoCol label="SALARY" value={`Rs.${worker.salary || "0"}`} />
          </div>

          {/* Underline tabs header */}
          <div style={{ display: "flex", borderBottom: "1px solid #E5E5EA", marginBottom: 4 }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: "10px 0", textAlign: "center", borderBottom: isActive ? "2px solid #1E64D3" : "2px solid transparent", background: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? "#1E64D3" : "#8E8E93" }}>{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {activeTab === "Overview" && <OverviewTabS worker={worker} isDutyOn={isDutyOn} onDutyToggle={handleDutyToggle} onOpenMap={handleOpenMapLocation} selectedRadius={selectedRadius} onRadius={handleRadiusChange} router={router} />}

          {activeTab === "Time Slots" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ ...iconCircle, marginRight: 12 }}>
                    <Icon name="clock-outline" size={20} color="#1E64D3" />
                  </span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E" }}>Weekly Availability</div>
                    <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>Manage your free working hours</div>
                  </div>
                </div>
                <button type="button" onClick={() => setIsSlotModalVisible(true)} style={{ background: "#EBF3FF", padding: "6px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ color: "#1E64D3", fontSize: 12, fontWeight: 700 }}>+ Add Slot</span>
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                {loadingSlots ? (
                  <div style={{ textAlign: "center", padding: 10 }}>
                    <div style={{ width: 20, height: 20, border: "3px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
                    <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : timeSlots.length > 0 ? (
                  timeSlots.map((slot) => (
                    <div key={slot.id} style={{ display: "flex", alignItems: "center", background: "#F9FAFB", padding: 12, borderRadius: 12, marginBottom: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: "#34C759" }} />
                      <div style={{ flex: 1, marginLeft: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{slot.startTime} - {slot.endTime}</div>
                        <div style={{ fontSize: 11, color: "#8E8E93" }}>Available Shift</div>
                      </div>
                      <button type="button" onClick={() => handleDeleteSlot(slot.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <Icon name="trash-can-outline" size={18} color="#8E8E93" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <Icon name="clock-outline" size={40} color="#D1D1D6" />
                    <div style={{ color: "#8E8E93", fontStyle: "italic", fontSize: 13, marginTop: 8 }}>No available time slots yet.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Experience" && (
            <div style={cardStyle}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>Experience History</div>
              {worker.experiences && worker.experiences.length > 0 ? (
                worker.experiences.map((exp, index) => (
                  <div key={index} style={{ display: "flex", marginTop: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: index === 0 ? "#1E64D3" : "#CCC" }} />
                      <span style={{ width: 2, flex: 1, background: "#E5E5EA", marginTop: 4 }} />
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1C1C1E" }}>{exp.title}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{exp.details}</div>
                      <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 4 }}>{exp.period}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#8E8E93", fontStyle: "italic", fontSize: 13, marginTop: 12 }}>No experiences recorded.</div>
              )}
            </div>
          )}

          {activeTab === "Reviews" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>Customer Reviews</div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#FFF8E7", padding: "4px 8px", borderRadius: 12 }}>
                  <Icon name="star" size={18} color="#FFD700" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>{worker.rating || "0.0"}</span>
                  <span style={{ fontSize: 12, color: "#8E8E93" }}>({worker.reviewCount || 0})</span>
                </span>
              </div>

              <div style={{ height: 1, background: "#F2F2F7", margin: "12px 0" }} />

              {loadingReviews ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div style={{ width: 20, height: 20, border: "3px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
                  <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : reviewsList && reviewsList.length > 0 ? (
                reviewsList.map((item, index) => (
                  <div key={item.id || index} style={{ padding: "12px 0", borderBottom: "1px solid #F2F2F7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ width: 32, height: 32, borderRadius: 16, background: "#EBF3FF", display: "flex", justifyContent: "center", alignItems: "center", marginRight: 10, fontSize: 14, color: "#1E64D3", fontWeight: 700 }}>
                          {item.clientName ? item.clientName.charAt(0).toUpperCase() : "C"}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1C1C1E" }}>{item.clientName || "Customer"}</div>
                          <div style={{ fontSize: 10, color: "#8E8E93" }}>{item.date || "Recent"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon key={star} name={star <= (item.rating || 5) ? "star" : "star-outline"} size={16} color="#FFD700" />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#3A3A3C", lineHeight: "18px" }}>{item.comment || item.reviewText || "No detailed comment provided."}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Icon name="message-draw" size={40} color="#D1D1D6" />
                  <div style={{ color: "#8E8E93", fontStyle: "italic", fontSize: 13, marginTop: 8 }}>No reviews found yet.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ADD TIME SLOT MODAL */}
      {isSlotModalVisible && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 50 }} onClick={() => setIsSlotModalVisible(false)}>
          <div style={{ background: "#FFF", borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#1C1C1E" }}>Manage Time Slot</div>
            <div style={{ fontSize: 12, color: "#8E8E93", marginBottom: 14 }}>Select Shift Timings</div>

            <label style={{ display: "flex", alignItems: "center", background: "#F2F2F7", padding: 14, borderRadius: 12, marginBottom: 12 }}>
              <Icon name="clock-outline" size={20} color="#1E64D3" />
              <span style={{ fontSize: 16, color: "#1C1C1E", fontWeight: 500, marginLeft: 8, marginRight: 10 }}>Start:</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ fontSize: 16, color: "#1C1C1E", border: "none", outline: "none", background: "transparent", fontFamily: "inherit", flex: 1 }} />
            </label>

            <label style={{ display: "flex", alignItems: "center", background: "#F2F2F7", padding: 14, borderRadius: 12, marginBottom: 12 }}>
              <Icon name="clock-outline" size={20} color="#1E64D3" />
              <span style={{ fontSize: 16, color: "#1C1C1E", fontWeight: 500, marginLeft: 8, marginRight: 22 }}>End:</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ fontSize: 16, color: "#1C1C1E", border: "none", outline: "none", background: "transparent", fontFamily: "inherit", flex: 1 }} />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setIsSlotModalVisible(false)} style={{ padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: "#8E8E93", fontWeight: 600, fontFamily: "inherit" }}>
                Cancel
              </button>
              <button type="button" onClick={handleAddTimeSlot} disabled={submittingSlot} style={{ background: "#1E64D3", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", color: "#FFF", fontWeight: 700, fontFamily: "inherit" }}>
                {submittingSlot ? "Saving…" : "Save Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub components & shared styles ──

const cardStyle = {
  background: "#FFF",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
  border: "1px solid #E5E5EA",
};

const iconCircle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  background: "#F0F4FF",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0,
};

function InfoCol({ label, value, sub }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#8E8E93", fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1E", padding: 5 }}>{value}</div>
      {sub ? <div style={{ fontSize: 10, color: "#8E8E93" }}>{sub}</div> : null}
    </div>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{ width: 50, height: 28, borderRadius: 14, background: value ? "#34C759" : "#D1D1D6", position: "relative", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
    >
      <span style={{ position: "absolute", top: 2, left: value ? 24 : 2, width: 24, height: 24, borderRadius: 12, background: "#FFF", transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function OverviewTabS({ worker, isDutyOn, onDutyToggle, onOpenMap, selectedRadius, onRadius, router }) {
  return (
    <>
      {/* Duty Status Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E" }}>Duty Status </span>
              <span style={{ background: "#E8F5E9", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>
                <span style={{ color: "#2E7D32", fontSize: 11, fontWeight: 700 }}>{isDutyOn ? "Online" : "Offline"}</span>
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>
              {isDutyOn ? "You are currently visible to customers" : "You are currently hidden"}
            </div>
          </div>
          <ToggleSwitch value={isDutyOn} onChange={onDutyToggle} />
        </div>

        <div style={{ height: 1, background: "#F2F2F7", margin: "12px 0" }} />

        {/* Work Location */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <span style={iconCircle}>
              <Icon name="map-marker-outline" size={20} color="#1E64D3" />
            </span>
            <div style={{ marginLeft: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Work Location</div>
              <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 1 }}>
                {worker.latitude && worker.longitude
                  ? `Pinned (${parseFloat(worker.latitude).toFixed(3)}, ${parseFloat(worker.longitude).toFixed(3)})`
                  : "Location not pinned on map"}
              </div>
            </div>
          </div>
          <button type="button" onClick={onOpenMap} style={{ background: "#1E64D3", display: "flex", alignItems: "center", padding: "6px 12px", borderRadius: 16, border: "none", cursor: "pointer" }}>
            <Icon name="map-search-outline" size={14} color="#FFF" />
            <span style={{ color: "#FFF", fontSize: 12, fontWeight: 700, marginLeft: 4 }}>Set Location</span>
          </button>
        </div>

        <div style={{ height: 1, background: "#F2F2F7", margin: "12px 0" }} />

        {/* Work Radius */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>
            Work Radius <span style={{ color: "#8E8E93", fontWeight: 400 }}>(Service Area)</span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E64D3" }}>{selectedRadius}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {RADIUS_OPTIONS.map((rad) => {
            const isActive = selectedRadius === rad;
            return (
              <button key={rad} type="button" onClick={() => onRadius(rad)} style={{ flex: 1, padding: "8px 0", background: isActive ? "#1E64D3" : "#F2F2F7", borderRadius: 8, margin: "0 2px", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ fontSize: 12, color: isActive ? "#FFF" : "#3A3A3C", fontWeight: isActive ? 700 : 500 }}>{rad}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interview Requests */}
      <button type="button" onClick={() => router.push("/worker/active-requests")} style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 16, padding: 14, marginBottom: 12, border: "1px solid #E5E5EA", width: "100%", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
        <span style={{ ...iconCircle, marginRight: 12 }}>
          <Icon name="email-outline" size={20} color="#333" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Interview Requests</div>
          <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 1 }}>Pending: {worker.pendingRequestCount || 0}</div>
        </div>
        <span style={{ background: "#E53935", width: 22, height: 22, borderRadius: 11, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <span style={{ color: "#FFF", fontSize: 11, fontWeight: 700 }}>{worker.pendingRequestCount || 0}</span>
        </span>
      </button>

      {/* Job Notifications */}
      <button type="button" onClick={() => router.push("/worker/job-confirmations")} style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 16, padding: 14, marginBottom: 12, border: "1px solid #E5E5EA", width: "100%", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
        <span style={{ ...iconCircle, marginRight: 12 }}>
          <Icon name="bell-outline" size={20} color="#333" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>Job Notifications</div>
          <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 1 }}>Job Confirmations and Rejections</div>
        </div>
        <span style={{ background: "#E53935", width: 22, height: 22, borderRadius: 11, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <span style={{ color: "#FFF", fontSize: 11, fontWeight: 700 }}>{worker.jobNotificationCount || 0}</span>
        </span>
      </button>

      {/* Employment Actions */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <Icon name="account-alert-outline" size={24} color="#FF4D4D" />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", marginLeft: 8 }}>Employment Actions</span>
        </div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>Manage your job status and termination requests</div>
        <button type="button" onClick={() => router.push("/worker/leave-job")} style={{ background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 21, border: "1px solid #FF4D4D", width: "100%", cursor: "pointer", fontFamily: "inherit" }}>
          <Icon name="close-circle-outline" size={20} color="#FF4D4D" />
          <span style={{ color: "#FF4D4D", fontWeight: 700, marginLeft: 8 }}>Resign from Job</span>
        </button>
      </div>

      <button type="button" onClick={() => router.push("/worker/termination-status")} style={{ background: "#FF3B30", height: 45, borderRadius: 22, width: "100%", color: "#FFF", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", marginBottom: 14, fontFamily: "inherit" }}>
        Check Termination Status {worker.terminationCount > 0 ? `(${worker.terminationCount})` : ""}
      </button>
    </>
  );
}
