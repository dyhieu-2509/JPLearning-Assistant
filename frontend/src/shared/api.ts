export type {
  AssessmentStartResponse,
  AssessmentSubmitResponse,
  AuthResponse,
  ChatMessageResponse,
  ChatResponse,
  ChatSessionResponse,
  FlashcardCardResponse,
  FlashcardDeckResponse,
  FlashcardReviewResponse,
  KnowledgeItemResponse,
  KnowledgeProgressResponse,
  LearnerDashboardResponse,
  PilotStudyMetricsResponse,
  PilotSurveyRequest,
  PilotSurveyResponse,
  PlannerContextResponse,
  PlannerRecommendationResponse,
  PronunciationScoreResponse,
  SavedStudyPlanResponse,
  SourceResponse,
  StudentProfileRequest,
  StudentProfileResponse,
  StudyFeedbackRequest,
  StudyFeedbackResponse,
  StudyLessonAttemptCompleteRequest,
  StudyLessonAttemptResponse,
  StudyLessonAttemptStartRequest,
  UserResponse
} from "./models";
import { apiBaseUrl } from "./config";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
};

type FormRequestOptions = {
  method?: "POST" | "PUT";
  token?: string | null;
  body: FormData;
};

type AuthRefreshHandler = () => Promise<string | null>;

let authRefreshHandler: AuthRefreshHandler | null = null;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function setAuthRefreshHandler(handler: AuthRefreshHandler | null) {
  authRefreshHandler = handler;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && options.token && !retried && authRefreshHandler && !path.startsWith("/auth/")) {
      const refreshedToken = await authRefreshHandler();
      if (refreshedToken) {
        return apiRequest<T>(path, { ...options, token: refreshedToken }, true);
      }
    }

    const message = typeof payload === "object" && payload?.message ? payload.message : "Chưa tải được dữ liệu. Thử lại sau.";
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

export async function apiFormRequest<T>(path: string, options: FormRequestOptions, retried = false): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "POST",
    headers,
    body: options.body
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && options.token && !retried && authRefreshHandler && !path.startsWith("/auth/")) {
      const refreshedToken = await authRefreshHandler();
      if (refreshedToken) {
        return apiFormRequest<T>(path, { ...options, token: refreshedToken }, true);
      }
    }

    const message = typeof payload === "object" && payload?.message ? payload.message : "Chưa tải được dữ liệu. Thử lại sau.";
    throw new ApiError(response.status, message);
  }

  return payload as T;
}
