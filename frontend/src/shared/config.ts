const devBackendBaseUrl = "http://localhost:8080";

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const oauthBaseUrl =
  import.meta.env.VITE_OAUTH_BASE_URL ??
  import.meta.env.VITE_BACKEND_BASE_URL ??
  (import.meta.env.DEV ? devBackendBaseUrl : "");

export const googleOAuthStartUrl = joinUrl(oauthBaseUrl, "/oauth2/authorization/google");
