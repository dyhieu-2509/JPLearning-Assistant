import { Activity, BookOpenCheck, Bot, DatabaseZap, ShieldCheck, UsersRound } from "lucide-react";
import { EmptyState, MetricTile, PageHeader, Panel, TopicChip } from "../../../shared/components";

const adminFocusAreas = [
  "Chất lượng hồ sơ học",
  "Độ phủ đồ thị kiến thức",
  "Độ tin cậy câu trả lời",
  "Mức sẵn sàng nội dung JLPT",
  "Hiệu chỉnh kiểm tra"
];

const adminWorkstreams = [
  {
    title: "Quản lý người học",
    description: "Theo dõi nhóm người học, câu trả lời onboarding, tín hiệu tiến độ, kỹ năng yếu và rủi ro bỏ học."
  },
  {
    title: "Vận hành kiến thức",
    description: "Rà soát nút từ vựng, ngữ pháp, kanji, quan hệ kiến thức và trạng thái lập chỉ mục vector."
  },
  {
    title: "Chất lượng trợ lý",
    description: "Kiểm tra câu trả lời có độ tin cậy thấp, thiếu nguồn, lỗi lặp lại và trường hợp cần can thiệp."
  },
  {
    title: "Quản trị nội dung",
    description: "Chuẩn bị bộ thẻ JLPT, ngân hàng câu hỏi, mẫu lộ trình học và nội dung MVP sẵn sàng triển khai."
  }
];

export function AdminDashboardView() {
  return (
    <main className="page-section">
      <PageHeader eyebrow="Quản trị" title="Bảng vận hành" />

      <div className="dashboard-grid">
        <MetricTile icon={<UsersRound size={22} />} label="Tài khoản học" value="-" accent="sky" />
        <MetricTile icon={<DatabaseZap size={22} />} label="Mục kiến thức" value="-" accent="green" />
        <MetricTile icon={<Bot size={22} />} label="Buổi trợ lý" value="-" accent="amber" />
        <MetricTile icon={<Activity size={22} />} label="Hàng đợi rà soát" value="-" accent="rose" />
      </div>

      <Panel className="admin-overview-panel" title="Ranh giới quản trị" eyebrow="Cấu trúc MVP">
        <div className="admin-boundary">
          <ShieldCheck size={36} />
          <div>
            <strong>Trải nghiệm quản trị và người học đã được tách riêng.</strong>
            <p className="muted-copy">
              Người học dùng `/learner` cho trợ lý, thẻ nhớ, kiểm tra và lộ trình. Quản trị dùng `/admin` cho vận
              hành, quản trị nội dung, theo dõi người học và kiểm soát chất lượng hệ thống.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Luồng việc quản trị" eyebrow="Bề mặt sản phẩm">
        <div className="admin-workstream-grid">
          {adminWorkstreams.map((item) => (
            <article className="admin-workstream" key={item.title}>
              <BookOpenCheck size={20} />
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Tín hiệu chất lượng cá nhân hóa" eyebrow="Cần theo dõi">
        <div className="chip-row">
          {adminFocusAreas.map((area) => (
            <TopicChip key={area}>{area}</TopicChip>
          ))}
        </div>
      </Panel>

      <EmptyState compact>
        API quản trị chưa được nối đầy đủ. Task backend tiếp theo nên mở phân tích người học, quản lý nội dung và
        điểm rà soát chất lượng trợ lý sau quyền quản trị.
      </EmptyState>
    </main>
  );
}
