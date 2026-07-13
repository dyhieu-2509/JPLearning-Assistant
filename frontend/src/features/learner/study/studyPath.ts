export type StudyFlashcard = {
  front: string;
  back: string;
  hint: string;
};

export type StudyQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type StudyLesson = {
  id: string;
  level: "N5" | "N4";
  title: string;
  focus: string;
  summary: string;
  pattern: string;
  example: string;
  translation: string;
  flashcards: StudyFlashcard[];
  questions: StudyQuestion[];
};

export const passThreshold = 85;

export const studyLessons: StudyLesson[] = [
  {
    id: "n5-desu-wa",
    level: "N5",
    title: "Bài 1: Giới thiệu bản thân",
    focus: "です và は",
    summary: "Dùng một câu đơn giản để nói mình là ai, đang học gì hoặc thích gì.",
    pattern: "A は B です。",
    example: "わたしは学生です。",
    translation: "Tôi là học sinh/sinh viên.",
    flashcards: [
      { front: "わたし", back: "tôi", hint: "Từ xưng hô cơ bản" },
      { front: "学生", back: "học sinh / sinh viên", hint: "がくせい" },
      { front: "です", back: "là / thì / ở dạng lịch sự", hint: "Đặt cuối câu" },
      { front: "は", back: "đánh dấu chủ đề", hint: "Viết là は, đọc là wa" }
    ],
    questions: [
      {
        id: "n5-desu-wa-q1",
        prompt: "Câu nào đúng để nói: Tôi là sinh viên?",
        options: ["わたしは学生です。", "わたしを学生です。", "わたしが学生をです。", "学生はわたしをです。"],
        answer: "わたしは学生です。",
        explanation: "Mẫu đúng là A は B です。"
      },
      {
        id: "n5-desu-wa-q2",
        prompt: "Trong câu わたしは学生です, は dùng để làm gì?",
        options: ["Đánh dấu chủ đề", "Đánh dấu tân ngữ", "Tạo phủ định", "Chỉ thời gian"],
        answer: "Đánh dấu chủ đề",
        explanation: "は nêu chủ đề đang được nói tới."
      },
      {
        id: "n5-desu-wa-q3",
        prompt: "です thường đứng ở đâu?",
        options: ["Cuối câu", "Đầu câu", "Trước は", "Sau mọi danh từ trong câu"],
        answer: "Cuối câu",
        explanation: "です đặt cuối câu để tạo sắc thái lịch sự."
      },
      {
        id: "n5-desu-wa-q4",
        prompt: "学生 đọc là gì?",
        options: ["がくせい", "せんせい", "ともだち", "にほん"],
        answer: "がくせい",
        explanation: "学生 đọc là がくせい."
      },
      {
        id: "n5-desu-wa-q5",
        prompt: "Câu わたしは学生です có nghĩa gần nhất là gì?",
        options: ["Tôi là sinh viên", "Tôi ăn cơm", "Tôi đi học", "Tôi không hiểu"],
        answer: "Tôi là sinh viên",
        explanation: "わたし là tôi, 学生 là sinh viên, です là dạng lịch sự."
      }
    ]
  },
  {
    id: "n5-o-e",
    level: "N5",
    title: "Bài 2: Đi đâu, làm gì",
    focus: "を và へ",
    summary: "Nói hành động đơn giản: ăn gì, uống gì, đi tới đâu.",
    pattern: "N を Vます。 / Place へ 行きます。",
    example: "水を飲みます。駅へ行きます。",
    translation: "Tôi uống nước. Tôi đi tới nhà ga.",
    flashcards: [
      { front: "水", back: "nước", hint: "みず" },
      { front: "飲みます", back: "uống", hint: "のみます" },
      { front: "駅", back: "nhà ga", hint: "えき" },
      { front: "行きます", back: "đi", hint: "いきます" }
    ],
    questions: [
      {
        id: "n5-o-e-q1",
        prompt: "Chọn câu đúng: Tôi uống nước.",
        options: ["水を飲みます。", "水へ飲みます。", "水は行きます。", "水です飲みます。"],
        answer: "水を飲みます。",
        explanation: "を đánh dấu đối tượng của hành động uống."
      },
      {
        id: "n5-o-e-q2",
        prompt: "駅へ行きます nghĩa là gì?",
        options: ["Đi tới nhà ga", "Uống nước", "Là nhà ga", "Không đi"],
        answer: "Đi tới nhà ga",
        explanation: "へ chỉ hướng đi tới."
      },
      {
        id: "n5-o-e-q3",
        prompt: "を thường đi với phần nào?",
        options: ["Đối tượng của hành động", "Nơi đến", "Chủ đề", "Câu hỏi"],
        answer: "Đối tượng của hành động",
        explanation: "Trong 水を飲みます, 水 là thứ được uống."
      },
      {
        id: "n5-o-e-q4",
        prompt: "へ trong 駅へ行きます nhấn mạnh điều gì?",
        options: ["Hướng đến", "Người nói", "Đồ vật", "Phủ định"],
        answer: "Hướng đến",
        explanation: "へ dùng để chỉ hướng hoặc đích đến."
      },
      {
        id: "n5-o-e-q5",
        prompt: "飲みます là động từ nào?",
        options: ["uống", "ăn", "đi", "nghe"],
        answer: "uống",
        explanation: "飲みます nghĩa là uống."
      }
    ]
  },
  {
    id: "n4-nakereba",
    level: "N4",
    title: "Bài 3: Việc phải làm",
    focus: "なければなりません",
    summary: "Nói việc bắt buộc phải làm, ví dụ bài tập, công việc hoặc lịch học.",
    pattern: "Vない bỏ い + ければなりません。",
    example: "宿題をしなければなりません。",
    translation: "Tôi phải làm bài tập.",
    flashcards: [
      { front: "宿題", back: "bài tập về nhà", hint: "しゅくだい" },
      { front: "しなければなりません", back: "phải làm", hint: "Từ する" },
      { front: "勉強しなければなりません", back: "phải học", hint: "勉強する -> 勉強しない" },
      { front: "行かなければなりません", back: "phải đi", hint: "行く -> 行かない" }
    ],
    questions: [
      {
        id: "n4-nakereba-q1",
        prompt: "宿題をしなければなりません nghĩa là gì?",
        options: ["Phải làm bài tập", "Có thể làm bài tập", "Đã làm bài tập", "Không làm bài tập"],
        answer: "Phải làm bài tập",
        explanation: "なければなりません diễn tả nghĩa vụ."
      },
      {
        id: "n4-nakereba-q2",
        prompt: "行く chuyển sang mẫu 'phải đi' là gì?",
        options: ["行かなければなりません", "行きなければなりません", "行くなければなりません", "行ってなりません"],
        answer: "行かなければなりません",
        explanation: "行く có thể ない là 行かない, rồi đổi thành 行かなければなりません."
      },
      {
        id: "n4-nakereba-q3",
        prompt: "Mẫu なければなりません thuộc ý nghĩa nào?",
        options: ["Nghĩa vụ", "So sánh", "Kinh nghiệm", "Dự đoán"],
        answer: "Nghĩa vụ",
        explanation: "Mẫu này dùng khi có việc bắt buộc phải làm."
      },
      {
        id: "n4-nakereba-q4",
        prompt: "勉強する thành 'phải học' là gì?",
        options: ["勉強しなければなりません", "勉強するなりません", "勉強したことがあります", "勉強しておきます"],
        answer: "勉強しなければなりません",
        explanation: "する đổi sang しない, rồi dùng しなければなりません."
      },
      {
        id: "n4-nakereba-q5",
        prompt: "Câu nào tự nhiên nhất khi nói 'Tôi phải uống thuốc'?",
        options: ["薬を飲まなければなりません。", "薬へ飲まなければなりません。", "薬です飲みます。", "薬を飲みたことがあります。"],
        answer: "薬を飲まなければなりません。",
        explanation: "薬を飲む là uống thuốc, đổi sang 飲まなければなりません."
      }
    ]
  }
];
