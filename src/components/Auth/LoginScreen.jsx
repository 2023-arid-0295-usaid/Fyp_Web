"use client";

// Port of assets/components/Auth/LoginScreen.js (myFypProject) — same state,
// same role logic, same AsyncStorage keys, same API payload and routing.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { storage } from "@/lib/storage";
import { API_AUTH } from "@/lib/config";
import { useToast } from "@/components/Toast/Toast";

const LOGO_IMG = "/images/logo.png";

const DEFAULT_AVATAR_PLACEHOLDER = "/images/default-user.png";

export default function LoginScreen() {
  const [role, setRole] = useState("Client");
  const [emailOrCnic, setEmailOrCnic] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const toast = useToast();

  const getIdentifierPlaceholder = () => {
    switch (role) {
      case "Client":
        return "Email";
      case "Worker":
        return "CNIC e.g XXXXX-XXXXXXX-X";
      case "Company":
        return "License Number";
      case "Police":
        return "Badge ID / Service ID";
      default:
        return "Email";
    }
  };

  const getIdentifierIcon = () => {
    switch (role) {
      case "Client":
        return "email-outline";
      case "Worker":
        return "card-account-details-outline";
      case "Company":
        return "domain";
      case "Police":
        return "shield-account-outline";
      default:
        return "email-outline";
    }
  };

  const getKeyboardType = () => {
    if (role === "Client") return "email";
    if (role === "Worker") return "text"; // CNIC has dashes; original used numeric keyboard
    return "text";
  };

  const handleLogin = async () => {
    const trimmedIdentifier = emailOrCnic.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      toast.show({ type: "error", text1: "Error ❌", text2: "Please enter your credentials." });
      return;
    }

    setIsLoading(true);
    const url = `${API_AUTH}/Login`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Role: role,
          EmailOrCnic: trimmedIdentifier,
          Password: trimmedPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // 1. Prepare key-value pairs for atomic batch storage (same keys as RN)
        const storageItems = [
          ["userToken", result.token || ""],
          ["userRole", result.role || role],
          ["userName", result.name || ""],
          ["userPicture", result.picture || ""],
          ["userAddress", result.address || ""],
          ["userPhone", result.phone || ""],
          ["userEmail", result.email || (role === "Client" ? trimmedIdentifier : "")],
        ];

        if (result.clientId != null) storageItems.push(["clientId", result.clientId.toString()]);
        if (result.workerId != null) storageItems.push(["workerId", result.workerId.toString()]);
        if (result.companyId != null) storageItems.push(["companyId", result.companyId.toString()]);
        if (result.policeId != null) storageItems.push(["policeId", result.policeId.toString()]);

        await storage.multiSet(storageItems);

        if (rememberMe) {
          // "Remember Me" had no logic in the RN app; the web clone can honor it.
          await storage.setItem("rememberFlag", "1");
        }

        toast.show({ type: "success", text1: "Success ✅", text2: "Login Successful!" });

        const userRole = result.role || role;
        if (userRole === "Client") {
          router.replace("/find-service");
        } else if (userRole === "Worker") {
          router.replace("/worker/dashboard");
        } else if (userRole === "Company") {
          router.replace("/company/directory");
        } else if (userRole === "Police") {
          router.replace("/police/portal");
        } else {
          toast.show({
            type: "success",
            text1: "Success ✅",
            text2: `${userRole} account logged in successfully!`,
          });
        }
      } else {
        toast.show({
          type: "error",
          text1: "Error ❌",
          text2: result.message || "Invalid credentials.",
        });
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Cannot reach the server." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FBFF", display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <div style={{ position: "absolute", top: -40, left: -40, width: 180, height: 180, borderRadius: 90, background: "#D6EAF8" }} />

      <div style={{ width: 420, maxWidth: "100%", background: "transparent", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={LOGO_IMG}
              alt="Maid & Servant Online"
              style={{ width: 120, height: 120, borderRadius: 25, objectFit: "contain", background: "#fff", boxShadow: "0 5px 20px rgba(0,0,0,0.18)" }}
            />
          </div>
          <div style={{ marginTop: 15, fontSize: 20, fontWeight: 700, color: "#2C437E" }}>Maid &amp; Servant Online</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 15 }}>
          {[
            { key: "Client", icon: "account-outline" },
            { key: "Worker", icon: "account-group-outline" },
            { key: "Company", icon: "domain" },
            { key: "Police", icon: "shield-check-outline" },
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setRole(r.key);
                setEmailOrCnic("");
              }}
              style={{
                height: 50,
                borderRadius: 15,
                border: "1px solid #EEE",
                background: role === r.key ? "#E0DADA" : "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              }}
            >
              <Icon name={r.icon} size={22} color={role === r.key ? "#1E64D3" : "#000"} />
              <span style={{ fontWeight: 700, color: "#000" }}>{r.key}</span>
            </button>
          ))}
        </div>

        <div style={inputWrap}>
          <Icon name={getIdentifierIcon()} size={24} color="#1E64D3" />
          <input
            value={emailOrCnic}
            onChange={(e) => setEmailOrCnic(e.target.value)}
            placeholder={getIdentifierPlaceholder()}
            type={getKeyboardType()}
            autoCapitalize="none"
            style={inputStyle}
          />
        </div>

        <div style={{ ...inputWrap, marginTop: 15 }}>
          <Icon name="lock-outline" size={24} color="#1E64D3" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type={isPasswordVisible ? "text" : "password"}
            style={inputStyle}
          />
          <button type="button" onClick={() => setPasswordVisible(!isPasswordVisible)} style={ghostBtn}>
            <Icon name={isPasswordVisible ? "eye-off" : "eye"} size={22} color="#666" />
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "15px 0 25px" }}>
          <button type="button" onClick={() => setRememberMe(!rememberMe)} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 8, padding: 0 }}>
            <Icon name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color="#1E64D3" />
            <span style={{ color: "#555", fontSize: 14 }}>Remember Me</span>
          </button>
          <button type="button" style={{ ...ghostBtn, color: "#1E64D3", fontSize: 14, fontWeight: 600, padding: 0 }}>
            Forgot Password?
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: "100%",
            height: 55,
            borderRadius: 30,
            background: "#FFF",
            border: "1px solid #1E64D3",
            color: "#1E64D3",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
          }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ textAlign: "center", margin: "15px 0", color: "#888", fontSize: 14 }}>OR</div>

        <button
          type="button"
          onClick={() => router.push("/signup")}
          style={{
            width: "100%",
            height: 55,
            borderRadius: 30,
            background: "#1E64D3",
            border: "none",
            color: "#FFF",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 5px 12px rgba(30,100,211,0.35)",
          }}
        >
          Signup
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={DEFAULT_AVATAR_PLACEHOLDER} alt="" style={{ display: "none" }} />
    </div>
  );
}

const inputWrap = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#FFF",
  borderRadius: 15,
  padding: "0 15px",
  height: 60,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

const inputStyle = {
  flex: 1,
  height: "100%",
  border: "none",
  outline: "none",
  fontSize: 16,
  color: "#333",
  background: "transparent",
};

const ghostBtn = { background: "none", border: "none", cursor: "pointer", color: "#333" };
