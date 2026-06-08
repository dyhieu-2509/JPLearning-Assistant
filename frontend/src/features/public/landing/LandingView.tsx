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
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { homePathForUser } from "../../../shared/auth";
import { logoUrl } from "../../../shared/assets";
import { ChoiceCard, IconTextButton, InfoCard, PrimaryButton, TopicChip } from "../../../shared/components";

const productHighlights = [
  {
    icon: <Bot size={22} />,
    title: "Trợ lý nhớ ngữ cảnh",
    description: "Nội dung chat, nguồn tham khảo, kỹ năng yếu và chủ đề gần đây đều được đưa vào hồ sơ học."
  },
  {
    icon: <Layers3 size={22} />,
    title: "Ôn tập theo ngày",
    description: "Thẻ nhớ và tín hiệu tiến độ ưu tiên đúng phần từ vựng, ngữ pháp, kanji cần luyện lại."
  },
  {
    icon: <CalendarCheck size={22} />,
    title: "Lộ trình có căn cứ",
    description: "Kế hoạch học dựa trên onboarding, bài kiểm tra, chat và điểm nắm vững thay vì lộ trình chung chung."
  }
];

const previewRows = [
  { label: "Cá nhân hóa", value: "8 câu hỏi", icon: <Sparkles size={18} /> },
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

  if (isAuthenticated) {
    return <Navigate replace to={homePathForUser(user)} />;
  }

  return (
    <main className="landing-screen">
      <section className="landing-hero">
        <img className="landing-hero-mark" src={logoUrl} alt="" aria-hidden="true" />
        <div className="landing-copy">
          <p className="eyebrow">VAJA 日本語</p>
          <h1>Học tiếng Nhật mỗi ngày như một hành trình nhỏ.</h1>
          <p>
            Làm vài câu cá nhân hóa trước, rồi VAJA sẽ mở lộ trình học tiếng Nhật bằng tiếng Việt: chat, thẻ nhớ,
            kiểm tra nhanh và kế hoạch ôn tập trong cùng một không gian.
          </p>
          <div className="chip-row">
            <TopicChip>JLPT N5-N4</TopicChip>
            <TopicChip>こんにちは</TopicChip>
            <TopicChip>かな・漢字</TopicChip>
            <TopicChip>Cá nhân hóa</TopicChip>
          </div>
          <div className="landing-actions">
            <PrimaryButton type="button" onClick={() => setChoosingPath(true)}>
              <Sparkles size={18} />
              Bắt đầu học
            </PrimaryButton>
            <IconTextButton type="button" variant="ghost" onClick={() => navigate("/login?mode=login")}>
              <LogIn size={18} />
              Tôi đã có tài khoản
            </IconTextButton>
          </div>
          <div className="landing-proof-row" aria-label="Tín hiệu sản phẩm">
            <span>
              <CheckCircle2 size={17} />
              Cá nhân hóa trước đăng nhập
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
        <section className="landing-conversion-band" aria-label="Chọn cách bắt đầu">
          <div className="landing-choice-copy">
            <p className="eyebrow">始めよう</p>
            <h2>Bạn muốn bắt đầu theo cách nào?</h2>
            <p>Người mới làm 8 câu cá nhân hóa trước. Người đang học đi thẳng vào đăng nhập.</p>
          </div>
          <div className="choice-grid landing-path-grid">
            <ChoiceCard
              label="Người học mới"
              description="Trả lời 8 câu để VAJA chọn trình độ, mục tiêu và cách giải thích phù hợp."
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
          <h2>Mọi hoạt động đều dùng chung hồ sơ cá nhân.</h2>
          <p>
            8 câu đầu không chỉ để trang trí. Chúng trở thành dữ liệu giúp VAJA chọn kiến thức, cách giải thích,
            lịch ôn tập, bài kiểm tra và đề xuất lộ trình phù hợp.
          </p>
        </div>
        <div className="landing-product-preview" aria-label="Xem trước bảng học VAJA">
          <div className="preview-topbar">
            <img src={logoUrl} alt="VAJA logo" />
            <div>
              <strong>VAJA 学習スペース</strong>
              <span>Trợ lý tiếng Nhật cá nhân hóa</span>
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
