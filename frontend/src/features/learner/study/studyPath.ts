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

export type StudyProfile = {
  currentLevel?: string | null;
  targetLevel?: string | null;
  learningPathway?: string | null;
  dailyStudyMinutes?: number | null;
  weakSkills?: string[];
};

export type StudyPathwayIntro = {
  label: string;
  title: string;
  description: string;
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

const pathwayLessons: Record<string, StudyLesson> = {
  jlpt_foundation: studyLessons[0],
  conversation: {
    id: "conversation-greetings",
    level: "N5",
    title: "Bài 1: Chào hỏi hằng ngày",
    focus: "hội thoại ngắn",
    summary: "Tập mở lời, giới thiệu ngắn và đáp lại tự nhiên trong một cuộc nói chuyện cơ bản.",
    pattern: "はじめまして。A です。よろしくお願いします。",
    example: "はじめまして。ヒエウです。よろしくお願いします。",
    translation: "Rất vui được gặp bạn. Tôi là Hiếu. Mong được giúp đỡ.",
    flashcards: [
      { front: "はじめまして", back: "rất vui được gặp lần đầu", hint: "Dùng khi mới gặp ai đó" },
      { front: "よろしくお願いします", back: "mong được giúp đỡ / rất mong được hợp tác", hint: "Câu kết khi tự giới thiệu" },
      { front: "友だち", back: "bạn bè", hint: "ともだち" },
      { front: "です", back: "là / dạng lịch sự", hint: "Đặt cuối câu" }
    ],
    questions: [
      {
        id: "conversation-greetings-q1",
        prompt: "Câu nào phù hợp khi gặp ai đó lần đầu?",
        options: ["はじめまして。", "ただいま。", "おやすみ。", "いただきます。"],
        answer: "はじめまして。",
        explanation: "はじめまして dùng khi gặp ai đó lần đầu."
      },
      {
        id: "conversation-greetings-q2",
        prompt: "よろしくお願いします thường đặt ở đâu trong phần tự giới thiệu?",
        options: ["Cuối phần giới thiệu", "Trước tên", "Giữa trợ từ", "Sau mọi động từ"],
        answer: "Cuối phần giới thiệu",
        explanation: "Câu này thường dùng để kết thúc phần tự giới thiệu một cách lịch sự."
      },
      {
        id: "conversation-greetings-q3",
        prompt: "ヒエウです có nghĩa gần nhất là gì?",
        options: ["Tôi là Hiếu", "Tôi đi học", "Tôi uống nước", "Tôi không hiểu"],
        answer: "Tôi là Hiếu",
        explanation: "Tên + です là cách nói 'tôi là...' lịch sự."
      },
      {
        id: "conversation-greetings-q4",
        prompt: "友だち đọc là gì?",
        options: ["ともだち", "せんせい", "がくせい", "かいしゃ"],
        answer: "ともだち",
        explanation: "友だち đọc là ともだち, nghĩa là bạn bè."
      },
      {
        id: "conversation-greetings-q5",
        prompt: "Pathway giao tiếp nên ưu tiên luyện gì trước?",
        options: ["Câu dùng được ngay", "Kanji hiếm", "Bài đọc dài", "Mẫu email trang trọng"],
        answer: "Câu dùng được ngay",
        explanation: "Giao tiếp hằng ngày cần phản xạ với câu ngắn và tự nhiên trước."
      }
    ]
  },
  school: {
    id: "school-classroom",
    level: "N5",
    title: "Bài 1: Hỏi bài trên lớp",
    focus: "これは何ですか",
    summary: "Tập hỏi đồ vật, từ mới và phần chưa hiểu khi đang học trên lớp.",
    pattern: "これは何ですか。 / もう一度お願いします。",
    example: "これは何ですか。もう一度お願いします。",
    translation: "Cái này là gì? Xin thầy/cô nói lại một lần nữa.",
    flashcards: [
      { front: "これ", back: "cái này", hint: "Vật gần người nói" },
      { front: "何", back: "cái gì", hint: "なん / なに" },
      { front: "もう一度", back: "một lần nữa", hint: "もういちど" },
      { front: "お願いします", back: "xin vui lòng", hint: "Cách nhờ lịch sự" }
    ],
    questions: [
      {
        id: "school-classroom-q1",
        prompt: "Câu nào dùng để hỏi 'Cái này là gì?'",
        options: ["これは何ですか。", "これは行きますか。", "何を飲みますか。", "学校へ行きます。"],
        answer: "これは何ですか。",
        explanation: "これは何ですか dùng để hỏi tên hoặc nghĩa của vật gần người nói."
      },
      {
        id: "school-classroom-q2",
        prompt: "もう一度お願いします dùng khi nào?",
        options: ["Muốn nghe lại", "Muốn về nhà", "Muốn ăn cơm", "Muốn ngủ"],
        answer: "Muốn nghe lại",
        explanation: "もう一度 nghĩa là một lần nữa, お願いします làm câu nhờ lịch sự hơn."
      },
      {
        id: "school-classroom-q3",
        prompt: "何 trong これは何ですか nghĩa là gì?",
        options: ["cái gì", "ở đâu", "khi nào", "ai"],
        answer: "cái gì",
        explanation: "何 là từ hỏi cho 'cái gì'."
      },
      {
        id: "school-classroom-q4",
        prompt: "これは chỉ vật ở vị trí nào?",
        options: ["Gần người nói", "Gần người nghe", "Xa cả hai", "Không chỉ vật"],
        answer: "Gần người nói",
        explanation: "これ dùng cho vật gần người nói."
      },
      {
        id: "school-classroom-q5",
        prompt: "Pathway bài trên lớp nên ưu tiên gì?",
        options: ["Từ vựng và mẫu đang học", "Hội thoại công sở", "Bài báo dài", "Kính ngữ nâng cao"],
        answer: "Từ vựng và mẫu đang học",
        explanation: "Người học theo lớp cần bám vào bài hiện tại để không đứt mạch."
      }
    ]
  },
  work: {
    id: "work-introduction",
    level: "N4",
    title: "Bài 1: Tự giới thiệu nơi làm việc",
    focus: "申します và lịch sự",
    summary: "Tập nói lịch sự khi giới thiệu tên, bộ phận và mong được hợp tác trong môi trường công việc.",
    pattern: "A と申します。よろしくお願いいたします。",
    example: "ブイと申します。よろしくお願いいたします。",
    translation: "Tôi tên là Bùi. Rất mong được giúp đỡ/hợp tác.",
    flashcards: [
      { front: "申します", back: "tên là / nói là (khiêm nhường)", hint: "もうします" },
      { front: "お願いいたします", back: "xin vui lòng / mong được giúp đỡ", hint: "Lịch sự hơn お願いします" },
      { front: "会社", back: "công ty", hint: "かいしゃ" },
      { front: "部署", back: "bộ phận", hint: "ぶしょ" }
    ],
    questions: [
      {
        id: "work-introduction-q1",
        prompt: "Cách nói lịch sự hơn cho 'tôi tên là Bùi' là gì?",
        options: ["ブイと申します。", "ブイを飲みます。", "ブイへ行きます。", "ブイがあります。"],
        answer: "ブイと申します。",
        explanation: "と申します là cách tự giới thiệu tên lịch sự trong công việc."
      },
      {
        id: "work-introduction-q2",
        prompt: "お願いいたします có sắc thái thế nào?",
        options: ["Lịch sự", "Thân mật", "Thô", "Phủ định"],
        answer: "Lịch sự",
        explanation: "お願いいたします lịch sự hơn お願いします."
      },
      {
        id: "work-introduction-q3",
        prompt: "会社 nghĩa là gì?",
        options: ["công ty", "trường học", "nhà ga", "bài tập"],
        answer: "công ty",
        explanation: "会社 đọc là かいしゃ, nghĩa là công ty."
      },
      {
        id: "work-introduction-q4",
        prompt: "部署 đọc là gì?",
        options: ["ぶしょ", "かいしゃ", "せんせい", "えき"],
        answer: "ぶしょ",
        explanation: "部署 đọc là ぶしょ, nghĩa là bộ phận/phòng ban."
      },
      {
        id: "work-introduction-q5",
        prompt: "Pathway công việc nên ưu tiên gì?",
        options: ["Cách nói lịch sự và tình huống công sở", "Tiếng lóng", "Bài hát", "Chỉ romaji"],
        answer: "Cách nói lịch sự và tình huống công sở",
        explanation: "Môi trường công việc cần câu lịch sự, rõ ý và đúng ngữ cảnh."
      }
    ]
  },
  reading: {
    id: "reading-short-passage",
    level: "N5",
    title: "Bài 1: Đọc đoạn ngắn N5",
    focus: "ý chính và từ khóa",
    summary: "Tập đọc một đoạn ngắn, tìm chủ đề chính và tách từ chưa biết thành thẻ nhớ.",
    pattern: "Topic は Adjective です。Reason から。",
    example: "日本語はおもしろいです。新しい言葉が多いからです。",
    translation: "Tiếng Nhật thú vị. Vì có nhiều từ mới.",
    flashcards: [
      { front: "おもしろい", back: "thú vị", hint: "Tính từ い" },
      { front: "新しい", back: "mới", hint: "あたらしい" },
      { front: "言葉", back: "từ ngữ", hint: "ことば" },
      { front: "多い", back: "nhiều", hint: "おおい" }
    ],
    questions: [
      {
        id: "reading-short-passage-q1",
        prompt: "日本語はおもしろいです nghĩa là gì?",
        options: ["Tiếng Nhật thú vị", "Tiếng Nhật khó uống", "Tôi đi Nhật", "Tôi là người Nhật"],
        answer: "Tiếng Nhật thú vị",
        explanation: "おもしろい là thú vị."
      },
      {
        id: "reading-short-passage-q2",
        prompt: "から trong câu ví dụ dùng để làm gì?",
        options: ["Nêu lý do", "Đánh dấu tân ngữ", "Tạo câu hỏi", "Chỉ nơi đến"],
        answer: "Nêu lý do",
        explanation: "から có thể dùng để nêu lý do: vì..."
      },
      {
        id: "reading-short-passage-q3",
        prompt: "言葉 nghĩa là gì?",
        options: ["từ ngữ", "nhà ga", "nước", "bộ phận"],
        answer: "từ ngữ",
        explanation: "言葉 đọc là ことば, nghĩa là từ ngữ/lời nói."
      },
      {
        id: "reading-short-passage-q4",
        prompt: "Khi đọc hiểu, bước nào nên làm trước?",
        options: ["Tìm ý chính", "Dịch từng chữ ngay", "Bỏ qua tiêu đề", "Chỉ đọc đáp án"],
        answer: "Tìm ý chính",
        explanation: "Đọc hiểu nên nắm ý chính trước rồi mới xử lý chi tiết."
      },
      {
        id: "reading-short-passage-q5",
        prompt: "Pathway đọc hiểu nên ưu tiên gì?",
        options: ["Từ khóa, kanji và câu ngắn", "Chỉ hội thoại", "Chỉ nghe", "Chỉ email công việc"],
        answer: "Từ khóa, kanji và câu ngắn",
        explanation: "Đọc hiểu tiến bộ tốt hơn khi gom từ khóa và câu mẫu thành thẻ nhớ."
      }
    ]
  }
};

const pathwayIntros: Record<string, StudyPathwayIntro> = {
  jlpt_foundation: {
    label: "JLPT từng bước",
    title: "Pathway JLPT: học chắc từng mẫu, qua quiz rồi mở bài tiếp.",
    description: "VAJA ưu tiên vòng học mới, flashcard, quiz ngắn và sửa lỗi theo chuẩn N5/N4."
  },
  conversation: {
    label: "Giao tiếp hằng ngày",
    title: "Pathway giao tiếp: học câu dùng được ngay trong đời sống.",
    description: "VAJA ưu tiên hội thoại ngắn, phản xạ câu cơ bản và cách đáp tự nhiên."
  },
  school: {
    label: "Bài trên lớp",
    title: "Pathway trên lớp: bám bài học, từ mới và mẫu câu đang gặp.",
    description: "VAJA ưu tiên câu hỏi trên lớp, từ vựng bài học và bài ôn ngắn để không bị đứt mạch."
  },
  work: {
    label: "Tiếng Nhật công việc",
    title: "Pathway công việc: học câu lịch sự và tình huống công sở.",
    description: "VAJA ưu tiên tự giới thiệu, email, nhờ vả và cách nói phù hợp môi trường làm việc."
  },
  reading: {
    label: "Đọc hiểu",
    title: "Pathway đọc hiểu: đọc câu ngắn, gom từ khóa, tăng kanji.",
    description: "VAJA ưu tiên từ vựng, kanji, ý chính và bài đọc ngắn N5/N4."
  }
};

export function buildStudyLessons(profile?: StudyProfile | null): StudyLesson[] {
  const pathway = normalizePathway(profile?.learningPathway);
  const firstLesson = pathwayLessons[pathway] ?? pathwayLessons.jlpt_foundation;
  const currentLevel = (profile?.currentLevel ?? "N5").toUpperCase();
  const targetLevel = (profile?.targetLevel ?? "N4").toUpperCase();
  const continuation = currentLevel === "N4" || targetLevel === "N4"
    ? [studyLessons[1], studyLessons[2]]
    : [studyLessons[1]];

  return [firstLesson, ...continuation.filter((lesson) => lesson.id !== firstLesson.id)];
}

export function studyPathwayIntro(profile?: StudyProfile | null): StudyPathwayIntro {
  return pathwayIntros[normalizePathway(profile?.learningPathway)] ?? pathwayIntros.jlpt_foundation;
}

export function weakSkillSummary(profile?: StudyProfile | null): string {
  const weakSkills = profile?.weakSkills?.length ? profile.weakSkills : ["vocabulary"];
  return weakSkills.slice(0, 3).map(weakSkillLabel).join(", ");
}

function normalizePathway(value?: string | null): string {
  const normalized = value?.trim().toLowerCase().replace(/-/g, "_") || "jlpt_foundation";
  return normalized in pathwayLessons ? normalized : "jlpt_foundation";
}

function weakSkillLabel(value: string): string {
  const labels: Record<string, string> = {
    vocabulary: "từ vựng",
    grammar: "ngữ pháp",
    kanji: "kanji",
    listening: "nghe",
    reading: "đọc",
    speaking: "nói"
  };
  return labels[value.toLowerCase()] ?? value;
}
