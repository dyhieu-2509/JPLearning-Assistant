import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<PlaceholderPage title="Dashboard" />} />
            <Route path="chat" element={<PlaceholderPage title="AI Tutor" />} />
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
