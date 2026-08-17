# VAJA Thesis Defense Speaker Notes

## Slide 01 - Cover

Em xin trình bày đề tài VAJA, một trợ lý học tiếng Nhật cá nhân hóa cho người học N5/N4. Trọng tâm của đề tài là thiết kế và xây dựng hệ thống web có Knowledge Graph, RAG, pathway học, flashcard, quiz và phần đánh giá thử nghiệm.

## Slide 02 - Problem

Vấn đề chính là người học sơ cấp thường không biết nên học gì tiếp theo. Ngoài ra, chatbot chung có thể trả lời thiếu nguồn, còn quiz và flashcard nhiều khi không nối lại thành một trạng thái học rõ ràng.

## Slide 03 - Agenda

Đây là slide agenda. Bài bảo vệ đi theo 6 ý: vấn đề, phạm vi agent, kiến trúc, cá nhân hóa, kết quả đánh giá và demo. Em sẽ không trình bày VAJA như một app thương mại, mà trình bày như một hệ thống phần mềm đã được thiết kế, triển khai và kiểm thử.

## Slide 04 - Research Questions

Đề tài có 4 câu hỏi: thiết kế hệ thống thế nào, KG + Vector RAG có giúp truy xuất tốt hơn không, pathway cá nhân hóa dựa trên dữ liệu nào, và người học dùng thử có phản hồi ra sao.

## Slide 05 - Terminology

Để tránh nói quá, agent trong bài này được hiểu là role-based agent architecture. Tutor, Pathway, Assessment và Review là các vai chuyên biệt trong hệ thống. Đây chưa phải multi-agent tự trị hoàn toàn có negotiation phức tạp.

## Slide 06 - Architecture

Hệ thống chia thành frontend React, backend Spring Boot và FastAPI AI service. Spring Boot giữ nghiệp vụ, bảo mật, API và dữ liệu người học. FastAPI xử lý phần AI như RAG, tutor và hỗ trợ planning. Dữ liệu dùng PostgreSQL, Neo4j và Qdrant.

## Slide 07 - Learner Flow

Người học đi theo flow rõ: onboarding, vào pathway, học flashcard, làm quiz cuối bài, qua 3 bài thì làm test chương. Nếu đạt từ 85% thì mở tiếp, nếu chưa đạt thì quay lại ôn và hỏi Tutor.

## Slide 08 - Personalization

Cá nhân hóa ở đây dựa trên level, mục tiêu, thời gian học, điểm yếu, kết quả quiz, flashcard và feedback. Người mới từ số 0 học kana trước. Người rớt nhiều sẽ nhận nhịp học chậm hơn và bài ôn. Người làm tốt có thể đi nhanh hơn.

## Slide 09 - Tutor + RAG

Tutor không chỉ là chat tự do. Tutor nhận context bài học, truy xuất từ Knowledge Graph và Vector DB, sau đó mới tạo câu trả lời tiếng Việt. Nếu câu trả lời có nguồn thì hệ thống ghi exposure, nhưng không tự tăng mastery chỉ vì người học chat.

## Slide 10 - Assessment + Mastery

Quiz và assessment là nơi tạo learning signal rõ ràng. Answer key được giữ ở backend, frontend không nhận đáp án khi start session. Sau khi nộp bài, backend chấm điểm và ghi đúng hoặc sai vào progress.

## Slide 11 - Software Engineering

Vì đây là MSE, đóng góp chính nằm ở thiết kế hệ thống chạy được: clean architecture, API contract rõ, JWT và refresh token, Docker, script benchmark, automated tests và public deployment.

## Slide 12 - RAG Benchmark

Benchmark dùng 50 câu hỏi N5/N4 và 4 chế độ. KG + Vector đạt Source Recall 0.740, cao hơn Vector only và KG only. Kết quả này hỗ trợ RQ2 rằng kết hợp graph và vector giúp tìm nguồn tốt hơn.

## Slide 13 - Pilot User Test

Pilot có 10 survey users, 11 feedback users và 25 lesson attempts. SUS là 58.6, trust là 3.45/5, điểm bài học trung bình 82.4%, pass rate 56%. Kết quả cho thấy flow dùng được nhưng usability vẫn còn cần cải thiện.

## Slide 14 - Feedback Improvements

Từ feedback, app được sửa theo hướng dễ dùng hơn: thêm kana overview, tour guide, pathway theo chương, test chương, audio, pronunciation scoring MVP và floating Tutor trong lúc học.

## Slide 15 - Demo Scenario

Demo sẽ đi theo người học mới từ số 0: vào landing, onboarding, chọn học kana, xem flashcard, nghe phát âm, làm quiz, thấy điều kiện qua bài và xem Tutor hỗ trợ khi cần.

## Slide 16 - Conclusion

Kết luận là VAJA đã chạy end-to-end, có KG-RAG, có pathway cá nhân hóa mức prototype, có benchmark và pilot data. Hạn chế là pilot còn nhỏ, pre/post-test chưa mạnh, pathway hiện còn heuristic và cần phát triển thêm BKT/IRT hoặc dữ liệu học dài hạn.
