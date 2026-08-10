import { apiRequest } from "./api";
import type { StudentProfileRequest, StudentProfileResponse } from "./models";

const STORAGE_KEY = "vaja.pendingOnboardingProfile";
const OAUTH_ONBOARDING_MODE_KEY = "vaja.oauthOnboardingMode";

export type OAuthOnboardingMode = "login" | "register";

export function saveOnboardingDraft(request: StudentProfileRequest) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(request));
}

export function readOnboardingDraft(): StudentProfileRequest | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudentProfileRequest) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearOnboardingDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveOAuthOnboardingMode(mode: OAuthOnboardingMode) {
  localStorage.setItem(OAUTH_ONBOARDING_MODE_KEY, mode);
}

export function readOAuthOnboardingMode(): OAuthOnboardingMode | null {
  const value = localStorage.getItem(OAUTH_ONBOARDING_MODE_KEY);
  return value === "login" || value === "register" ? value : null;
}

export function clearOAuthOnboardingMode() {
  localStorage.removeItem(OAUTH_ONBOARDING_MODE_KEY);
}

export function hasOnboardingDraft(): boolean {
  return readOnboardingDraft() !== null;
}

export async function syncOnboardingDraft(token: string | null | undefined): Promise<void> {
  if (!token) {
    return;
  }

  const draft = readOnboardingDraft();
  if (!draft) {
    return;
  }

  try {
    await apiRequest<StudentProfileResponse>("/personalization/me/profile", {
      method: "PUT",
      token,
      body: draft
    });
    clearOnboardingDraft();
  } catch {
    // Keep the draft so the learner can retry from the in-app onboarding page.
  }
}
