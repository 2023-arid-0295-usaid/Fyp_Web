"use client";

// Port of assets/components/Auth/SignupScreen.js (myFypProject), active version.
//
// Handoffs that used React Navigation route params in the RN app are bridged
// through sessionStorage here (same data, same keys):
//   - "skillsDraft"           : form snapshot while visiting /worker/add-skills
//   - "skillsResult"          : { experiencesJson, categoryId } returned by the skills screen
//   - "signupDraft"           : form snapshot while visiting the map pinning screen
//   - "signupLocation"        : { latitude, longitude, pickedAt } returned by the map
//
// Edit mode: dashboards stash the profile as "editDraft" and navigate to
// /signup?isEdit=1 — mirroring navigation.navigate('Signup', { isEdit:true, initialData }).

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { pickImageFile, Platform } from "@/components/Platform/platform";
import { useToast } from "@/components/Toast/Toast";
import { SERVER_BASE, API_ACCOUNT } from "@/lib/config";

const BG = "#F6F9FF";
const SURFACE = "#FFFFFF";
const BLUE = "#1E64D3";
const INK = "#0E1B4D";
const MUTED = "#9BA9C0";
const SUBTLE = "#7C8CA6";
const LINE = "#E6EDF9";
const SOFT_BLUE = "#EAF2FF";
const SOFT_BLUE_BORDER = "#D8E6FF";

const LOGO_MARK = "/images/logo.png";

const ROLES = [
  { key: "Client", label: "Client", icon: "account-outline" },
  { key: "Worker", label: "Worker", icon: "broom" },
  { key: "Company", label: "Company", icon: "domain" },
];

const dataUrlToFile = async (dataUrl, fileName, type) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: type || blob.type || "image/jpeg" });
};

// Reusable card-styled input
function Field({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secure, onToggleSecure, multiline, style, iconColor }) {
  return (
    <View style={{ ...fieldStyle.container, ...(style || {}) }}>
      <Icon name={icon} size={18} color={iconColor || MUTED} style={{ marginRight: 10 }} />
      {multiline ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          style={{ ...fieldStyle.input, height: 64, paddingTop: 12, resize: "none" }}
          placeholderStyle={{ color: MUTED }}
        />
      ) : (
        <input
          type={secure ? "password" : keyboardType === "email" ? "email" : keyboardType === "numeric" || keyboardType === "phone-pad" ? "text" : "text"}
          inputMode={keyboardType === "numeric" || keyboardType === "phone-pad" ? "numeric" : undefined}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          autoCapitalize={autoCapitalize || "sentences"}
          style={fieldStyle.input}
          placeholderStyle={{ color: MUTED }}
        />
      )}
      {onToggleSecure && (
        <button type="button" onClick={onToggleSecure} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Icon name={secure ? "eye-off-outline" : "eye-outline"} size={19} color={MUTED} />
        </button>
      )}
    </View>
  );
}

const View = ({ children, style }) => <div style={style}>{children}</div>;

const fieldStyle = {
  container: {
    display: "flex",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    background: SURFACE,
    border: `1px solid ${LINE}`,
    padding: "0 14px",
    marginBottom: 10,
    boxShadow: "0 1px 3px rgba(30,58,138,0.06)",
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: INK,
    border: "none",
    outline: "none",
    background: "transparent",
    height: "100%",
    minWidth: 0,
  },
};

export default function SignupScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // ─── state (unchanged behaviour) ───
  const [role, setRole] = useState("Client");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [salary, setSalary] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasAddedSkills, setHasAddedSkills] = useState(false);
  const [skillsData, setSkillsData] = useState([]);
  const [gender, setGender] = useState("Male");
  const [bio, setBio] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // ─── LOCATION ───
  const [pendingLocation, setPendingLocation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(() => searchParams.get("isEdit") === "1");
  const handledLocationRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    setIsEditMode(searchParams.get("isEdit") === "1");
  }, [searchParams]);

  // Restores edit-mode data + the Add-Skills + Map round trips
  useEffect(() => {
    const editDraft = sessionStorage.getItem("editDraft");
    if (isEditMode && editDraft && !hasAddedSkills) {
      let data = null;
      try {
        data = JSON.parse(editDraft);
      } catch (_) {}
      if (data) {
        const targetRole = data.role || "Worker";
        setRole(targetRole);
        setName(data.name || "");
        setPhone(data.phone || data.phoneNo || "");
        setAddress(data.location || data.companyAddress || data.address || "");
        setEmail(data.email || "");
        setBio(data.bio || "");
        const dbGender = data.gender ? data.gender.toLowerCase() : "male";
        setGender(dbGender === "female" ? "Female" : "Male");

        if (targetRole === "Worker") {
          setAge(data.age?.toString() || "");
          setCnic(data.cnic || "");
          const rawSalary = data.salary ? data.salary.toString() : "0";
          setSalary(rawSalary.replace("Not Set", "0"));
          if (data.rawExperiences) {
            setSkillsData(data.rawExperiences);
            setHasAddedSkills(true);
          }
        } else if (targetRole === "Company") {
          setCompanyName(data.companyName || "");
          setLicenseNumber(data.licenseNumber || "");
        }
        if (data.picture && typeof data.picture === "string") {
          setSelectedImage({
            uri: data.picture.startsWith("/") ? `${SERVER_BASE}${data.picture}` : data.picture,
          });
        }
      }
    }

    const skillsResult = sessionStorage.getItem("skillsResult");
    if (skillsResult) {
      setHasAddedSkills(true);
      try {
        const parsed = JSON.parse(skillsResult);
        const draft = parsed.draft || {};
        if (draft.name !== undefined) setName(draft.name);
        if (draft.age !== undefined) setAge(draft.age);
        if (draft.phone !== undefined) setPhone(draft.phone);
        if (draft.cnic !== undefined) setCnic(draft.cnic);
        if (draft.salary !== undefined) setSalary(draft.salary);
        if (draft.email !== undefined) setEmail(draft.email);
        if (draft.address !== undefined) setAddress(draft.address);
        if (draft.password !== undefined) setPassword(draft.password);
        if (draft.confirmPassword !== undefined) setConfirmPassword(draft.confirmPassword);
        if (draft.role !== undefined) setRole(draft.role);
        if (draft.gender !== undefined) setGender(draft.gender);
        if (draft.bio !== undefined) setBio(draft.bio);
        if (draft.companyName !== undefined) setCompanyName(draft.companyName);
        if (draft.licenseNumber !== undefined) setLicenseNumber(draft.licenseNumber);
        setStep(2);
        if (parsed.experiencesJson) {
          try {
            setSkillsData(JSON.parse(parsed.experiencesJson));
          } catch (e) {
            console.error(e);
          }
        }
      } catch (_) {}
      sessionStorage.removeItem("skillsResult");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, searchParams]);

  const buildDraft = () => ({
    role,
    step,
    name,
    age,
    phone,
    cnic,
    salary,
    email,
    address,
    password,
    confirmPassword,
    selectedImage,
    gender,
    bio,
    companyName,
    licenseNumber,
    hasAddedSkills,
    skillsData,
  });

  const openMapForLocation = () => {
    sessionStorage.setItem(
      "signupDraft",
      JSON.stringify({ ...buildDraft(), selectedImage: null })
    );
    router.push(
      `/map?pickLocationForSignup=1&userRole=${encodeURIComponent(role)}` +
        (pendingLocation?.latitude != null ? `&lat=${pendingLocation.latitude}&lng=${pendingLocation.longitude}` : "")
    );
  };

  const goToSkills = () => {
    sessionStorage.setItem("skillsDraft", JSON.stringify(buildDraft()));
    router.push("/worker/add-skills");
  };

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      pickImageFile(input, (response) => {
        if (!response.didCancel && response.assets) {
          setSelectedImage(response.assets[0]);
        }
      });
    };
    input.click();
  };

  // ─── ACTUAL SUBMIT ───
  const performSignup = async (data, location) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const {
      role: dataRole, name: dName, age: dAge, phone: dPhone, cnic: dCnic, salary: dSalary,
      email: dEmail, address: dAddress, password: dPassword, confirmPassword: dConfirmPassword,
      selectedImage: dImage, gender: dGender, bio: dBio, companyName: dCompanyName,
      licenseNumber: dLicenseNumber, skillsData: dSkills,
    } = data;

    if (dataRole === "Company") {
      if (!dCompanyName || !dEmail || !dPhone || !dLicenseNumber || !dAddress) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Please fill out all company details." });
        submittingRef.current = false;
        return;
      }
    } else {
      if (!dName || !dPhone || !dAddress || !dEmail) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Please fill out all fundamental profile details." });
        submittingRef.current = false;
        return;
      }
    }

    if (!isEditMode && !dPassword) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Password field is required." });
      submittingRef.current = false;
      return;
    }

    if (dPassword !== dConfirmPassword) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Passwords do not match." });
      submittingRef.current = false;
      return;
    }

    if (!dImage && (dataRole === "Client" || dataRole === "Worker")) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please upload a profile picture." });
      submittingRef.current = false;
      return;
    }

    if (dataRole === "Worker" && dSkills.length === 0) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please add at least one primary skill to proceed." });
      submittingRef.current = false;
      return;
    }

    const needsLocation = !isEditMode && (dataRole === "Client" || dataRole === "Worker");
    if (needsLocation && !location) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please pin your location on the map to continue." });
      submittingRef.current = false;
      openMapForLocation();
      return;
    }

    const API_BASE_URL = API_ACCOUNT;
    let endpoint = "";
    if (dataRole === "Company") {
      endpoint = isEditMode ? "UpdateCompany" : "SignupCompany";
    } else if (dataRole === "Client") {
      endpoint = isEditMode ? "UpdateClient" : "SignupClient";
    } else {
      endpoint = isEditMode ? "UpdateWorker" : "SignupWorker";
    }

    const url = `${API_BASE_URL}/${endpoint}`;
    const formData = new FormData();

    if (isEditMode) {
      let initialId = null;
      try {
        const draft = JSON.parse(sessionStorage.getItem("editDraft") || "{}");
        initialId = draft.id;
      } catch (_) {}
      if (!initialId) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Session error: Missing profile tracking metadata." });
        submittingRef.current = false;
        return;
      }
      formData.append(
        dataRole === "Company" ? "CompanyID" : dataRole === "Client" ? "ClientId" : "WorkerId",
        initialId
      );
    }

    if (dataRole === "Company") {
      formData.append("CompanyName", dCompanyName);
      formData.append("PhoneNo", dPhone);
      formData.append("CompanyAddress", dAddress);
      formData.append("LicenseNumber", dLicenseNumber);
      formData.append("Email", dEmail);
      formData.append("Password", dPassword || "");

      if (dImage && dImage.uri && !String(dImage.uri).startsWith("http")) {
        const f = await dataUrlToFile(dImage.uri, dImage.fileName || "logo.jpg", dImage.type);
        formData.append("LogoFile", f);
      }
    } else {
      formData.append("Name", dName);
      formData.append("Phone", dPhone);
      formData.append("Address", dAddress);
      formData.append("Password", dPassword || "");
      formData.append("Email", dEmail);

      if (dataRole === "Worker") {
        formData.append("Cnic", dCnic);
        formData.append("Salary", dSalary || "0");
        formData.append("Age", dAge || "0");
        formData.append("Gender", dGender);
        formData.append("Bio", dBio);
        formData.append("experiencesJson", JSON.stringify(dSkills));
      }

      if (dImage && dImage.uri && !String(dImage.uri).startsWith("http")) {
        const f = await dataUrlToFile(dImage.uri, dImage.fileName || "profile.jpg", dImage.type);
        formData.append("PictureFile", f);
      }

      if (needsLocation && location) {
        formData.append("Latitude", Number(location.latitude).toFixed(6));
        formData.append("Longitude", Number(location.longitude).toFixed(6));
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setPendingLocation(null);
        handledLocationRef.current = null;
        sessionStorage.removeItem("signupDraft");
        sessionStorage.removeItem("signupLocation");

        toast.show({
          type: "success",
          text1: "Success ✅",
          text2: result.message || "Operation completed successfully!",
        });
        setTimeout(() => {
          if (isEditMode) {
            sessionStorage.removeItem("editDraft");
            router.replace(role === "Worker" ? "/worker/dashboard" : "/find-service");
          } else {
            router.replace("/login");
          }
        }, 1200);
      } else {
        toast.show({ type: "error", text1: "Error ❌", text2: result.message || "Something went wrong during data validation." });
      }
    } catch (error) {
      console.error("Auth Action Error:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Cannot reach backend server." });
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  // ─── BUTTON HANDLER ───
  const handleSignup = () => {
    const data = buildDraft();

    if (data.role === "Company") {
      if (!companyName || !email || !phone || !licenseNumber || !address) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Please fill out all company details." });
        return;
      }
    } else if (!name || !phone || !address || !email) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please fill out all fundamental profile details." });
      return;
    }

    if (!isEditMode && !password) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Password field is required." });
      return;
    }

    if (password !== confirmPassword) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Passwords do not match." });
      return;
    }

    if (!selectedImage && (role === "Client" || role === "Worker")) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please upload a profile picture." });
      return;
    }

    if (role === "Worker" && skillsData.length === 0) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please add at least one primary skill to proceed." });
      return;
    }

    if (!isEditMode && (role === "Client" || role === "Worker") && !pendingLocation) {
      openMapForLocation();
      return;
    }

    performSignup(data, pendingLocation);
  };

  // ─── RETURN FROM THE MAP ───
  useEffect(() => {
    const raw = sessionStorage.getItem("signupLocation");
    if (!raw) return;
    let picked = null;
    try {
      picked = JSON.parse(raw);
    } catch (_) {}
    if (!picked || typeof picked.latitude !== "number" || typeof picked.longitude !== "number") return;
    if (handledLocationRef.current === picked.pickedAt) return;

    handledLocationRef.current = picked.pickedAt;
    setPendingLocation(picked);
    sessionStorage.removeItem("signupLocation");

    const draftRaw = sessionStorage.getItem("signupDraft");
    let draft = null;
    try {
      draft = JSON.parse(draftRaw);
    } catch (_) {}

    if (draft) {
      if (draft.role !== undefined) setRole(draft.role);
      if (draft.step !== undefined) setStep(draft.step);
      if (draft.name !== undefined) setName(draft.name);
      if (draft.age !== undefined) setAge(draft.age);
      if (draft.phone !== undefined) setPhone(draft.phone);
      if (draft.cnic !== undefined) setCnic(draft.cnic);
      if (draft.salary !== undefined) setSalary(draft.salary);
      if (draft.email !== undefined) setEmail(draft.email);
      if (draft.address !== undefined) setAddress(draft.address);
      if (draft.password !== undefined) setPassword(draft.password);
      if (draft.confirmPassword !== undefined) setConfirmPassword(draft.confirmPassword);
      if (draft.gender !== undefined) setGender(draft.gender);
      if (draft.bio !== undefined) setBio(draft.bio);
      if (draft.companyName !== undefined) setCompanyName(draft.companyName);
      if (draft.licenseNumber !== undefined) setLicenseNumber(draft.licenseNumber);
      if (draft.hasAddedSkills !== undefined) setHasAddedSkills(draft.hasAddedSkills);
      if (draft.skillsData !== undefined) setSkillsData(draft.skillsData);

      if (!isEditMode) {
        performSignup(draft, picked);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── header helpers ───
  const showStepUi = !isEditMode && role === "Worker";
  const headerTitle = isEditMode ? "Edit Profile" : "Create Account";
  const headerSubtitle = isEditMode ? "Update your information" : "Basic Information";

  const goBack = () => {
    if (showStepUi && step === 2) setStep(1);
    else router.back();
  };

  const submitLabel = isEditMode
    ? role === "Company"
      ? "Update"
      : "Update Profile"
    : role === "Worker" && step === 1
      ? "Next"
      : "Sign Up";

  const submitHandler = () => {
    if (role === "Worker" && step === 1 && !isEditMode) {
      setStep(2);
      return;
    }
    handleSignup();
  };

  const renderLocationCard = () => {
    if (isEditMode || (role !== "Client" && role !== "Worker")) return null;
    const pinned = !!pendingLocation;

    return (
      <button
        type="button"
        onClick={openMapForLocation}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          background: SOFT_BLUE,
          borderRadius: 18,
          border: `1px solid ${SOFT_BLUE_BORDER}`,
          padding: "10px 12px",
          marginTop: 4,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Icon
          name={pinned ? "map-marker-check-outline" : "map-marker-radius-outline"}
          size={20}
          color={pinned ? "#FFFFFF" : BLUE}
          style={{ padding: 10, borderRadius: 12, background: pinned ? BLUE : "#D8E6FF", marginRight: 12 }}
        />
        <span style={{ flex: 1, textAlign: "left" }}>
          <span style={{ display: "block", fontWeight: 800, fontSize: 13.5, color: INK }}>
            {pinned ? "Location Pinned" : "Location Required"}
          </span>
          <span style={{ display: "block", fontSize: 11.5, color: SUBTLE, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>
            {pinned
              ? `${Number(pendingLocation.latitude).toFixed(5)}, ${Number(pendingLocation.longitude).toFixed(5)} — tap to change`
              : "Tap to pinpoint address on live map"}
          </span>
        </span>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: pinned ? BLUE : "#DCE9FF",
            position: "relative",
          }}
        >
          <span style={{ position: "absolute", top: 3, left: pinned ? 3 : "auto", right: pinned ? "auto" : 3, width: 20, height: 20, borderRadius: 10, background: pinned ? "#fff" : BLUE }} />
        </span>
      </button>
    );
  };

  const renderAvatar = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14 }}>
      <button
        type="button"
        onClick={pickImage}
        style={{
          width: 78,
          height: 78,
          borderRadius: 39,
          border: "1.4px dashed #B9CBE8",
          background: SURFACE,
          cursor: "pointer",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        {selectedImage?.uri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selectedImage.uri} alt="avatar" style={{ width: 76, height: 76, borderRadius: 38, objectFit: "cover" }} />
        ) : (
          <>
            <Icon name="camera-outline" size={22} color={BLUE} />
            <span style={{ fontSize: 10.5, color: BLUE, fontWeight: 600, marginTop: 2 }}>Photo</span>
          </>
        )}
      </button>
    </div>
  );

  const renderBody = () => {
    if (role === "Company") {
      return (
        <View>
          {renderAvatar()}
          <Field icon="domain" placeholder="Company Name" value={companyName} onChangeText={setCompanyName} />
          <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email" autoCapitalize="none" />
          <Field icon="home-outline" placeholder="Company Address" value={address} onChangeText={setAddress} />
          <Field icon="card-account-details-outline" placeholder="License / Registration Number" value={licenseNumber} onChangeText={setLicenseNumber} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword} secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} />
            <Field icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword} secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} />
          </div>
        </View>
      );
    }

    if (role === "Worker" && step === 1) {
      return (
        <View>
          {renderAvatar()}
          <Field icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field icon="card-bulleted-outline" placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
            <Field icon="card-account-details-outline" placeholder="CNIC" value={cnic} onChangeText={setCnic} keyboardType="numeric" />
          </div>
          <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="currency-usd" placeholder="Expected Salary" value={salary} onChangeText={setSalary} keyboardType="numeric" />
          <Field icon="map-marker-outline" placeholder="Address or Street" value={address} onChangeText={setAddress} />
        </View>
      );
    }

    if (role === "Worker" && step === 2) {
      return (
        <View>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: SUBTLE, margin: "8px 0 10px" }}>
            PROFESSIONAL DESCRIPTION
          </div>
          <Field icon="text-account" placeholder="Briefly describe your work experience and skills..." value={bio} onChangeText={setBio} multiline />
          <Field icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email" autoCapitalize="none" />

          <button type="button" onClick={goToSkills} style={{ ...fieldStyle.container, cursor: "pointer", width: "100%", background: SURFACE }}>
            <Icon name={skillsData.length > 0 ? "check-circle-outline" : "plus-circle-outline"} size={18} color={skillsData.length > 0 ? "#16A34A" : BLUE} style={{ marginRight: 10 }} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 14.5, color: skillsData.length > 0 ? INK : MUTED }}>
              {skillsData.length > 0 ? `${skillsData.length} Skills Added` : "Add Skills"}
            </span>
            <Icon name="chevron-right" size={20} color="#B9C6DB" />
          </button>

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: SUBTLE, margin: "14px 0 10px" }}>SELECT GENDER</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
            {["Male", "Female"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={{
                  height: 46,
                  borderRadius: 16,
                  border: `1px solid ${gender === g ? BLUE : LINE}`,
                  background: gender === g ? BLUE : SURFACE,
                  color: gender === g ? "#fff" : SUBTLE,
                  fontWeight: 700,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <Icon name={g === "Male" ? "gender-male" : "gender-female"} size={18} color={gender === g ? "#fff" : SUBTLE} />
                {g}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field icon="lock-outline" placeholder={isEditMode ? "New Password" : "Password"} value={password} onChangeText={setPassword} secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} />
            <Field icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword} secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} />
          </div>

          {renderLocationCard()}
        </View>
      );
    }

    // CLIENT — single page
    return (
      <View>
        {renderAvatar()}
        <Field icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
        <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email" autoCapitalize="none" />
        <Field icon="home-outline" placeholder="Address or Street" value={address} onChangeText={setAddress} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword} secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} />
          <Field icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword} secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} />
        </div>
        {renderLocationCard()}
      </View>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", justifyContent: "center", padding: "20px 12px" }}>
      <div style={{ width: 460, maxWidth: "100%" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
          <button type="button" onClick={goBack} style={{ width: 40, height: 40, borderRadius: 20, background: "#EDF3FF", border: "none", cursor: "pointer" }}>
            <Icon name="chevron-left" size={26} color={INK} />
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>{headerTitle}</div>
            <div style={{ fontSize: 11.5, color: SUBTLE, marginTop: 1 }}>
              {showStepUi ? `Step ${step} of 2 • ${headerSubtitle}` : headerSubtitle}
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: SURFACE, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(30,58,138,0.14)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_MARK} alt="logo" style={{ width: 30, height: 30, borderRadius: 15, objectFit: "contain" }} />
          </div>
        </div>

        {showStepUi && (
          <div style={{ height: 5, borderRadius: 3, background: "#E3EBF9", margin: "2px 4px 10px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: step === 1 ? "50%" : "100%", background: BLUE, borderRadius: 3 }} />
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "12px 4px 120px" }}>
          {!isEditMode && (
            <View>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: SUBTLE }}>SELECT ROLE</span>
                <span style={{ background: "#E8F1FF", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 800, color: BLUE }}>Required</span>
              </div>
              <div style={{ display: "flex", background: "#E9EFFB", borderRadius: 16, padding: 4, marginBottom: 14 }}>
                {ROLES.map((r) => {
                  const active = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setRole(r.key);
                        setStep(1);
                      }}
                      style={{
                        flex: 1,
                        height: 42,
                        borderRadius: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        border: "none",
                        background: active ? SURFACE : "transparent",
                        boxShadow: active ? "0 2px 6px rgba(30,58,138,0.16)" : "none",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: active ? BLUE : SUBTLE,
                      }}
                    >
                      <Icon name={r.icon} size={17} color={active ? BLUE : SUBTLE} />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </View>
          )}

          {renderBody()}
        </div>

        {/* Footer */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: BG, padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, maxWidth: 460, margin: "0 auto", boxShadow: "0 -4px 20px rgba(30,58,138,0.06)" }}>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <button
              type="button"
              onClick={goBack}
              disabled={isLoading}
              style={{ flex: 1, height: 52, borderRadius: 16, background: "#E9EFFB", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, color: SUBTLE }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={submitHandler}
              disabled={isLoading}
              style={{
                flex: 1.7,
                height: 52,
                borderRadius: 16,
                background: BLUE,
                border: "none",
                cursor: "pointer",
                color: "#fff",
                fontSize: 15.5,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 5px 14px rgba(30,100,211,0.3)",
              }}
            >
              {isLoading ? "Saving…" : submitLabel}
              {!isLoading && <Icon name="arrow-right" size={17} color="#FFF" />}
            </button>
          </div>
          {!isEditMode && (
            <button type="button" onClick={() => router.push("/login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: SUBTLE, padding: 4 }}>
              Already have an account? <span style={{ color: BLUE, fontWeight: 800 }}>Login</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
