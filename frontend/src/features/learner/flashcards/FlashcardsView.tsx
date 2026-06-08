import { Layers3, Plus, RotateCcw } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { FlashcardCardResponse, FlashcardDeckResponse, FlashcardReviewResponse } from "../../../shared/models";

const ratings = ["AGAIN", "HARD", "GOOD", "EASY"] as const;
const ratingLabels: Record<(typeof ratings)[number], string> = {
  AGAIN: "Lại lần nữa",
  HARD: "Khó",
  GOOD: "Ổn",
  EASY: "Dễ"
};

export function FlashcardsView() {
  const { accessToken } = useAuth();
  const token = accessToken ?? "";
  const [decks, setDecks] = useState<FlashcardDeckResponse[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashcardCardResponse[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardCardResponse[]>([]);
  const [flipped, setFlipped] = useState<string | null>(null);
  const [title, setTitle] = useState("Tăng tốc từ vựng N5");
  const [level, setLevel] = useState("N5");
  const [category, setCategory] = useState("vocabulary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadFlashcards(deckId = selectedDeckId) {
    setError(null);
    try {
      const [deckData, dueData] = await Promise.all([
        apiRequest<FlashcardDeckResponse[]>("/flashcards/decks", { token }),
        apiRequest<FlashcardCardResponse[]>("/flashcards/review/due?limit=12", { token })
      ]);
      setDecks(deckData);
      setDueCards(dueData);
      const nextDeckId = deckId ?? deckData[0]?.id ?? null;
      setSelectedDeckId(nextDeckId);
      if (nextDeckId) {
        const cardData = await apiRequest<FlashcardCardResponse[]>(`/flashcards/decks/${nextDeckId}/cards`, {
          token
        });
        setCards(cardData);
      } else {
        setCards([]);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải thẻ nhớ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFlashcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const deck = await apiRequest<FlashcardDeckResponse>("/flashcards/decks", {
        method: "POST",
        token,
        body: { title, level, category, autoGenerate: true, limit: 12 }
      });
      await loadFlashcards(deck.id);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tạo bộ thẻ");
    }
  }

  async function review(card: FlashcardCardResponse, rating: (typeof ratings)[number]) {
    setError(null);
    try {
      await apiRequest<FlashcardReviewResponse>("/flashcards/review", {
        method: "POST",
        token,
        body: { cardId: card.id, rating }
      });
      setFlipped(null);
      await loadFlashcards(selectedDeckId);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể lưu lượt ôn");
    }
  }

  const activeCard = dueCards[0] ?? cards[0] ?? null;

  return (
    <section className="learning-grid">
      <div className="section-heading full-span">
        <p className="eyebrow">間隔反復</p>
        <h2>Thẻ nhớ</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Tạo bộ thẻ</p>
            <h3>Tự tạo từ đồ thị kiến thức</h3>
          </div>
          <Plus size={21} />
        </div>
        <form className="profile-form single" onSubmit={createDeck}>
          <label>
            Tên bộ thẻ
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Trình độ
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>N5</option>
              <option>N4</option>
              <option>N3</option>
            </select>
          </label>
          <label>
            Nhóm kiến thức
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="vocabulary">Từ vựng</option>
              <option value="grammar">Ngữ pháp</option>
              <option value="kanji">Kanji</option>
            </select>
          </label>
          <button className="icon-text-button" type="submit">
            <Layers3 size={18} />
            Tạo bộ thẻ
          </button>
        </form>
      </section>

      <section className="workspace-panel focus-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Ôn ngay</p>
            <h3>{dueCards.length} thẻ cần ôn</h3>
          </div>
          <button className="icon-button" type="button" onClick={() => void loadFlashcards()} title="Làm mới">
            <RotateCcw size={18} />
          </button>
        </div>
        {loading ? (
          <div className="loading-inline">Đang tải thẻ...</div>
        ) : activeCard ? (
          <div className="flashcard-study">
            <button className="flashcard-card" type="button" onClick={() => setFlipped(activeCard.id)}>
              <span>{flipped === activeCard.id ? activeCard.backText : activeCard.frontText}</span>
              <small>{flipped === activeCard.id ? activeCard.reading || "nghĩa" : "chạm để lật"}</small>
            </button>
            <div className="rating-row">
              {ratings.map((rating) => (
                <button key={rating} type="button" onClick={() => void review(activeCard, rating)}>
                  {ratingLabels[rating]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state compact">Tạo bộ thẻ để bắt đầu ôn.</div>
        )}
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Bộ thẻ</p>
            <h3>Thư viện</h3>
          </div>
        </div>
        <div className="stack-list">
          {decks.map((deck) => (
            <button
              className={deck.id === selectedDeckId ? "session-button active" : "session-button"}
              key={deck.id}
              type="button"
              onClick={() => void loadFlashcards(deck.id)}
            >
              <strong>{deck.title}</strong>
              <span>
                {deck.level} · {displayCategory(deck.category)} · {deck.cardCount} thẻ
              </span>
            </button>
          ))}
          {!decks.length && <div className="empty-state compact">Chưa có bộ thẻ nào.</div>}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">カード</p>
            <h3>Bộ thẻ đang chọn</h3>
          </div>
        </div>
        <div className="stack-list">
          {cards.slice(0, 8).map((card) => (
            <div className="knowledge-row" key={card.id}>
              <div>
                <strong>{card.frontText}</strong>
                <span>{card.backText}</span>
              </div>
              <span className="topic-chip">{card.level || "JLPT"}</span>
            </div>
          ))}
          {!cards.length && <div className="empty-state compact">Chọn hoặc tạo một bộ thẻ.</div>}
        </div>
      </section>
    </section>
  );
}

function displayCategory(value?: string | null): string {
  if (!value) {
    return "Kiến thức";
  }

  const labels: Record<string, string> = {
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    kanji: "Kanji"
  };
  return labels[value.toLowerCase()] ?? value;
}
