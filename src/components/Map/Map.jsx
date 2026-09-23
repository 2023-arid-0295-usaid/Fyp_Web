"use client";

// Port of assets/components/Map/Map.js — full-screen Leaflet/OSM map with a
// draggable pin. Supports two modes:
//   1) Signup picker (pickLocationForSignup=1): stores signupLocation in
//      sessionStorage and returns to /signup (no API call — account doesn't
//      exist yet).
//   2) Live location save: PUT /api/Dashboard/UpdateWorkerLocation for workers,
//      POST /api/Dashboard/update-location for clients.
//
// Browser map is rendered through an iframe that runs Leaflet from unpkg CDN.
// The React side reads the pin position from the iframe via postMessage.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon/Icon";
import { FALLBACK_CENTER, API_DASHBOARD } from "@/lib/config";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast/Toast";

export function buildLeafletHtml({ lat, lng, workers = [], role = "Client" }) {
  const workersJson = JSON.stringify(workers || []);
  const markerTitle = role === "Worker" ? "Your Service Location" : "Your Location";
  const markerPopup =
    role === "Worker"
      ? "Your Service Location<br><small>Drag to adjust</small>"
      : "Your Location<br><small>Drag to adjust</small>";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>OSM Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true })
               .setView([${lat}, ${lng}], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    var userIcon = L.divIcon({
      html: '<div style="background:#1E64D3;width:18px;height:18px;border-radius:50%;border:3px solid #FFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: ''
    });

    var userMarker = L.marker([${lat}, ${lng}], {
      icon: userIcon,
      draggable: true,
      title: '${markerTitle}'
    }).addTo(map).bindPopup('${markerPopup}');

    function sendPosition(lat, lng) {
      try {
        window.parent.postMessage(JSON.stringify({ type: 'position', lat: lat, lng: lng }), '*');
      } catch (e) {}
    }

    userMarker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      sendPosition(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      userMarker.setLatLng(e.latlng);
      sendPosition(e.latlng.lat, e.latlng.lng);
    });

    var workers = ${workersJson};
    var workerIcon = L.divIcon({
      html: '<div style="background:#FF6B35;width:16px;height:16px;border-radius:50%;border:2px solid #FFF;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: ''
    });

    workers.forEach(function(w) {
      var wLat = parseFloat(w.latitude);
      var wLng = parseFloat(w.longitude);
      if (!isNaN(wLat) && !isNaN(wLng)) {
        L.marker([wLat, wLng], { icon: workerIcon })
          .addTo(map)
          .bindPopup('<b>' + (w.name || 'Worker') + '</b><br>' + (w.role || 'Service Worker'));
      }
    });

    // Report initial position immediately so the parent has a pin to save.
    sendPosition(${lat}, ${lng});
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");
  const workersRaw = searchParams.get("workers");
  const userRoleParam = searchParams.get("userRole");
  const workerIdParam = searchParams.get("workerId");
  const pickLocationForSignup = searchParams.get("pickLocationForSignup") === "1";

  const iframeRef = useRef(null);

  const [userRole, setUserRole] = useState(userRoleParam || "Client");
  const [workers] = useState(() => {
    try {
      return workersRaw ? JSON.parse(decodeURIComponent(workersRaw)) : [];
    } catch (_) {
      return [];
    }
  });
  const [clientPosition, setClientPosition] = useState(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [mapPosition, setMapPosition] = useState(clientPosition);

  // Resolve role from storage when not provided (mirrors the RN behaviour).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let activeRole = userRoleParam;
      if (!activeRole) {
        activeRole = (await storage.getItem("userRole")) || "Client";
      }
      if (!cancelled) setUserRole(activeRole);
    })();
    return () => {
      cancelled = true;
    };
  }, [userRoleParam]);

  // Receive pin positions from the Leaflet iframe via postMessage.
  useEffect(() => {
    const onMessage = (event) => {
      let data = null;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch (_) {
        return;
      }
      if (data && data.type === "position" && Number.isFinite(parseFloat(data.lat)) && Number.isFinite(parseFloat(data.lng))) {
        setMapPosition({ latitude: parseFloat(data.lat), longitude: parseFloat(data.lng) });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const activeCenter = mapPosition || clientPosition || FALLBACK_CENTER;

  const currentCoords = () => {
    const src = mapPosition || clientPosition;
    if (!src) return null;
    const lat = parseFloat(src.latitude);
    const lng = parseFloat(src.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { latitude: lat, longitude: lng };
  };

  const saveLocation = async () => {
    const coords = currentCoords();
    if (!coords) return;

    // ─── MODE 1: SIGNUP PICKER ──────────────────────────────────────────
    if (pickLocationForSignup) {
      sessionStorage.setItem(
        "signupLocation",
        JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude, pickedAt: Date.now() })
      );
      router.replace("/signup");
      return;
    }
    // ────────────────────────────────────────────────────────────────────

    setIsSaving(true);

    try {
      const token = await storage.getItem("userToken");
      if (!token) {
        toast.show({ type: "error", text1: "Error ❌", text2: "Session expired. Please login again." });
        setIsSaving(false);
        return;
      }

      if (userRole === "Worker") {
        const storedWorkerId = await storage.getItem("workerId");
        const targetWorkerId = workerIdParam || storedWorkerId;

        if (!targetWorkerId) {
          toast.show({ type: "error", text1: "Error ❌", text2: "Worker ID missing. Please log in again." });
          setIsSaving(false);
          return;
        }

        const endpoint = `${API_DASHBOARD}/UpdateWorkerLocation`;
        const payload = {
          workerId: parseInt(targetWorkerId, 10),
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await storage.setItem("workerLatitude", coords.latitude.toString());
          await storage.setItem("workerLongitude", coords.longitude.toString());
          toast.show({ type: "success", text1: "Success ✅", text2: "Worker location saved successfully!" });
          router.back();
        } else {
          const errText = await response.text();
          toast.show({ type: "error", text1: `Failed (${response.status}) ❌`, text2: errText || "Server error" });
        }
      } else {
        const storedClientId = await storage.getItem("clientId");
        if (!storedClientId) {
          toast.show({ type: "error", text1: "Error ❌", text2: "Client ID missing. Please log in again." });
          setIsSaving(false);
          return;
        }

        const endpoint = `${API_DASHBOARD}/update-location`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ClientId: parseInt(storedClientId, 10),
            Latitude: coords.latitude,
            Longitude: coords.longitude,
          }),
        });

        if (response.ok) {
          await storage.setItem("clientLatitude", coords.latitude.toString());
          await storage.setItem("clientLongitude", coords.longitude.toString());
          toast.show({ type: "success", text1: "Success ✅", text2: "Your location has been saved!" });
          router.back();
        } else {
          const errText = await response.text();
          toast.show({ type: "error", text1: `Failed (${response.status}) ❌`, text2: errText || "Server error" });
        }
      }
    } catch (error) {
      console.error("saveLocation error:", error);
      toast.show({ type: "error", text1: "Error ❌", text2: "Network error while saving location." });
    } finally {
      setIsSaving(false);
    }
  };

  const headerTitle = pickLocationForSignup
    ? userRole === "Worker"
      ? "Set Your Work Location"
      : "Set Your Location"
    : "Set Your Work Location";

  const headerSubtitle = pickLocationForSignup
    ? userRole === "Worker"
      ? "Pin the area where you provide service"
      : "Pin the area where you need service"
    : userRole === "Worker"
      ? "Pin your service location"
      : "let the worker find you";

  const saveLabel = pickLocationForSignup ? "Confirm Location" : "Save Location";

  const html = buildLeafletHtml({
    lat: activeCenter.latitude,
    lng: activeCenter.longitude,
    workers,
    role: userRole,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FFF", fontFamily: "system-ui, sans-serif" }}>
      {/* Map iframe */}
      <iframe
        ref={iframeRef}
        title="Map"
        srcDoc={html}
        style={{ width: "100%", height: "100%", border: "none", position: "absolute", inset: 0 }}
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Floating Header */}
      <div style={{ position: "absolute", top: 20, left: 16, right: 16, zIndex: 10, display: "flex", alignItems: "center", background: "#FFF", borderRadius: 16, padding: "10px 15px", boxShadow: "0 3px 6px rgba(0,0,0,0.15)", maxWidth: 620, margin: "0 auto" }}>
        <button type="button" onClick={() => router.back()} style={{ padding: 5, marginRight: 10, background: "none", border: "none", cursor: "pointer" }}>
          <Icon name="arrow-left" size={24} color="#1A1C1E" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1C1E" }}>{headerTitle}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{headerSubtitle}</div>
        </div>
      </div>

      {/* Save Location Area */}
      {activeCenter && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#FFF", padding: "14px 20px 20px", borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: "0 -3px 8px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#EEF4FF", padding: "5px 12px", borderRadius: 20, gap: 5 }}>
            <Icon name="crosshairs-gps" size={13} color="#1E64D3" />
            <span style={{ fontSize: 12, color: "#1E64D3", fontWeight: 600 }}>
              {(mapPosition || FALLBACK_CENTER).latitude.toFixed(5)}, {(mapPosition || FALLBACK_CENTER).longitude.toFixed(5)}
            </span>
          </div>
          <button type="button" onClick={saveLocation} disabled={isSaving} style={{ width: "100%", background: "#00B14F", borderRadius: 16, padding: "15px 0", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#FFF", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {isSaving ? (
              "Saving…"
            ) : (
              <>
                <Icon name={pickLocationForSignup ? "map-marker-check" : "content-save-check"} size={20} color="#FFF" />
                {saveLabel}
              </>
            )}
          </button>
          <div style={{ fontSize: 12, color: "#999", textAlign: "center" }}>Tap the map or drag the blue dot to adjust</div>
        </div>
      )}
    </div>
  );
}
