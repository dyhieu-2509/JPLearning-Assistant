export type UserResponse = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  status: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
};

export type SourceResponse = {
  type: string;
  id: string;
  title: string;
};

export type KnowledgeProgressResponse = {
  id: string;
  knowledgeType: string;
  knowledgeId: string;
  title?: string | null;
  level?: string | null;
  masteryScore: number;
  exposureCount: number;
  correctCount: number;
  wrongCount: number;
  nextReviewAt?: string | null;
  updatedAt?: string | null;
};

export type KnowledgeItemResponse = {
  type: string;
  id: string;
  title: string;
  reading?: string | null;
  meaningVi?: string | null;
  meaningEn?: string | null;
  level?: string | null;
  source?: string | null;
};

export type StudentProfileResponse = {
  id: string;
  currentLevel?: string | null;
  targetLevel?: string | null;
  avatarUrl?: string | null;
  goal?: string | null;
  dailyStudyMinutes: number;
  explanationStyle?: string | null;
  romajiEnabled: boolean;
  weakSkills: string[];
};

export type StudentProfileRequest = {
  currentLevel?: string | null;
  targetLevel?: string | null;
  avatarUrl?: string | null;
  goal?: string | null;
  dailyStudyMinutes?: number | null;
  explanationStyle?: string | null;
  romajiEnabled?: boolean | null;
  weakSkills?: string[];
};

export type FlashcardCardResponse = {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  reading?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  level?: string | null;
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt?: string | null;
  lastReviewedAt?: string | null;
};

export type FlashcardDeckResponse = {
  id: string;
  title: string;
  level?: string | null;
  category?: string | null;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardReviewResponse = {
  card?: FlashcardCardResponse | null;
  progress?: KnowledgeProgressResponse | null;
  masteryScore?: number;
};

export type AssessmentSummaryResponse = {
  sessionId: string;
  level: string;
  category: string;
  score: number;
  total: number;
  weakAreas: string[];
  submittedAt: string;
};

export type AssessmentStartResponse = {
  sessionId: string;
  level: string;
  category: string;
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
  }>;
};

export type AssessmentSubmitResponse = {
  sessionId: string;
  score: number;
  total: number;
  weakAreas: string[];
  results: Array<{
    questionId: string;
    selectedAnswer: string;
    correctAnswer: string;
    correct: boolean;
    explanation?: string | null;
  }>;
};

export type LearnerDashboardResponse = {
  profile: StudentProfileResponse;
  progress: {
    totalItems: number;
    masteredItems: number;
    weakItems: number;
    averageMasteryScore: number;
    weakestItems: KnowledgeProgressResponse[];
  };
  flashcards: {
    totalCards: number;
    dueCards: number;
    dueNow: FlashcardCardResponse[];
  };
  assessments: {
    completedSessions: number;
    averageScorePercent: number;
    latest?: AssessmentSummaryResponse | null;
    recentWeakAreas: string[];
  };
  chat: {
    sessionCount: number;
    messageCount: number;
    recentTopics: string[];
  };
  generatedAt: string;
};

export type ChatSessionResponse = {
  id: string;
  title: string;
  contextTopic?: string | null;
  startedAt: string;
  updatedAt: string;
};

export type ChatMessageResponse = {
  id: string;
  sessionId: string;
  role: "USER" | "ASSISTANT" | string;
  content: string;
  sources?: SourceResponse[];
  confidence?: number | null;
  createdAt: string;
};

export type ChatResponse = {
  answer: string;
  sources: SourceResponse[];
  confidence: number;
  sessionId: string;
};

export type StudyPlanItemResponse = {
  order: number;
  title: string;
  objective: string;
  estimatedHours: number;
};

export type PlannerContextResponse = {
  profile: StudentProfileResponse;
  weakProgress: KnowledgeProgressResponse[];
  dueFlashcards: FlashcardCardResponse[];
  recentChatTopics: string[];
  recentAssessment?: AssessmentSummaryResponse | null;
};

export type PlannerRecommendationResponse = {
  planId: string;
  level: string;
  targetLevel: string;
  goal: string;
  weeklyStudyHours: number;
  items: StudyPlanItemResponse[];
  context?: PlannerContextResponse | null;
};

export type SavedStudyPlanResponse = {
  id: string;
  level: string;
  targetLevel: string;
  goal: string;
  weeklyStudyHours: number;
  completedItems: number;
  totalItems: number;
  completionRate: number;
  items: Array<{
    id: string;
    order: number;
    title: string;
    objective: string;
    estimatedHours: number;
    completed: boolean;
    completedAt?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
};
