const devBackendBaseUrl = "http://localhost:8080";

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function isLocalBrowserHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function currentBrowserOrigin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const oauthBaseUrl = (() => {
  const explicitBaseUrl = import.meta.env.VITE_OAUTH_BASE_URL ?? import.meta.env.VITE_BACKEND_BASE_URL;
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (import.meta.env.DEV && typeof window !== "undefined" && isLocalBrowserHost(window.location.hostname)) {
    return devBackendBaseUrl;
  }

  return currentBrowserOrigin();
})();

export const googleOAuthStartUrl = joinUrl(oauthBaseUrl, "/oauth2/authorization/google");
