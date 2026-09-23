"use client";

// Port of assets/components/Client/FindServiceScreen.js — search, category
// tabs, filters, map handoff, and worker cards with rating/availability/police
// chips. Same endpoints & query param names as the RN app.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD, SERVER_BASE } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

const API_BASE = API_DASHBOARD;

export default function FindServiceScreen() {
  const [search, setSearch] = useState("");
  const [categoriesList, setCategoriesList] = useState(["All"]);
  const [categoryLookup, setCategoryLookup] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientName, setClientName] = useState("Client");
  const [clientPicture, setClientPicture] = useState("");

  const [allFilters, setAllFilters] = useState({ gender: "", city: "", categories: [], subSkills: {} });

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    storage.getItem("userName").then((n) => {
      if (n) setClientName(n);
    });
    storage.getItem("userPicture").then((p) => {
      if (p) setClientPicture(p);
    });
    fetchCategories();
    // Consume filters handed back from FilterationScreen (sessionStorage is the
    // clone's equivalent of the RN navigation param round-trip).
    const storedFilters = sessionStorage.getItem("appliedFilters");
    if (storedFilters) {
      try {
        const parsed = JSON.parse(storedFilters);
        const subSkills = parsed.subSkills && typeof parsed.subSkills === "object" && !Array.isArray(parsed.subSkills) ? parsed.subSkills : {};
        setAllFilters({
          gender: parsed.gender || "",
          city: parsed.city || "",
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          subSkills,
        });
      } catch (_) {
        // ignore malformed stored filters
      }
      sessionStorage.removeItem("appliedFilters");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/GetFiltersData`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const categories = Array.isArray(data) ? data : [];
        const names = categories.map((c) => c.categoryName);
        setCategoriesList(["All", ...names]);
        const lookup = {};
        categories.forEach((c) => {
          lookup[c.categoryId?.toString()] = c.categoryName;
          lookup[c.categoryName] = c.categoryName;
        });
        setCategoryLookup(lookup);
      }
    } catch (e) {
      console.error("Failed to fetch top categories:", e);
    }
  };

  const getCategoryName = (selection) => {
    if (!selection) return "";
    const key = selection.toString();
    return categoryLookup[key] || key;
  };

  const fetchWorkers = useCallback(
    async (categoryTab, searchText, currentFilters) => {
      setIsLoading(true);
      try {
        const token = await storage.getItem("userToken");

        let url = `${API_BASE}/GetWorkersForClient?`;

        if (searchText && searchText.trim()) {
          url += `search=${encodeURIComponent(searchText.trim())}&`;
        }

        const selectedCategoryNames = (currentFilters.categories || [])
          .map(getCategoryName)
          .filter((cat) => cat && cat !== "All");

        const combinedCategories = [...new Set(selectedCategoryNames)];
        if (categoryTab && categoryTab !== "All" && !combinedCategories.includes(categoryTab)) {
          combinedCategories.push(categoryTab);
        }

        combinedCategories.forEach((cat) => {
          url += `categories=${encodeURIComponent(cat)}&`;
        });

        if (currentFilters.gender && currentFilters.gender !== "Both") {
          url += `gender=${encodeURIComponent(currentFilters.gender)}&`;
        }

        if (currentFilters.city) {
          url += `city=${encodeURIComponent(currentFilters.city)}&`;
        }

        Object.keys(currentFilters.subSkills || {}).forEach((catName) => {
          (currentFilters.subSkills[catName] || []).forEach((skill) => {
            url += `subSkills=${encodeURIComponent(skill)}&`;
          });
        });

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setWorkers(Array.isArray(data) ? data : []);
        } else if (response.status === 401) {
          toast.show({ type: "error", text1: "Error ❌", text2: "Session Expired. Please login again." });
          router.replace("/login");
        } else {
          console.error("Failed to fetch workers:", await response.text());
        }
      } catch (err) {
        console.error("Network error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorkers(selectedCategory, search, allFilters);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, search, allFilters, fetchWorkers]);

  const handleMapNavigation = async () => {
    try {
      const lat = await storage.getItem("clientLatitude");
      const lng = await storage.getItem("clientLongitude");
      router.push(`/map?lat=${lat || ""}&lng=${lng || ""}&workers=${encodeURIComponent(JSON.stringify(workers))}`);
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      router.push("/map");
    }
  };

  const extractCity = (address) => {
    if (!address || address === "N/A") return "N/A";
    const parts = address.split(",");
    return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "28px 20px 10px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#001F3F" }}>Welcome, {clientName}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>FIND SERVICE</div>
            <div style={{ fontSize: 13, color: "#666" }}>What would you like to do?</div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/client/dashboard")}
            style={{ border: "none", background: "none", cursor: "pointer", borderRadius: 28, padding: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                clientPicture && clientPicture.startsWith("/")
                  ? `${SERVER_BASE}${clientPicture}`
                  : clientPicture
                    ? clientPicture
                    : "/images/default-user.png"
              }
              alt="profile"
              onError={(e) => { e.currentTarget.src = "/images/default-user.png"; }}
              style={{ width: 55, height: 55, borderRadius: 28, background: "#EEE", display: "block", objectFit: "cover" }}
            />
          </button>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", background: "#FFF", margin: "14px 0 12px", borderRadius: 15, border: "1px solid #DDD", padding: "0 15px", height: 45 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15 }}
          />
          <Icon name="magnify" size={24} color="#333" />
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                flex: "0 0 auto",
                padding: "8px 14px",
                borderRadius: 16,
                border: "1px solid #DDD",
                background: selectedCategory === cat ? "#1E64D3" : "#F5F5F5",
                color: selectedCategory === cat ? "#FFF" : "#333",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter + Map */}
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => router.push("/client/filteration?from=find")}
            style={{ ...filterButton, width: 120 }}
          >
            <Icon name="filter" size={18} color="#666" />
            <span style={{ marginLeft: 6, color: "#333", fontWeight: 500 }}>Filter</span>
          </button>
          <button type="button" onClick={handleMapNavigation} style={{ ...filterButton, width: 170 }}>
            <Icon name="map-marker-radius-outline" size={18} color="#1E64D3" />
            <span style={{ marginLeft: 6, color: "#1E64D3", fontWeight: 500 }}>View on Map</span>
          </button>
        </div>

        <div style={{ textAlign: "right", fontSize: 12, color: "#999", margin: "8px 0" }}>{workers.length} Total Results</div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 50 }}>Loading workers…</div>
        ) : workers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
            <Icon name="account-search-outline" size={60} color="#CCC" />
            <div style={{ marginTop: 10 }}>No workers found</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 30 }}>
            {workers.map((item) => (
              <WorkerCard key={item.id} item={item} city={extractCity(item.city)} onView={() => router.push(`/client/worker-detail?workerId=${item.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkerCard({ item, city, onView }) {
  const secondaryCategories = item.categories && item.categories.length > 1 ? item.categories.slice(1) : [];

  const picture = item.picture && item.picture.startsWith("/") ? `${SERVER_BASE}${item.picture}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <div style={{ background: "#FFF", borderRadius: 24, padding: 16, border: "1px solid #F0F0F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 85, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={picture} alt={item.name} style={{ width: 85, height: 85, borderRadius: 20, background: "#F8F9FA", objectFit: "cover" }} />
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", padding: "3px 8px", borderRadius: 12, marginTop: -12, border: "0.5px solid #EEE", boxShadow: "0 2px 5px rgba(0,0,0,0.12)" }}>
            <Icon name="star" size={12} color="#FFD700" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#333", marginLeft: 3 }}>{item.rating || "0.0"}</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1A1C1E", flex: 1, marginRight: 8 }}>{item.name}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#00B14F", whiteSpace: "nowrap" }}>{item.salary || "N/A"}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#666", marginTop: 1 }}>{item.gender || "N/A"}</div>
          <div style={{ color: "#1A1C1E", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{item.role}</div>

          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <Icon name="map-marker-outline" size={14} color="#666" />
            <span style={{ fontSize: 12, color: "#5F6368", marginLeft: 4 }}>{city}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span style={{ ...badge, background: item.availableStatus ? "#E8F0FE" : "#FFEBEE", color: item.availableStatus ? "#1E64D3" : "#D32F2F" }}>
              {item.availableStatus ? "Available" : "Not Available"}
            </span>

            {item.isBlocked ? (
              <span style={{ ...badge, background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", display: "inline-flex", alignItems: "center" }}>
                <Icon name="alert-octagon" size={12} color="#991B1B" style={{ marginRight: 4 }} /> FIR Record
              </span>
            ) : item.isFlagged ? (
              <span style={{ ...badge, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", display: "inline-flex", alignItems: "center" }}>
                <Icon name="alert" size={12} color="#92400E" style={{ marginRight: 4 }} /> Warned
              </span>
            ) : null}

            {secondaryCategories.map((cat, index) => (
              <span key={index} style={{ ...badge, background: "#F1F3F4", color: "#5F6368" }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        style={{ background: "#1E64D3", borderRadius: 16, height: 48, width: "100%", border: "none", color: "#FFF", fontWeight: 700, fontSize: 15, marginTop: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      >
        View Profile &amp; Interview <Icon name="chevron-right" size={20} color="#FFF" />
      </button>
    </div>
  );
}

const filterButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F5F5F5",
  padding: "10px 0",
  borderRadius: 12,
  border: "1px solid #DDD",
  cursor: "pointer",
  fontSize: 14,
};

const badge = { padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 };
