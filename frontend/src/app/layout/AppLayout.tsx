import {
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  Layers3,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { logoUrl } from "../../shared/assets";

const navItems = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/chat", label: "AI Tutor", icon: Bot },
  { to: "/flashcards", label: "Flashcards", icon: Layers3 },
  { to: "/assessment", label: "Assessment", icon: ClipboardCheck },
  { to: "/planner", label: "Planner", icon: CalendarCheck }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand-block">
          <img src={logoUrl} alt="VAJA logo" />
          <div>
            <strong>VAJA</strong>
            <span>JLPT learning</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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
        <Outlet />
      </div>
    </div>
  );
}
