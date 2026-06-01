import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layout/AdminLayout";
import { LearnerLayout } from "./layout/LearnerLayout";
import { ProtectedRoute } from "./layout/ProtectedRoute";
import { AuthProvider } from "./providers/AuthProvider";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AuthCallbackPage } from "../pages/AuthCallbackPage";
import { AssessmentPage } from "../pages/AssessmentPage";
import { AuthPage } from "../pages/AuthPage";
import { ChatPage } from "../pages/ChatPage";
import { DashboardPage } from "../pages/DashboardPage";
import { FlashcardsPage } from "../pages/FlashcardsPage";
import { PlannerPage } from "../pages/PlannerPage";

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
