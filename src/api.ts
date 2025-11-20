// src/api.ts

// This automatically picks the live URL when deployed, or localhost when running on your computer
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// NOTE: If you used Create-React-App instead of Vite, use:
// export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";