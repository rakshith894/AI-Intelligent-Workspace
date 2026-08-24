
import { api } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/v1/auth/login",
    credentials,
  );

  return response.data;
}

export function saveAccessToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function removeAccessToken() {
  localStorage.removeItem("access_token");
}
