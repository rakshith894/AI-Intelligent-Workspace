
import { api } from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/* ============================================================
   LOGIN
============================================================ */

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/v1/auth/login",
    credentials,
  );

  return response.data;
}

/* ============================================================
   TOKEN MANAGEMENT
============================================================ */

export function saveAccessToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function removeAccessToken(): void {
  localStorage.removeItem("access_token");
}

/* ============================================================
   AUTHENTICATION CHECK
============================================================ */

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

/* ============================================================
   GET CURRENT USER PROFILE
============================================================ */

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  created_at?: string | null;
}

export async function getMe(): Promise<UserProfile> {
  const response = await api.get<UserProfile>("/api/v1/users/me");
  return response.data;
}

/* ============================================================
   LOGOUT
============================================================ */

export function logout(): void {
  removeAccessToken();

  window.location.href = "/login";
}
