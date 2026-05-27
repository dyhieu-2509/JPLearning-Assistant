import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { ProtectedRoute } from "./layout/ProtectedRoute";
import { AuthProvider } from "./providers/AuthProvider";
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
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="assessment" element={<AssessmentPage />} />
            <Route path="planner" element={<PlannerPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </AuthProvider>
  );
}
