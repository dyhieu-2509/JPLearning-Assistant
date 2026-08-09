from app.application.services.pronunciation_service_impl import PronunciationServiceImpl


class FakeSettings:
    gemini_api_key = "test-key"
    gemini_model = "gemini-test"


class NoKeySettings:
    gemini_api_key = None
    gemini_model = "gemini-test"


class FakeGeminiResponse:
    text = (
        '{"transcript":"はじめまして。",'
        '"scorePercent":86,'
        '"verdict":"GOOD",'
        '"issues":["Âm cuối hơi nhỏ"],'
        '"feedback":"Bạn đọc khá rõ. Giữ nhịp chậm như vậy.",'
        '"confidence":0.82}'
    )


class FakeGeminiModels:
    def __init__(self) -> None:
        self.last_model = ""
        self.last_contents = []

    def generate_content(self, model: str, contents: list, config: object) -> FakeGeminiResponse:
        self.last_model = model
        self.last_contents = contents
        return FakeGeminiResponse()


class FakeGeminiClient:
    def __init__(self) -> None:
        self.models = FakeGeminiModels()


def test_pronunciation_service_falls_back_without_gemini_key() -> None:
    service = PronunciationServiceImpl(NoKeySettings())

    response = service.score("はじめまして。", b"fake-audio", "audio/webm")

    assert response.score_percent == 45
    assert response.verdict == "AGAIN"
    assert response.transcript == ""
    assert response.confidence == 0.2


def test_pronunciation_service_parses_gemini_json_feedback() -> None:
    client = FakeGeminiClient()
    service = PronunciationServiceImpl(FakeSettings(), client_factory=lambda _api_key: client)

    response = service.score(
        target_text="はじめまして。",
        audio_bytes=b"fake-audio",
        mime_type="audio/webm",
        lesson_title="Chào hỏi",
        level="N5",
    )

    assert response.transcript == "はじめまして。"
    assert response.score_percent == 86
    assert response.verdict == "GOOD"
    assert response.issues == ["Âm cuối hơi nhỏ"]
    assert "đọc khá rõ" in response.feedback
    assert response.confidence == 0.82
    assert client.models.last_model == "gemini-test"
    assert "はじめまして" in client.models.last_contents[0]
