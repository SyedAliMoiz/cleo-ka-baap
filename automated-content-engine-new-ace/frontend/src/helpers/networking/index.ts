import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Attach auth token if present
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for 401 errors that are NOT from the login endpoint
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getModules = async () => {
  const response = await apiClient.get("/modules");
  return response.data;
};

export const getModuleBySlug = async (slug: string) => {
  const response = await apiClient.get(`/modules/slug/${slug}`);
  return response.data;
};

export const getSessionsByModule = async (slug: string) => {
  const response = await apiClient.get(`/chat/${slug}/sessions`);
  return response.data;
};

export const createSessionForModule = async (slug: string) => {
  const response = await apiClient.post(`/chat/${slug}/sessions`);
  return response.data;
};

export const getMessagesForSession = async (sessionId: string) => {
  const response = await apiClient.get(`/chat/sessions/${sessionId}/messages`);
  return response.data;
};

export const sendMessageToSession = async (
  sessionId: string,
  message: string
) => {
  const response = await apiClient.post(
    `/chat/sessions/${sessionId}/messages`,
    { message }
  );
  return response.data;
};

export const deleteSession = async (sessionId: string) => {
  const response = await apiClient.delete(`/chat/sessions/${sessionId}`);
  return response.data;
};

export const addModuleToFavorites = async (moduleId: string) => {
  const response = await apiClient.post(`/modules/${moduleId}/favorite`);
  return response.data;
};

export const removeModuleFromFavorites = async (moduleId: string) => {
  const response = await apiClient.delete(`/modules/${moduleId}/favorite`);
  return response.data;
};

export const getUserFavorites = async () => {
  const response = await apiClient.get("/modules/favorites/list");
  return response.data;
};

export const updateModulePositions = async (
  positionUpdates: Array<{ id: string; position: number }>
) => {
  const response = await apiClient.post("/modules/positions", positionUpdates);
  return response.data;
};
