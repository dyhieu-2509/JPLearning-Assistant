import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="flashcards" element={<PlaceholderPage title="Flashcards" />} />
            <Route path="assessment" element={<PlaceholderPage title="Assessment" />} />
            <Route path="planner" element={<PlaceholderPage title="Planner" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </AuthProvider>
  );
}
