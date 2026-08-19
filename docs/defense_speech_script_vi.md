# Kịch Bản Nói Bảo Vệ Thesis - VAJA

Đề tài: VAJA: Personalized Japanese Learning Assistant  
Học viên: Bùi Duy Hiếu - MSE K24  
Đối tượng chính: sinh viên đại học Việt Nam học tiếng Nhật ở mức N5/N4, gồm cả người mới bắt đầu từ số 0.  
Mục tiêu của bản này: giúp học và nói khi bảo vệ, theo từng slide, bằng tiếng Việt dễ nói.

## Slide 01 - Cover

Thời lượng gợi ý: 40-50 giây

Mục tiêu slide: giới thiệu đề tài, phạm vi, và nói rõ đây là một đề tài kỹ thuật phần mềm có phần AI hỗ trợ học tiếng Nhật.

Script nói:

Kính chào quý thầy cô trong hội đồng. Em là Bùi Duy Hiếu, học viên lớp MSE K24. Hôm nay em xin trình bày đề tài thesis của em là VAJA, một hệ thống trợ lý học tiếng Nhật cá nhân hóa cho sinh viên đại học Việt Nam học ở mức N5/N4.

Đề tài của em không tập trung vào việc làm một ứng dụng thương mại hoàn chỉnh, mà tập trung vào thiết kế và triển khai một hệ thống học tập có pathway, flashcard, quiz, kiểm tra chương, AI Tutor có nguồn tham khảo, và cơ chế ghi nhận tiến độ học.

Góc chính của đề tài là kỹ thuật phần mềm: hệ thống web, kiến trúc backend, API, lưu trữ dữ liệu học tập, Knowledge Graph, RAG, kiểm thử, benchmark, và user test nhỏ.

Câu chuyển slide:

Đầu tiên, em xin nói về vấn đề thực tế mà đề tài này muốn giải quyết.

Lưu ý khi bị hỏi:

- Không nói VAJA là sản phẩm hoàn thiện như Duolingo hay Quizlet.
- Nói rõ đây là prototype/thesis system, có triển khai thực tế và có dữ liệu đánh giá ban đầu.

## Slide 02 - Problem

Thời lượng gợi ý: 45-60 giây

Mục tiêu slide: nói vấn đề của người mới học tiếng Nhật khi tự học.

Script nói:

Vấn đề đầu tiên là sinh viên Việt Nam ở mức sơ cấp thường rất dễ bị rối khi tự học. Ví dụ một người mới bắt đầu có thể có rất nhiều tài liệu: bảng chữ cái, từ vựng, ngữ pháp, kanji, video, chatbot, flashcard. Nhưng họ lại không biết nên học cái gì trước, học bao nhiêu là đủ, và khi sai thì nên ôn lại phần nào.

Vấn đề thứ hai là chatbot thông thường có thể trả lời rất nhanh, nhưng câu trả lời không phải lúc nào cũng bám vào tài liệu N5/N4, và nhiều khi không có nguồn rõ ràng. Với người học mới, nếu câu trả lời quá rộng hoặc quá khó thì họ càng khó theo.

Vấn đề thứ ba là các chức năng học thường bị tách rời. Flashcard là một nơi, quiz là một nơi, chatbot là một nơi. Nếu các kết quả này không được nối vào một trạng thái học chung, hệ thống sẽ khó biết người học đang yếu ở đâu.

Vì vậy, đề tài của em đặt mục tiêu xây dựng một luồng học rõ hơn: học theo chương, học bằng thẻ nhớ, làm quiz, làm test chương, và có Tutor hỗ trợ theo ngữ cảnh.

Câu chuyển slide:

Từ vấn đề đó, bài trình bày của em sẽ đi theo các phần sau.

Lưu ý khi bị hỏi:

- Nên đưa ví dụ đơn giản: người mới chưa biết chữ cái thì không nên nhảy ngay vào ngữ pháp.
- Không nói tất cả app hiện tại đều kém; chỉ nói khoảng trống mà đề tài muốn xử lý.

## Slide 03 - Agenda

Thời lượng gợi ý: 30-40 giây

Mục tiêu slide: cho hội đồng biết bài nói sẽ đi theo cấu trúc nào.

Script nói:

Bài trình bày của em gồm các phần chính sau. Phần đầu là vấn đề học N5/N4 và lý do cần một luồng học rõ ràng hơn.

Phần thứ hai là phạm vi của chữ “agent” trong đề tài và các điều thesis không claim. Em sẽ nói rõ agent ở đây là các vai trò học tập, không phải một hệ thống multi-agent tự trị hoàn toàn.

Phần thứ ba là kiến trúc hệ thống, gồm frontend, backend FastAPI, cơ sở dữ liệu, Knowledge Graph và Vector Search.

Phần thứ tư là cá nhân hóa lộ trình học. Em sẽ trình bày hệ thống dùng thông tin đầu vào, kết quả quiz, flashcard, feedback và số lần sai để điều chỉnh bước học tiếp theo.

Phần thứ năm là kết quả đánh giá, gồm benchmark RAG và pilot user test. Cuối cùng là demo, kết luận và hướng phát triển.

Câu chuyển slide:

Trước khi đi vào thiết kế, em xin trình bày 5 câu hỏi nghiên cứu của thesis.

Lưu ý khi bị hỏi:

- Dùng chữ “agenda”, không nói “nội dung em sẽ bảo vệ” trên slide.
- Nhấn mạnh bài nói đi đúng theo thesis, không chỉ demo app.

## Slide 04 - Research Questions

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: chứng minh đề tài có hướng nghiên cứu và có cách đánh giá.

Script nói:

Trong thesis, em dùng 5 câu hỏi nghiên cứu chính.

RQ1 hỏi cách xây dựng Knowledge Graph cho nội dung N5/N4. Ở đây hệ thống cần lưu được từ vựng, ngữ pháp, kanji, bài học và quan hệ giữa các phần này.

RQ2 hỏi việc kết hợp Knowledge Graph và Vector RAG có giúp truy xuất nguồn tốt hơn không. Phần này em đánh giá bằng benchmark với 4 chế độ: LLM only, Vector, KG, và KG cộng Vector.

RQ3 hỏi các tín hiệu mastery như kết quả quiz, flashcard, số lần sai, feedback có ảnh hưởng đến nhiệm vụ học tiếp theo như thế nào.

RQ4 hỏi các vai trò như Tutor, Pathway, Assessment và Review chia sẻ trạng thái người học ra sao mà không bị lẫn nhiệm vụ.

RQ5 hỏi người học có thể dùng luồng này trong một pilot nhỏ hay không. Phần này em dùng dữ liệu user test, SUS, trust score, điểm bài học, pass rate và feedback.

Câu chuyển slide:

Vì trong đề tài có dùng chữ agent, em cần làm rõ phạm vi thuật ngữ này trước.

Lưu ý khi bị hỏi:

- Nếu thầy hỏi “research ở đâu?”, trả lời: research nằm ở KG design, benchmark RAG, tracking mastery, role-state design, và pilot user test.
- Không nói pilot đủ để chứng minh hiệu quả học dài hạn.

## Slide 05 - Agent Scope

Thời lượng gợi ý: 70-90 giây

Mục tiêu slide: tránh bị bắt bẻ vì dùng thuật ngữ “agent” quá mạnh.

Script nói:

Slide này rất quan trọng vì em muốn làm rõ cách dùng thuật ngữ “agent” trong thesis. Trong phạm vi đề tài của em, agent được hiểu là các vai trò học tập có nhiệm vụ rõ ràng, input rõ ràng, output rõ ràng, và dùng chung learner state.

Tutor role phụ trách nhận câu hỏi, truy xuất nguồn từ Knowledge Graph hoặc Vector DB, rồi dùng LLM để giải thích lại bằng tiếng Việt. Tutor không tự đặt mục tiêu riêng và không tự hành động ngoài luồng học.

Pathway role đọc thông tin người học như level, mục tiêu, thời gian học, điểm quiz, lỗi sai, thẻ nhớ đến hạn và feedback để đề xuất bước học tiếp theo. Hiện tại phần này là heuristic, chưa phải BKT, DKT hay IRT.

Assessment role phụ trách tạo và chấm quiz hoặc test chương. Sau khi người học nộp bài, backend ghi nhận tín hiệu đúng hoặc sai để cập nhật tiến độ.

Review role dùng logic kiểu spaced repetition cho flashcard, ví dụ Again, Hard, Good, Easy, để quyết định thời điểm ôn lại.

Vì vậy, em không claim đây là một multi-agent system tự trị hoàn toàn có negotiation hay planning phức tạp. Cách diễn đạt đúng hơn là role-based learning agent architecture.

Câu chuyển slide:

Để tránh hiểu quá phạm vi nghiên cứu, em xin tách riêng một slide về những điều thesis không claim.

Lưu ý khi bị hỏi:

- Câu trả lời an toàn: “Trong thesis, agent là role-based service/component, không phải autonomous agent theo nghĩa đầy đủ.”
- Nếu bị hỏi sao không dùng LangGraph/AutoGen/CrewAI: trả lời đây là hướng phát triển sau; MVP tập trung vào workflow ổn định, đo được và triển khai được.

## Slide 06 - What This Thesis Does Not Claim

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: nói rõ giới hạn nghiên cứu để hội đồng hiểu đây là limitation được kiểm soát, không phải lỗi claim quá mức.

Script nói:

Slide này là phần em muốn nói rõ trước khi đi tiếp vào kiến trúc và kết quả. Thesis của em có dùng AI, RAG và agent roles, nhưng có một số điều em không claim.

Thứ nhất, em không claim đây là autonomous multi-agent system đầy đủ. Agent trong đề tài là role-based learning services, có nhiệm vụ riêng và chia sẻ trạng thái người học.

Thứ hai, em không claim pathway hiện tại dùng BKT, DKT hay IRT. Pathway trong MVP dùng heuristic rule và learning signals như quiz score, fail count, flashcard rating và feedback.

Thứ ba, em không claim hệ thống đã chứng minh learning gain. Pilot user test chỉ kiểm tra usability, flow, trust và dữ liệu ban đầu, chưa đủ để kết luận người học giỏi lên sau thời gian dài.

Thứ tư, em không claim LLM answer luôn đúng. RAG giúp câu trả lời có nguồn hơn, nhưng answer correctness và faithfulness vẫn cần một đánh giá riêng.

Thứ năm, em không claim pilot đại diện cho toàn bộ người học tiếng Nhật ở Việt Nam. Pilot nhỏ chỉ dùng để kiểm tra ban đầu với nhóm gần đối tượng thesis.

Câu chuyển slide:

Sau khi làm rõ các giới hạn này, em xin chuyển sang kiến trúc hệ thống.

Lưu ý khi bị hỏi:

- Đây là slide nên nói chậm và chắc, vì nó chặn trước các câu hỏi khó.
- Nếu hội đồng hỏi vào limitation, nhắc lại: “Dạ phần này em có ghi rõ là chưa claim, và em xem là future work.”

## Slide 07 - Architecture

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: nói rõ hệ thống được chia lớp như thế nào.

Script nói:

Kiến trúc trong thesis gồm 3 phần chính.

Phần frontend dùng React và Vite. Đây là nơi người học làm onboarding, xem pathway, học flashcard, làm quiz, làm test chương, tra cứu từ và hỏi Tutor.

Phần backend trong thesis được trình bày là Python FastAPI. Backend xử lý API, xác thực, JWT và refresh token, profile, progress, feedback, metrics, Tutor, planner và assessment. Backend cũng là nơi giữ answer key, nên frontend không nhận đáp án khi bắt đầu bài test.

Phần data và retrieval gồm PostgreSQL, Neo4j, Qdrant và LLM provider. PostgreSQL lưu dữ liệu người học và tiến độ. Neo4j lưu Knowledge Graph về từ vựng, ngữ pháp, kanji, bài học và quan hệ. Qdrant dùng cho vector search. LLM dùng để sinh câu trả lời, nhưng câu trả lời được kiểm soát bằng context và nguồn truy xuất.

Điểm em muốn nhấn mạnh ở đây là hệ thống không chỉ là gọi AI. Nó có API contract, phân tách trách nhiệm, lưu trạng thái học và có thể kiểm thử.

Câu chuyển slide:

Từ kiến trúc này, em xin trình bày luồng học chính của người dùng.

Lưu ý khi bị hỏi:

- Nếu thầy hỏi “backend là gì?”, trả lời theo thesis: Python FastAPI.
- Nhấn mạnh answer key nằm ở backend để tránh gian lận và tạo learning signal đáng tin hơn.

## Slide 08 - Learner Flow

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: nói app hoạt động như thế nào với người học bình thường.

Script nói:

Luồng học chính được thiết kế để người mới không phải tự chọn quá nhiều nút. Đầu tiên, người học vào onboarding và trả lời các câu hỏi về trình độ, mục tiêu, thời gian học mỗi ngày và phần đang yếu.

Sau đó hệ thống tạo pathway. Một chương có khoảng 3 bài học. Trong mỗi bài, người học học bằng flashcard trước, sau đó làm lesson quiz. Nếu đạt từ 85% trở lên thì mở bài tiếp theo. Nếu chưa đạt, hệ thống giữ người học lại để ôn thêm, xem lỗi sai và có thể hỏi Tutor.

Sau khi hoàn thành các bài trong một chương, người học cần làm chapter test, khoảng 20 câu. Nếu đạt 85% thì mở chương kế tiếp. Cách này làm cho assessment có vai trò rõ hơn, giống một checkpoint trước khi qua phần mới.

Cuối cùng, feedback trong quá trình học được lưu lại để hệ thống biết bài đó quá khó, quá dễ, hay tốc độ đang phù hợp.

Câu chuyển slide:

Tiếp theo là phần cá nhân hóa, tức là pathway thay đổi dựa trên người học cụ thể.

Lưu ý khi bị hỏi:

- Nói rõ “85%” là rule dùng trong MVP để kiểm soát tiến độ.
- Nếu bị hỏi vì sao cần test chương: trả lời quiz ngắn kiểm tra từng bài, còn chapter test kiểm tra khả năng tổng hợp.

## Slide 09 - Personalization

Thời lượng gợi ý: 75-90 giây

Mục tiêu slide: giải thích cá nhân hóa là gì trong hệ thống này.

Script nói:

Trong VAJA, cá nhân hóa không chỉ là hiển thị tên người học. Hệ thống dùng nhiều tín hiệu để quyết định người học nên học gì tiếp.

Nhóm tín hiệu đầu tiên đến từ onboarding: người học đang ở mức số 0, N5 hay N4; học để thi JLPT, giao tiếp, học ở trường, công việc hay đọc hiểu; mỗi ngày có bao nhiêu phút; và đang yếu phần nào như kana, từ vựng, ngữ pháp, kanji, nghe hoặc nói.

Nhóm tín hiệu thứ hai đến từ quá trình học: điểm quiz, số lần làm sai, câu nào sai, flashcard được đánh giá Again, Hard, Good hay Easy, và feedback của người học sau bài.

Từ đó hệ thống có 3 hướng xử lý đơn giản. Nếu là người mới từ số 0, hệ thống cho học kana trước. Nếu người học sai nhiều hoặc feedback là quá khó, hệ thống giữ lại, tăng phần ôn và gợi ý hỏi Tutor. Nếu người học làm tốt, hệ thống cho đi nhanh hơn qua bài tiếp theo hoặc chương tiếp theo.

Em cũng muốn nói rõ là hiện tại phần pathway vẫn là heuristic, tức là logic theo luật. Thesis chưa claim đã dùng BKT, DKT hoặc IRT. Đây là hạn chế và cũng là hướng phát triển tiếp theo.

Câu chuyển slide:

Một phần hỗ trợ quan trọng trong luồng này là AI Tutor có dùng RAG.

Lưu ý khi bị hỏi:

- Câu trả lời an toàn: “MVP có adaptive pathway theo rule và learning signals, chưa phải ML model.”
- Không dùng từ “tự học sâu” hay “AI tự tối ưu hoàn toàn”.

## Slide 10 - Tutor + RAG

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: nói AI Tutor làm gì và không làm gì.

Script nói:

AI Tutor trong hệ thống không chỉ là một ô chat tự do. Khi người học hỏi, Tutor nhận câu hỏi kèm context của bài học hiện tại, ví dụ bài kana, từ vựng hoặc ngữ pháp đang học.

Sau đó hệ thống truy xuất nguồn từ Knowledge Graph và Vector DB. Knowledge Graph giúp tìm quan hệ có cấu trúc, ví dụ một từ thuộc bài nào, liên quan đến mẫu ngữ pháp nào. Vector DB giúp tìm nội dung gần nghĩa với câu hỏi của người học.

Khi có nguồn, LLM sẽ dùng nguồn đó để giải thích bằng tiếng Việt. Kết quả trả về gồm câu trả lời, nguồn tham khảo và mức độ confidence.

Một điểm quan trọng là chat không tự động làm tăng mastery. Nếu người học chỉ hỏi hoặc đọc giải thích, hệ thống chỉ ghi nhận là đã được hỗ trợ hoặc đã tiếp xúc với nguồn. Mastery chỉ thay đổi rõ khi có tín hiệu có kiểm soát như quiz, assessment hoặc flashcard review.

Câu chuyển slide:

Vì vậy, phần assessment rất quan trọng để tạo tín hiệu học tập rõ ràng hơn.

Lưu ý khi bị hỏi:

- Nếu hỏi “AI Tutor có thể trả lời sai không?”, trả lời: có rủi ro, nên hệ thống dùng RAG/source và không dùng chat để tăng mastery trực tiếp.
- Nói “Tutor hỗ trợ học”, không nói Tutor thay giáo viên hoàn toàn.

## Slide 11 - Assessment + Mastery

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: giải thích quiz, test chương và mastery signal.

Script nói:

Assessment trong hệ thống gồm lesson quiz và chapter test. Lesson quiz thường ngắn, khoảng 5 câu, dùng để kiểm tra ngay sau bài học. Chapter test dài hơn, khoảng 20 câu, dùng để quyết định người học có đủ điều kiện sang chương tiếp theo hay không.

Điểm quan trọng là answer key được giữ ở backend. Khi frontend bắt đầu session, nó không nhận đáp án. Sau khi người học nộp bài, backend mới chấm và ghi kết quả đúng hoặc sai.

Từ kết quả này, hệ thống tạo learning signal. Với quiz và assessment, signal chính là CORRECT hoặc WRONG. Với flashcard, signal là Again, Hard, Good hoặc Easy theo kiểu spaced repetition.

Những tín hiệu này giúp pathway biết người học nên đi tiếp, ôn lại, hay cần Tutor hỗ trợ thêm. Như vậy assessment không đứng riêng, mà được nối vào quá trình cá nhân hóa.

Câu chuyển slide:

Ngoài phần AI và học tập, em cũng muốn nhấn mạnh đóng góp về kỹ thuật phần mềm.

Lưu ý khi bị hỏi:

- Nếu hỏi vì sao 85%: trả lời đây là threshold rõ ràng cho MVP, có thể điều chỉnh sau khi có thêm dữ liệu.
- Nếu hỏi có adaptive testing chưa: trả lời chưa; hiện tại là controlled assessment, adaptive testing là hướng sau.

## Slide 12 - Software Engineering Contribution

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: kéo trọng tâm về MSE, không chỉ nói AI.

Script nói:

Vì đây là thesis của chương trình Master of Software Engineering, em không chỉ xem đóng góp là phần AI. Đóng góp chính còn nằm ở cách thiết kế và triển khai một hệ thống học tập có thể chạy, có thể test và có thể deploy.

Về kiến trúc, hệ thống tách frontend, backend, data layer và retrieval layer. Các chức năng như auth, profile, chat, flashcard, assessment, feedback, metrics và planner có API riêng.

Về bảo mật, hệ thống dùng JWT access token, refresh token, Google OAuth linking và BCrypt cho mật khẩu. Điều này giúp session rõ ràng hơn và có thể invalidate khi cần.

Về reproducibility, hệ thống có Docker Compose, seed dữ liệu Knowledge Graph, script benchmark và automated tests. Việc này giúp người khác có thể chạy lại một phần đánh giá thay vì chỉ đọc mô tả.

Về triển khai, frontend được deploy public, backend chạy trên VPS, và có proxy API để demo end-to-end.

Câu chuyển slide:

Sau đây là kết quả benchmark cho phần truy xuất nguồn RAG.

Lưu ý khi bị hỏi:

- Nhấn mạnh “MSE contribution”: architecture, API contract, testing, deployment, reproducibility.
- Không để phần bảo vệ bị lệch thành “em chỉ gọi LLM”.

## Slide 13 - RAG Benchmark

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: trình bày số liệu chính cho RQ2 và phân biệt rõ retrieval quality với answer quality.

Script nói:

Để đánh giá RQ2, em chạy benchmark với 50 câu hỏi N5/N4 và so sánh 4 chế độ. Chế độ thứ nhất là LLM only, tức là không có retrieval. Chế độ thứ hai là Vector. Chế độ thứ ba là Knowledge Graph. Chế độ thứ tư là kết hợp KG và Vector.

Kết quả chính là KG cộng Vector có Source Recall cao nhất, đạt 0.740. Vector riêng và KG riêng đều đạt 0.620. Điều này cho thấy khi kết hợp hai hướng truy xuất, hệ thống tìm được nhiều nguồn liên quan hơn.

Với Precision@3, Vector đạt 0.300, KG đạt 0.386, và KG cộng Vector cũng đạt 0.386. Kết quả này cho thấy KG giúp precision tốt hơn vector-only, còn phần kết hợp giúp tăng recall rõ hơn.

Điểm quan trọng nhất ở slide này là Source Recall 0.740 không có nghĩa là answer accuracy 74%. Đây là metric của phần retrieval, tức là hệ thống có tìm được nguồn đúng hay không. Nó chưa chấm câu trả lời cuối cùng của LLM có đúng hoàn toàn hay có faithful với nguồn hay không.

Vì vậy, em chỉ kết luận ở mức vừa phải: với bộ câu hỏi thử nghiệm, KG cộng Vector cải thiện khả năng tìm nguồn liên quan cho Tutor. Answer correctness và faithfulness cần một đánh giá riêng, có thể bằng human annotation hoặc rubric ở hướng phát triển sau.

Câu chuyển slide:

Ngoài benchmark tự động, em cũng có pilot user test nhỏ với người học thật.

Lưu ý khi bị hỏi:

- Nhớ số chính: 50 câu hỏi, Source Recall KG+Vector = 0.740, Precision@3 KG+Vector = 0.386.
- Không nói 0.740 là answer accuracy 74%.
- Không nói benchmark chứng minh người học giỏi hơn; nó chỉ đánh giá retrieval quality.

## Slide 14 - Pilot User Test

Thời lượng gợi ý: 75-90 giây

Mục tiêu slide: giải thích sample consistency của pilot và nói giới hạn đúng.

Script nói:

Phần pilot user test được làm với quy mô nhỏ, đúng với giới hạn thời gian của thesis. Mục tiêu chính là xem nhóm người học gần với đối tượng thesis, tức sinh viên hoặc người học Việt Nam ở mức N5/N4, có đi được qua luồng học hay không, phần nào dễ rối, và người học có tin Tutor ở mức nào.

Ở phần này em cần giải thích rõ sample consistency. Các con số không dùng cùng một mẫu số. 10 learners là nhóm người học chính trong pilot dùng để quan sát luồng học. 11 survey rows là số dòng khảo sát SUS/trust được gửi lên, nên em gọi là rows chứ không gọi là 11 learners. 11 feedback users là số người dùng có gửi feedback trong app. 19 knowledge progress users là số tài khoản có phát sinh progress log, trong đó có thể gồm pilot, demo hoặc test account.

Vì vậy, em không cộng các con số này lại và cũng không dùng chúng như một sample size duy nhất. Chúng là các log khác nhau từ các endpoint khác nhau.

Dữ liệu kết quả gồm 25 lesson attempts. Điểm lesson trung bình là 82.4%, pass rate là 56%, tức 14/25 attempts đạt. SUS là 58.6, tức là mức usability trung bình, chưa cao. Trust score là 3.45 trên 5, cũng ở mức trung bình.

Em diễn giải kết quả này theo hướng thận trọng. Dữ liệu cho thấy hệ thống có thể dùng được và có thể ghi nhận tiến độ, nhưng trải nghiệm ban đầu vẫn cần cải thiện. Một số feedback nói luồng học còn khó hiểu với người mới, cần thêm tour guide, bảng chữ cái, audio và hướng dẫn khi đang làm bài.

Vì vậy, pilot này không đủ để kết luận hệ thống làm tăng năng lực tiếng Nhật một cách chắc chắn. Nó là dữ liệu ban đầu để cải thiện sản phẩm và bổ sung phần đánh giá trong appendix.

Câu chuyển slide:

Từ các feedback đó, em đã điều chỉnh lại một số phần của hệ thống.

Lưu ý khi bị hỏi:

- Nếu thầy hỏi vì sao 10, 11 và 19 khác nhau: trả lời đây là các loại log khác nhau, không cùng mẫu số.
- Nếu thầy hỏi SUS 58.6 có tốt không: trả lời trung bình, chưa tốt; đây là lý do em có phần cải thiện sau feedback.
- Nói rõ “small pilot”, không nói “large user study”.

## Slide 15 - Feedback Improvements

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: cho thấy feedback đã được dùng để cải thiện app, không chỉ thu thập cho có.

Script nói:

Sau user feedback, em sửa hệ thống theo các vấn đề người dùng nêu ra.

Vấn đề đầu tiên là người mới không thấy được bức tranh tổng thể, đặc biệt người chưa học chữ Nhật. Vì vậy em bổ sung tour guide và kana overview để người dùng biết mình đang học gì và tại sao phải bắt đầu từ bảng chữ cái.

Vấn đề thứ hai là luồng học trước đó còn rời rạc. Em chuyển sang mô hình chapter pathway, mỗi chương có khoảng 3 bài, học xong thì có chapter test trước khi qua chương mới.

Vấn đề thứ ba là assessment trước đó chưa có vai trò rõ. Em điều chỉnh để test chương là checkpoint bắt buộc, gồm khoảng 20 câu và yêu cầu 85%.

Vấn đề thứ tư là học giao tiếp mà thiếu audio thì khó học. Vì vậy flashcard có audio và phần pronunciation guidance ở mức MVP.

Vấn đề cuối cùng là chatbot không nên bị tách khỏi luồng học. Em đưa Tutor thành floating Tutor, để người học có thể hỏi khi đang học hoặc làm bài mà không bị rời khỏi màn hình chính.

Câu chuyển slide:

Sau phần này, em sẽ demo nhanh một luồng người học mới từ số 0.

Lưu ý khi bị hỏi:

- Nói “pronunciation guidance MVP”, không nói đã có scoring phát âm hoàn chỉnh nếu chưa đủ dữ liệu.
- Nhấn mạnh feedback được dùng làm input cải thiện UI và flow.

## Slide 16 - Demo Scenario

Thời lượng gợi ý: 30-45 giây trước demo, demo 4-6 phút

Mục tiêu slide: nói trước kịch bản demo để hội đồng dễ theo.

Script nói:

Ở phần demo, em sẽ đi theo một người học mới từ số 0. Đầu tiên là vào landing page và bắt đầu onboarding. Người học trả lời các câu hỏi cơ bản để hệ thống biết trình độ, mục tiêu và thời gian học.

Sau đó hệ thống đưa người học vào pathway. Nếu là người mới hoàn toàn thì bắt đầu từ kana. Người học xem flashcard, nghe audio, làm quiz, và nếu đạt điểm thì mở bài tiếp theo.

Sau khoảng 3 bài trong một chương, người học gặp chapter test. Nếu chưa đạt, hệ thống giữ người học lại để ôn. Nếu đạt, hệ thống mở chương tiếp theo.

Trong quá trình học, người học có thể dùng floating Tutor để hỏi câu đang thắc mắc, hoặc dùng lookup để tra từ theo ngữ cảnh.

Nếu mạng hoặc server có vấn đề trong lúc demo, em vẫn có thể trình bày flow này theo slide và ảnh chụp kết quả.

Câu chuyển slide:

Sau demo, em xin kết luận những gì đề tài đã làm được và các giới hạn còn lại.

Lưu ý khi bị hỏi:

- Khi demo, đi chậm, nói rõ mỗi nút dùng để làm gì.
- Không demo quá dài; tập trung vào onboarding, pathway, lesson, quiz, Tutor và chapter test.

## Slide 17 - Conclusion and Future Work

Thời lượng gợi ý: 60-75 giây

Mục tiêu slide: kết thúc chắc, không nói quá.

Script nói:

Tóm lại, VAJA đã đạt mục tiêu prototype chính. Hệ thống chạy end-to-end, có luồng học cho người mới, có pathway, flashcard, quiz, test chương, Tutor có nguồn RAG, lookup, feedback và ghi nhận tiến độ học.

Về mặt research, thesis có 5 câu hỏi nghiên cứu, có thiết kế Knowledge Graph, benchmark RAG với 50 câu hỏi, có pilot user test nhỏ, và có dữ liệu ban đầu về SUS, trust, pass rate và lesson score. Với RAG benchmark, em chỉ kết luận về retrieval quality, chưa kết luận answer quality.

Về mặt kỹ thuật phần mềm, đề tài có kiến trúc rõ, API contract, xác thực, lưu dữ liệu học tập, Docker, deployment và automated tests. Đây là phần em muốn nhấn mạnh vì đề tài thuộc chương trình MSE.

Tuy nhiên, đề tài vẫn có giới hạn. Pilot còn nhỏ và không đại diện cho toàn bộ người học. Dữ liệu pre-test/post-test còn yếu, nên em không claim learning gain. Pathway hiện tại là heuristic chứ chưa dùng BKT, DKT hoặc IRT. RAG benchmark chưa chấm answer correctness hoặc faithfulness. Phần phát âm mới ở mức guidance, chưa có scoring đầy đủ dựa trên dữ liệu giọng nói.

Hướng phát triển tiếp theo là mở rộng dữ liệu học, chạy user study lớn hơn, bổ sung BKT hoặc IRT cho mastery model, bổ sung đánh giá answer correctness/faithfulness cho Tutor, cải thiện speech/pronunciation, và tiếp tục làm pathway thông minh hơn dựa trên dữ liệu thật.

Em xin kết thúc phần trình bày tại đây. Em cảm ơn quý thầy cô đã lắng nghe và mong nhận được góp ý của hội đồng.

Lưu ý khi bị hỏi:

- Kết luận theo hướng đã làm được prototype và có số liệu ban đầu.
- Khi nói limitation, nói thẳng và biến nó thành future work.

## Câu Trả Lời Nhanh Khi Bị Hỏi Xoáy

### 1. “Đây có thật sự là multi-agent system không?”

Dạ trong phạm vi thesis này, em dùng theo nghĩa role-based learning agents. Nghĩa là mỗi agent là một vai trò có nhiệm vụ riêng như Tutor, Pathway, Assessment và Review. Em không claim đây là multi-agent tự trị hoàn toàn có negotiation hay autonomous planning phức tạp.

### 2. “Pathway có dùng AI model không?”

Dạ hiện tại pathway là adaptive theo heuristic và learning signals. Hệ thống dùng dữ liệu như onboarding, quiz score, fail count, flashcard rating và feedback để điều chỉnh tốc độ học. Em chưa claim đã dùng BKT, DKT hoặc IRT. Đây là hướng phát triển sau.

### 3. “Số liệu user study đủ mạnh chưa?”

Dạ chưa đủ để kết luận hiệu quả học dài hạn. Đây là pilot test nhỏ để kiểm tra usability, trust và khả năng hoàn thành flow. Em đưa vào appendix và dùng kết quả để cải thiện hệ thống.

### 4. “RAG benchmark chứng minh điều gì?”

Dạ benchmark chứng minh ở mức truy xuất nguồn. Với 50 câu hỏi N5/N4, KG cộng Vector có Source Recall cao nhất là 0.740. Con số này không phải answer accuracy 74%. Nó chỉ nói rằng hệ thống tìm được nguồn liên quan tốt hơn. Answer correctness và faithfulness cần một đánh giá riêng.

### 5. “Điểm đóng góp MSE là gì?”

Dạ đóng góp MSE nằm ở thiết kế và triển khai hệ thống: kiến trúc frontend/backend/data/retrieval, API contract, bảo mật session, lưu tiến độ học, benchmark có thể chạy lại, Docker, testing và deployment.

### 6. “Vì sao người mới cần học kana trước?”

Dạ vì nếu người học chưa biết bảng chữ cái thì học từ vựng, ngữ pháp hoặc giao tiếp sẽ rất khó theo. Cho nên với người chọn mức số 0, hệ thống ưu tiên kana overview và bài học kana đầu tiên.

### 7. “Chatbot có làm người học giỏi hơn không?”

Dạ em không kết luận như vậy. Tutor là công cụ hỗ trợ giải thích theo nguồn. Mastery chỉ được cập nhật rõ qua quiz, assessment và flashcard review, chứ không phải chỉ chat là tăng trình độ.

### 8. “Vì sao số liệu pilot có 10, 11 và 19 khác nhau?”

Dạ vì đó là các mẫu số khác nhau. 10 là số pilot learners chính. 11 survey rows là số dòng khảo sát SUS/trust. 11 feedback users là số user có gửi feedback trong app. 19 knowledge progress users là số tài khoản có progress log, có thể gồm cả pilot, demo hoặc test account. Em không cộng các số này thành một sample size duy nhất.
