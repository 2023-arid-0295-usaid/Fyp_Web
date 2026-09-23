// Browser equivalent of @react-native-async-storage/async-storage.
// Uses the EXACT same storage keys as the React Native app so the clone is a
// drop-in: userToken, userRole, userName, userPicture, userAddress, userPhone,
// userEmail, clientId, workerId, companyId, policeId, clientLatitude, ... etc.

const mem = new Map();

export const storage = {
  async setItem(key, value) {
    mem.set(key, String(value));
    try {
      window.localStorage.setItem(key, String(value));
    } catch (_) {
      // private mode / quota — keep in-memory copy
    }
  },

  async getItem(key) {
    if (mem.has(key)) return mem.get(key);
    try {
      const v = window.localStorage.getItem(key);
      return v === null ? null : v;
    } catch (_) {
      return null;
    }
  },

  async removeItem(key) {
    mem.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch (_) {}
  },

  // AsyncStorage.multiSet(pairs) — used by LoginScreen
  async multiSet(pairs) {
    for (const [k, v] of pairs) await this.setItem(k, v);
  },

  // AsyncStorage.clear() — used by every logout
  async clear() {
    mem.clear();
    try {
      window.localStorage.clear();
    } catch (_) {}
  },
};

export async function getToken() {
  return storage.getItem("userToken");
}
