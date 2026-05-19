"""
Build Qdrant vector index for JPLearning Assistant.

Usage:
    python index_qdrant.py --recreate
"""

from __future__ import annotations

import argparse
import logging
import uuid
from pathlib import Path
from typing import Iterable

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.config.settings import get_settings
from app.infrastructure.vectordb.text_embedder import TextEmbedder, create_text_embedder
from data_loader import (
    GRAMMAR_CSV,
    KANJI_CSV,
    MINNA_YAML,
    VOCAB_CSV,
    parse_grammar,
    parse_kanji,
    parse_minna_vocabulary,
    parse_vocabulary,
)

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


def build_documents(levels: list[str]) -> list[dict[str, str]]:
    """Build indexable documents from local datasets."""
    documents: list[dict[str, str]] = []

    for item in parse_grammar(GRAMMAR_CSV, levels):
        title = item["pattern"]
        documents.append(
            {
                "type": "GrammarPoint",
                "id": f"{title}:{item['level']}",
                "title": title,
                "reading": "",
                "meaningVi": item["meaning_vi"],
                "meaningEn": item["meaning_en"],
                "level": item["level"],
                "source": "JLPT",
                "text": " ".join(
                    [
                        "grammar",
                        title,
                        item["meaning_en"],
                        item["meaning_vi"],
                        item["level"],
                    ]
                ),
            }
        )

    for item in parse_vocabulary(VOCAB_CSV, levels):
        title = item["kanji"] or item["reading"]
        documents.append(
            {
                "type": "Vocabulary",
                "id": f"{item['reading']}:{item['level']}",
                "title": title,
                "reading": item["reading"],
                "meaningVi": "",
                "meaningEn": "",
                "level": item["level"],
                "source": "JLPT",
                "text": " ".join(["vocabulary", title, item["reading"], item["level"]]),
            }
        )

    for item in parse_minna_vocabulary(MINNA_YAML):
        if item["level"] not in levels:
            continue
        title = item["kanji"] or item["kana"]
        documents.append(
            {
                "type": "Vocabulary",
                "id": f"{item['kana']}:{item['level']}:lesson-{item['lesson_id']}",
                "title": title,
                "reading": item["kana"],
                "meaningVi": "",
                "meaningEn": item["meaning_en"],
                "level": item["level"],
                "source": "MinnaNoDS",
                "text": " ".join(
                    [
                        "vocabulary",
                        title,
                        item["kana"],
                        item["romaji"],
                        item["meaning_en"],
                        f"lesson {item['lesson_id']}",
                        item["level"],
                    ]
                ),
            }
        )

    for item in parse_kanji(KANJI_CSV, levels):
        documents.append(
            {
                "type": "Kanji",
                "id": item["character"],
                "title": item["character"],
                "reading": "",
                "meaningVi": "",
                "meaningEn": "",
                "level": item["level"],
                "source": "JLPT",
                "text": " ".join(["kanji", item["character"], item["level"]]),
            }
        )

    return documents


def upsert_documents(
    client: QdrantClient,
    collection_name: str,
    embedder: TextEmbedder,
    documents: Iterable[dict[str, str]],
    batch_size: int = 64,
) -> int:
    """Upsert documents into Qdrant."""
    document_batch: list[dict[str, str]] = []
    total = 0
    for document in documents:
        document_batch.append(document)
        if len(document_batch) >= batch_size:
            total += _upsert_batch(client, collection_name, embedder, document_batch)
            document_batch = []

    if document_batch:
        total += _upsert_batch(client, collection_name, embedder, document_batch)
    return total


def _upsert_batch(
    client: QdrantClient,
    collection_name: str,
    embedder: TextEmbedder,
    documents: list[dict[str, str]],
) -> int:
    vectors = embedder.embed_many([document["text"] for document in documents])
    points: list[PointStruct] = []
    for document, vector in zip(documents, vectors, strict=True):
        point_key = ":".join(
            [
                "jpassistant",
                document["type"],
                document["source"],
                document["id"],
                document["title"],
                document["text"],
            ]
        )
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, point_key))
        payload = {key: value for key, value in document.items() if key != "text"}
        payload["text"] = document["text"]
        points.append(PointStruct(id=point_id, vector=vector, payload=payload))

    client.upsert(collection_name=collection_name, points=points, wait=True)
    return len(points)


def ensure_collection(
    client: QdrantClient,
    collection_name: str,
    vector_size: int,
    recreate: bool,
) -> None:
    """Create or recreate the target Qdrant collection."""
    exists = client.collection_exists(collection_name)
    if exists and recreate:
        client.delete_collection(collection_name)
        exists = False

    if not exists:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )


def main() -> None:
    """Build and upload Qdrant index."""
    parser = argparse.ArgumentParser(description="Index JPLearning knowledge documents in Qdrant")
    parser.add_argument("--recreate", action="store_true", help="Delete and rebuild the collection")
    parser.add_argument("--level", nargs="+", default=["N5", "N4"], help="JLPT levels to index")
    parser.add_argument("--qdrant-url", default=None, help="Qdrant URL override")
    parser.add_argument("--collection", default=None, help="Collection name override")
    parser.add_argument("--batch-size", type=int, default=64, help="Embedding/upsert batch size")
    parser.add_argument("--prefer-grpc", action="store_true", help="Use Qdrant gRPC for uploads")
    args = parser.parse_args()

    settings = get_settings()
    qdrant_url = args.qdrant_url or settings.qdrant_url
    collection_name = args.collection or settings.qdrant_collection
    embedder = create_text_embedder(settings)
    client_kwargs = {
        "url": qdrant_url,
        "prefer_grpc": args.prefer_grpc,
        "timeout": 60,
    }
    if not args.prefer_grpc:
        client_kwargs["headers"] = {"Accept-Encoding": "identity"}
    client = QdrantClient(**client_kwargs)

    try:
        documents = build_documents(args.level)
        ensure_collection(client, collection_name, embedder.vector_size, args.recreate)
        total = upsert_documents(client, collection_name, embedder, documents, batch_size=args.batch_size)
    finally:
        if hasattr(embedder, "close"):
            embedder.close()
        client.close()

    print(f"Indexed {total} documents into {collection_name} at {qdrant_url}")


if __name__ == "__main__":
    main()
