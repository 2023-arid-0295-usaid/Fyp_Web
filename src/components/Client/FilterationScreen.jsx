"use client";

// Port of assets/components/Client/FilterationScreen.js — gender, skill
// categories, city picker, sub-skills; returns appliedFilters back to find-service.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";

const API_BASE = API_DASHBOARD;

const RECOMMENDED_CITIES = ["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Faisalabad", "Peshawar", "Multan", "Quetta", "Gujranwala", "Sialkot"];

export default function FilterationScreen() {
  const [allCategories, setAllCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [subFilters, setSubFilters] = useState({});

  const router = useRouter();

  useEffect(() => {
    fetchFilterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFilterData = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getItem("userToken");
      const response = await fetch(`${API_BASE}/GetFiltersData`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const categories = Array.isArray(data) ? data : [];
        setAllCategories(categories);
        if (Object.keys(subFilters).length === 0) {
          const initial = {};
          categories.forEach((cat) => {
            initial[cat.categoryName] = [];
          });
          setSubFilters(initial);
        }
      }
    } catch (error) {
      console.error("Network error fetching filter data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (selection) => {
    const match = allCategories.find((cat) => cat.categoryId?.toString() === selection.toString() || cat.categoryName === selection);
    return match ? match.categoryName : selection;
  };

  const isCategorySelected = (cat) => {
    const idString = cat.categoryId?.toString();
    return selectedSkills.some((item) => {
      const itemName = getCategoryLabel(item);
      return item === idString || item === cat.categoryName || itemName === cat.categoryName;
    });
  };

  const toggleSkillSelection = (categoryId) => {
    const id = categoryId?.toString();
    const categoryName = getCategoryLabel(id);
    const isSelected = selectedSkills.some((item) => {
      const itemName = getCategoryLabel(item);
      return item === id || item === categoryName || itemName === categoryName;
    });

    if (isSelected) {
      setSelectedSkills(selectedSkills.filter((item) => {
        const itemName = getCategoryLabel(item);
        return item !== id && item !== categoryName && itemName !== categoryName;
      }));
    } else {
      setSelectedSkills([...selectedSkills, id]);
    }
  };

  const toggleSubFilter = (category, value) => {
    let current = subFilters[category] ? [...subFilters[category]] : [];
    if (current.includes(value)) current = current.filter((item) => item !== value);
    else current.push(value);
    setSubFilters({ ...subFilters, [category]: current });
  };

  const handleApply = () => {
    sessionStorage.setItem("appliedFilters", JSON.stringify({ gender: selectedGender, city: selectedCity, categories: selectedSkills, subSkills: subFilters }));
    router.push("/find-service");
  };

  const handleReset = () => {
    const resetSubFilters = {};
    allCategories.forEach((cat) => {
      resetSubFilters[cat.categoryName] = [];
    });
    setSelectedGender("");
    setSelectedSkills([]);
    setSelectedCity("");
    setSubFilters(resetSubFilters);
    sessionStorage.setItem("appliedFilters", JSON.stringify({ gender: "", city: "", categories: [], subSkills: resetSubFilters }));
    router.push("/find-service");
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: 60 }}>Loading filters…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 15px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button type="button" onClick={() => router.back()} style={{ width: 35, height: 35, borderRadius: 18, background: "#F0F0F0", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrow-left" size={20} color="#666" />
          </button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 24, fontWeight: 700 }}>FILTERATION</div>
          <div style={{ width: 35 }} />
        </div>

        {/* Active tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {selectedGender ? <FilterTag label={selectedGender} onRemove={() => setSelectedGender("")} /> : null}
          {selectedCity ? <FilterTag label={selectedCity} onRemove={() => setSelectedCity("")} /> : null}
          {selectedSkills.map((s) => (
            <FilterTag key={`tag-${s}`} label={getCategoryLabel(s)} onRemove={() => toggleSkillSelection(s)} />
          ))}
        </div>

        {/* Gender */}
        <SectionCard title="GENDER" icon="account-outline">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {["Male", "Female", "Both"].map((g) => (
              <button key={g} type="button" onClick={() => setSelectedGender(g)} style={{ ...choiceBtn, background: selectedGender === g ? "#1E64D3" : "#FFF", borderColor: selectedGender === g ? "#1E64D3" : "#DDD", color: selectedGender === g ? "#FFF" : "#333" }}>
                {g}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard title="SKILLS" icon="account-group-outline">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allCategories.map((cat) => (
              <button key={cat.categoryId} type="button" onClick={() => toggleSkillSelection(cat.categoryId)} style={{ ...choiceBtn, width: "auto", padding: "8px 16px", background: isCategorySelected(cat) ? "#1E64D3" : "#FFF", borderColor: isCategorySelected(cat) ? "#1E64D3" : "#DDD", color: isCategorySelected(cat) ? "#FFF" : "#333" }}>
                {cat.categoryName}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* City */}
        <SectionCard title="CITY" icon="map-marker-outline">
          <button type="button" onClick={() => setCityModalVisible(true)} style={{ ...choiceBtn, width: "100%", textAlign: "left", padding: "12px 15px" }}>
            {selectedCity || "Select Recommended City"}
            <Icon name="chevron-down" size={20} color="#666" style={{ float: "right" }} />
          </button>
        </SectionCard>

        {/* Sub-skills */}
        {selectedSkills.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 15 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 15 }}>
              <Icon name="reorder-horizontal" size={20} color="#000" />
              <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 10 }}>Sub-Category</span>
            </div>
            {allCategories.filter(isCategorySelected).map((cat) => (
              <div key={`sub-${cat.categoryId}`} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, textDecoration: "underline", marginBottom: 10 }}>{cat.categoryName}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(Array.isArray(cat.skills) ? cat.skills : []).map((opt) => (
                    <button key={opt} type="button" onClick={() => toggleSubFilter(cat.categoryName, opt)} style={{ ...choiceBtn, width: "auto", padding: "8px 15px", borderRadius: 15, background: (subFilters[cat.categoryName] || []).includes(opt) ? "#1E64D3" : "#FFF", borderColor: (subFilters[cat.categoryName] || []).includes(opt) ? "#1E64D3" : "#DDD", color: (subFilters[cat.categoryName] || []).includes(opt) ? "#FFF" : "#333" }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", gap: 12, padding: 20, background: "#FFF", borderTop: "1px solid #EEE", maxWidth: 640, margin: "0 auto" }}>
        <button type="button" onClick={handleReset} style={{ flex: 0.45, height: 50, borderRadius: 25, background: "#555", border: "none", color: "#FFF", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
          Reset
        </button>
        <button type="button" onClick={handleApply} style={{ flex: 0.45, height: 50, borderRadius: 25, background: "#1E64D3", border: "none", color: "#FFF", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
          Apply
        </button>
      </div>

      {/* City modal */}
      {cityModalVisible && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setCityModalVisible(false)}>
          <div style={{ background: "#FFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, width: "100%", maxWidth: 640, maxHeight: "70%", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid #EEE" }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>Select Recommended City</span>
              <button type="button" onClick={() => setCityModalVisible(false)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <Icon name="close" size={24} color="#333" />
              </button>
            </div>
            {RECOMMENDED_CITIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSelectedCity(item);
                  setCityModalVisible(false);
                }}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", border: "none", borderBottom: "1px solid #F5F5F5", background: "none", cursor: "pointer", fontSize: 16, color: selectedCity === item ? "#1E64D3" : "#666", fontWeight: selectedCity === item ? 700 : 400 }}
              >
                {item}
                {selectedCity === item && <Icon name="check" size={20} color="#1E64D3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 15 }}>
        <Icon name={icon} size={22} color="#000" />
        <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 10, letterSpacing: 1 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: "#D9D9D9", padding: "6px 12px", borderRadius: 10, gap: 5, fontSize: 13, fontWeight: 500 }}>
      {label}
      <button type="button" onClick={onRemove} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
        <Icon name="close" size={16} color="#000" />
      </button>
    </span>
  );
}

const cardStyle = { background: "#FFF", borderRadius: 15, padding: 15, marginBottom: 15, border: "1px solid #EEE", boxShadow: "0 2px 5px rgba(0,0,0,0.04)" };

const choiceBtn = { height: 40, borderRadius: 10, border: "1px solid #DDD", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, fontWeight: 700 };
