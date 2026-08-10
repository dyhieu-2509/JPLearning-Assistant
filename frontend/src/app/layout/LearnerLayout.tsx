import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Flame,
  ClipboardCheck,
  BookOpenCheck,
  BookOpenText,
  HelpCircle,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  { to: "/learner/knowledge", label: "Tra cứu", icon: BookOpenText },
  { to: "/learner/flashcards", label: "Thẻ nhớ", icon: Layers3 },
  { to: "/learner/assessment", label: "Kiểm tra", icon: ClipboardCheck }
];

const navTourTargets: Record<string, string> = {
  "/learner/study": "nav-study",
  "/learner/knowledge": "nav-lookup",
  "/learner/flashcards": "nav-flashcards"
};

type LearnerTourStep = {
  target: string;
  route: string;
  title: string;
  body: string;
  primaryLabel?: string;
  completion?: "close" | "start-study";
};

type TourBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const learnerTourSteps: LearnerTourStep[] = [
  {
    target: "today-start",
    route: "/learner",
    title: "Bắt đầu ở đây",
    body: "Người mới chỉ cần bấm nút này. App sẽ đưa bạn vào bài đang mở trong pathway của riêng bạn."
  },
  {
    target: "daily-loop",
    route: "/learner",
    title: "Một buổi học có 3 bước",
    body: "Học ngắn, lật thẻ, rồi làm quiz cuối bài. Đạt từ 85% thì bài tiếp theo mới mở."
  },
  {
    target: "nav-study",
    route: "/learner",
    title: "Tab Học là luồng chính",
    body: "Khi không biết làm gì tiếp, vào Học. Đây là nơi app xếp chương và bài theo câu trả lời mở đầu, điểm quiz và phần bạn hay sai."
  },
  {
    target: "study-stage",
    route: "/learner/study",
    title: "Khung giữa là bài hôm nay",
    body: "Bạn làm theo nút chính trong khung này: học mẫu, học thẻ, làm quiz, rồi xem kết quả."
  },
  {
    target: "study-roadmap",
    route: "/learner/study",
    title: "Pathway mở dần theo chương",
    body: "Bài sáng là học được. Bài khóa cần qua bài trước. Nếu rớt nhiều, VAJA giữ lại để ôn kỹ hơn."
  },
  {
    target: "floating-tutor",
    route: "/learner/study",
    title: "Bí thì hỏi VAJA",
    body: "Bong bóng chat luôn đi theo bạn. Khi vào quiz, VAJA còn báo số 1 và gợi ý đúng câu bạn đang làm."
  },
  {
    target: "nav-flashcards",
    route: "/learner/study",
    title: "Thẻ nhớ để ôn thêm",
    body: "Phần này dùng như kho thẻ riêng: lọc theo cấp, kanji hoặc nhóm từ để ôn ngoài bài chính."
  },
  {
    target: "nav-lookup",
    route: "/learner/study",
    title: "Tra cứu khi gặp từ lạ",
    body: "Tra cứu hoạt động như từ điển ngắn: nghĩa, cách dùng, ví dụ và ngữ cảnh nên dùng."
  },
  {
    target: "study-next-action",
    route: "/learner/study",
    title: "Bây giờ vào học",
    body: "Tour xong thì không cần đoán nữa. Bấm nút này, VAJA sẽ đưa bạn vào thẻ đầu tiên của bài đang mở.",
    primaryLabel: "Bắt đầu học",
    completion: "start-study"
  }
];

const learnerTourSeenPrefix = "vaja.learnerTour.seen.v1";

export type LearnerOutletContext = {
  markOnboardingComplete: () => void;
};

export function LearnerLayout() {
  const { accessToken, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourBox, setTourBox] = useState<TourBox | null>(null);
  const [tourCardStyle, setTourCardStyle] = useState<CSSProperties>({});
  const onboardingPath = "/learner/onboarding";
  const isOnboardingRoute = location.pathname === onboardingPath;
  const tutorContext = getTutorContext(location.pathname);
  const tourStep = learnerTourSteps[Math.min(tourStepIndex, learnerTourSteps.length - 1)];
  const tourStorageKey = `${learnerTourSeenPrefix}.${user?.id ?? "guest"}`;
  const showFloatingTutor =
    Boolean(accessToken) &&
    !checkingProfile &&
    !needsOnboarding &&
    !isOnboardingRoute;

  const markOnboardingComplete = useCallback(() => {
    setNeedsOnboarding(false);
    setCheckingProfile(false);
  }, []);
  const outletContext = useMemo<LearnerOutletContext>(
    () => ({ markOnboardingComplete }),
    [markOnboardingComplete]
  );

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

  useEffect(() => {
    if (!showFloatingTutor || hasSeenLearnerTour(tourStorageKey)) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTourStepIndex(0);
      setTourOpen(true);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [showFloatingTutor, tourStorageKey]);

  useEffect(() => {
    if (!tourOpen || location.pathname === tourStep.route) {
      return;
    }
    navigate(tourStep.route);
  }, [location.pathname, navigate, tourOpen, tourStep.route]);

  useEffect(() => {
    if (!tourOpen) {
      setTourBox(null);
      setTourCardStyle({});
      document.querySelectorAll(".tour-target-active").forEach((element) => {
        element.classList.remove("tour-target-active");
      });
      return;
    }

    let retryTimer: number | undefined;
    let measureTimer: number | undefined;

    function placeTour(targetId: string, shouldScroll = false, attempt = 0) {
      document.querySelectorAll(".tour-target-active").forEach((element) => {
        element.classList.remove("tour-target-active");
      });

      const target = document.querySelector<HTMLElement>(`[data-tour="${targetId}"]`);
      if (!target) {
        setTourBox(null);
        setTourCardStyle({
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(360px, calc(100vw - 32px))"
        });
        if (attempt < 10) {
          retryTimer = window.setTimeout(() => placeTour(targetId, shouldScroll, attempt + 1), 120);
        }
        return;
      }

      if (shouldScroll) {
        target.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
      }
      target.classList.add("tour-target-active");

      if (measureTimer) {
        window.clearTimeout(measureTimer);
      }
      measureTimer = window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const padding = 10;
        const paddedLeft = rect.left - padding;
        const paddedTop = rect.top - padding;
        const paddedRight = rect.right + padding;
        const paddedBottom = rect.bottom + padding;
        const boxLeft = clamp(paddedLeft, 10, Math.max(10, window.innerWidth - 30));
        const boxTop = clamp(paddedTop, 10, Math.max(10, window.innerHeight - 30));
        const boxRight = clamp(paddedRight, boxLeft + 20, window.innerWidth - 10);
        const boxBottom = clamp(paddedBottom, boxTop + 20, window.innerHeight - 10);
        const nextBox = {
          top: boxTop,
          left: boxLeft,
          width: boxRight - boxLeft,
          height: boxBottom - boxTop
        };
        setTourBox(nextBox);

        const cardWidth = Math.min(380, window.innerWidth - 32);
        const card = document.querySelector<HTMLElement>(".learner-tour-card");
        const measuredCardHeight = Math.max(
          card?.getBoundingClientRect().height ?? 0,
          card?.scrollHeight ?? 0,
          window.innerWidth < 360 ? 320 : 260
        );
        const cardHeight = Math.min(measuredCardHeight, window.innerHeight - 32);
        const belowTop = nextBox.top + nextBox.height + 14;
        const aboveTop = nextBox.top - cardHeight - 14;
        const belowSpace = window.innerHeight - belowTop - 16;
        const aboveSpace = aboveTop - 16;
        const preferredTop = belowSpace >= cardHeight
          ? belowTop
          : aboveSpace >= 0
            ? aboveTop
            : belowSpace >= aboveSpace
              ? belowTop
              : aboveTop;
        const top = clamp(preferredTop, 16, Math.max(16, window.innerHeight - cardHeight - 16));
        const left = clamp(nextBox.left, 16, Math.max(16, window.innerWidth - cardWidth - 16));
        setTourCardStyle({ maxHeight: window.innerHeight - 32, overflowY: "auto", top, left, width: cardWidth });
      }, 80);
    }

    function handleViewportChange() {
      placeTour(tourStep.target);
    }

    placeTour(tourStep.target, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      if (measureTimer) {
        window.clearTimeout(measureTimer);
      }
      window.removeEventListener("resize", handleViewportChange);
      document.querySelectorAll(".tour-target-active").forEach((element) => {
        element.classList.remove("tour-target-active");
      });
    };
  }, [tourOpen, tourStep.target, location.pathname]);

  const closeTour = useCallback(() => {
    markLearnerTourSeen(tourStorageKey);
    setTourOpen(false);
  }, [tourStorageKey]);

  const startStudyFromTour = useCallback(() => {
    markLearnerTourSeen(tourStorageKey);
    setTourOpen(false);
    if (location.pathname !== "/learner/study") {
      navigate("/learner/study");
    }
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("vaja:start-study-lesson"));
    }, 260);
  }, [location.pathname, navigate, tourStorageKey]);

  const openTour = useCallback(() => {
    setTourStepIndex(0);
    setTourOpen(true);
  }, []);

  const goToPreviousTourStep = useCallback(() => {
    setTourStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const goToNextTourStep = useCallback(() => {
    if (tourStepIndex >= learnerTourSteps.length - 1) {
      if (tourStep.completion === "start-study") {
        startStudyFromTour();
        return;
      }
      closeTour();
      return;
    }
    setTourStepIndex((current) => Math.min(learnerTourSteps.length - 1, current + 1));
  }, [closeTour, startStudyFromTour, tourStep, tourStepIndex]);

  useEffect(() => {
    if (!tourOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeTour();
      }
      if (event.key === "ArrowLeft") {
        goToPreviousTourStep();
      }
      if (event.key === "ArrowRight") {
        goToNextTourStep();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTour, goToNextTourStep, goToPreviousTourStep, tourOpen]);

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
                data-tour={navTourTargets[item.to]}
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
          <div className="topbar-actions">
            <button className="tour-trigger-button" type="button" onClick={openTour}>
              <HelpCircle size={17} />
              Giới thiệu nhanh
            </button>
            <div className="status-chip" data-tour="daily-status">
              <Flame size={17} />
              Mỗi ngày một bài nhỏ
            </div>
          </div>
        </header>
        {checkingProfile ? (
          <LoadingPanel>Đang chuẩn bị góc học của bạn...</LoadingPanel>
        ) : needsOnboarding && !isOnboardingRoute ? (
          <Navigate replace to={onboardingPath} />
        ) : (
          <Outlet context={outletContext} />
        )}
        {showFloatingTutor && (
          <FloatingTutor
            token={accessToken ?? ""}
            contextTopic={tutorContext.topic}
            suggestions={tutorContext.suggestions}
          />
        )}
        {tourOpen && (
          <LearnerTourOverlay
            box={tourBox}
            cardStyle={tourCardStyle}
            current={tourStepIndex + 1}
            step={tourStep}
            total={learnerTourSteps.length}
            onBack={goToPreviousTourStep}
            onClose={closeTour}
            onNext={goToNextTourStep}
          />
        )}
      </div>
    </div>
  );
}

function LearnerTourOverlay({
  box,
  cardStyle,
  current,
  step,
  total,
  onBack,
  onClose,
  onNext
}: {
  box: TourBox | null;
  cardStyle: CSSProperties;
  current: number;
  step: LearnerTourStep;
  total: number;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const lastStep = current === total;

  return (
    <div className="learner-tour-layer" role="dialog" aria-modal="true" aria-labelledby="learner-tour-title">
      <button className="learner-tour-click-catcher" type="button" aria-label="Bỏ qua giới thiệu" onClick={onClose} />
      {box && (
        <div
          className="learner-tour-highlight"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height
          }}
        />
      )}
      <article className="learner-tour-card" style={cardStyle}>
        <div className="learner-tour-card-head">
          <span>{current}/{total}</span>
          <button className="icon-button" type="button" title="Bỏ qua" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <h2 id="learner-tour-title">{step.title}</h2>
        <p>{step.body}</p>
        <div className="learner-tour-progress" aria-hidden="true">
          {Array.from({ length: total }).map((_, index) => (
            <span className={index + 1 <= current ? "active" : ""} key={index} />
          ))}
        </div>
        <div className="learner-tour-actions">
          <button className="learner-tour-skip" type="button" onClick={onClose}>
            Bỏ qua
          </button>
          <div>
            <button className="icon-text-button ghost" type="button" disabled={current === 1} onClick={onBack}>
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <button className="primary-button" type="button" onClick={onNext}>
              {lastStep ? step.primaryLabel ?? "Xong" : "Tiếp"}
              {!lastStep && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function hasSeenLearnerTour(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return true;
  }
}

function markLearnerTourSeen(key: string) {
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // Local storage may be blocked in private contexts; the tour can still close for this session.
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

  return {
    topic: "dashboard",
    suggestions: ["Tôi nên ôn gì hôm nay?", "Giải thích は và が", "Tạo ví dụ N5 với です"]
  };
}
