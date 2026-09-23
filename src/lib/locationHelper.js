// Mirrors assets/components/helpers/locationHelper.js (non-commented version):
// detects the client or worker's browser geolocation and posts it to the same
// backend endpoints the RN app used.

import { storage } from "@/lib/storage";
import { API_DASHBOARD } from "@/lib/config";

const requestBrowserPermission = () =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.log("❌ Geolocation not supported by this browser");
      resolve(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });

// 1. Worker Location Detector
export const detectAndUpdateWorkerLocation = async () => {
  try {
    console.log("📍 detectAndUpdateWorkerLocation called");
    const hasPermission = await requestBrowserPermission();
    if (!hasPermission) {
      console.log("❌ Location permission DENIED by user");
      return false;
    }
    console.log("✅ Location permission GRANTED");

    const workerIdStr = await storage.getItem("workerId");
    const token = await storage.getItem("userToken");
    if (!workerIdStr) {
      console.log("❌ Worker ID not found in storage");
      return false;
    }
    const workerId = parseInt(workerIdStr, 10);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log("📍 Worker GPS position received:", { latitude, longitude });
          await storage.setItem("workerLatitude", latitude.toString());
          await storage.setItem("workerLongitude", longitude.toString());

          try {
            const response = await fetch(`${API_DASHBOARD}/UpdateWorkerLocation`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ workerId, latitude, longitude }),
            });
            resolve(response.ok);
          } catch (_) {
            resolve(false);
          }
        },
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  } catch (e) {
    console.error("detectAndUpdateWorkerLocation Error:", e);
    return false;
  }
};

// 2. Client Location Detector
export const detectAndUpdateLocation = async () => {
  try {
    console.log("📍 detectAndUpdateLocation (Client) called");
    const hasPermission = await requestBrowserPermission();
    if (!hasPermission) {
      console.log("❌ Location permission DENIED by user");
      return false;
    }

    const clientIdStr = await storage.getItem("clientId");
    const token = await storage.getItem("userToken");
    if (!clientIdStr) {
      console.log("❌ Client ID not found in storage");
      return false;
    }
    const clientId = parseInt(clientIdStr, 10);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await storage.setItem("clientLatitude", latitude.toString());
          await storage.setItem("clientLongitude", longitude.toString());

          try {
            const response = await fetch(`${API_DASHBOARD}/update-location`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ ClientId: clientId, Latitude: latitude, Longitude: longitude }),
            });
            resolve(response.ok);
          } catch (_) {
            resolve(false);
          }
        },
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  } catch (e) {
    console.error("detectAndUpdateLocation Error:", e);
    return false;
  }
};
