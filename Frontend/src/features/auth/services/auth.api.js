import api from "../../../shared/api/client";

const TOKEN_KEY = "ra_auth_token";

function saveToken(data) {
  if (data?.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }

  return data;
}

export async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });

  return saveToken(response.data);
}

export async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  return saveToken(response.data);
}

export async function googleAuth({ credential }) {
  const response = await api.post("/api/auth/google", {
    credential,
  });

  return saveToken(response.data);
}

export async function logout() {
  const response = await api.post("/api/auth/logout");

  localStorage.removeItem(TOKEN_KEY);

  return response.data;
}

export async function getMe() {
  const response = await api.get("/api/auth/get-me");
  return response.data;
}