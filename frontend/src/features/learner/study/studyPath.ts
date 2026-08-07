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

export type StudyPracticeTask = {
  id: string;
  label: string;
  title: string;
  prompt: string;
  exampleAnswer: string;
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
  practiceTasks?: StudyPracticeTask[];
};

export type StudyChapter = {
  id: string;
  title: string;
  level: "N5" | "N4";
  focus: string;
  description: string;
  lessons: StudyLesson[];
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

function makeQuestion(
  id: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string
): StudyQuestion {
  return { id, prompt, options, answer, explanation };
}

function makeLesson(
  id: string,
  level: "N5" | "N4",
  title: string,
  focus: string,
  summary: string,
  pattern: string,
  example: string,
  translation: string,
  flashcards: StudyFlashcard[],
  questions: StudyQuestion[]
): StudyLesson {
  return { id, level, title, focus, summary, pattern, example, translation, flashcards, questions };
}

const kanaHiraganaVowels = makeLesson(
  "kana-hiragana-vowels",
  "N5",
  "Hiragana hàng あ",
  "bảng chữ hiragana",
  "Nhận mặt chữ あ, い, う, え, お trước khi học mẫu câu. Người mới chỉ cần đọc chậm và nhớ âm chính.",
  "あ い う え お = a i u e o",
  "あおい / いいえ / うえ",
  "xanh / không / phía trên",
  [
    { front: "あ", back: "a", hint: "Âm a, mở miệng rõ" },
    { front: "い", back: "i", hint: "Âm i, ngắn và gọn" },
    { front: "う", back: "u", hint: "Âm u, môi khép nhẹ" },
    { front: "え", back: "e", hint: "Âm e" },
    { front: "お", back: "o", hint: "Âm o" }
  ],
  [
    makeQuestion("kana-vowels-q1", "あ đọc là gì?", ["a", "i", "u", "e"], "a", "あ là âm a trong hiragana."),
    makeQuestion("kana-vowels-q2", "い đọc là gì?", ["i", "a", "u", "o"], "i", "い là âm i trong hiragana."),
    makeQuestion("kana-vowels-q3", "Đâu là hàng nguyên âm hiragana đúng?", ["あ い う え お", "か き く け こ", "ア イ ウ エ オ", "さ し す せ そ"], "あ い う え お", "Hàng nguyên âm hiragana đầu tiên là あ, い, う, え, お."),
    makeQuestion("kana-vowels-q4", "え đọc là gì?", ["e", "o", "a", "u"], "e", "え là âm e."),
    makeQuestion("kana-vowels-q5", "お đọc là gì?", ["o", "a", "i", "e"], "o", "お là âm o.")
  ]
);

const kanaHiraganaRows = makeLesson(
  "kana-hiragana-rows",
  "N5",
  "Hiragana hàng か-さ-た",
  "kana ghép âm",
  "Tập đọc các hàng hay gặp: か, さ, た. Chưa cần viết đẹp, trước hết phải nhìn chữ và đọc được.",
  "Phụ âm + nguyên âm: か ka, き ki, く ku, け ke, こ ko",
  "かさ / すし / たこ",
  "ô / sushi / bạch tuộc",
  [
    { front: "か", back: "ka", hint: "Hàng k, âm a" },
    { front: "き", back: "ki", hint: "Hàng k, âm i" },
    { front: "さ", back: "sa", hint: "Hàng s, âm a" },
    { front: "し", back: "shi", hint: "Đặc biệt: không đọc là si" },
    { front: "た", back: "ta", hint: "Hàng t, âm a" },
    { front: "ち", back: "chi", hint: "Đặc biệt: không đọc là ti" }
  ],
  [
    makeQuestion("kana-rows-q1", "か đọc là gì?", ["ka", "sa", "ta", "a"], "ka", "か là âm ka."),
    makeQuestion("kana-rows-q2", "し đọc tự nhiên là gì?", ["shi", "si", "chi", "ki"], "shi", "し thường đọc là shi."),
    makeQuestion("kana-rows-q3", "た đọc là gì?", ["ta", "ka", "sa", "to"], "ta", "た là âm ta."),
    makeQuestion("kana-rows-q4", "Từ すし gồm các âm nào?", ["su + shi", "sa + si", "ku + shi", "ta + ko"], "su + shi", "す là su, し là shi."),
    makeQuestion("kana-rows-q5", "ち đọc tự nhiên là gì?", ["chi", "ti", "shi", "ki"], "chi", "ち thường đọc là chi.")
  ]
);

const kanaKatakanaEntry = makeLesson(
  "kana-katakana-entry",
  "N5",
  "Katakana cơ bản",
  "katakana và từ vay mượn",
  "Katakana dùng nhiều cho tên nước, tên người, đồ ăn và từ mượn. Học hàng ア trước để không bị ngợp khi gặp từ mới.",
  "ア イ ウ エ オ = a i u e o",
  "コーヒー / テスト / ベトナム",
  "cà phê / bài kiểm tra / Việt Nam",
  [
    { front: "ア", back: "a", hint: "Katakana của あ" },
    { front: "イ", back: "i", hint: "Katakana của い" },
    { front: "ウ", back: "u", hint: "Katakana của う" },
    { front: "エ", back: "e", hint: "Katakana của え" },
    { front: "オ", back: "o", hint: "Katakana của お" },
    { front: "コーヒー", back: "cà phê", hint: "Từ mượn hay gặp" }
  ],
  [
    makeQuestion("kana-katakana-q1", "ア đọc là gì?", ["a", "i", "u", "e"], "a", "ア là âm a trong katakana."),
    makeQuestion("kana-katakana-q2", "Đâu là hàng nguyên âm katakana đúng?", ["ア イ ウ エ オ", "あ い う え お", "か き く け こ", "さ し す せ そ"], "ア イ ウ エ オ", "Katakana dùng nét góc cạnh hơn hiragana."),
    makeQuestion("kana-katakana-q3", "コーヒー nghĩa là gì?", ["cà phê", "trà", "nước", "cơm"], "cà phê", "コーヒー là từ mượn, nghĩa là cà phê."),
    makeQuestion("kana-katakana-q4", "テスト thường nghĩa là gì?", ["bài kiểm tra", "giáo viên", "nhà ga", "sách"], "bài kiểm tra", "テスト là từ mượn từ test."),
    makeQuestion("kana-katakana-q5", "Katakana thường dùng cho nhóm nào?", ["từ mượn và tên riêng", "trợ từ は", "chia động từ", "đếm ngày tháng"], "từ mượn và tên riêng", "Katakana hay dùng cho từ mượn, tên riêng và tên nước.")
  ]
);

const n5DesuWa = makeLesson(
  "n5-desu-wa",
  "N5",
  "Giới thiệu bản thân",
  "です và は",
  "Dùng một câu đơn giản để nói mình là ai, đang học gì hoặc thích gì.",
  "A は B です。",
  "わたしは学生です。",
  "Tôi là học sinh/sinh viên.",
  [
    { front: "わたし", back: "tôi", hint: "Từ xưng hô cơ bản" },
    { front: "学生", back: "học sinh / sinh viên", hint: "がくせい" },
    { front: "です", back: "là / thì / ở dạng lịch sự", hint: "Đặt cuối câu" },
    { front: "は", back: "đánh dấu chủ đề", hint: "Viết là は, đọc là wa" }
  ],
  [
    makeQuestion("n5-desu-wa-q1", "Câu nào đúng để nói: Tôi là sinh viên?", ["わたしは学生です。", "わたしを学生です。", "わたしが学生をです。", "学生はわたしをです。"], "わたしは学生です。", "Mẫu đúng là A は B です。"),
    makeQuestion("n5-desu-wa-q2", "Trong câu わたしは学生です, は dùng để làm gì?", ["Đánh dấu chủ đề", "Đánh dấu tân ngữ", "Tạo phủ định", "Chỉ thời gian"], "Đánh dấu chủ đề", "は nêu chủ đề đang được nói tới."),
    makeQuestion("n5-desu-wa-q3", "です thường đứng ở đâu?", ["Cuối câu", "Đầu câu", "Trước は", "Sau mọi danh từ trong câu"], "Cuối câu", "です đặt cuối câu để tạo sắc thái lịch sự."),
    makeQuestion("n5-desu-wa-q4", "学生 đọc là gì?", ["がくせい", "せんせい", "ともだち", "にほん"], "がくせい", "学生 đọc là がくせい."),
    makeQuestion("n5-desu-wa-q5", "Câu わたしは学生です có nghĩa gần nhất là gì?", ["Tôi là sinh viên", "Tôi ăn cơm", "Tôi đi học", "Tôi không hiểu"], "Tôi là sinh viên", "わたし là tôi, 学生 là sinh viên, です là dạng lịch sự.")
  ]
);

const n5OE = makeLesson(
  "n5-o-e",
  "N5",
  "Đi đâu, làm gì",
  "を và へ",
  "Nói hành động đơn giản: ăn gì, uống gì, đi tới đâu.",
  "N を Vます。 / Place へ 行きます。",
  "水を飲みます。駅へ行きます。",
  "Tôi uống nước. Tôi đi tới nhà ga.",
  [
    { front: "水", back: "nước", hint: "みず" },
    { front: "飲みます", back: "uống", hint: "のみます" },
    { front: "駅", back: "nhà ga", hint: "えき" },
    { front: "行きます", back: "đi", hint: "いきます" }
  ],
  [
    makeQuestion("n5-o-e-q1", "Chọn câu đúng: Tôi uống nước.", ["水を飲みます。", "水へ飲みます。", "水は行きます。", "水です飲みます。"], "水を飲みます。", "を đánh dấu đối tượng của hành động uống."),
    makeQuestion("n5-o-e-q2", "駅へ行きます nghĩa là gì?", ["Đi tới nhà ga", "Uống nước", "Là nhà ga", "Không đi"], "Đi tới nhà ga", "へ chỉ hướng đi tới."),
    makeQuestion("n5-o-e-q3", "を thường đi với phần nào?", ["Đối tượng của hành động", "Nơi đến", "Chủ đề", "Câu hỏi"], "Đối tượng của hành động", "Trong 水を飲みます, 水 là thứ được uống."),
    makeQuestion("n5-o-e-q4", "へ trong 駅へ行きます nhấn mạnh điều gì?", ["Hướng đến", "Người nói", "Đồ vật", "Phủ định"], "Hướng đến", "へ dùng để chỉ hướng hoặc đích đến."),
    makeQuestion("n5-o-e-q5", "飲みます là động từ nào?", ["uống", "ăn", "đi", "nghe"], "uống", "飲みます nghĩa là uống.")
  ]
);

const n5Classroom = makeLesson(
  "n5-classroom",
  "N5",
  "Hỏi bài trên lớp",
  "これは何ですか",
  "Tập hỏi đồ vật, từ mới và phần chưa hiểu khi đang học trên lớp.",
  "これは何ですか。 / もう一度お願いします。",
  "これは何ですか。もう一度お願いします。",
  "Cái này là gì? Xin thầy/cô nói lại một lần nữa.",
  [
    { front: "これ", back: "cái này", hint: "Vật gần người nói" },
    { front: "何", back: "cái gì", hint: "なん / なに" },
    { front: "もう一度", back: "một lần nữa", hint: "もういちど" },
    { front: "お願いします", back: "xin vui lòng", hint: "Cách nhờ lịch sự" }
  ],
  [
    makeQuestion("n5-classroom-q1", "Câu nào dùng để hỏi 'Cái này là gì?'", ["これは何ですか。", "これは行きますか。", "何を飲みますか。", "学校へ行きます。"], "これは何ですか。", "これは何ですか dùng để hỏi tên hoặc nghĩa của vật gần người nói."),
    makeQuestion("n5-classroom-q2", "もう一度お願いします dùng khi nào?", ["Muốn nghe lại", "Muốn về nhà", "Muốn ăn cơm", "Muốn ngủ"], "Muốn nghe lại", "もう一度 nghĩa là một lần nữa, お願いします làm câu nhờ lịch sự hơn."),
    makeQuestion("n5-classroom-q3", "何 trong これは何ですか nghĩa là gì?", ["cái gì", "ở đâu", "khi nào", "ai"], "cái gì", "何 là từ hỏi cho 'cái gì'.")
  ]
);

const n5DeNi = makeLesson(
  "n5-de-ni",
  "N5",
  "Làm ở đâu, vào lúc nào",
  "で và に",
  "Phân biệt nơi diễn ra hành động và mốc thời gian/nơi tồn tại.",
  "Place で Vます。 / Time に Vます。",
  "学校で勉強します。七時に起きます。",
  "Tôi học ở trường. Tôi thức dậy lúc 7 giờ.",
  [
    { front: "学校で", back: "ở trường", hint: "Nơi diễn ra hành động" },
    { front: "七時に", back: "lúc 7 giờ", hint: "Mốc thời gian" },
    { front: "勉強します", back: "học", hint: "べんきょうします" }
  ],
  [
    makeQuestion("n5-de-ni-q1", "学校で勉強します dùng trợ từ nào cho nơi hành động?", ["で", "に", "を", "へ"], "で", "で chỉ nơi hành động diễn ra."),
    makeQuestion("n5-de-ni-q2", "七時に起きます nghĩa là gì?", ["Thức dậy lúc 7 giờ", "Học ở trường", "Đi nhà ga", "Ăn cơm"], "Thức dậy lúc 7 giờ", "に có thể đánh dấu mốc thời gian."),
    makeQuestion("n5-de-ni-q3", "Câu nào tự nhiên nhất?", ["図書館で読みます。", "図書館を読みます。", "図書館へ読みます。", "図書館は読みます。"], "図書館で読みます。", "Đọc sách ở thư viện là hành động diễn ra tại nơi đó, dùng で.")
  ]
);

const n5TimeFrequency = makeLesson(
  "n5-time-frequency",
  "N5",
  "Thời gian và tần suất",
  "まいにち và ときどき",
  "Nói thói quen hằng ngày, thỉnh thoảng hoặc không thường xuyên.",
  "Time/Frequency + Vます。",
  "まいにち日本語を勉強します。",
  "Mỗi ngày tôi học tiếng Nhật.",
  [
    { front: "まいにち", back: "mỗi ngày", hint: "Tần suất" },
    { front: "ときどき", back: "thỉnh thoảng", hint: "Không phải lúc nào cũng làm" },
    { front: "あまり", back: "không ... lắm", hint: "Hay đi với phủ định" }
  ],
  [
    makeQuestion("n5-time-q1", "まいにち nghĩa là gì?", ["mỗi ngày", "hôm qua", "ngày mai", "thỉnh thoảng"], "mỗi ngày", "まいにち dùng cho việc lặp lại hằng ngày."),
    makeQuestion("n5-time-q2", "ときどき dùng khi nào?", ["Thỉnh thoảng làm", "Luôn luôn làm", "Không bao giờ làm", "Đã làm xong"], "Thỉnh thoảng làm", "ときどき chỉ tần suất không thường xuyên."),
    makeQuestion("n5-time-q3", "あまり thường đi với dạng nào?", ["Phủ định", "Mệnh lệnh", "Quá khứ", "て form"], "Phủ định", "あまり...ません nghĩa là không ... lắm.")
  ]
);

const n5VerbsMasu = makeLesson(
  "n5-verbs-masu",
  "N5",
  "Động từ lịch sự",
  "ます / ません / ました",
  "Nắm hiện tại, phủ định và quá khứ lịch sự của động từ cơ bản.",
  "Vます / Vません / Vました。",
  "きのう映画を見ました。",
  "Hôm qua tôi đã xem phim.",
  [
    { front: "見ます", back: "xem", hint: "みます" },
    { front: "見ません", back: "không xem", hint: "Phủ định lịch sự" },
    { front: "見ました", back: "đã xem", hint: "Quá khứ lịch sự" }
  ],
  [
    makeQuestion("n5-masu-q1", "見ました là nghĩa nào?", ["đã xem", "không xem", "đang đi", "sẽ uống"], "đã xem", "ました là quá khứ lịch sự."),
    makeQuestion("n5-masu-q2", "Dạng phủ định lịch sự của 飲みます là gì?", ["飲みません", "飲みました", "飲んで", "飲むです"], "飲みません", "ます đổi thành ません để phủ định."),
    makeQuestion("n5-masu-q3", "きのう thường kéo câu về thời nào?", ["Quá khứ", "Hiện tại", "Tương lai chắc chắn", "Mệnh lệnh"], "Quá khứ", "きのう là hôm qua nên thường dùng dạng quá khứ.")
  ]
);

const n5Adjectives = makeLesson(
  "n5-adjectives",
  "N5",
  "Tính từ cơ bản",
  "い và な",
  "Nói đồ vật, nơi chốn hoặc cảm xúc bằng tính từ N5.",
  "いAdj です。 / なAdj です。",
  "この町は静かです。",
  "Thị trấn này yên tĩnh.",
  [
    { front: "高い", back: "cao / đắt", hint: "たかい" },
    { front: "静か", back: "yên tĩnh", hint: "しずか, tính từ な" },
    { front: "おもしろい", back: "thú vị", hint: "Tính từ い" }
  ],
  [
    makeQuestion("n5-adj-q1", "静か thuộc nhóm nào?", ["Tính từ な", "Tính từ い", "Động từ", "Trợ từ"], "Tính từ な", "静か là tính từ な."),
    makeQuestion("n5-adj-q2", "高い có thể nghĩa là gì?", ["cao / đắt", "rẻ", "nhanh", "gần"], "cao / đắt", "高い có hai nghĩa thường gặp là cao hoặc đắt."),
    makeQuestion("n5-adj-q3", "この町は静かです nghĩa là gì?", ["Thị trấn này yên tĩnh", "Tôi uống nước", "Tôi đi học", "Nhà ga xa"], "Thị trấn này yên tĩnh", "町 là thị trấn, 静か là yên tĩnh.")
  ]
);

const n5TeForm = makeLesson(
  "n5-te-form",
  "N5",
  "Nối hành động bằng て",
  "て form",
  "Dùng て để nối hành động và tạo lời nhờ đơn giản.",
  "Vて、Vます。 / Vてください。",
  "朝ごはんを食べて、学校へ行きます。",
  "Tôi ăn sáng rồi đi học.",
  [
    { front: "食べて", back: "ăn rồi / hãy ăn", hint: "て form của 食べる" },
    { front: "行って", back: "đi rồi / hãy đi", hint: "て form của 行く" },
    { front: "ください", back: "xin hãy", hint: "Dùng để nhờ" }
  ],
  [
    makeQuestion("n5-te-q1", "食べて là dạng gì?", ["て form", "Phủ định", "Quá khứ", "Danh từ"], "て form", "食べて là て form của 食べる."),
    makeQuestion("n5-te-q2", "Vてください dùng để làm gì?", ["Nhờ ai làm gì", "Nói quá khứ", "Đếm đồ", "So sánh"], "Nhờ ai làm gì", "ください làm lời nhờ lịch sự hơn."),
    makeQuestion("n5-te-q3", "行く chuyển sang て form là gì?", ["行って", "行いて", "行んで", "行きて"], "行って", "行く là trường hợp đặc biệt: 行って.")
  ]
);

const n5Existence = makeLesson(
  "n5-existence",
  "N5",
  "Có người, có đồ vật",
  "あります và います",
  "Nói nơi có đồ vật, người hoặc con vật.",
  "Place に N が あります/います。",
  "部屋に机があります。公園に子どもがいます。",
  "Trong phòng có bàn. Ở công viên có trẻ em.",
  [
    { front: "あります", back: "có (đồ vật/cây)", hint: "Dùng với vật không tự di chuyển" },
    { front: "います", back: "có (người/động vật)", hint: "Dùng với sinh vật" },
    { front: "部屋", back: "phòng", hint: "へや" }
  ],
  [
    makeQuestion("n5-exist-q1", "机があります dùng cho loại nào?", ["Đồ vật", "Người", "Động vật", "Thời gian"], "Đồ vật", "机 là bàn, dùng あります."),
    makeQuestion("n5-exist-q2", "子どもがいます nghĩa là gì?", ["Có trẻ em", "Có cái bàn", "Ăn cơm", "Đi học"], "Có trẻ em", "います dùng cho người hoặc động vật."),
    makeQuestion("n5-exist-q3", "Place に N が... mẫu này dùng để nói gì?", ["Nơi có gì", "Ai làm gì", "Giá tiền", "So sánh"], "Nơi có gì", "に đánh dấu nơi tồn tại.")
  ]
);

const n5Requests = makeLesson(
  "n5-requests",
  "N5",
  "Xin phép và nhờ vả",
  "てもいいですか",
  "Hỏi có thể làm gì không và nhờ người khác làm giúp.",
  "Vてもいいですか。 / Vてください。",
  "写真を撮ってもいいですか。",
  "Tôi chụp ảnh được không?",
  [
    { front: "撮ってもいいですか", back: "chụp được không", hint: "とってもいいですか" },
    { front: "書いてください", back: "xin hãy viết", hint: "かいてください" },
    { front: "少し", back: "một chút", hint: "すこし" }
  ],
  [
    makeQuestion("n5-request-q1", "てもいいですか dùng để làm gì?", ["Xin phép", "Cấm đoán", "Quá khứ", "Đếm người"], "Xin phép", "Mẫu này dùng để hỏi có được làm gì không."),
    makeQuestion("n5-request-q2", "書いてください nghĩa là gì?", ["Xin hãy viết", "Đã viết", "Không viết", "Muốn viết"], "Xin hãy viết", "Vてください là lời nhờ."),
    makeQuestion("n5-request-q3", "写真を撮ってもいいですか nghĩa gần nhất là gì?", ["Tôi chụp ảnh được không?", "Tôi đã chụp ảnh", "Đừng chụp ảnh", "Ảnh ở đâu?"], "Tôi chụp ảnh được không?", "撮る là chụp, てもいいですか là xin phép.")
  ]
);

const n5CountersMoney = makeLesson(
  "n5-counters-money",
  "N5",
  "Số đếm và mua đồ",
  "いくら và つ",
  "Hỏi giá, gọi món và đếm một vài đồ vật cơ bản.",
  "N は いくらですか。 / N を ひとつください。",
  "このパンはいくらですか。パンをひとつください。",
  "Bánh mì này bao nhiêu tiền? Cho tôi một cái bánh mì.",
  [
    { front: "いくら", back: "bao nhiêu tiền", hint: "Hỏi giá" },
    { front: "ひとつ", back: "một cái", hint: "Cách đếm chung" },
    { front: "ください", back: "cho tôi / xin hãy", hint: "Dùng khi gọi món" }
  ],
  [
    makeQuestion("n5-money-q1", "いくらですか dùng để hỏi gì?", ["Giá tiền", "Thời gian", "Địa điểm", "Tên người"], "Giá tiền", "いくら là bao nhiêu tiền."),
    makeQuestion("n5-money-q2", "ひとつ nghĩa là gì?", ["một cái", "hai người", "ba giờ", "hôm qua"], "một cái", "ひとつ là một đơn vị trong cách đếm chung."),
    makeQuestion("n5-money-q3", "パンをひとつください dùng khi nào?", ["Mua/gọi một cái bánh mì", "Hỏi đường", "Nói sở thích", "Xin nghỉ"], "Mua/gọi một cái bánh mì", "Mẫu Nを...ください dùng khi muốn lấy/mua thứ gì.")
  ]
);

const n5KanjiDays = makeLesson(
  "n5-kanji-days",
  "N5",
  "Kanji ngày tháng cơ bản",
  "日 月 火 水 木 金 土",
  "Nhận diện các kanji rất hay gặp trong lịch học, ngày tháng và lịch thi.",
  "Kanji + reading + example word",
  "今日は月曜日です。",
  "Hôm nay là thứ Hai.",
  [
    { front: "日", back: "ngày / mặt trời", hint: "にち / ひ" },
    { front: "月", back: "tháng / mặt trăng", hint: "げつ / つき" },
    { front: "水", back: "nước / thứ Tư", hint: "みず / すい" }
  ],
  [
    makeQuestion("n5-kanji-q1", "日 có nghĩa thường gặp nào?", ["ngày / mặt trời", "lửa", "tiền", "người"], "ngày / mặt trời", "日 là kanji rất cơ bản trong ngày tháng."),
    makeQuestion("n5-kanji-q2", "月曜日 là thứ mấy?", ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Chủ nhật"], "Thứ Hai", "月曜日 là thứ Hai."),
    makeQuestion("n5-kanji-q3", "水 có âm đọc nào trong 水曜日?", ["すい", "げつ", "か", "きん"], "すい", "水曜日 đọc là すいようび.")
  ]
);

const n5ReadingShort = makeLesson(
  "n5-reading-short-passage",
  "N5",
  "Đọc đoạn ngắn N5",
  "ý chính và từ khóa",
  "Tập đọc một đoạn ngắn, tìm chủ đề chính và tách từ chưa biết thành thẻ nhớ.",
  "Topic は Adjective です。Reason から。",
  "日本語はおもしろいです。新しい言葉が多いからです。",
  "Tiếng Nhật thú vị. Vì có nhiều từ mới.",
  [
    { front: "おもしろい", back: "thú vị", hint: "Tính từ い" },
    { front: "新しい", back: "mới", hint: "あたらしい" },
    { front: "言葉", back: "từ ngữ", hint: "ことば" }
  ],
  [
    makeQuestion("n5-reading-q1", "日本語はおもしろいです nghĩa là gì?", ["Tiếng Nhật thú vị", "Tiếng Nhật khó uống", "Tôi đi Nhật", "Tôi là người Nhật"], "Tiếng Nhật thú vị", "おもしろい là thú vị."),
    makeQuestion("n5-reading-q2", "から trong câu ví dụ dùng để làm gì?", ["Nêu lý do", "Đánh dấu tân ngữ", "Tạo câu hỏi", "Chỉ nơi đến"], "Nêu lý do", "から có thể dùng để nêu lý do: vì..."),
    makeQuestion("n5-reading-q3", "Khi đọc hiểu, bước nào nên làm trước?", ["Tìm ý chính", "Dịch từng chữ ngay", "Bỏ qua tiêu đề", "Chỉ đọc đáp án"], "Tìm ý chính", "Đọc hiểu nên nắm ý chính trước rồi mới xử lý chi tiết.")
  ]
);

const n5ListeningCues = makeLesson(
  "n5-listening-cues",
  "N5",
  "Nghe tín hiệu trong câu",
  "từ khóa nghe hiểu",
  "Tập bắt từ chỉ thời gian, nơi chốn và hành động chính trong câu ngắn.",
  "Keyword first, detail second",
  "あした、友だちと図書館へ行きます。",
  "Ngày mai tôi đi thư viện với bạn.",
  [
    { front: "あした", back: "ngày mai", hint: "Từ khóa thời gian" },
    { front: "友だちと", back: "với bạn", hint: "と là với" },
    { front: "図書館", back: "thư viện", hint: "としょかん" }
  ],
  [
    makeQuestion("n5-listen-q1", "あした là tín hiệu gì?", ["Thời gian", "Địa điểm", "Người", "Giá tiền"], "Thời gian", "あした nghĩa là ngày mai."),
    makeQuestion("n5-listen-q2", "友だちと nghĩa là gì?", ["với bạn", "ở trường", "mỗi ngày", "không hiểu"], "với bạn", "と có thể nghĩa là với."),
    makeQuestion("n5-listen-q3", "Khi nghe câu ngắn nên bắt gì trước?", ["Từ khóa chính", "Từng chữ nhỏ", "Kanji khó", "Đáp án dài nhất"], "Từ khóa chính", "Bắt từ khóa giúp hiểu nhanh ý chính.")
  ]
);

const n5MockReview = makeLesson(
  "n5-mock-review",
  "N5",
  "Ôn tổng hợp N5",
  "quiz hỗn hợp",
  "Trộn trợ từ, từ vựng, kanji và câu ngắn để kiểm tra trước khi sang phần mới.",
  "Mixed N5 review",
  "わたしは毎日、学校で日本語を勉強します。",
  "Mỗi ngày tôi học tiếng Nhật ở trường.",
  [
    { front: "毎日", back: "mỗi ngày", hint: "まいにち" },
    { front: "学校で", back: "ở trường", hint: "Nơi hành động" },
    { front: "日本語", back: "tiếng Nhật", hint: "にほんご" }
  ],
  [
    makeQuestion("n5-review-q1", "学校で dùng で vì sao?", ["Nơi hành động", "Tân ngữ", "Hướng đến", "Sở hữu"], "Nơi hành động", "で đánh dấu nơi diễn ra hành động."),
    makeQuestion("n5-review-q2", "毎日 nghĩa là gì?", ["mỗi ngày", "hôm qua", "tháng này", "một cái"], "mỗi ngày", "毎日 đọc là まいにち."),
    makeQuestion("n5-review-q3", "Câu ví dụ nói hành động nào?", ["Học tiếng Nhật", "Uống nước", "Mua bánh", "Chụp ảnh"], "Học tiếng Nhật", "勉強します là học.")
  ]
);

const conversationEntry = makeLesson(
  "conversation-greetings",
  "N5",
  "Chào hỏi hằng ngày",
  "hội thoại ngắn",
  "Tập mở lời, giới thiệu ngắn và đáp lại tự nhiên trong một cuộc nói chuyện cơ bản.",
  "はじめまして。A です。よろしくお願いします。",
  "はじめまして。ヒエウです。よろしくお願いします。",
  "Rất vui được gặp bạn. Tôi là Hiếu. Mong được giúp đỡ.",
  [
    { front: "はじめまして", back: "rất vui được gặp lần đầu", hint: "Dùng khi mới gặp ai đó" },
    { front: "よろしくお願いします", back: "mong được giúp đỡ", hint: "Câu kết khi tự giới thiệu" },
    { front: "友だち", back: "bạn bè", hint: "ともだち" }
  ],
  [
    makeQuestion("conversation-q1", "Câu nào phù hợp khi gặp ai đó lần đầu?", ["はじめまして。", "ただいま。", "おやすみ。", "いただきます。"], "はじめまして。", "はじめまして dùng khi gặp ai đó lần đầu."),
    makeQuestion("conversation-q2", "よろしくお願いします thường đặt ở đâu?", ["Cuối phần giới thiệu", "Trước tên", "Giữa trợ từ", "Sau mọi động từ"], "Cuối phần giới thiệu", "Câu này thường dùng để kết thúc phần tự giới thiệu một cách lịch sự."),
    makeQuestion("conversation-q3", "ヒエウです có nghĩa gần nhất là gì?", ["Tôi là Hiếu", "Tôi đi học", "Tôi uống nước", "Tôi không hiểu"], "Tôi là Hiếu", "Tên + です là cách nói 'tôi là...' lịch sự.")
  ]
);

const workEntry = makeLesson(
  "work-introduction",
  "N4",
  "Tự giới thiệu nơi làm việc",
  "申します và lịch sự",
  "Tập nói lịch sự khi giới thiệu tên, bộ phận và mong được hợp tác trong môi trường công việc.",
  "A と申します。よろしくお願いいたします。",
  "ブイと申します。よろしくお願いいたします。",
  "Tôi tên là Bùi. Rất mong được giúp đỡ/hợp tác.",
  [
    { front: "申します", back: "tên là / nói là", hint: "もうします" },
    { front: "お願いいたします", back: "xin vui lòng", hint: "Lịch sự hơn お願いします" },
    { front: "部署", back: "bộ phận", hint: "ぶしょ" }
  ],
  [
    makeQuestion("work-q1", "Cách nói lịch sự hơn cho 'tôi tên là Bùi' là gì?", ["ブイと申します。", "ブイを飲みます。", "ブイへ行きます。", "ブイがあります。"], "ブイと申します。", "と申します là cách tự giới thiệu tên lịch sự trong công việc."),
    makeQuestion("work-q2", "お願いいたします có sắc thái thế nào?", ["Lịch sự", "Thân mật", "Thô", "Phủ định"], "Lịch sự", "お願いいたします lịch sự hơn お願いします."),
    makeQuestion("work-q3", "部署 đọc là gì?", ["ぶしょ", "かいしゃ", "せんせい", "えき"], "ぶしょ", "部署 nghĩa là bộ phận/phòng ban.")
  ]
);

const n4Nakereba = makeLesson(
  "n4-nakereba",
  "N4",
  "Việc phải làm",
  "なければなりません",
  "Nói việc bắt buộc phải làm, ví dụ bài tập, công việc hoặc lịch học.",
  "Vない bỏ い + ければなりません。",
  "宿題をしなければなりません。",
  "Tôi phải làm bài tập.",
  [
    { front: "宿題", back: "bài tập về nhà", hint: "しゅくだい" },
    { front: "しなければなりません", back: "phải làm", hint: "Từ する" },
    { front: "行かなければなりません", back: "phải đi", hint: "行く -> 行かない" }
  ],
  [
    makeQuestion("n4-nakereba-q1", "宿題をしなければなりません nghĩa là gì?", ["Phải làm bài tập", "Có thể làm bài tập", "Đã làm bài tập", "Không làm bài tập"], "Phải làm bài tập", "なければなりません diễn tả nghĩa vụ."),
    makeQuestion("n4-nakereba-q2", "行く chuyển sang mẫu 'phải đi' là gì?", ["行かなければなりません", "行きなければなりません", "行くなければなりません", "行ってなりません"], "行かなければなりません", "行く có thể ない là 行かない, rồi đổi thành 行かなければなりません."),
    makeQuestion("n4-nakereba-q3", "Mẫu なければなりません thuộc ý nghĩa nào?", ["Nghĩa vụ", "So sánh", "Kinh nghiệm", "Dự đoán"], "Nghĩa vụ", "Mẫu này dùng khi có việc bắt buộc phải làm.")
  ]
);

const n4Requests = makeLesson(
  "n4-requests-soft",
  "N4",
  "Nhờ vả mềm hơn",
  "てもらえませんか",
  "Nói lời nhờ lịch sự hơn trong lớp học hoặc công việc.",
  "Vてもらえませんか。",
  "もう一度説明してもらえませんか。",
  "Bạn có thể giải thích lại một lần nữa không?",
  [
    { front: "説明", back: "giải thích", hint: "せつめい" },
    { front: "もう一度", back: "một lần nữa", hint: "もういちど" },
    { front: "てもらえませんか", back: "có thể làm giúp không", hint: "Nhờ lịch sự" }
  ],
  [
    makeQuestion("n4-request-q1", "てもらえませんか dùng để làm gì?", ["Nhờ lịch sự", "Cấm đoán", "Nói giá tiền", "So sánh"], "Nhờ lịch sự", "Mẫu này dùng khi nhờ ai đó làm giúp."),
    makeQuestion("n4-request-q2", "説明 nghĩa là gì?", ["giải thích", "công ty", "bài tập", "ga"], "giải thích", "説明 đọc là せつめい."),
    makeQuestion("n4-request-q3", "もう一度説明してもらえませんか nghĩa gần nhất là gì?", ["Bạn giải thích lại giúp được không?", "Tôi đã giải thích", "Đừng giải thích", "Giải thích rất rẻ"], "Bạn giải thích lại giúp được không?", "もう一度 là một lần nữa, てもらえませんか là nhờ lịch sự.")
  ]
);

const kanaFoundationChapter: StudyChapter = {
  id: "kana-foundation",
  title: "Bảng chữ cái nhập môn",
  level: "N5",
  focus: "hiragana, katakana",
  description: "Dành cho người học từ số 0: đọc được kana trước, rồi mới vào mẫu câu N5.",
  lessons: [kanaHiraganaVowels, kanaHiraganaRows, kanaKatakanaEntry]
};

const coreChapters: StudyChapter[] = [
  {
    id: "n5-chapter-1",
    title: "Câu nền tảng N5",
    level: "N5",
    focus: "giới thiệu, hành động, hỏi bài",
    description: "Chương mở đầu giúp người học nói câu đơn giản và không bị lạc trong lớp.",
    lessons: [n5DesuWa, n5OE, n5Classroom]
  },
  {
    id: "n5-chapter-2",
    title: "Trợ từ và thời gian",
    level: "N5",
    focus: "で, に, thói quen",
    description: "Củng cố các trợ từ hay sai và cách nói thói quen hằng ngày.",
    lessons: [n5DeNi, n5TimeFrequency, n5VerbsMasu]
  },
  {
    id: "n5-chapter-3",
    title: "Mô tả và nối câu",
    level: "N5",
    focus: "tính từ, て form, tồn tại",
    description: "Tập mô tả người/vật, nối hành động và nói nơi có người hoặc đồ vật.",
    lessons: [n5Adjectives, n5TeForm, n5Existence]
  },
  {
    id: "n5-chapter-4",
    title: "Tình huống đời sống",
    level: "N5",
    focus: "xin phép, mua đồ, kanji ngày tháng",
    description: "Đưa mẫu câu vào mua đồ, xin phép và đọc lịch học/lịch thi.",
    lessons: [n5Requests, n5CountersMoney, n5KanjiDays]
  },
  {
    id: "n5-chapter-5",
    title: "Ôn thi JLPT N5",
    level: "N5",
    focus: "đọc, nghe, tổng hợp",
    description: "Gom kiến thức đã học vào dạng đọc hiểu, nghe tín hiệu và quiz hỗn hợp.",
    lessons: [n5ReadingShort, n5ListeningCues, n5MockReview]
  }
];

const n4BridgeChapter: StudyChapter = {
  id: "n4-bridge-1",
  title: "Cầu nối lên N4",
  level: "N4",
  focus: "công việc, nghĩa vụ, nhờ vả",
  description: "Chỉ mở khi hồ sơ hướng tới N4 để người học có đường đi tiếp sau nền N5.",
  lessons: [workEntry, n4Nakereba, n4Requests]
};

const pathwayEntryLessons: Record<string, StudyLesson> = {
  jlpt_foundation: n5DesuWa,
  conversation: conversationEntry,
  school: n5Classroom,
  work: workEntry,
  reading: n5ReadingShort
};

const pathwayIntros: Record<string, StudyPathwayIntro> = {
  jlpt_foundation: {
    label: "JLPT từng bước",
    title: "Pathway JLPT: học theo chương, qua quiz rồi mở phần tiếp.",
    description: "VAJA chia JLPT N5 thành các chương 3 bài, rồi điều chỉnh nhịp theo điểm và số lần làm lại."
  },
  conversation: {
    label: "Giao tiếp hằng ngày",
    title: "Pathway giao tiếp: bắt đầu bằng câu dùng được ngay.",
    description: "VAJA vẫn giữ khung JLPT N5, nhưng đưa hội thoại lên trước để học xong dùng được ngay."
  },
  school: {
    label: "Bài trên lớp",
    title: "Pathway trên lớp: bám bài học, từ mới và mẫu câu đang gặp.",
    description: "VAJA ưu tiên câu hỏi trên lớp trước, sau đó nối vào các chương N5 nền tảng."
  },
  work: {
    label: "Tiếng Nhật công việc",
    title: "Pathway công việc: học câu lịch sự rồi nối về nền JLPT.",
    description: "VAJA đưa tình huống công việc lên đầu, sau đó giữ nhịp phù hợp để không hổng nền."
  },
  reading: {
    label: "Đọc hiểu",
    title: "Pathway đọc hiểu: đọc câu ngắn, gom từ khóa, tăng kanji.",
    description: "VAJA ưu tiên từ khóa, kanji và bài đọc ngắn trước khi đi sâu vào các mẫu còn yếu."
  }
};

export function buildStudyChapters(profile?: StudyProfile | null): StudyChapter[] {
  const pathway = normalizePathway(profile?.learningPathway);
  const wantsN4 = wantsN4Bridge(profile);
  const entryLesson = pathwayEntryLessons[pathway] ?? pathwayEntryLessons.jlpt_foundation;
  const corePathChapters = [
    buildPersonalizedEntryChapter(pathway, entryLesson, profile),
    ...coreChapters
  ];
  const selectedChapters = isZeroBeginner(profile)
    ? [kanaFoundationChapter, ...corePathChapters]
    : corePathChapters;
  const withBridge = wantsN4 ? [...selectedChapters, n4BridgeChapter] : selectedChapters;
  return personalizeChapters(renumberChapters(removeDuplicateLessons(withBridge)), profile, pathway);
}

export function buildStudyLessons(profile?: StudyProfile | null): StudyLesson[] {
  return flattenStudyChapters(buildStudyChapters(profile));
}

export function flattenStudyChapters(chapters: StudyChapter[]): StudyLesson[] {
  return chapters.flatMap((chapter) => chapter.lessons);
}

export function studyPathwayIntro(profile?: StudyProfile | null): StudyPathwayIntro {
  if (isZeroBeginner(profile)) {
    const nextPathway = pathwayIntros[normalizePathway(profile?.learningPathway)] ?? pathwayIntros.jlpt_foundation;
    return {
      label: `Số 0 → ${nextPathway.label}`,
      title: "Pathway số 0: học bảng chữ trước, rồi vào pathway đã chọn.",
      description: `VAJA mở đầu bằng hiragana và katakana. Sau phần chữ cái, bạn sẽ đi tiếp theo ${nextPathway.label.toLowerCase()}.`
    };
  }
  return pathwayIntros[normalizePathway(profile?.learningPathway)] ?? pathwayIntros.jlpt_foundation;
}

export function weakSkillSummary(profile?: StudyProfile | null): string {
  const weakSkills = profile?.weakSkills?.length ? profile.weakSkills : ["vocabulary"];
  return weakSkills.slice(0, 3).map(weakSkillLabel).join(", ");
}

function buildPersonalizedEntryChapter(
  pathway: string,
  entryLesson: StudyLesson,
  profile?: StudyProfile | null
): StudyChapter {
  const weakLessons = lessonsForWeakSkills(profile?.weakSkills, isZeroBeginner(profile));
  const fallbackLessons = pathway === "reading"
    ? [n5KanjiDays, n5DesuWa, n5OE]
    : pathway === "work"
      ? [n4Nakereba, n5DesuWa, n5OE]
      : [n5DesuWa, n5OE, n5Classroom];
  const lessonCandidates = [entryLesson, ...weakLessons, ...fallbackLessons];
  const lessons = uniqueLessons(lessonCandidates).slice(0, 3);
  const usesDefaultCoreOpening = lessons.map((lesson) => lesson.id).join("|") === "n5-desu-wa|n5-o-e|n5-classroom";
  return {
    id: `${pathway}-entry`,
    title: usesDefaultCoreOpening ? "Câu nền tảng N5" : "Khởi động cá nhân",
    level: lessons[0]?.level ?? entryLesson.level,
    focus: chapterFocus(lessons, entryLesson.focus),
    description: usesDefaultCoreOpening
      ? "Chương mở đầu giúp người học nói câu đơn giản và không bị lạc trong lớp."
      : "Chương đầu được đổi theo câu trả lời onboarding để người học vào đúng nhu cầu trước.",
    lessons
  };
}

function lessonsForWeakSkills(weakSkills?: string[], skipKana = false): StudyLesson[] {
  const lessons: StudyLesson[] = [];
  for (const skill of weakSkills ?? []) {
    const normalized = skill.trim().toLowerCase();
    if (isKanaSkill(normalized)) {
      if (skipKana) {
        continue;
      }
      lessons.push(kanaKatakanaEntry, n5DesuWa);
      continue;
    }
    if (normalized === "grammar") {
      lessons.push(n5DesuWa, n5DeNi, n5TimeFrequency, n5VerbsMasu);
      continue;
    }
    if (normalized === "vocabulary") {
      lessons.push(n5OE, n5Classroom, n5Adjectives);
      continue;
    }
    if (normalized === "kanji") {
      lessons.push(n5KanjiDays, n5ReadingShort, n5CountersMoney);
      continue;
    }
    if (normalized === "reading") {
      lessons.push(n5ReadingShort, n5KanjiDays, n5MockReview);
      continue;
    }
    if (normalized === "listening") {
      lessons.push(n5ListeningCues, conversationEntry, n5Classroom);
      continue;
    }
    if (normalized === "speaking") {
      lessons.push(conversationEntry, n5Classroom, n5Requests);
    }
  }
  return lessons;
}

function uniqueLessons(lessons: StudyLesson[]): StudyLesson[] {
  const seen = new Set<string>();
  return lessons.filter((lesson) => {
    if (seen.has(lesson.id)) {
      return false;
    }
    seen.add(lesson.id);
    return true;
  });
}

function chapterFocus(lessons: StudyLesson[], fallback: string): string {
  const focusParts = uniqueLessons(lessons)
    .map((lesson) => lesson.focus)
    .filter(Boolean);
  return focusParts.slice(0, 3).join(", ") || fallback;
}

function personalizeChapters(
  chapters: StudyChapter[],
  profile: StudyProfile | null | undefined,
  pathway: string
): StudyChapter[] {
  return chapters.map((chapter, chapterIndex) => ({
    ...chapter,
    lessons: chapter.lessons.map((lesson, lessonIndex) =>
      personalizeLesson(lesson, profile, pathway, chapterIndex, lessonIndex)
    )
  }));
}

function personalizeLesson(
  lesson: StudyLesson,
  profile: StudyProfile | null | undefined,
  pathway: string,
  chapterIndex: number,
  lessonIndex: number
): StudyLesson {
  const weakSkills = normalizedWeakSkills(profile?.weakSkills);
  const taskLimit = practiceTaskLimit(profile?.dailyStudyMinutes);
  const tasks = uniquePracticeTasks([
    pathwayPracticeTask(pathway, lesson, lessonIndex),
    ...weakSkills.flatMap((skill) => weakSkillPracticeTasks(skill, lesson)),
    timePracticeTask(profile?.dailyStudyMinutes, lesson),
    chapterPracticeTask(chapterIndex, lesson)
  ]).slice(0, taskLimit);

  return {
    ...lesson,
    practiceTasks: tasks
  };
}

function pathwayPracticeTask(pathway: string, lesson: StudyLesson, lessonIndex: number): StudyPracticeTask {
  const firstCard = lesson.flashcards[0];
  switch (pathway) {
    case "conversation":
      return {
        id: `${lesson.id}-practice-conversation`,
        label: "Giao tiếp",
        title: "Đóng vai hội thoại 2 lượt",
        prompt: `Nói thành tiếng một câu dùng ${lesson.focus}, rồi tự đáp lại bằng một câu ngắn.`,
        exampleAnswer: `${lesson.example} / Mình đổi tên, địa điểm hoặc đồ vật để nói lại.`
      };
    case "school":
      return {
        id: `${lesson.id}-practice-school`,
        label: "Trên lớp",
        title: "Hỏi lại phần chưa rõ",
        prompt: `Viết một câu hỏi cho giáo viên hoặc bạn học về ${lesson.focus}.`,
        exampleAnswer: "もう一度お願いします。Từ này nghĩa là gì ạ?"
      };
    case "work":
      return {
        id: `${lesson.id}-practice-work`,
        label: "Công việc",
        title: "Đổi sang câu lịch sự",
        prompt: `Dùng mẫu ${lesson.pattern} để viết một câu dùng được trong email, họp hoặc tự giới thiệu.`,
        exampleAnswer: "Tên + と申します。よろしくお願いいたします。"
      };
    case "reading":
      return {
        id: `${lesson.id}-practice-reading`,
        label: "Đọc hiểu",
        title: "Tìm từ khóa trong câu",
        prompt: `Gạch 2 từ khóa trong ví dụ, rồi đoán ý chính trước khi nhìn nghĩa tiếng Việt.`,
        exampleAnswer: `${firstCard?.front ?? "Từ khóa"} = ${firstCard?.back ?? "ý chính trong câu"}`
      };
    default:
      return {
        id: `${lesson.id}-practice-jlpt-${lessonIndex}`,
        label: "JLPT",
        title: lessonIndex % 2 === 0 ? "Nhận ra mẫu câu" : "Tự đổi 1 chi tiết",
        prompt: lessonIndex % 2 === 0
          ? `Khoanh mẫu ${lesson.pattern} trong ví dụ, rồi đọc lại ý nghĩa của mẫu.`
          : "Đổi một từ trong câu ví dụ nhưng giữ nguyên mẫu ngữ pháp.",
        exampleAnswer: lessonIndex % 2 === 0 ? lesson.pattern : lesson.example
      };
  }
}

function weakSkillPracticeTasks(skill: string, lesson: StudyLesson): StudyPracticeTask[] {
  const firstCard = lesson.flashcards[0];
  const secondCard = lesson.flashcards[1] ?? firstCard;
  switch (skill) {
    case "grammar":
      return [{
        id: `${lesson.id}-practice-weak-grammar`,
        label: "Ngữ pháp",
        title: "Tách mẫu và ý nghĩa",
        prompt: `Tách câu ví dụ thành 2 phần: mẫu chính và phần từ vựng thay được.`,
        exampleAnswer: `${lesson.pattern} là khung câu; ${firstCard?.front ?? "từ mới"} là phần có thể thay.`
      }];
    case "vocabulary":
      return [{
        id: `${lesson.id}-practice-weak-vocabulary`,
        label: "Từ vựng",
        title: "Tạo cặp từ riêng",
        prompt: "Chọn 2 thẻ khó nhất của bài và tự đặt một câu rất ngắn cho mỗi thẻ.",
        exampleAnswer: `${firstCard?.front ?? "Từ 1"} = ${firstCard?.back ?? "nghĩa"}; ${secondCard?.front ?? "Từ 2"} = ${secondCard?.back ?? "nghĩa"}`
      }];
    case "kana":
      return [{
        id: `${lesson.id}-practice-weak-kana`,
        label: "Bảng chữ",
        title: "Che romaji, đọc kana",
        prompt: "Nhìn mặt trước thẻ, đọc chậm 3 lần trước khi lật đáp án.",
        exampleAnswer: `${firstCard?.front ?? lesson.example} → đọc âm trước, xem nghĩa sau.`
      }];
    case "kanji":
      return [{
        id: `${lesson.id}-practice-weak-kanji`,
        label: "Kanji",
        title: "Nhìn chữ, đoán âm",
        prompt: "Tìm chữ Hán trong ví dụ hoặc thẻ, đoán cách đọc trước khi xem nghĩa.",
        exampleAnswer: `${firstCard?.front ?? "日"} → cách đọc và nghĩa.`
      }];
    case "reading":
      return [{
        id: `${lesson.id}-practice-weak-reading`,
        label: "Đọc",
        title: "Chia câu thành cụm nhỏ",
        prompt: "Chia câu ví dụ thành từng cụm, dịch từng cụm trước khi dịch cả câu.",
        exampleAnswer: `${lesson.example} → chủ đề / hành động / thời gian hoặc nơi chốn.`
      }];
    case "listening":
      return [{
        id: `${lesson.id}-practice-weak-listening`,
        label: "Nghe",
        title: "Đọc theo 3 nhịp",
        prompt: "Đọc câu ví dụ 3 lần: chậm, bình thường, rồi che nghĩa và đọc lại.",
        exampleAnswer: "Lần 1 rõ từng âm, lần 2 tự nhiên, lần 3 nhớ nghĩa."
      }];
    case "speaking":
      return [{
        id: `${lesson.id}-practice-weak-speaking`,
        label: "Nói",
        title: "Nói lại bằng thông tin của mình",
        prompt: "Thay tên, địa điểm hoặc đồ vật trong câu ví dụ rồi nói thành tiếng.",
        exampleAnswer: lesson.example
      }];
    default:
      return [];
  }
}

function timePracticeTask(minutes: number | null | undefined, lesson: StudyLesson): StudyPracticeTask {
  const dailyMinutes = minutes ?? 30;
  if (dailyMinutes <= 15) {
    return {
      id: `${lesson.id}-practice-time-short`,
      label: "10 phút",
      title: "Chỉ làm phần cốt lõi",
      prompt: "Học mẫu chính, lật 3 thẻ đầu, rồi vào quiz. Phần mở rộng để sau.",
      exampleAnswer: `Mẫu cần nhớ hôm nay: ${lesson.pattern}`
    };
  }
  if (dailyMinutes >= 45) {
    return {
      id: `${lesson.id}-practice-time-long`,
      label: "Mở rộng",
      title: "Tạo thêm 2 câu mới",
      prompt: "Sau khi hiểu ví dụ, tự viết thêm 2 câu cùng mẫu nhưng đổi từ vựng.",
      exampleAnswer: "Một câu về bản thân, một câu về lớp học/công việc."
    };
  }
  return {
    id: `${lesson.id}-practice-time-normal`,
    label: "20-30 phút",
    title: "Làm đủ vòng học",
    prompt: "Đọc mẫu, học hết thẻ, làm quiz. Nếu sai thì hỏi VAJA ở câu đó.",
    exampleAnswer: "Học → thẻ nhớ → quiz → sửa sai."
  };
}

function chapterPracticeTask(chapterIndex: number, lesson: StudyLesson): StudyPracticeTask {
  return {
    id: `${lesson.id}-practice-chapter-${chapterIndex}`,
    label: "Ôn chương",
    title: chapterIndex === 0 ? "Ghi một lỗi dễ sai" : "Nối với bài trước",
    prompt: chapterIndex === 0
      ? "Trước khi làm quiz, ghi ra một điểm dễ nhầm trong bài này."
      : "Tìm một điểm giống hoặc khác với bài trước trong cùng pathway.",
    exampleAnswer: chapterIndex === 0 ? `Điểm dễ nhầm: ${lesson.focus}` : "Giống mẫu cũ ở trợ từ, khác ở ý nghĩa."
  };
}

function practiceTaskLimit(minutes: number | null | undefined): number {
  const dailyMinutes = minutes ?? 30;
  if (dailyMinutes <= 15) {
    return 2;
  }
  if (dailyMinutes >= 45) {
    return 4;
  }
  return 3;
}

function normalizedWeakSkills(weakSkills?: string[]): string[] {
  return Array.from(new Set((weakSkills ?? []).map((skill) => skill.trim().toLowerCase()).filter(Boolean)));
}

function uniquePracticeTasks(tasks: StudyPracticeTask[]): StudyPracticeTask[] {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    const key = `${task.label}:${task.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function removeDuplicateLessons(chapters: StudyChapter[]): StudyChapter[] {
  const seen = new Set<string>();
  return chapters
    .map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.filter((lesson) => {
        if (seen.has(lesson.id)) {
          return false;
        }
        seen.add(lesson.id);
        return true;
      })
    }))
    .filter((chapter) => chapter.lessons.length > 0);
}

function renumberChapters(chapters: StudyChapter[]): StudyChapter[] {
  let lessonIndex = 1;
  return chapters.map((chapter, chapterIndex) => ({
    ...chapter,
    title: `Chương ${chapterIndex + 1}: ${cleanChapterTitle(chapter.title)}`,
    lessons: chapter.lessons.map((lesson) => ({
      ...lesson,
      title: `Bài ${lessonIndex++}: ${cleanLessonTitle(lesson.title)}`
    }))
  }));
}

function wantsN4Bridge(profile?: StudyProfile | null): boolean {
  const currentLevel = (profile?.currentLevel ?? "N5").toUpperCase();
  const targetLevel = (profile?.targetLevel ?? "N4").toUpperCase();
  return currentLevel === "N4" || targetLevel === "N4";
}

function isZeroBeginner(profile?: StudyProfile | null): boolean {
  const currentLevel = (profile?.currentLevel ?? "").trim().toUpperCase();
  return currentLevel === "ZERO" || currentLevel === "N0";
}

function isKanaSkill(skill: string): boolean {
  const normalized = skill.trim().toLowerCase();
  return normalized === "kana" || normalized === "hiragana" || normalized === "katakana";
}

function normalizePathway(value?: string | null): string {
  const normalized = value?.trim().toLowerCase().replace(/-/g, "_") || "jlpt_foundation";
  return normalized in pathwayEntryLessons ? normalized : "jlpt_foundation";
}

function cleanLessonTitle(value: string): string {
  return value.replace(/^Bài\s+\d+:\s*/i, "");
}

function cleanChapterTitle(value: string): string {
  return value.replace(/^Chương\s+\d+:\s*/i, "");
}

function weakSkillLabel(value: string): string {
  const labels: Record<string, string> = {
    vocabulary: "từ vựng",
    kana: "bảng chữ",
    grammar: "ngữ pháp",
    kanji: "kanji",
    listening: "nghe",
    reading: "đọc",
    speaking: "nói"
  };
  return labels[value.toLowerCase()] ?? value;
}
