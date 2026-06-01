import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layout/AdminLayout";
import { LearnerLayout } from "./layout/LearnerLayout";
import { ProtectedRoute } from "./layout/ProtectedRoute";
import { AuthProvider } from "./providers/AuthProvider";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AuthCallbackPage } from "../pages/auth/AuthCallbackPage";
import { AuthPage } from "../pages/auth/AuthPage";
import { AssessmentPage } from "../pages/learner/AssessmentPage";
import { ChatPage } from "../pages/learner/ChatPage";
import { DashboardPage } from "../pages/learner/DashboardPage";
import { FlashcardsPage } from "../pages/learner/FlashcardsPage";
import { OnboardingPage } from "../pages/learner/OnboardingPage";
import { PlannerPage } from "../pages/learner/PlannerPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route index element={<Navigate replace to="/learner" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/learner" element={<LearnerLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="assessment" element={<AssessmentPage />} />
            <Route path="planner" element={<PlannerPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/learner" />} />
      </Routes>
    </AuthProvider>
  );
}
