import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  LogIn,
  Sparkles,
  UserPlus
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { homePathForUser } from "../../../shared/auth";
import { logoUrl } from "../../../shared/assets";
import { ChoiceCard, IconTextButton, InfoCard, PrimaryButton, TopicChip } from "../../../shared/components";

const productHighlights = [
  {
    icon: <Bot size={22} />,
    title: "Hỏi bài bằng tiếng Việt",
    description: "Khi bí từ vựng hay ngữ pháp, bạn có thể hỏi VAJA như hỏi một bạn học biết tiếng Nhật."
  },
  {
    icon: <Layers3 size={22} />,
    title: "Ôn lại đúng lúc",
    description: "Thẻ nhớ giúp những từ, mẫu câu và kanji hay quên xuất hiện lại đúng thời điểm."
  },
  {
    icon: <CalendarCheck size={22} />,
    title: "Kế hoạch vừa sức",
    description: "Mỗi tuần có vài việc nhỏ: làm thử, ôn thẻ, tra cứu và hỏi bài khi cần."
  }
];

const previewRows = [
  { label: "Bắt đầu", value: "8 câu hỏi", icon: <Sparkles size={18} /> },
  { label: "Trọng tâm JLPT", value: "N5-N4", icon: <ClipboardCheck size={18} /> },
  { label: "Gợi ý hôm nay", value: "Lộ trình", icon: <BarChart3 size={18} /> }
];

const lessonPath = [
  { jp: "あ", vi: "Kana", state: "done" },
  { jp: "こんにちは", vi: "Chào hỏi", state: "active" },
  { jp: "です", vi: "Ngữ pháp", state: "locked" },
  { jp: "日本", vi: "Kanji", state: "locked" }
];

export function LandingView() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [choosingPath, setChoosingPath] = useState(false);
  const choiceSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!choosingPath) {
      return;
    }

    window.requestAnimationFrame(() => {
      choiceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [choosingPath]);

  function showLearnerChoices() {
    if (choosingPath) {
      choiceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setChoosingPath(true);
  }

  if (isAuthenticated) {
    return <Navigate replace to={homePathForUser(user)} />;
  }

  return (
    <main className="landing-screen">
      <section className="landing-hero">
        <img className="landing-hero-mark" src={logoUrl} alt="" aria-hidden="true" />
        <div className="landing-copy">
          <p className="eyebrow">VAJA 日本語</p>
          <h1>Học tiếng Nhật mỗi ngày bằng những bài nhỏ dễ theo.</h1>
          <p>
            Trả lời vài câu để VAJA hiểu mục tiêu của bạn, rồi bắt đầu học bằng tiếng Việt: làm thử, ôn thẻ,
            tra cứu nhanh và hỏi bài trong cùng một góc học.
          </p>
          <div className="chip-row">
            <TopicChip>JLPT N5-N4</TopicChip>
            <TopicChip>こんにちは</TopicChip>
            <TopicChip>かな・漢字</TopicChip>
            <TopicChip>Dễ bắt đầu</TopicChip>
          </div>
          <div className="landing-actions">
            <PrimaryButton type="button" onClick={showLearnerChoices}>
              <Sparkles size={18} />
              Bắt đầu học
            </PrimaryButton>
            <IconTextButton type="button" variant="ghost" onClick={() => navigate("/login?mode=login")}>
              <LogIn size={18} />
              Tôi đã có tài khoản
            </IconTextButton>
          </div>
          <div className="landing-proof-row" aria-label="Điểm nổi bật">
            <span>
              <CheckCircle2 size={17} />
              Làm quen trước khi đăng nhập
            </span>
            <span>
              <CheckCircle2 size={17} />
              Đăng nhập Google hoặc hệ thống
            </span>
            <span>
              <CheckCircle2 size={17} />
              Bảng học tập sẵn sàng
            </span>
          </div>
        </div>
        <div className="landing-path-preview" aria-label="Lộ trình học mẫu">
          <div className="path-preview-top">
            <strong>今日のレッスン</strong>
            <span>Chuỗi 5 ngày</span>
          </div>
          <div className="lesson-path">
            {lessonPath.map((item, index) => (
              <div className={`lesson-node ${item.state}`} key={item.jp}>
                <span>{item.jp}</span>
                <small>{item.vi}</small>
                {index < lessonPath.length - 1 && <i aria-hidden="true" />}
              </div>
            ))}
          </div>
          <div className="path-xp-row">
            <span>120 XP</span>
            <span>目標 N4</span>
          </div>
        </div>
      </section>

      {choosingPath && (
        <section id="start" ref={choiceSectionRef} className="landing-conversion-band" aria-label="Chọn cách bắt đầu">
          <div className="landing-choice-copy">
            <p className="eyebrow">始めよう</p>
            <h2>Bạn muốn bắt đầu theo cách nào?</h2>
            <p>Người mới trả lời 8 câu làm quen trước. Người đang học đi thẳng vào đăng nhập.</p>
          </div>
          <div className="choice-grid landing-path-grid">
            <ChoiceCard
              label="Người học mới"
              description="Trả lời 8 câu để VAJA biết trình độ, mục tiêu và cách giải thích bạn thích."
              selected={false}
              onClick={() => navigate("/onboarding")}
              icon={<UserPlus size={18} />}
            />
            <ChoiceCard
              label="Đang học tiếp"
              description="Đã có tài khoản? Vào đăng nhập và tiếp tục lộ trình hiện tại."
              selected={false}
              onClick={() => navigate("/login?mode=login")}
              icon={<ArrowRight size={18} />}
            />
          </div>
        </section>
      )}

      <section id="about" className="landing-preview-section" aria-label="Giới thiệu sản phẩm">
        <div className="landing-preview-copy">
          <p className="eyebrow">Học bằng tiếng Việt</p>
          <h2>Mỗi phần học đều nối tiếp nhau.</h2>
          <p>
            8 câu đầu giúp VAJA biết bạn đang ở đâu. Sau đó bài thử, thẻ nhớ, tra cứu và hỏi bài sẽ cùng giúp
            kế hoạch học tuần sau vừa sức hơn.
          </p>
        </div>
        <div className="landing-product-preview" aria-label="Xem trước bảng học VAJA">
          <div className="preview-topbar">
            <img src={logoUrl} alt="VAJA logo" />
            <div>
              <strong>VAJA 学習スペース</strong>
              <span>Góc học tiếng Nhật của bạn</span>
            </div>
          </div>
          <div className="preview-metrics">
            {previewRows.map((item) => (
              <div className="preview-metric" key={item.label}>
                <span>{item.icon}</span>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
          <div className="preview-chat">
            <p>Hôm nay VAJA gợi ý ôn mẫu câu です, 12 thẻ cần xem lại và một bài đọc ngắn N4.</p>
          </div>
        </div>
      </section>

      <section className="landing-highlight-grid" aria-label="Điểm nổi bật của VAJA">
        {productHighlights.map((item) => (
          <InfoCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
        ))}
      </section>
    </main>
  );
}
