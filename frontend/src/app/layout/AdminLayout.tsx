import { BarChart3, BookOpenCheck, Bot, DatabaseZap, LogOut, Menu, ShieldCheck, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { logoUrl } from "../../shared/assets";

const adminNavItems = [
  { to: "/admin", label: "Tổng quan", icon: BarChart3 },
  { to: "/admin/learners", label: "Người học", icon: UsersRound },
  { to: "/admin/knowledge", label: "Kho kiến thức", icon: DatabaseZap },
  { to: "/admin/content", label: "Nội dung học", icon: BookOpenCheck },
  { to: "/admin/tutor", label: "Chất lượng trợ lý", icon: Bot }
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell admin-shell">
      <aside className={`sidebar admin-sidebar ${open ? "open" : ""}`}>
        <div className="brand-block">
          <img src={logoUrl} alt="VAJA logo" />
          <div>
            <strong>VAJA Quản trị</strong>
            <span>Bảng vận hành</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Điều hướng quản trị">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <NavLink className="nav-link portal-link" to="/learner" onClick={() => setOpen(false)}>
            <ShieldCheck size={19} />
            <span>Trang học</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="mini-profile">
            <div className="avatar admin-avatar">{user?.displayName?.slice(0, 1).toUpperCase() ?? "A"}</div>
            <div>
              <strong>{user?.displayName ?? "Quản trị"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="icon-text-button ghost" type="button" onClick={logout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" onClick={() => setOpen((next) => !next)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <p className="eyebrow admin-eyebrow">Quản trị</p>
            <h1>Trung tâm điều phối</h1>
          </div>
          <div className="status-chip admin-status-chip">
            <ShieldCheck size={17} />
            Chỉ quản trị
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
