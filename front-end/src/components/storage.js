// Storage keys
const STORAGE_KEYS = {
  USER: "cheque_processor_user",
  TOKEN: "cheque_processor_token",
  THEME: "cheque_processor_theme",
  LAST_ACTIVE: "cheque_processor_last_active",
};

// Storage utility functions
export const storage = {
  // User data management
  setUser: (userData) => {
    try {
      const user = {
        id: userData.id || userData.userId || userData.user,
        email: userData.email,
        token: userData.token,
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      console.log("User data stored:", user);
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  },

  getUser: () => {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  // Token management
  setToken: (token) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error("Error storing token:", error);
    }
  },

  getToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  // Clear all user data
  clearUser: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE);
      console.log("User data cleared from storage");
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  },

  // Check if user is logged in
  isLoggedIn: () => {
    const user = storage.getUser();
    const token = storage.getToken();
    return !!(user && token);
  },

  // Update last active timestamp
  updateLastActive: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, new Date().toISOString());
    } catch (error) {
      console.error("Error updating last active:", error);
    }
  },

  // Get user ID
  getUserId: () => {
    const user = storage.getUser();
    return user ? user.id : null;
  },

  // Get user email
  getUserEmail: () => {
    const user = storage.getUser();
    return user ? user.email : null;
  },

  // Store page-specific data
  setPageData: (page, data) => {
    try {
      const key = `cheque_processor_${page}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error(`Error storing ${page} data:`, error);
    }
  },

  // Get page-specific data
  getPageData: (page) => {
    try {
      const key = `cheque_processor_${page}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting ${page} data:`, error);
      return null;
    }
  },

  // Clear page-specific data
  clearPageData: (page) => {
    try {
      const key = `cheque_processor_${page}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing ${page} data:`, error);
    }
  },
};

export default storage;
