"use client";

// Port of assets/components/Client/UserDashboardScreen.js (active version).
// Same dashboard fetch, same status logic, same quick-access grid + tabs.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function UserDashboardScreen() {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  const [userName, setUserName] = useState("Client User");
  const [userPicture, setUserPicture] = useState("");
  const [userAddress, setUserAddress] = useState("Your Address");
  const [userPhone, setUserPhone] = useState("03XXXXXXX");
  const [userId, setUserId] = useState(null);
  const [hiredCount, setHiredCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);

  const router = useRouter();
  const toast = useToast();

  const sortWorkersByInterviewIdDesc = (list = []) =>
    [...list].sort((a, b) => Number(b.interviewId || b.id || 0) - Number(a.interviewId || a.id || 0));

  useEffect(() => {
    loadUserInfo();
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserInfo = async () => {
    try {
      const name = await storage.getItem("userName");
      const pic = await storage.getItem("userPicture");
      const addr = await storage.getItem("userAddress");
      const phone = await storage.getItem("userPhone");
      const id = await storage.getItem("clientId");
      if (name) setUserName(name);
      if (pic) setUserPicture(pic);
      if (addr) setUserAddress(addr);
      if (phone) setUserPhone(phone);
      if (id) setUserId(id);
    } catch (e) {
      console.error("Error loading user info:", e);
    }
  };

  const handleEditProfile = () => {
    sessionStorage.setItem(
      "editDraft",
      JSON.stringify({ id: userId, name: userName, email: "", phone: userPhone, location: userAddress, picture: userPicture, role: "Client" })
    );
    router.push("/signup?isEdit=1");
  };

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetClientDashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const hiredWorkers = Array.isArray(data.hiredWorkers) ? data.hiredWorkers : [];
        const list = sortWorkersByInterviewIdDesc(hiredWorkers);
        const activeWorkers = list.filter((w) => {
          const s = (w.status || "").toString().toLowerCase();
          return !s.includes("terminate") && !s.includes("resign");
        });
        setWorkers(list);
        setHiredCount(activeWorkers.length);
        setPendingInterviewsCount(data.pendingInterviewsCount || 0);
      } else if (response.status === 401) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Session Expired. Please login again." });
        router.replace("/login");
      } else {
        console.error("Failed to fetch dashboard data", await response.text());
      }
    } catch (e) {
      console.error("Network error fetching dashboard data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await storage.clear();
    router.replace("/login");
  };

  const isTerminatedWorker = (item) => {
    const s = (item.status || "").toString().trim().toLowerCase();
    return s.includes("terminate") || s.includes("resign");
  };

  const activeWorkersList = workers.filter((w) => !isTerminatedWorker(w));
  const pastWorkersList = workers.filter((w) => isTerminatedWorker(w));

  const getDisplayedWorkers = () => {
    if (activeTab === "Active") return activeWorkersList;
    if (activeTab === "Past") return pastWorkersList;
    return [];
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 16px 24px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button type="button" onClick={() => router.back()} style={circleBtn}>
            <Icon name="chevron-left" size={24} color="#4A5568" />
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={handleEditProfile} style={pillEdit}>
              <Icon name="pencil-outline" size={14} color="#3182CE" />
              <span style={{ color: "#3182CE", fontSize: 13, fontWeight: 600 }}>Edit</span>
            </button>
            <button type="button" onClick={handleLogout} style={pillLogout}>
              <Icon name="logout" size={14} color="#E53E3E" />
              <span style={{ color: "#E53E3E", fontSize: 13, fontWeight: 600 }}>Logout</span>
            </button>
          </div>
        </div>

        {/* Profile */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#3182CE", letterSpacing: 0.5 }}>GOOD MORNING</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1A202C", marginTop: 2 }}>{userName}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={userPicture && userPicture.startsWith("/") ? `${SERVER_BASE}${userPicture}` : "https://cdn-icons-png.flaticon.com/512/3135/3135768.png"}
            alt="profile"
            style={{ width: 56, height: 56, borderRadius: 28, border: "2px solid #3182CE", objectFit: "cover" }}
          />
        </div>

        {/* Contact card */}
        <div style={{ background: "#FFF", borderRadius: 14, padding: 14, marginBottom: 20, border: "1px solid #EDF2F7" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <Icon name="map-marker" size={16} color="#E91E63" />
            <span style={{ marginLeft: 8, color: "#4A5568", fontSize: 13 }}>{userAddress}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Icon name="phone" size={16} color="#2B6CB0" />
            <span style={{ marginLeft: 8, color: "#4A5568", fontSize: 13 }}>{userPhone}</span>
          </div>
        </div>

        {/* Quick access grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          <QuickCard icon="bag-personal-outline" bg="#EBF8FF" color="#3182CE" label="Services" onClick={() => router.push("/find-service")} />
          <QuickCard icon="calendar-month-outline" bg="#FEFCBF" color="#D69E2E" label="Interviews" dot={pendingInterviewsCount > 0} onClick={() => router.push("/client/active-requests")} />
          <QuickCard icon="briefcase-outline" bg="#E6FFFA" color="#319795" label="Job Reqs" onClick={() => router.push("/client/worker-decisions")} />
          <QuickCard icon="file-document-outline" bg="#FFF5F5" color="#E53E3E" label="Resignations" onClick={() => router.push("/client/resignations")} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#E2E8F0", borderRadius: 22, padding: 4, marginBottom: 20 }}>
          {["Overview", "Active", "Past"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 18, border: "none", background: activeTab === tab ? "#FFF" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab ? 700 : 600, color: activeTab === tab ? "#3182CE" : "#718096" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>Loading…</div>
        ) : activeTab === "Overview" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <OverviewCard icon="account-group" bg="#EBF8FF" color="#3182CE" label="Workers" num={hiredCount} tag="Live" tagColor="#3182CE" />
            <OverviewCard icon="clock-outline" bg="#FFFAF0" color="#DD6B20" label="Interview" num={pendingInterviewsCount} tag="Pending" tagColor="#DD6B20" />
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#718096", marginBottom: 12 }}>
              Showing {getDisplayedWorkers().length} {activeTab === "Past" ? "historical worker records" : "active worker records"}
            </div>
            {getDisplayedWorkers().length === 0 ? (
              <div style={{ textAlign: "center", color: "#A0AEC0", fontStyle: "italic", padding: 24, fontSize: 13 }}>
                No worker records found in {activeTab.toLowerCase()}.
              </div>
            ) : (
              getDisplayedWorkers().map((item) => (
                <WorkerRow key={item.interviewId || item.id} item={item} isPast={isTerminatedWorker(item)} onOpen={() => router.push(`/client/worker-detail?workerId=${item.id}`)} onTerminate={() => router.push(`/client/terminate?workerId=${item.id}&interviewId=${item.interviewId}`)} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WorkerRow({ item, isPast, onOpen, onTerminate }) {
  const displayStatus = isPast
    ? (item.status || "").toLowerCase().includes("resign")
      ? "Resigned"
      : "Terminated"
    : "On Work";

  return (
    <div style={{ background: "#FFF", borderRadius: 14, padding: 14, marginBottom: 12, border: "1px solid #EDF2F7", cursor: "pointer" }} onClick={onOpen}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.picture && item.picture.startsWith("/") ? `${SERVER_BASE}${item.picture}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
          alt=""
          style={{ width: 44, height: 44, borderRadius: 22, background: "#EDF2F7", objectFit: "cover" }}
        />
        <div style={{ marginLeft: 12, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1A202C" }}>{item.name}</span>
            <span style={{ padding: "3px 10px", borderRadius: 12, background: isPast ? "#FEFCBF" : "#C6F6D5", color: isPast ? "#975A16" : "#22543D", fontSize: 11, fontWeight: 700 }}>
              {displayStatus}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
            <Icon name="map-marker" size={14} color="#E91E63" />
            <span style={{ fontSize: 12, color: "#718096", marginLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.location || "Tahli mohri chowk, cantt Rawalpindi"}
            </span>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: "#EDF2F7", margin: "10px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#A0AEC0" }}>Record ID: #{item.interviewId || item.id || "WK-7811"}</span>
        {!isPast && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTerminate();
            }}
            style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 8, padding: "4px 10px", color: "#E53E3E", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            Terminate
          </button>
        )}
      </div>
    </div>
  );
}

function QuickCard({ icon, bg, color, label, dot, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ position: "relative", background: "#FFF", border: "1px solid #EDF2F7", borderRadius: 14, padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon name={icon} size={20} color={color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#2D3748" }}>{label}</span>
      {dot && <span style={{ position: "absolute", top: 10, right: 12, width: 8, height: 8, borderRadius: 4, background: "#DD6B20" }} />}
    </button>
  );
}

function OverviewCard({ icon, bg, color, label, num, tag, tagColor }) {
  return (
    <div style={{ position: "relative", background: "#FFF", border: "1px solid #EDF2F7", borderRadius: 16, padding: 14, display: "flex", alignItems: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
        <Icon name={icon} size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#718096", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A202C", marginTop: 2 }}>{num}</div>
      </div>
      <span style={{ position: "absolute", top: 12, right: 10, background: bg, color: tagColor, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8 }}>{tag}</span>
    </div>
  );
}

const circleBtn = {
  width: 38,
  height: 38,
  borderRadius: 19,
  background: "#EDF2F7",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const pillEdit = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "#EBF8FF",
  border: "none",
  padding: "7px 14px",
  borderRadius: 18,
  cursor: "pointer",
};

const pillLogout = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "#FFF5F5",
  border: "none",
  padding: "7px 14px",
  borderRadius: 18,
  cursor: "pointer",
};
