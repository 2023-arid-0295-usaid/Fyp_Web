"use client";

// Port of assets/components/Company/WorkerDirectoryScreen.js — the company
// workforce directory: search + category filter + GetAllWorkers cards.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { SERVER_BASE, API_DIRECTORY } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export default function WorkerDirectoryScreen() {
  const router = useRouter();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const categoriesList = ["All Workers", "Cleaning", "Driver", "Cooking", "Security"];
  const [selectedCategory, setSelectedCategory] = useState("All Workers");
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState("Company");
  const [companyPicture, setCompanyPicture] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    try {
      const savedName = await storage.getItem("userName");
      let companyId = (await storage.getItem("companyId")) || (await storage.getItem("userId"));

      if (!companyId) {
        const userStr = await storage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          companyId = userObj?.companyID || userObj?.companyId || userObj?.userId || userObj?.id;
        }
      }

      if (savedName) setCompanyName(savedName);

      if (companyId) {
        const response = await fetch(`${API_DIRECTORY}/GetCompanyProfile?companyId=${companyId}`);
        const data = await response.json();
        if (response.ok && data.companyPicture) {
          setCompanyPicture(data.companyPicture);
          await storage.setItem("userPicture", data.companyPicture);
        }
      } else {
        const savedPic = await storage.getItem("userPicture");
        if (savedPic) setCompanyPicture(savedPic);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_DIRECTORY}/GetAllWorkers`);
      const data = await response.json();

      if (response.ok) {
        setWorkers(data);
        setFilteredWorkers(data);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: "Failed to fetch directory." });
      }
    } catch (error) {
      console.error(error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Cannot reach the server." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAndFilter = (text, category) => {
    let result = workers;

    if (category && category !== "All Workers") {
      result = result.filter(
        (w) =>
          (w.categories && w.categories.some((c) => c.toLowerCase().includes(category.toLowerCase()))) ||
          (w.roleTitle && w.roleTitle.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (text && text.trim()) {
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(text.toLowerCase()) ||
          w.roleTitle.toLowerCase().includes(text.toLowerCase())
      );
    }

    setFilteredWorkers(result);
  };

  const extractCity = (address) => {
    if (!address || address === "N/A") return "Rawalpindi";
    const parts = address.split(",");
    return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
  };

  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/company_default.jpg`;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const formattedPath = path.startsWith("/") ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Screen Header */}
        <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#001F3F" }}>Welcome, {companyName}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginTop: 2 }}>WORKFORCE DIRECTORY</div>
            <div style={{ fontSize: 13, color: "#666" }}>Manage and verify your workforce directory.</div>
          </div>

          {/* Profile Picture (Top Right) */}
          <button
            type="button"
            onClick={() => router.push("/client/dashboard")}
            style={{ position: "relative", marginLeft: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {companyPicture && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUri(companyPicture)} alt="" onError={() => setImageError(true)} style={{ width: 55, height: 55, borderRadius: 28, background: "#EEE", objectFit: "cover" }} />
            ) : (
              <span style={{ display: "flex", width: 55, height: 55, borderRadius: 28, background: "#E8F0FE", alignItems: "center", justifyContent: "center" }}>
                <Icon name="domain" size={28} color="#1E64D3" />
              </span>
            )}
            <span style={{ position: "absolute", bottom: 0, right: 0, background: "#EEE", borderRadius: 10, padding: 2, border: "1px solid #FFF" }}>
              <Icon name="account" size={12} color="#000" />
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ display: "flex", backgroundColor: "#FFF", margin: "12px 20px", borderRadius: 15, padding: "0 15px", alignItems: "center", border: "1px solid #DDD" }}>
          <input
            style={{ flex: 1, height: 45, color: "#333", border: "none", outline: "none", fontFamily: "inherit", fontSize: 15 }}
            placeholder="Search by Name or Role"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearchAndFilter(e.target.value, selectedCategory);
            }}
          />
          <Icon name="magnify" size={22} color="#333" />
        </div>

        {/* Single-Line Scrollable Category Filters */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", whiteSpace: "nowrap", padding: "0 20px", marginBottom: 10 }}>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                handleSearchAndFilter(searchQuery, cat);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                background: selectedCategory === cat ? "#1E64D3" : "#F5F5F5",
                border: `1px solid ${selectedCategory === cat ? "#1E64D3" : "#DDD"}`,
                color: selectedCategory === cat ? "#FFF" : "#333",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Total Counter */}
        <div style={{ marginLeft: 20, fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 10 }}>
          {filteredWorkers.length} Total Professionals
        </div>

        {/* Main List */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <div className="spinner" style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: "#1E64D3", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <Icon name="account-search-outline" size={60} color="#CCC" />
            <div style={{ color: "#999", fontSize: 16, marginTop: 10 }}>No professionals found</div>
          </div>
        ) : (
          <div style={{ padding: "0 20px 30px" }}>
            {filteredWorkers.map((item) => (
              <WorkerCard
                key={item.workerId || item.id}
                item={item}
                city={extractCity(item.location)}
                onVerify={() => router.push(`/company/worker-details-verification?workerId=${item.workerId}`)}
                getImageUri={getImageUri}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkerCard({ item, city, onVerify, getImageUri }) {
  const avatarUri = getImageUri(item.picture);

  return (
    <div style={{ background: "#FFF", borderRadius: 24, padding: 16, marginBottom: 18, boxShadow: "0 3px 8px rgba(0,0,0,0.1)", border: "1px solid #F0F0F0" }}>
      <div style={{ display: "flex" }}>
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUri} alt="" onError={(e) => { e.currentTarget.src = "/images/logo.png"; }} style={{ width: 85, height: 85, borderRadius: 20, background: "#F8F9FA", objectFit: "cover" }} />
          <span style={{ position: "absolute", bottom: -5, right: -5, display: "flex", alignItems: "center", background: "#FFF", padding: "2px 6px", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            <Icon name="star" size={12} color="#FFD700" />
            <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 2, color: "#333" }}>{item.rating || "4.0"}</span>
          </span>
        </div>

        {/* Details */}
        <div style={{ flex: 1, marginLeft: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#1A1C1E", flex: 1, marginRight: 8 }}>{item.name}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#00B14F" }}>{item.salary}</span>
          </div>

          <span style={{ color: "#1E64D3", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.roleTitle}</span>

          {/* Badges */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {item.categories && item.categories.length > 0 ? (
              item.categories.slice(0, 2).map((cat, index) => (
                <span key={index} style={{ padding: "3px 10px", borderRadius: 8, background: "#EAEAEA", fontSize: 11, fontWeight: 600, color: "#444" }}>{cat}</span>
              ))
            ) : (
              <span style={{ padding: "3px 10px", borderRadius: 8, background: "#EAEAEA", fontSize: 11, fontWeight: 600, color: "#444" }}>General</span>
            )}
          </div>

          {/* Location */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#888", marginRight: 4 }}>City</span>
            <span style={{ fontSize: 12, color: "#333", fontWeight: 700 }}>{city}</span>
          </div>
        </div>
      </div>

      <button type="button" onClick={onVerify} style={{ background: "#1E64D3", borderRadius: 16, height: 48, width: "100%", marginTop: 14, color: "#FFF", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        Verify Profile
      </button>
    </div>
  );
}
