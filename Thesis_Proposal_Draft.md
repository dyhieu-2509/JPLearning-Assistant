# THESIS PROPOSAL (BẢN NHÁP)

**Tên đề tài:** Xây dựng phần mềm Web-App trợ lý ảo học tiếng Nhật sử dụng kiến trúc Multi-Agent và Knowledge Graph cho học tập và cá nhân hóa lộ trình học tập của sinh viên đại học tại Việt Nam.

---

## 1. Introduction and Background (Giới thiệu và Bối cảnh)
### 1.1. Problem Description (Mô tả bài toán)
Việc học tiếng Nhật tại Việt Nam, đặc biệt đối với đối tượng sinh viên đại học, đang đối mặt với nhiều khó khăn do thiếu sự cá nhân hóa. Phần lớn các ứng dụng học tập hiện nay (như Duolingo, Memrise) chỉ cung cấp lộ trình học cố định, tuyến tính và thiếu khả năng tư duy giải thích ngữ cảnh sâu sắc (context-aware reasoning). Mặt khác, sinh viên đại học có những mục tiêu học tập rất đa dạng: ôn thi chứng chỉ JLPT (N5-N2), học giao tiếp thực tế, hoặc đơn thuần là ôn tập để qua môn tiếng Nhật tại trường. Sự thiếu hụt một hệ thống có thể tự động đánh giá năng lực, hiểu rõ mục tiêu và tự động sinh lộ trình học phù hợp đã gây lãng phí thời gian và làm giảm động lực học tập của sinh viên.

### 1.2. Research Objectives (Mục tiêu nghiên cứu)
Đề tài nhằm mục đích nghiên cứu và phát triển một hệ thống trợ lý ảo thông minh (Web-App) giúp giải quyết các hạn chế trên, với các mục tiêu cụ thể:
1. Xây dựng một **Knowledge Graph (Đồ thị tri thức)** liên kết các thực thể học tập (Từ vựng, Kanji, Ngữ pháp, Ví dụ) dựa trên nhiều nguồn giáo trình chuẩn (Minna no Nihongo, Soumatome, Marugoto) và giáo trình tùy biến nội bộ.
2. Thiết kế và tích hợp kiến trúc **Multi-Agent (Đa tác tử)** để mô phỏng vai trò của một Gia sư cá nhân: từ việc kiểm tra đầu vào, lên kế hoạch học tập, đến giải đáp thắc mắc.
3. Đề xuất thuật toán sinh lộ trình học tập tự động (Automated Curriculum Generation) dựa trên năng lực hiện tại, mục tiêu và thời gian rảnh của người dùng.

### 1.3. Scope of the Project (Phạm vi dự án)
*   **Đối tượng người dùng:** Sinh viên đại học tại Việt Nam.
*   **Phạm vi ngôn ngữ:** Giải thích và giao diện hoàn toàn bằng tiếng Việt.
*   **Phạm vi dữ liệu:** Kiến thức ngữ pháp, từ vựng và Kanji tiếng Nhật từ trình độ vỡ lòng (N5) đến trung - cao cấp (N2). 
*   **Phạm vi nghiệp vụ:** Hệ thống tập trung vào vai trò người lên kế hoạch (Planner) và gia sư giải đáp (Tutor), không thay thế hoàn toàn nghiệp vụ sư phạm khắt khe của giảng viên truyền thống.

---

## 2. Proposed Solution (Giải pháp đề xuất)
### 2.1. Solution Description (Mô tả giải pháp)
Giải pháp là một hệ thống Web-App sử dụng kiến trúc Multi-Agent kết hợp với Agentic RAG và Knowledge Graph. Quy trình của người dùng bao gồm:
1. **Kiểm tra đầu vào (Placement Test):** Hệ thống tạo bài test từ Graph DB bằng thuật toán thích ứng (Adaptive) để đánh giá trình độ.
2. **Thiết lập mục tiêu (Goal Setting):** Sinh viên chọn mục tiêu (Thi JLPT, giao tiếp, học qua môn) và quỹ thời gian.
3. **Sinh lộ trình tự động (Curriculum Generation):** Tác tử lên kế hoạch (Planner Agent) truy xuất dữ liệu từ Graph DB, tính toán khối lượng kiến thức cần học để tạo ra lộ trình chi tiết theo từng ngày (Daily Roadmap).
4. **Học tập & Tương tác:** Tác tử gia sư (Tutor Agent) theo dõi tiến độ, cung cấp Flashcard và giải đáp thắc mắc (RAG) ngữ pháp bằng tiếng Việt dựa trên cơ sở dữ liệu giáo trình.

### 2.2. Software Architecture (Kiến trúc phần mềm)
Hệ thống sử dụng kiến trúc hướng dịch vụ (Service-Oriented) tích hợp Multi-Agent:
*   **Knowledge Base (Graph DB):** Nơi tổ chức Ontology liên kết các bài học, từ vựng, ngữ pháp theo cấu trúc mạng lưới (Neo4j).
*   **Agentic Framework:** 
    *   *Assessor Agent:* Phụ trách ra đề và chấm điểm đánh giá năng lực.
    *   *Planner Agent:* Tính toán đường đi ngắn nhất (Pathfinding) trong Knowledge Graph để tạo lộ trình học.
    *   *Tutor Agent:* Sử dụng RAG truy xuất tài liệu để giải thích ngữ nghĩa, ngữ pháp.
*   **Backend API:** Quản lý User, Lưu trữ tiến độ, Spaced Repetition System (SRS).

### 2.3. Technology Stack (Công nghệ sử dụng)
*   **Backend:** Python (FastAPI).
*   **Frontend:** ReactJS / Next.js.
*   **Database:** PostgreSQL (User Data), Neo4j (Knowledge Graph), Milvus/Qdrant (Vector DB cho RAG).
*   **AI/LLM:** LangChain / AutoGen Framework, tích hợp LLM (OpenAI / Gemini).
*   **Data Pipeline:** Python Scripts (BeautifulSoup, Pandas, PyPDF2) để thu thập, làm sạch và xử lý dữ liệu từ Anki Decks, PDF và Web.

---

## 3. Implementation Plan (Kế hoạch triển khai)
### 3.1. Main Development Stages (Các giai đoạn chính)
*   **Giai đoạn 1:** Phân tích yêu cầu và Tiền xử lý dữ liệu (Crawl/Parse dữ liệu JLPT N5-N1, Minna no Nihongo thành file CSV/JSON). Đẩy dữ liệu vào Neo4j.
*   **Giai đoạn 2:** Phát triển Backend (FastAPI) và thuật toán Placement Test.
*   **Giai đoạn 3:** Tích hợp Multi-Agent và Xây dựng thuật toán tạo Lộ trình học cá nhân hóa.
*   **Giai đoạn 4:** Phát triển Frontend Web-App, Dashboard tiến độ.
*   **Giai đoạn 5:** Triển khai Tutor Agent (Chatbot) tích hợp RAG, kiểm thử và tinh chỉnh hệ thống.

### 3.2. Expected Schedule (Tiến độ dự kiến)
*(Mục này bạn có thể điền timeline chi tiết theo số tuần/tháng thực tế của đồ án).*

### 3.3. Feasibility Assessment (Đánh giá tính khả thi)
*   **Dữ liệu:** Đã hoàn thiện toàn bộ công cụ tự động cào/làm sạch (Crawl & Parse) dữ liệu ngôn ngữ tiếng Việt (Từ vựng, Ngữ pháp, Cặp câu giao tiếp).
*   **Kỹ thuật:** Python/FastAPI kết hợp với LangChain và Neo4j là các công nghệ trưởng thành, có tài liệu hỗ trợ phong phú.

---

## 4. Expected Results (Kết quả dự kiến)
*   Một hệ thống Web-App hoạt động trơn tru với giao diện trực quan.
*   Knowledge Graph chuẩn hóa chứa tri thức tiếng Nhật liên kết chặt chẽ.
*   Cơ chế Multi-Agent tự động ra bài kiểm tra, tạo lộ trình học cá nhân và giải đáp thắc mắc 24/7 một cách tự nhiên.
*   Nâng cao động lực và hiệu quả học tập cho sinh viên thông qua lộ trình được thiết kế riêng biệt.

---

## 5. Evaluation Plan (Kế hoạch đánh giá)
1. **Đánh giá Kỹ thuật:** 
    *   Đo lường thời gian phản hồi của thuật toán sinh lộ trình (dưới 5 giây).
    *   Đánh giá độ chính xác của RAG trong việc truy xuất đúng ngữ pháp để giải thích (Accuracy & Relevance metrics).
2. **Đánh giá Người dùng:** 
    *   Mời một nhóm sinh viên (Beta testers) dùng thử. Khảo sát mức độ hài lòng (CSAT) và tính hữu ích của lộ trình học được đề xuất so với lộ trình truyền thống.
