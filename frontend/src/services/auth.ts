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

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  created_at?: string | null;
}

/* ============================================================
   LOGIN & LOGOUT
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

export function logout(): void {
  removeAccessToken();
  window.location.href = "/login";
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

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

/* ============================================================
   GET CURRENT USER PROFILE
============================================================ */

export async function getMe(): Promise<UserProfile> {
  const response = await api.get<UserProfile>("/api/v1/users/me");
  return response.data;
}

/* ============================================================
   PASSWORD RESET API
============================================================ */

export async function forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
  const response = await api.post<{ message: string; reset_token?: string }>(
    "/api/v1/auth/forgot-password",
    { email },
  );
  return response.data;
}

export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    "/api/v1/auth/reset-password",
    {
      email,
      reset_token: resetToken,
      new_password: newPassword,
    },
  );
  return response.data;
}
