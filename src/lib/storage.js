// LocalStorage wrapper with safe JSON serialization
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`smart_kirana_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`smart_kirana_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error saving localStorage key "${key}":`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`smart_kirana_${key}`);
      return true;
    } catch (e) {
      console.error(`Error removing localStorage key "${key}":`, e);
      return false;
    }
  }
};
