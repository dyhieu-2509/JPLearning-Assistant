import { Layers3, Plus, RotateCcw } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { FlashcardCardResponse, FlashcardDeckResponse, FlashcardReviewResponse } from "../../../shared/models";

const ratings = ["AGAIN", "HARD", "GOOD", "EASY"] as const;

export function FlashcardsView() {
  const { accessToken } = useAuth();
  const token = accessToken ?? "";
  const [decks, setDecks] = useState<FlashcardDeckResponse[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashcardCardResponse[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardCardResponse[]>([]);
  const [flipped, setFlipped] = useState<string | null>(null);
  const [title, setTitle] = useState("N5 Vocabulary Sprint");
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
      setError(caught instanceof ApiError ? caught.message : "Cannot load flashcards");
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
      setError(caught instanceof ApiError ? caught.message : "Cannot create deck");
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
      setError(caught instanceof ApiError ? caught.message : "Cannot review card");
    }
  }

  const activeCard = dueCards[0] ?? cards[0] ?? null;

  return (
    <section className="learning-grid">
      <div className="section-heading full-span">
        <p className="eyebrow">Spaced repetition</p>
        <h2>Flashcards</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Create</p>
            <h3>Auto deck from KG</h3>
          </div>
          <Plus size={21} />
        </div>
        <form className="profile-form single" onSubmit={createDeck}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Level
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>N5</option>
              <option>N4</option>
              <option>N3</option>
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="vocabulary">vocabulary</option>
              <option value="grammar">grammar</option>
              <option value="kanji">kanji</option>
            </select>
          </label>
          <button className="icon-text-button" type="submit">
            <Layers3 size={18} />
            Generate deck
          </button>
        </form>
      </section>

      <section className="workspace-panel focus-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Review now</p>
            <h3>{dueCards.length} cards due</h3>
          </div>
          <button className="icon-button" type="button" onClick={() => void loadFlashcards()} title="Refresh">
            <RotateCcw size={18} />
          </button>
        </div>
        {loading ? (
          <div className="loading-inline">Loading cards...</div>
        ) : activeCard ? (
          <div className="flashcard-study">
            <button className="flashcard-card" type="button" onClick={() => setFlipped(activeCard.id)}>
              <span>{flipped === activeCard.id ? activeCard.backText : activeCard.frontText}</span>
              <small>{flipped === activeCard.id ? activeCard.reading || "meaning" : "tap to flip"}</small>
            </button>
            <div className="rating-row">
              {ratings.map((rating) => (
                <button key={rating} type="button" onClick={() => void review(activeCard, rating)}>
                  {rating}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state compact">Create a deck to start review.</div>
        )}
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Decks</p>
            <h3>Library</h3>
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
                {deck.level} · {deck.category} · {deck.cardCount} cards
              </span>
            </button>
          ))}
          {!decks.length && <div className="empty-state compact">No decks yet.</div>}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cards</p>
            <h3>Selected deck</h3>
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
          {!cards.length && <div className="empty-state compact">Select or create a deck.</div>}
        </div>
      </section>
    </section>
  );
}
