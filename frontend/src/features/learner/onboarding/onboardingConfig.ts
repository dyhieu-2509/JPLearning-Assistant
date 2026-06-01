import {
  BookOpenCheck,
  CalendarClock,
  GraduationCap,
  Languages,
  MessageCircle,
  PencilLine,
  Sparkles,
  Target,
  type LucideIcon
} from "lucide-react";

export type OnboardingField =
  | "currentLevel"
  | "targetLevel"
  | "goal"
  | "deadline"
  | "dailyStudyMinutes"
  | "weakSkills"
  | "explanationStyle"
  | "romajiEnabled";

export type OnboardingOption = {
  value: string;
  label: string;
  description?: string;
};

export type OnboardingQuestion = {
  id: OnboardingField;
  eyebrow: string;
  title: string;
  subtitle: string;
  multi?: boolean;
  icon: LucideIcon;
  options: OnboardingOption[];
};

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "currentLevel",
    eyebrow: "Level",
    title: "Trình độ hiện tại của bạn?",
    subtitle: "VAJA dùng level này để chọn độ khó khi chat, quiz và flashcard.",
    icon: GraduationCap,
    options: [
      { value: "N5", label: "Mới bắt đầu / N5", description: "Hiragana, katakana, mẫu câu cơ bản" },
      { value: "N4", label: "N4", description: "Đã biết câu cơ bản và muốn tăng tốc" },
      { value: "N3", label: "N3", description: "Đọc hiểu trung cấp, cần luyện đều" },
      { value: "N2", label: "N2", description: "Tập trung đọc, nghe và business Japanese" },
      { value: "N1", label: "N1", description: "Nâng độ chính xác và tốc độ xử lý" }
    ]
  },
  {
    id: "targetLevel",
    eyebrow: "Target",
    title: "Bạn muốn đạt mục tiêu nào?",
    subtitle: "Target level giúp planner tạo roadmap sát với kỳ vọng.",
    icon: Target,
    options: [
      { value: "N5", label: "N5", description: "Nền tảng nhập môn" },
      { value: "N4", label: "N4", description: "Giao tiếp và đọc hiểu cơ bản" },
      { value: "N3", label: "N3", description: "Trung cấp, đọc đoạn dài hơn" },
      { value: "N2", label: "N2", description: "Du học, công việc, đọc hiểu nâng cao" },
      { value: "N1", label: "N1", description: "Nâng cấp học thuật và chuyên môn" }
    ]
  },
  {
    id: "goal",
    eyebrow: "Goal",
    title: "Mục tiêu học chính là gì?",
    subtitle: "Mục tiêu này sẽ được đưa vào profile và prompt cá nhân hóa.",
    icon: BookOpenCheck,
    options: [
      { value: "Pass JLPT", label: "Thi JLPT", description: "Ưu tiên ngữ pháp, từ vựng, đọc hiểu" },
      { value: "Improve conversation", label: "Giao tiếp", description: "Ưu tiên ví dụ hội thoại và phản xạ" },
      { value: "Study abroad preparation", label: "Du học", description: "Từ vựng trường học, đời sống, thủ tục" },
      { value: "Work in Japanese", label: "Công việc", description: "Keigo, email, business vocabulary" },
      { value: "Read Japanese content", label: "Đọc hiểu", description: "Manga, tin tức, tài liệu Nhật" }
    ]
  },
  {
    id: "deadline",
    eyebrow: "Timeline",
    title: "Bạn muốn thấy tiến bộ trong bao lâu?",
    subtitle: "Timeline giúp VAJA chọn nhịp học và mức độ ôn tập.",
    icon: CalendarClock,
    options: [
      { value: "in 1 month", label: "1 tháng", description: "Cường độ cao, ôn tập dày" },
      { value: "in 3 months", label: "3 tháng", description: "Nhịp học đều, phù hợp MVP demo" },
      { value: "in 6 months", label: "6 tháng", description: "Lộ trình bền, ít quá tải" },
      { value: "without a fixed deadline", label: "Không gấp", description: "Tập trung hiểu chắc" }
    ]
  },
  {
    id: "dailyStudyMinutes",
    eyebrow: "Habit",
    title: "Mỗi ngày bạn học được bao lâu?",
    subtitle: "Daily target sẽ được dùng trong dashboard và study plan.",
    icon: Sparkles,
    options: [
      { value: "10", label: "10 phút", description: "Ôn nhanh hằng ngày" },
      { value: "20", label: "20 phút", description: "Nhịp nhẹ nhưng đều" },
      { value: "30", label: "30 phút", description: "Khuyến nghị cho tiến độ ổn định" },
      { value: "60", label: "60 phút", description: "Tăng tốc rõ rệt" }
    ]
  },
  {
    id: "weakSkills",
    eyebrow: "Weakness",
    title: "Bạn thấy yếu phần nào nhất?",
    subtitle: "Có thể chọn nhiều kỹ năng để VAJA ưu tiên khi cá nhân hóa.",
    multi: true,
    icon: PencilLine,
    options: [
      { value: "vocabulary", label: "Từ vựng", description: "Nhớ nghĩa, collocation, ví dụ" },
      { value: "grammar", label: "Ngữ pháp", description: "Mẫu câu, sắc thái, cách dùng" },
      { value: "kanji", label: "Kanji", description: "Âm đọc, nghĩa, ghi nhớ" },
      { value: "listening", label: "Nghe", description: "Tốc độ và bắt ý chính" },
      { value: "reading", label: "Đọc", description: "Đọc đoạn dài, phân tích câu" },
      { value: "speaking", label: "Nói", description: "Tự nhiên và đúng ngữ cảnh" }
    ]
  },
  {
    id: "explanationStyle",
    eyebrow: "Tutor style",
    title: "Bạn muốn VAJA giải thích kiểu nào?",
    subtitle: "Chatbot sẽ dùng style này khi giải thích câu trả lời.",
    icon: MessageCircle,
    options: [
      { value: "concise", label: "Ngắn gọn", description: "Trả lời nhanh, ít lý thuyết" },
      { value: "step-by-step", label: "Từng bước", description: "Giải thích rõ logic và lỗi sai" },
      { value: "example-first", label: "Ví dụ trước", description: "Dùng câu mẫu rồi rút quy tắc" }
    ]
  },
  {
    id: "romajiEnabled",
    eyebrow: "Reading aid",
    title: "Bạn có muốn bật romaji gợi ý không?",
    subtitle: "Người mới học nên bật, người đã vững kana có thể tắt.",
    icon: Languages,
    options: [
      { value: "true", label: "Bật romaji", description: "Phù hợp khi mới bắt đầu hoặc cần đọc nhanh" },
      { value: "false", label: "Tắt romaji", description: "Tập trung đọc kana/kanji tự nhiên hơn" }
    ]
  }
];
