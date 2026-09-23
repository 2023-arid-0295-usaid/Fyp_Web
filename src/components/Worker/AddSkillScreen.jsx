"use client";

// Port of assets/components/Worker/AddSkillScreen.js — same categories/skills
// logic, same experience objects, same return contract to SignupScreen.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { API_ACCOUNT } from "@/lib/config";

const API_BASE_URL = API_ACCOUNT;

const getIconName = (name) => {
  const norm = (name || "").toLowerCase().trim();
  if (norm.includes("clean")) return "broom";
  if (norm.includes("driv")) return "car";
  if (norm.includes("cook")) return "chef-hat";
  return "briefcase-outline";
};

const monthDiff = (startDate) => {
  const start = new Date(startDate);
  const end = new Date();
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0 && months > 0) return `${years} Years, ${months} Months`;
  if (years > 0) return `${years} ${years === 1 ? "Year" : "Years"}`;
  return `${months} ${months === 1 ? "Month" : "Months"}`;
};

function ExpertiseSection({ title, icon, isActive, categoryId, onExperiencesAdded }) {
  const [dateText, setDateText] = useState("Select Date");
  const [workAt, setWorkAt] = useState("");
  const [description, setDescription] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubSkillIds, setSelectedSubSkillIds] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isActive && categoryId) {
      setIsFetching(true);
      fetch(`${API_BASE_URL}/GetSkillsByCategory?categoryId=${categoryId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const list = Array.isArray(data)
            ? data.map((item, index) => ({
                id: item.id ?? item.SkillsId ?? item.skillsId ?? `skill-${index}`,
                name: item.name ?? item.SkillName ?? item.skillName ?? "Missing Name",
              }))
            : [];
          setSubCategories(list);
          setIsFetching(false);
        })
        .catch((err) => {
          console.error("Error fetching skills:", err);
          setIsFetching(false);
        });
    }
  }, [isActive, categoryId]);

  const toggleSkillSelection = (id) => {
    if (selectedSubSkillIds.includes(id)) {
      setSelectedSubSkillIds(selectedSubSkillIds.filter((item) => item !== id));
    } else {
      setSelectedSubSkillIds([...selectedSubSkillIds, id]);
    }
  };

  const handleLocalAdd = () => {
    if (!workAt || !description || dateText === "Select Date" || selectedSubSkillIds.length === 0) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please select at least one sub-category and fill all fields." });
      return;
    }

    const newExperiencesBatch = selectedSubSkillIds.map((skillId) => ({
      WorkAt: workAt,
      ExpDetail: description,
      Duration: monthDiff(new Date(dateText)),
      CategoryId: parseInt(categoryId, 10),
      SkillsId: parseInt(skillId, 10),
    }));

    onExperiencesAdded(newExperiencesBatch);
    setWorkAt("");
    setDescription("");
    setDateText("Select Date");
    setSelectedSubSkillIds([]);
    toast.show({ type: "success", text1: "Success ✅", text2: "1 Experience(s) added to your submission list." });
  };

  return (
    <div style={{ border: "1px solid #E6EDF9", borderRadius: 18, background: "#fff", padding: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "#E8F1FF", borderRadius: 14, padding: 10 }}>
          <Icon name={icon} size={24} color="#1E64D3" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0E1B4D" }}>{title} Expertise</div>
      </div>

      <div style={subLabel}>SUB CATEGORIES (Tap to select)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {isFetching ? (
          <span style={{ color: "#9BA9C0", fontSize: 13 }}>Loading…</span>
        ) : (
          subCategories.map((skill) => {
            const selected = selectedSubSkillIds.includes(skill.id);
            return (
              <button
                key={skill.id.toString()}
                type="button"
                onClick={() => toggleSkillSelection(skill.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 16,
                  border: "1px solid #E6EDF9",
                  background: selected ? "#1E64D3" : "#fff",
                  color: selected ? "#fff" : "#334155",
                  fontWeight: selected ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {skill.name}
              </button>
            );
          })
        )}
      </div>

      <div style={subLabel}>WORKING SINCE</div>
      <input
        type="date"
        value={dateText === "Select Date" ? "" : dateText}
        max={new Date().toISOString().split("T")[0]}
        onChange={(e) => setDateText(e.target.value)}
        style={{ ...fieldStyle, marginBottom: 10 }}
      />

      <div style={{ display: "flex", alignItems: "center", ...fieldStyle }}>
        <Icon name="office-building-marker-outline" size={20} color="#333" style={{ marginRight: 10 }} />
        <input placeholder="Where did you work?" value={workAt} onChange={(e) => setWorkAt(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: 14 }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", ...fieldStyle }}>
        <Icon name="text-box-outline" size={20} color="#333" style={{ marginRight: 10 }} />
        <input placeholder="Describe your role" value={description} onChange={(e) => setDescription(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: 14 }} />
      </div>

      <button type="button" onClick={handleLocalAdd} style={{ background: "#1E64D3", color: "#fff", border: "none", borderRadius: 14, padding: "10px 0", width: "100%", fontWeight: 700, cursor: "pointer" }}>
        + Add Experience
      </button>
    </div>
  );
}

const subLabel = { fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: "#7C8CA6", margin: "10px 0 8px" };
const fieldStyle = { width: "100%", maxWidth: "100%", height: 48, borderRadius: 14, border: "1px solid #E6EDF9", background: "#fff", padding: "0 12px", fontSize: 14, boxSizing: "border-box" };

export default function AddSkillsScreen() {
  const [dbCategories, setDbCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [experienceList, setExperienceList] = useState([]);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetch(`${API_BASE_URL}/GetCategories`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load schema categories.");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((c) => ({
            id: c.categoryId ?? c.id ?? c.category_ID,
            name: c.categoryName ?? c.name ?? c.category_Name,
          }));
          setDbCategories(formatted);
        }
        setCategoriesLoading(false);
      })
      .catch((err) => {
        console.error("Categories fetch error:", err);
        setCategoriesLoading(false);
      });
  }, []);

  useEffect(() => {
    const draft = sessionStorage.getItem("skillsDraft");
    if (draft && experienceList.length === 0 && dbCategories.length > 0) {
      let parsed = null;
      try {
        parsed = JSON.parse(draft);
      } catch (_) {}
      if (parsed && parsed.skillsData && parsed.skillsData.length > 0) {
        setExperienceList(parsed.skillsData);
        const catId = parsed.skillsData[0].CategoryId ?? parsed.skillsData[0].categoryId;
        const matchedCat = dbCategories.find((c) => String(c.id) === String(catId));
        if (matchedCat) setPrimary(matchedCat);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbCategories]);

  const handleFinalSave = () => {
    if (experienceList.length === 0) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please add at least one experience before saving." });
      return;
    }

    const sanitizedExperiences = experienceList.map((exp) => ({
      ...exp,
      CategoryId: exp.CategoryId ? parseInt(exp.CategoryId, 10) : null,
      SkillsId: exp.SkillsId ? parseInt(exp.SkillsId, 10) : null,
    }));

    const draft = {};
    try {
      const d = JSON.parse(sessionStorage.getItem("skillsDraft") || "null");
      if (d) Object.assign(draft, d);
    } catch (_) {}

    sessionStorage.setItem(
      "skillsResult",
      JSON.stringify({
        ...draft,
        draft,
        categoryId: primary?.id ? parseInt(primary.id, 10) : null,
        experiencesJson: JSON.stringify(sanitizedExperiences),
      })
    );
    sessionStorage.removeItem("skillsDraft");
    router.push("/signup");
  };

  const handleAddBatchExperiences = (newBatch) => {
    setExperienceList((prev) => [...prev, ...newBatch]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F6F9FF", display: "flex", justifyContent: "center", padding: "14px 10px 40px" }}>
      <div style={{ width: 560, maxWidth: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "8px 0 16px" }}>
          <button type="button" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, background: "#EDF3FF", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" size={24} color="#333" />
          </button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 800, color: "#0E1B4D" }}>Add Skills</div>
          <div style={{ width: 40 }} />
        </div>

        {categoriesLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#7C8CA6" }}>Loading categories…</div>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0E1B4D", marginBottom: 10 }}>Select Your Primary Skills</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
              {dbCategories.map((cat) => (
                <SkillBox key={`primary-${cat.id}`} icon={getIconName(cat.name)} label={cat.name} selected={String(primary?.id) === String(cat.id)} onPress={() => setPrimary(cat)} />
              ))}
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, color: "#0E1B4D", marginBottom: 10 }}>
              Select Your Secondary Skills <span style={{ fontWeight: 400, color: "#9BA9C0", fontSize: 13 }}>(Optional)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
              {dbCategories.map((cat) => (
                <SkillBox
                  key={`secondary-${cat.id}`}
                  icon={getIconName(cat.name)}
                  label={cat.name}
                  selected={String(secondary?.id) === String(cat.id)}
                  disabled={String(primary?.id) === String(cat.id)}
                  onPress={() => setSecondary(cat)}
                />
              ))}
            </div>
          </>
        )}

        {primary && (
          <ExpertiseSection title={primary.name} icon={getIconName(primary.name)} isActive categoryId={primary.id} onExperiencesAdded={handleAddBatchExperiences} />
        )}
        {secondary && (
          <ExpertiseSection title={secondary.name} icon={getIconName(secondary.name)} isActive categoryId={secondary.id} onExperiencesAdded={handleAddBatchExperiences} />
        )}

        <button
          type="button"
          onClick={handleFinalSave}
          style={{ background: "#1E64D3", color: "#fff", border: "none", borderRadius: 16, padding: "14px 0", width: "100%", fontWeight: 800, fontSize: 15.5, cursor: "pointer", boxShadow: "0 5px 14px rgba(30,100,211,0.3)" }}
        >
          Save and Continue
        </button>
      </div>
    </div>
  );
}

function SkillBox({ icon, label, selected, disabled, onPress }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "14px 8px",
        borderRadius: 16,
        border: `1px solid ${selected ? "#1E64D3" : "#E6EDF9"}`,
        background: selected ? "#EAF2FF" : "#fff",
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 26, background: selected ? "#1E64D3" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={30} color={selected ? "#fff" : "#333"} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: selected ? "#1E64D3" : "#334155", textAlign: "center" }}>{label}</span>
    </button>
  );
}
