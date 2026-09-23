"use client";

// Mirrors assets/components/Notification/NotificationHelper.js — a declarative
// toast system standing in for react-native-toast-message.

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type = "success", text1 = "", text2 = "", visibilityTime = 3000, onHide }) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, text1, text2 }]);
      if (visibilityTime > 0) {
        setTimeout(() => dismiss(id), visibilityTime);
        if (typeof onHide === "function") {
          setTimeout(onHide, visibilityTime);
        }
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div style={styles.host} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...(t.type === "error" ? styles.error : styles.success) }}>
            <div style={styles.title}>{t.text1}</div>
            {t.text2 ? <div style={styles.body}>{t.text2}</div> : null}
            <button style={styles.close} onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const styles = {
  host: {
    position: "fixed",
    top: 12,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 999999,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "min(92vw, 420px)",
  },
  toast: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#fff",
    boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
    position: "relative",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  success: { background: "#15803D" },
  error: { background: "#B91C1C" },
  title: { fontWeight: 700, fontSize: 14, paddingRight: 20 },
  body: { fontSize: 12.5, opacity: 0.95, marginTop: 2 },
  close: {
    position: "absolute",
    top: 6,
    right: 10,
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    lineHeight: 1,
  },
};
