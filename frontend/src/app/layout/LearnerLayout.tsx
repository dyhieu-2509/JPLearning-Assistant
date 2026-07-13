import {
  BarChart3,
  Bot,
  Flame,
  CalendarCheck,
  ClipboardCheck,
  BookOpenCheck,
  BookOpenText,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
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
import { FloatingTutor } from "../../features/learner/tutor/FloatingTutor";

const navItems = [
  { to: "/learner", label: "Hôm nay", icon: BarChart3 },
  { to: "/learner/study", label: "Học", icon: BookOpenCheck },
  { to: "/learner/chat", label: "Hỏi bài", icon: Bot },
  { to: "/learner/knowledge", label: "Tra cứu", icon: BookOpenText },
  { to: "/learner/flashcards", label: "Thẻ nhớ", icon: Layers3 },
  { to: "/learner/assessment", label: "Kiểm tra", icon: ClipboardCheck },
  { to: "/learner/planner", label: "Lộ trình", icon: CalendarCheck }
];

export function LearnerLayout() {
  const { accessToken, user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const onboardingPath = "/learner/onboarding";
  const isOnboardingRoute = location.pathname === onboardingPath;
  const tutorContext = getTutorContext(location.pathname);
  const showFloatingTutor =
    Boolean(accessToken) &&
    !checkingProfile &&
    !needsOnboarding &&
    location.pathname !== "/learner" &&
    !isOnboardingRoute &&
    location.pathname !== "/learner/assessment" &&
    location.pathname !== "/learner/flashcards" &&
    location.pathname !== "/learner/planner" &&
    location.pathname !== "/learner/study" &&
    location.pathname !== "/learner/chat";

  useEffect(() => {
    if (!accessToken) {
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
  }, [accessToken]);

  return (
    <div className="app-shell learner-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand-block">
          <img src={logoUrl} alt="VAJA logo" />
          <div>
            <strong>VAJA</strong>
            <span>Góc học tiếng Nhật</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Điều hướng người học">
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
              <span>Quản trị</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="mini-profile">
            <div className="avatar">{user?.displayName?.slice(0, 1).toUpperCase() ?? "V"}</div>
            <div>
              <strong>{user?.displayName ?? "Người học"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="icon-text-button ghost" type="button" onClick={logout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="app-main learner-main">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" onClick={() => setOpen((next) => !next)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <p className="eyebrow">VAJA 日本語</p>
            <h1>Học tiếng Nhật cùng VAJA</h1>
          </div>
          <div className="status-chip">
            <Flame size={17} />
            Mỗi ngày một bài nhỏ
          </div>
        </header>
        {needsOnboarding && !isOnboardingRoute ? (
          <Navigate replace to={onboardingPath} />
        ) : checkingProfile ? (
          <LoadingPanel>Đang chuẩn bị góc học của bạn...</LoadingPanel>
        ) : (
          <Outlet />
        )}
        {showFloatingTutor && (
          <FloatingTutor
            token={accessToken ?? ""}
            contextTopic={tutorContext.topic}
            suggestions={tutorContext.suggestions}
          />
        )}
      </div>
    </div>
  );
}

function getTutorContext(pathname: string): { topic: string; suggestions: string[] } {
  if (pathname.includes("/study")) {
    return {
      topic: "study",
      suggestions: ["Tôi chưa hiểu bài này", "Cho thêm ví dụ giống bài", "Giải thích câu quiz sai"]
    };
  }

  if (pathname.includes("/flashcards")) {
    return {
      topic: "flashcards",
      suggestions: ["Thẻ này nên nhớ bằng mẹo nào?", "Tạo ví dụ với từ vừa ôn", "Khi nào dùng kanji này?"]
    };
  }

  if (pathname.includes("/knowledge")) {
    return {
      topic: "knowledge",
      suggestions: ["Giải thích dễ hiểu bằng tiếng Việt", "Cho ví dụ N5 dễ nhớ", "So sánh với mẫu gần giống"]
    };
  }

  if (pathname.includes("/assessment")) {
    return {
      topic: "assessment",
      suggestions: ["Giải thích câu tôi sai", "Ôn nhanh ngữ pháp N5", "Cho tôi một câu tương tự"]
    };
  }

  if (pathname.includes("/planner")) {
    return {
      topic: "planner",
      suggestions: ["Hôm nay nên học gì?", "Rút gọn bài tuần này", "Ôn phần tôi hay quên"]
    };
  }

  return {
    topic: "dashboard",
    suggestions: ["Tôi nên ôn gì hôm nay?", "Giải thích は và が", "Tạo ví dụ N5 với です"]
  };
}
