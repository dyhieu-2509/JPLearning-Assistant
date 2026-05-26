from app.config.settings import Settings
from app.domain.schemas import KnowledgeSource


class LangChainClient:
    """LLM adapter placeholder used by the Tutor Agent."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def generate_tutor_answer(self, message: str, sources: list[KnowledgeSource]) -> str:
        """Generate a Vietnamese tutor answer from retrieved context."""
        if not sources:
            return (
                "Mình chưa tìm thấy ngữ cảnh phù hợp trong Knowledge Graph. "
                "Ở bước Phase 3, hệ thống đã nhận câu hỏi và sẵn sàng nối RAG; "
                "hãy import dữ liệu Neo4j để câu trả lời có nguồn tham chiếu."
            )

        lines = [
            "Dựa trên dữ liệu đã truy xuất từ Knowledge Graph, đây là phần giải thích ngắn:",
        ]
        for source in sources[:3]:
            meaning = source.meaningVi or source.meaningEn or "chưa có nghĩa chi tiết"
            reading = f" ({source.reading})" if source.reading else ""
            lines.append(f"- {source.title}{reading}: {meaning}.")

        lines.append(f"Câu hỏi của bạn: {message}")
        lines.append("Bản sinh tự nhiên bằng LLM sẽ được bật khi cấu hình API key ở các phase tiếp theo.")
        return "\n".join(lines)
