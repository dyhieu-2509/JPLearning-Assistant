export const learningPathwayOptions = [
  {
    value: "jlpt_foundation",
    label: "JLPT từng bước",
    description: "Đi theo vòng học mới, quiz ngắn, sửa lỗi và ôn thẻ."
  },
  {
    value: "conversation",
    label: "Giao tiếp hằng ngày",
    description: "Ưu tiên hội thoại ngắn, ví dụ tự nhiên và phản xạ câu cơ bản."
  },
  {
    value: "school",
    label: "Bài trên lớp",
    description: "Ôn theo bài học, từ vựng và mẫu câu đang học ở trường."
  },
  {
    value: "work",
    label: "Tiếng Nhật công việc",
    description: "Ưu tiên cách nói lịch sự, tự giới thiệu, email và tình huống công sở."
  },
  {
    value: "reading",
    label: "Đọc hiểu",
    description: "Tăng từ vựng, kanji và đọc đoạn ngắn N5/N4."
  }
] as const;

export type LearningPathway = (typeof learningPathwayOptions)[number]["value"];

export function learningPathwayLabel(value?: string | null): string {
  return learningPathwayOptions.find((option) => option.value === value)?.label ?? "JLPT từng bước";
}
