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
  KnowledgeProgressResponse,
  LearnerDashboardResponse,
  PlannerRecommendationResponse,
  SavedStudyPlanResponse,
  SourceResponse,
  StudentProfileResponse,
  UserResponse
} from "./models";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
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
    const message = typeof payload === "object" && payload?.message ? payload.message : "Request failed";
    throw new ApiError(response.status, message);
  }

  return payload as T;
}
