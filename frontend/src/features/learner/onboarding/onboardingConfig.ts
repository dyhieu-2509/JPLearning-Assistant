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
    eyebrow: "Trình độ",
    title: "Trình độ hiện tại của bạn?",
    subtitle: "VAJA dùng trình độ này để chọn độ khó khi trò chuyện, kiểm tra nhanh và ôn thẻ nhớ.",
    icon: GraduationCap,
    options: [
      { value: "N5", label: "Mới bắt đầu / N5", description: "Hiragana, katakana, mẫu câu cơ bản" },
      { value: "N4", label: "N4", description: "Đã biết câu cơ bản và muốn tăng tốc" },
      { value: "N3", label: "N3", description: "Đọc hiểu trung cấp, cần luyện đều" },
      { value: "N2", label: "N2", description: "Tập trung đọc, nghe và tiếng Nhật công việc" },
      { value: "N1", label: "N1", description: "Nâng độ chính xác và tốc độ xử lý" }
    ]
  },
  {
    id: "targetLevel",
    eyebrow: "Mục tiêu",
    title: "Bạn muốn đạt mục tiêu nào?",
    subtitle: "Mục tiêu JLPT giúp VAJA tạo lộ trình học sát với kỳ vọng.",
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
    eyebrow: "Lý do học",
    title: "Mục tiêu học chính là gì?",
    subtitle: "Mục tiêu này giúp VAJA chọn ví dụ, bài ôn và kế hoạch phù hợp hơn.",
    icon: BookOpenCheck,
    options: [
      { value: "Thi JLPT", label: "Thi JLPT", description: "Ưu tiên ngữ pháp, từ vựng, đọc hiểu" },
      { value: "Luyện giao tiếp", label: "Giao tiếp", description: "Ưu tiên ví dụ hội thoại và phản xạ" },
      { value: "Chuẩn bị du học", label: "Du học", description: "Từ vựng trường học, đời sống, thủ tục" },
      { value: "Dùng tiếng Nhật trong công việc", label: "Công việc", description: "Kính ngữ, email, từ vựng công việc" },
      { value: "Đọc nội dung tiếng Nhật", label: "Đọc hiểu", description: "Manga, tin tức, tài liệu Nhật" }
    ]
  },
  {
    id: "deadline",
    eyebrow: "Thời gian",
    title: "Bạn muốn thấy tiến bộ trong bao lâu?",
    subtitle: "Mốc thời gian giúp VAJA chọn nhịp học và mức độ ôn tập.",
    icon: CalendarClock,
    options: [
      { value: "trong 1 tháng", label: "1 tháng", description: "Cường độ cao, ôn tập dày" },
      { value: "trong 3 tháng", label: "3 tháng", description: "Nhịp học đều, phù hợp tiến độ ổn định" },
      { value: "trong 6 tháng", label: "6 tháng", description: "Lộ trình bền, ít quá tải" },
      { value: "không giới hạn thời gian", label: "Không gấp", description: "Tập trung hiểu chắc" }
    ]
  },
  {
    id: "dailyStudyMinutes",
    eyebrow: "Thói quen",
    title: "Mỗi ngày bạn học được bao lâu?",
    subtitle: "Mục tiêu hằng ngày sẽ được dùng trong bảng học tập và lộ trình ôn tập.",
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
    eyebrow: "Cần luyện",
    title: "Bạn thấy yếu phần nào nhất?",
    subtitle: "Có thể chọn nhiều phần để VAJA ưu tiên trong các bài ôn đầu tiên.",
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
    eyebrow: "Cách giải thích",
    title: "Bạn muốn VAJA giải thích kiểu nào?",
    subtitle: "VAJA sẽ dùng cách này khi giải thích câu trả lời.",
    icon: MessageCircle,
    options: [
      { value: "concise", label: "Ngắn gọn", description: "Trả lời nhanh, ít lý thuyết" },
      { value: "step-by-step", label: "Từng bước", description: "Giải thích rõ logic và lỗi sai" },
      { value: "example-first", label: "Ví dụ trước", description: "Dùng câu mẫu rồi rút quy tắc" }
    ]
  },
  {
    id: "romajiEnabled",
    eyebrow: "Gợi ý đọc",
    title: "Bạn có muốn bật romaji gợi ý không?",
    subtitle: "Người mới học nên bật, người đã vững kana có thể tắt.",
    icon: Languages,
    options: [
      { value: "true", label: "Bật romaji", description: "Phù hợp khi mới bắt đầu hoặc cần đọc nhanh" },
      { value: "false", label: "Tắt romaji", description: "Tập trung đọc kana/kanji tự nhiên hơn" }
    ]
  }
];
