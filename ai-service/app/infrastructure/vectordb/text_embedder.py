from __future__ import annotations

import hashlib
import math
import re
import time
import unicodedata
from typing import Protocol, Sequence

import httpx


class TextEmbedder(Protocol):
    """Common interface for vector embedders used by Qdrant."""

    @property
    def vector_size(self) -> int:
        """Return embedding vector size."""

    def embed(self, text: str) -> list[float]:
        """Embed one text string."""

    def embed_many(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed multiple text strings."""

    def terms(self, text: str) -> set[str]:
        """Return normalized lexical terms used for lightweight reranking."""

    def normalized_text(self, text: str) -> str:
        """Return normalized expanded text for exact phrase checks."""


class LexicalTextMixin:
    """Shared multilingual normalization helpers for retrieval reranking."""

    _TOKEN_PATTERN = re.compile(
        r"[a-z0-9]+|[\u3040-\u30ff]+|[\u3400-\u9fff]+",
        re.IGNORECASE,
    )

    _EXPANSIONS = {
        "\u0103n": (
            "eat food taberu tabemasu "
            "\u98df\u3079\u308b \u98df\u3079\u307e\u3059 "
            "\u305f\u3079\u308b \u305f\u3079\u307e\u3059"
        ),
        "\u0103n ti\u1ebfng nh\u1eadt": (
            "eat taberu tabemasu "
            "\u98df\u3079\u308b \u98df\u3079\u307e\u3059 "
            "\u305f\u3079\u308b \u305f\u3079\u307e\u3059"
        ),
        "an": (
            "eat food taberu tabemasu "
            "\u98df\u3079\u308b \u98df\u3079\u307e\u3059 "
            "\u305f\u3079\u308b \u305f\u3079\u307e\u3059"
        ),
        "an tieng nhat": (
            "eat taberu tabemasu "
            "\u98df\u3079\u308b \u98df\u3079\u307e\u3059 "
            "\u305f\u3079\u308b \u305f\u3079\u307e\u3059"
        ),
        "eat": (
            "\u0103n taberu tabemasu "
            "\u98df\u3079\u308b \u98df\u3079\u307e\u3059 "
            "\u305f\u3079\u308b \u305f\u3079\u307e\u3059"
        ),
        "food": (
            "\u0111\u1ed3 \u0103n th\u1ee9c \u0103n tabemono "
            "\u98df\u3079\u7269 \u305f\u3079\u3082\u306e"
        ),
        "kh\u00f4ng": "not nai masen",
        "khong": "not nai masen",
        "\u0111\u01b0\u1ee3c": "allowed can dekiru ii",
        "duoc": "allowed can dekiru ii",
        "\u0111u\u1ee3c": "allowed can dekiru ii",
        "kh\u00f4ng \u0111\u01b0\u1ee3c": (
            "must not cha ikenai ja ikenai "
            "\u3061\u3083\u3044\u3051\u306a\u3044 \u3058\u3083\u3044\u3051\u306a\u3044"
        ),
        "khong duoc": (
            "must not cha ikenai ja ikenai "
            "\u3061\u3083\u3044\u3051\u306a\u3044 \u3058\u3083\u3044\u3051\u306a\u3044"
        ),
        "c\u1ea5m": "must not prohibit cha ikenai ja ikenai",
        "cam": "must not prohibit cha ikenai ja ikenai",
        "l\u00e0": "to be desu da \u3067\u3059 \u3060",
        "la": "to be desu da \u3067\u3059 \u3060",
        "to be": "l\u00e0 desu da \u3067\u3059 \u3060",
        "desu": "to be l\u00e0 la da \u3067\u3059 \u3060",
        "da": "to be l\u00e0 la desu \u3067\u3059 \u3060",
        "khi n\u00e0o": "when usage use meaning",
        "khi nao": "when usage use meaning",
        "d\u00f9ng khi n\u00e0o": "usage meaning use when",
        "dung khi nao": "usage meaning use when",
        "d\u00f9ng": "use usage meaning",
        "dung": "use usage meaning",
        "ngh\u0129a": "meaning means",
        "nghia": "meaning means",
        "ti\u1ebfng nh\u1eadt": "japanese nihongo \u65e5\u672c\u8a9e",
        "tieng nhat": "japanese nihongo \u65e5\u672c\u8a9e",
    }

    def terms(self, text: str) -> set[str]:
        expanded = self._expand(self._normalize(text))
        return set(self._TOKEN_PATTERN.findall(expanded))

    def normalized_text(self, text: str) -> str:
        return self._expand(self._normalize(text))

    def _expand(self, normalized: str) -> str:
        expanded = normalized
        for phrase, expansion in self._EXPANSIONS.items():
            if self._contains_phrase(normalized, phrase):
                expanded = f"{expanded} {expansion}"
        return expanded

    def _contains_phrase(self, normalized: str, phrase: str) -> bool:
        if self._is_latin_phrase(phrase):
            pattern = rf"(?<![^\W_]){re.escape(phrase)}(?![^\W_])"
            return re.search(pattern, normalized) is not None
        return phrase in normalized

    def _is_latin_phrase(self, phrase: str) -> bool:
        for char in phrase:
            if char.isspace() or char.isdigit():
                continue
            if "LATIN" not in unicodedata.name(char, ""):
                return False
        return True

    def _normalize(self, text: str) -> str:
        normalized = unicodedata.normalize("NFKC", text).lower()
        return re.sub(r"\s+", " ", normalized).strip()

    def _char_ngrams(self, token: str, min_size: int, max_size: int) -> list[str]:
        if not token:
            return []
        ngrams: list[str] = []
        upper = min(max_size, len(token))
        for size in range(min_size, upper + 1):
            ngrams.extend(token[index : index + size] for index in range(0, len(token) - size + 1))
        return ngrams

    def _normalize_vector(self, vector: Sequence[float]) -> list[float]:
        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return [float(value) for value in vector]
        return [float(value) / norm for value in vector]


class LocalTextEmbedder(LexicalTextMixin):
    """Deterministic multilingual feature-hashing embedder for offline fallback."""

    def __init__(self, vector_size: int = 384) -> None:
        self._vector_size = vector_size

    @property
    def vector_size(self) -> int:
        return self._vector_size

    def embed(self, text: str) -> list[float]:
        features = self._features(text)
        vector = [0.0] * self._vector_size
        for feature, weight in features:
            digest = hashlib.sha256(feature.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self._vector_size
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign * weight
        return self._normalize_vector(vector)

    def embed_many(self, texts: Sequence[str]) -> list[list[float]]:
        return [self.embed(text) for text in texts]

    def _features(self, text: str) -> list[tuple[str, float]]:
        normalized = self._normalize(text)
        expanded = self._expand(normalized)
        tokens = self._TOKEN_PATTERN.findall(expanded)

        features: list[tuple[str, float]] = []
        for token in tokens:
            features.append((f"tok:{token}", 2.0))
            for ngram in self._char_ngrams(token, 2, 4):
                features.append((f"ng:{ngram}", 0.7))

        compact = re.sub(r"\s+", "", expanded)
        for ngram in self._char_ngrams(compact, 3, 5):
            features.append((f"cx:{ngram}", 0.35))
        return features


class OllamaTextEmbedder(LexicalTextMixin):
    """Multilingual deep-learning embedder backed by a local Ollama model."""

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "bge-m3",
        vector_size: int = 1024,
        timeout_seconds: float = 120.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._vector_size = vector_size
        self._client = httpx.Client(timeout=timeout_seconds)
        self._fallback_embedder = LocalTextEmbedder(vector_size)

    @property
    def vector_size(self) -> int:
        return self._vector_size

    def embed(self, text: str) -> list[float]:
        embeddings = self.embed_many([text])
        return embeddings[0] if embeddings else []

    def embed_many(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []

        try:
            return self._embed_batch(texts)
        except (httpx.HTTPStatusError, httpx.TransportError) as exc:
            if len(texts) == 1 and self._is_nan_embedding_error(exc):
                return self._embed_folded_text(texts[0])
            if len(texts) == 1:
                return self._embed_batch_with_retries(texts)
            midpoint = max(1, len(texts) // 2)
            return self.embed_many(texts[:midpoint]) + self.embed_many(texts[midpoint:])

    def _embed_batch_with_retries(self, texts: Sequence[str]) -> list[list[float]]:
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                return self._embed_batch(texts)
            except (httpx.HTTPStatusError, httpx.TransportError) as exc:
                if self._is_nan_embedding_error(exc):
                    return self._embed_folded_text(texts[0])
                last_error = exc
                time.sleep(0.5 * (attempt + 1))
        if len(texts) == 1:
            return self._embed_folded_text(texts[0])
        if last_error is not None:
            raise last_error
        return []

    def _embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        prepared_texts = [self._prepare_embedding_text(text) for text in texts]
        response = self._client.post(
            f"{self._base_url}/api/embed",
            json={"model": self._model, "input": prepared_texts},
        )
        response.raise_for_status()
        payload = response.json()
        embeddings = payload.get("embeddings")
        if embeddings is None and "embedding" in payload:
            embeddings = [payload["embedding"]]
        if not isinstance(embeddings, list) or len(embeddings) != len(texts):
            raise RuntimeError(f"Ollama returned an invalid embedding payload for model {self._model}")

        vectors: list[list[float]] = []
        for embedding in embeddings:
            vector = self._normalize_vector([float(value) for value in embedding])
            if len(vector) != self._vector_size:
                raise RuntimeError(
                    f"Ollama model {self._model} returned vector size {len(vector)}, "
                    f"expected {self._vector_size}. Update EMBEDDING_VECTOR_SIZE."
                )
            vectors.append(vector)
        return vectors

    def close(self) -> None:
        self._client.close()

    def _embed_folded_text(self, text: str) -> list[list[float]]:
        folded_text = self._strip_latin_diacritics(text)
        if folded_text != text:
            try:
                return self._embed_batch([folded_text])
            except (httpx.HTTPStatusError, httpx.TransportError):
                pass
        return [self._fallback_embedder.embed(text)]

    def _prepare_embedding_text(self, text: str) -> str:
        normalized = unicodedata.normalize("NFKC", text)
        normalized = re.sub(r"\[([A-Za-z0-9]+)\]", r"\1", normalized)
        normalized = re.sub(r"\b([A-Za-z]+)['\u2019]s\b", r"\1", normalized)
        normalized = re.sub(r"['\u2019`]", "", normalized)
        return " ".join(re.findall(r"[^\W_]+", normalized))

    def _is_nan_embedding_error(self, exc: Exception) -> bool:
        if not isinstance(exc, httpx.HTTPStatusError):
            return False
        return "unsupported value: NaN" in exc.response.text

    def _strip_latin_diacritics(self, text: str) -> str:
        chars: list[str] = []
        for char in text:
            if char == "\u0111":
                chars.append("d")
                continue
            if char == "\u0110":
                chars.append("D")
                continue

            decomposed = unicodedata.normalize("NFD", char)
            base = decomposed[0]
            if "LATIN" in unicodedata.name(base, ""):
                chars.append(base)
            else:
                chars.append(char)
        return unicodedata.normalize("NFC", "".join(chars))


def create_text_embedder(settings) -> TextEmbedder:
    """Create the configured text embedder."""
    provider = str(getattr(settings, "embedding_provider", "local")).strip().lower()
    vector_size = int(getattr(settings, "embedding_vector_size", 384))

    if provider == "ollama":
        return OllamaTextEmbedder(
            base_url=str(getattr(settings, "ollama_base_url", "http://localhost:11434")),
            model=str(getattr(settings, "ollama_embedding_model", "bge-m3")),
            vector_size=vector_size,
            timeout_seconds=float(getattr(settings, "ollama_timeout_seconds", 120.0)),
        )

    if provider in {"local", "hash", "hashing"}:
        return LocalTextEmbedder(vector_size)

    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {provider}")
