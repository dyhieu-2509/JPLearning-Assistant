# Đề án Nghiên cứu & Phát triển: Web-App Trợ lý ảo Học Tiếng Nhật cho Sinh viên

## 1. Tóm tắt Phạm vi (Scope) & Đối tượng (Target Audience)
*   **Đối tượng:** Sinh viên Đại học tại Việt Nam.
*   **Đặc thù:** Sinh viên có nhiều mục tiêu học tập khác nhau:
    *   Học để thi lấy chứng chỉ JLPT (N5, N4, N3...) phục vụ công việc.
    *   Học giao tiếp thực tế.
    *   Học đối phó để qua môn trên trường.
*   **Hạn chế nghiệp vụ sư phạm:** Trợ lý ảo đóng vai trò **Người hướng dẫn (Tutor) & Lên lộ trình (Planner)**, không thay thế hoàn toàn giảng viên. Ưu tiên tính linh hoạt, giảm tải áp lực sư phạm cứng nhắc.
*   **Ngôn ngữ chính:** Giao diện và giải thích ngữ pháp/từ vựng hoàn toàn bằng **Tiếng Việt**.

## 2. Nguồn dữ liệu Giáo trình (Dataset Strategy)
Để phục vụ mọi nhu cầu, Knowledge Graph (KG) sẽ được tổng hợp từ nhiều nguồn giáo trình tiêu chuẩn (đã được Việt hóa):
1.  **Minna no Nihongo (Sơ cấp 1 & 2):** Phù hợp để xây dựng nền tảng (Từ vựng, Ngữ pháp, Hội thoại) cho người mới bắt đầu. (Đã có sẵn tại `datasets/MinnaNoDS`).
2.  **Somatome / Shinkanzen Master (N4 - N2):** Tập trung vào luyện thi JLPT nhanh, phân chia rạch ròi theo kỹ năng (Kanji, Từ vựng, Ngữ pháp, Đọc hiểu, Nghe). Rất phù hợp cho sinh viên muốn lấy bằng gấp.
3.  **Marugoto / Irodori:** Phù hợp cho mục tiêu giao tiếp thực tế và văn hóa, ít đặt nặng ngữ pháp hàn lâm.
4.  **Giáo trình nội bộ Đại học (Custom Data):** Cho phép import slide/tài liệu môn học của trường đại học để trợ lý ảo "khoanh vùng" ôn thi qua môn.

> [!IMPORTANT]
> Việc xây dựng Knowledge Graph cần ánh xạ (mapping) các kiến thức giữa các giáo trình. Ví dụ: Ngữ pháp "～て kudasai" ở bài 14 Minna no Nihongo sẽ được link với node JLPT N5 và có thể xuất hiện trong Marugoto A1.

## 3. Kiến trúc Hệ thống (System Architecture)

### 3.1. Công nghệ đề xuất (Tech Stack)
*   **Backend:** **FastAPI** (Python). *Lý do: Tốc độ cao, hỗ trợ tốt cho Async (rất quan trọng khi gọi các API của LLM/Agents), dễ dàng tích hợp các thư viện AI/Data Science (LangChain, LlamaIndex).*
*   **Frontend:** ReactJS/Next.js (hoặc VueJS) để tạo trải nghiệm Web-App mượt mà, hỗ trợ làm bài test interactive.
*   **Cơ sở dữ liệu (Database):**
    *   *Relational DB:* PostgreSQL (Lưu thông tin User, kết quả test, tiến độ học).
    *   *Graph DB:* Neo4j (Lưu trữ Knowledge Graph về ngữ pháp, từ vựng liên kết giữa các giáo trình).
    *   *Vector DB:* Milvus / Qdrant (Lưu trữ RAG cho các câu hỏi, giải thích ngữ cảnh).
*   **AI Architecture:** Multi-Agent Framework (AutoGen hoặc LangGraph).

### 3.2. Luồng nghiệp vụ cốt lõi (User Flow)
1.  **Onboarding & Placement Test (Kiểm tra đầu vào):**
    *   Hệ thống sinh ngẫu nhiên các câu hỏi từ Graph DB theo thuật toán Adaptive (trả lời đúng -> câu khó hơn, trả lời sai -> câu dễ hơn).
2.  **Goal Setting (Xác định mục tiêu):**
    *   Hệ thống phỏng vấn sinh viên: *"Mục tiêu của bạn là gì? (JLPT N3 trong 6 tháng / Qua môn Tiếng Nhật 1 / Giao tiếp cơ bản)"*
    *   Sinh viên chọn thời gian rảnh mỗi ngày (ví dụ: 30 phút/ngày).
3.  **Curriculum Generation (Tạo lộ trình cá nhân hóa):**
    *   Dựa trên [Trình độ hiện tại] + [Mục tiêu] + [Thời gian rảnh].
    *   Agent sẽ lấy dữ liệu từ các giáo trình phù hợp (ví dụ: Thi N3 -> Dùng Somatome; Giao tiếp -> Dùng Irodori) để tạo timeline học tập theo ngày.
4.  **Daily Learning & Chat (Học tập hàng ngày):**
    *   Mỗi ngày, hệ thống nhả bài học (flashcard, quiz, đoạn hội thoại).
    *   Tutor Agent túc trực để giải đáp thắc mắc (VD: *"Tại sao câu này dùng trợ từ に mà không phải で?"*).

---

## 4. Lộ trình Triển khai (Phases of Development)

### Phase 1: Xây dựng Nền tảng Dữ liệu & Knowledge Graph (Data & KG Foundation)
*   **Nhiệm vụ:**
    *   Thu thập, parse và làm sạch dữ liệu từ Minna no Nihongo, Somatome (từ vựng, Kanji, ngữ pháp, bài tập).
    *   Viết script Python chuyển đổi dữ liệu thô (YAML/CSV/PDF) thành cấu trúc Node & Edge.
    *   Đẩy dữ liệu lên Neo4j. Xây dựng ontology (Ví dụ: `(Word)-[BELONGS_TO]->(Lesson)-[PART_OF]->(Textbook)`).
*   **Kết quả:** Graph DB hoạt động trơn tru, có API truy vấn nội dung bài học.

### Phase 2: Phát triển Core Backend (FastAPI) & Placement Test Engine
*   **Nhiệm vụ:**
    *   Thiết lập project FastAPI, cấu hình PostgreSQL cho User Management.
    *   Phát triển API cho bài kiểm tra năng lực (Placement Test) lấy câu hỏi từ Neo4j.
    *   Viết thuật toán chấm điểm và định vị trình độ (N5, N4, N3...).
*   **Kết quả:** Sinh viên có thể tạo tài khoản, làm bài test và nhận đánh giá năng lực ban đầu.

### Phase 3: Tích hợp Multi-Agent & Thuật toán Cá nhân hóa (Curriculum Engine)
*   **Nhiệm vụ:**
    *   Xây dựng **Planner Agent**: Nhận input từ kết quả test + mục tiêu của User -> Query Graph DB -> Sinh ra JSON chứa lộ trình học 30/60/90 ngày.
    *   Phát triển hệ thống theo dõi tiến độ (Spaced Repetition System - SRS) để tính toán điểm rơi quên kiến thức của sinh viên.
*   **Kết quả:** User nhận được Lộ trình học (Roadmap) dựa trên các giáo trình đã chọn.

### Phase 4: Phát triển Interactive Web Frontend
*   **Nhiệm vụ:**
    *   Thiết kế UI/UX theo phong cách hiện đại, trẻ trung phù hợp với sinh viên đại học.
    *   Tạo giao diện: Dashboard (Tiến độ), Màn hình Test, Màn hình Học tập (Flashcard, Multiple Choice), và Chat Interface.
*   **Kết quả:** Giao diện Web hoàn chỉnh, kết nối mượt mà với FastAPI backend.

### Phase 5: Triển khai Tutor Agent (Agentic RAG) & Hoàn thiện
*   **Nhiệm vụ:**
    *   Xây dựng **Tutor Agent**: Một chatbot tích hợp RAG, có khả năng search trong các giáo trình để giải thích ngữ pháp cho sinh viên bằng tiếng Việt.
    *   Giới hạn scope của chatbot để không trả lời các câu hỏi ngoài phạm vi học tập (tránh rủi ro).
    *   Testing, Bug Fixing và Deploy (Docker, AWS/GCP).
*   **Kết quả:** Sản phẩm hoàn thiện có thể dùng thử (Beta Test) với một nhóm sinh viên nhỏ.

## Yêu cầu xem xét từ User (User Review Required)
> [!WARNING]
> 1. **Về framework:** Bạn có ưu tiên sử dụng FastAPI hơn Django không? FastAPI sẽ phù hợp hơn rất nhiều cho kiến trúc Multi-Agent và AI.
> 2. **Về dữ liệu:** Việc số hóa các giáo trình như Somatome sang định dạng CSV/Graph tốn khá nhiều công sức. Bạn có muốn sử dụng các bộ Anki Deck (đã được cộng đồng số hóa) làm nguồn dữ liệu chính để rút ngắn thời gian không?

## Câu hỏi mở (Open Questions)
1. Trong phạm vi đồ án, chúng ta sẽ ưu tiên hoàn thiện lộ trình học tự động (Phase 3) trước, hay tính năng Chatbot giải đáp (Phase 5) trước?
2. Có cần thiết kế tính năng import PDF/Slide môn học trên trường của sinh viên để Agent tự động bóc tách kiến thức ôn thi (chế độ học qua môn) ngay trong version 1 không?
