import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layout/AdminLayout";
import { LearnerLayout } from "./layout/LearnerLayout";
import { ProtectedRoute } from "./layout/ProtectedRoute";
import { AuthProvider } from "./providers/AuthProvider";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AuthCallbackPage } from "../pages/auth/AuthCallbackPage";
import { AuthPage } from "../pages/auth/AuthPage";
import { AssessmentPage } from "../pages/learner/AssessmentPage";
import { DashboardPage } from "../pages/learner/DashboardPage";
import { FlashcardsPage } from "../pages/learner/FlashcardsPage";
import { KnowledgePage } from "../pages/learner/KnowledgePage";
import { OnboardingPage } from "../pages/learner/OnboardingPage";
import { StudyPage } from "../pages/learner/StudyPage";
import { LandingPage } from "../pages/public/LandingPage";
import { PreAuthOnboardingPage } from "../pages/public/PreAuthOnboardingPage";
import { Headbar } from "../shared/components";

export default function App() {
  return (
    <AuthProvider>
      <div className="app-viewport">
        <Headbar />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<PreAuthOnboardingPage />} />
          <Route index element={<LandingPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/learner" element={<LearnerLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="chat" element={<Navigate replace to="/learner/study" />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="flashcards" element={<FlashcardsPage />} />
              <Route path="assessment" element={<AssessmentPage />} />
              <Route path="planner" element={<Navigate replace to="/learner/study" />} />
              <Route path="study" element={<StudyPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="*" element={<AdminDashboardPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
