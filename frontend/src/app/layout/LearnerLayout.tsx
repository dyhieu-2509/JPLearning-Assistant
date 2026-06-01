import {
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  SlidersHorizontal,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { logoUrl } from "../../shared/assets";
import { isAdminRole } from "../../shared/auth";
import { apiRequest } from "../../shared/api";
import { LoadingPanel } from "../../shared/components";
import type { StudentProfileResponse } from "../../shared/models";
import { needsLearnerOnboarding } from "../../shared/profile";

const navItems = [
  { to: "/learner", label: "Dashboard", icon: BarChart3 },
  { to: "/learner/onboarding", label: "Profile setup", icon: SlidersHorizontal },
  { to: "/learner/chat", label: "AI Tutor", icon: Bot },
  { to: "/learner/flashcards", label: "Flashcards", icon: Layers3 },
  { to: "/learner/assessment", label: "Assessment", icon: ClipboardCheck },
  { to: "/learner/planner", label: "Planner", icon: CalendarCheck }
];

export function LearnerLayout() {
  const { accessToken, user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const onboardingPath = "/learner/onboarding";

  useEffect(() => {
    if (!accessToken || location.pathname === onboardingPath) {
      setCheckingProfile(false);
      setNeedsOnboarding(false);
      return;
    }

    let active = true;
    setCheckingProfile(true);
    apiRequest<StudentProfileResponse>("/personalization/me/profile", { token: accessToken })
      .then((profile) => {
        if (active) {
          setNeedsOnboarding(needsLearnerOnboarding(profile));
        }
      })
      .catch(() => {
        if (active) {
          setNeedsOnboarding(false);
        }
      })
      .finally(() => {
        if (active) {
          setCheckingProfile(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, location.pathname]);

  return (
    <div className="app-shell learner-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand-block">
          <img src={logoUrl} alt="VAJA logo" />
          <div>
            <strong>VAJA</strong>
            <span>Learner workspace</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Learner navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/learner"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          {isAdminRole(user?.role) && (
            <NavLink className="nav-link portal-link" to="/admin" onClick={() => setOpen(false)}>
              <LayoutDashboard size={19} />
              <span>Admin Console</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="mini-profile">
            <div className="avatar">{user?.displayName?.slice(0, 1).toUpperCase() ?? "V"}</div>
            <div>
              <strong>{user?.displayName ?? "Learner"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="icon-text-button ghost" type="button" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" onClick={() => setOpen((next) => !next)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <p className="eyebrow">Personalized Japanese tutor</p>
            <h1>Study workspace</h1>
          </div>
          <div className="status-chip">
            <Brain size={17} />
            RAG + Knowledge Graph
          </div>
        </header>
        {needsOnboarding ? (
          <Navigate replace to={onboardingPath} />
        ) : checkingProfile ? (
          <LoadingPanel>Preparing learner profile...</LoadingPanel>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
