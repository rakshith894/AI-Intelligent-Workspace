import { api } from "./api";

export interface GitHubStatus {
  is_connected: boolean;
  github_username: string | null;
  connected_at: string | null;
  profile_url: string | null;
  avatar_url: string | null;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
}

export async function getGitHubStatus(): Promise<GitHubStatus> {
  const response = await api.get<GitHubStatus>("/api/v1/users/me/github");
  return response.data;
}

export async function connectGitHub(
  githubUsername: string,
  accessToken?: string,
): Promise<GitHubStatus> {
  const response = await api.post<GitHubStatus>(
    "/api/v1/users/me/github/connect",
    {
      github_username: githubUsername,
      access_token: accessToken || null,
    },
  );
  return response.data;
}

export async function disconnectGitHub(): Promise<GitHubStatus> {
  const response = await api.delete<GitHubStatus>(
    "/api/v1/users/me/github/disconnect",
  );
  return response.data;
}

export async function getGitHubRepos(): Promise<GitHubRepo[]> {
  const response = await api.get<GitHubRepo[]>(
    "/api/v1/users/me/github/repos",
  );
  return response.data;
}
