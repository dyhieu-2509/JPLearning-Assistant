import { CalendarClock, CheckCircle2, Eye, Layers3, Plus, RotateCcw, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import {
  EmptyState,
  IconButton,
  IconTextButton,
  Panel,
  PrimaryButton,
  TopicChip
} from "../../../shared/components";
import type { FlashcardCardResponse, FlashcardDeckResponse, FlashcardReviewResponse } from "../../../shared/models";

const ratings = ["AGAIN", "HARD", "GOOD", "EASY"] as const;
type ReviewRating = (typeof ratings)[number];
type CategoryFilter = "all" | "vocabulary" | "grammar" | "kanji";

const categoryFilters: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "kanji", label: "Kanji" },
  { value: "vocabulary", label: "Từ vựng" },
  { value: "grammar", label: "Ngữ pháp" }
];

const ratingLabels: Record<ReviewRating, { label: string; description: string }> = {
  AGAIN: {
    label: "Chưa nhớ",
    description: "Sẽ gặp lại rất sớm"
  },
  HARD: {
    label: "Khó",
    description: "Tăng nhẹ, vẫn ưu tiên ôn sớm"
  },
  GOOD: {
    label: "Nhớ được",
    description: "Giãn lịch ôn ra xa hơn"
  },
  EASY: {
    label: "Dễ",
    description: "Tăng mạnh hơn, ôn lại muộn hơn"
  }
};

type ReviewFeedback = {
  rating: ReviewRating;
  masteryScore?: number;
  nextReviewAt?: string | null;
  intervalDays?: number;
};

export function FlashcardsView() {
  const { accessToken } = useAuth();
  const token = accessToken ?? "";
  const [decks, setDecks] = useState<FlashcardDeckResponse[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashcardCardResponse[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardCardResponse[]>([]);
  const [flipped, setFlipped] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback | null>(null);
  const [title, setTitle] = useState("Tăng tốc từ vựng N5");
  const [level, setLevel] = useState("N5");
  const [category, setCategory] = useState("vocabulary");
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) ?? null,
    [decks, selectedDeckId]
  );
  const availableLevels = useMemo(() => {
    const levels = Array.from(new Set(decks.map((deck) => deck.level || "JLPT")));
    return levels.length ? levels.sort(compareJlptLevels) : ["N5", "N4"];
  }, [decks]);
  const visibleDecks = useMemo(
    () => decks.filter((deck) => deckMatchesFilter(deck, selectedLevel, categoryFilter)),
    [categoryFilter, decks, selectedLevel]
  );
  const visibleDueCards = useMemo(
    () => dueCards.filter((card) => cardMatchesFilter(card, selectedLevel, categoryFilter)),
    [categoryFilter, dueCards, selectedLevel]
  );
  const activeCard = visibleDueCards[0] ?? cards[0] ?? null;
  const isFlipped = Boolean(activeCard && flipped === activeCard.id);
  const studyMode = visibleDueCards.length ? "Đến hạn" : "Luyện tự do";

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
      const nextDeck = deckData.find((deck) => deck.id === nextDeckId) ?? deckData[0];
      if (nextDeck?.level) {
        setSelectedLevel(nextDeck.level);
      }
      setSelectedDeckId(nextDeckId);
      if (nextDeckId) {
        await loadDeckCards(nextDeckId);
      } else {
        setCards([]);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải thẻ nhớ");
    } finally {
      setLoading(false);
    }
  }

  async function loadDeckCards(deckId: string) {
    const cardData = await apiRequest<FlashcardCardResponse[]>(`/flashcards/decks/${deckId}/cards`, {
      token
    });
    setCards(cardData);
  }

  useEffect(() => {
    void loadFlashcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setReviewFeedback(null);
    setFlipped(null);
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

  async function review(card: FlashcardCardResponse, rating: ReviewRating) {
    setError(null);
    setReviewing(true);
    try {
      const response = await apiRequest<FlashcardReviewResponse>("/flashcards/review", {
        method: "POST",
        token,
        body: { cardId: card.id, rating }
      });
      setReviewFeedback({
        rating,
        masteryScore: response.masteryScore ?? response.progress?.masteryScore,
        nextReviewAt: response.card?.nextReviewAt ?? response.progress?.nextReviewAt,
        intervalDays: response.card?.intervalDays
      });
      setFlipped(null);
      await loadFlashcards(selectedDeckId);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể lưu lượt ôn");
    } finally {
      setReviewing(false);
    }
  }

  function selectDeck(deckId: string) {
    setReviewFeedback(null);
    setFlipped(null);
    setSelectedDeckId(deckId);
    void loadDeckCards(deckId);
  }

  function selectLevel(nextLevel: string) {
    setSelectedLevel(nextLevel);
    selectFirstMatchingDeck(nextLevel, categoryFilter);
  }

  function selectCategoryFilter(nextCategory: CategoryFilter) {
    setCategoryFilter(nextCategory);
    selectFirstMatchingDeck(selectedLevel, nextCategory);
  }

  function selectFirstMatchingDeck(nextLevel: string, nextCategory: CategoryFilter) {
    const nextDeck = decks.find((deck) => deckMatchesFilter(deck, nextLevel, nextCategory));
    setReviewFeedback(null);
    setFlipped(null);
    if (nextDeck) {
      setSelectedDeckId(nextDeck.id);
      void loadDeckCards(nextDeck.id);
      return;
    }
    setSelectedDeckId(null);
    setCards([]);
  }

  function refresh() {
    setReviewFeedback(null);
    setFlipped(null);
    void loadFlashcards();
  }

  function toggleActiveCard(cardId: string) {
    setFlipped((current) => (current === cardId ? null : cardId));
  }

  return (
    <section className="learning-grid flashcard-workspace">
      <div className="section-heading full-span">
        <p className="eyebrow">間隔反復</p>
        <h2>Thẻ nhớ theo cấp học</h2>
      </div>
      {error && <div className="form-error full-span">{error}</div>}

      <Panel className="flashcard-filter-panel full-span" eyebrow="Cấp học" title="Chọn phạm vi ôn">
        <div className="flashcard-filter-group" aria-label="Chọn cấp học">
          {availableLevels.map((item) => (
            <button
              className={item === selectedLevel ? "active" : ""}
              key={item}
              type="button"
              onClick={() => selectLevel(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flashcard-filter-group category" aria-label="Lọc nhóm thẻ">
          {categoryFilters.map((option) => (
            <button
              className={option.value === categoryFilter ? "active" : ""}
              key={option.value}
              type="button"
              onClick={() => selectCategoryFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="flashcard-create-panel" eyebrow="Tạo bộ thẻ" title="Chọn phần muốn nhớ" action={<Plus size={21} />}>
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
          <IconTextButton type="submit">
            <Layers3 size={18} />
            Tạo bộ thẻ
          </IconTextButton>
        </form>
        <div className="flashcard-rule-list" aria-label="Cách ôn thẻ nhớ">
          <span>
            <CheckCircle2 size={17} />
            Chỉ chấm sau khi tự nhớ và lật đáp án.
          </span>
          <span>
            <CheckCircle2 size={17} />
            Chọn đúng cảm giác nhớ để lịch ôn vừa sức hơn.
          </span>
          <span>
            <CheckCircle2 size={17} />
            Lịch ôn tiếp theo được tự xếp, bạn không cần nhập tay.
          </span>
        </div>
      </Panel>

      <Panel
        className="focus-panel flashcard-study-panel"
        eyebrow="Ôn ngay"
        title={activeCard ? `${studyMode}: ${activeCard.level || selectedDeck?.level || "JLPT"}` : "Chưa có thẻ để ôn"}
        action={
          <IconButton type="button" onClick={refresh} title="Làm mới thẻ nhớ">
            <RotateCcw size={18} />
          </IconButton>
        }
      >
        {loading ? (
          <div className="loading-inline">Đang tải thẻ...</div>
        ) : activeCard ? (
          <div className="flashcard-study">
            <div className="flashcard-study-meta">
              <TopicChip>
                {visibleDueCards.length ? `${visibleDueCards.length} thẻ đến hạn` : "Không có thẻ đến hạn"}
              </TopicChip>
              <TopicChip>{displayCategory(activeCard.sourceType)}</TopicChip>
              <TopicChip>{activeCard.repetitions} lượt ôn</TopicChip>
              <TopicChip>{activeCard.intervalDays} ngày giãn cách</TopicChip>
            </div>

            <button
              aria-label={isFlipped ? "Xem lại mặt trước" : "Lật thẻ"}
              className={isFlipped ? "flashcard-card flipped" : "flashcard-card"}
              type="button"
              onClick={() => toggleActiveCard(activeCard.id)}
            >
              <span>{isFlipped ? activeCard.backText : activeCard.frontText}</span>
              <small>{isFlipped ? activeCard.reading || "Nhấn thẻ để xem lại câu hỏi" : "Tự nhớ trước, rồi lật đáp án"}</small>
            </button>

            {!isFlipped ? (
              <PrimaryButton type="button" onClick={() => setFlipped(activeCard.id)}>
                <Eye size={18} />
                Lật đáp án
              </PrimaryButton>
            ) : (
              <div className="rating-row srs-rating-row" aria-label="Chấm mức độ nhớ">
                {ratings.map((rating) => (
                  <button key={rating} type="button" disabled={reviewing} onClick={() => void review(activeCard, rating)}>
                    <strong>{ratingLabels[rating].label}</strong>
                    <small>{ratingLabels[rating].description}</small>
                  </button>
                ))}
              </div>
            )}

            {reviewFeedback && <ReviewFeedbackPanel feedback={reviewFeedback} />}
          </div>
        ) : (
          <EmptyState compact>Chưa có thẻ trong phạm vi này. Đổi cấp học, đổi nhóm thẻ hoặc tạo bộ thẻ mới.</EmptyState>
        )}
      </Panel>

      <Panel eyebrow="Lịch ôn" title="Tiến độ thẻ nhớ" action={<CalendarClock size={21} />}>
        <div className="flashcard-schedule-summary">
          <div>
            <strong>{visibleDueCards.length}</strong>
            <span>Thẻ đến hạn</span>
          </div>
          <div>
            <strong>{cards.length}</strong>
            <span>Thẻ trong bộ</span>
          </div>
          <div>
            <strong>{visibleDecks.length}</strong>
            <span>Bộ trong cấp này</span>
          </div>
        </div>
        <p className="muted-copy">
          Mỗi lần tự chấm sẽ giúp VAJA biết thẻ nào nên xuất hiện lại sớm hơn trong buổi học sau.
        </p>
      </Panel>

      <Panel eyebrow="Bộ thẻ" title="Thư viện">
        <div className="stack-list">
          {visibleDecks.map((deck) => (
            <button
              className={deck.id === selectedDeckId ? "session-button active" : "session-button"}
              key={deck.id}
              type="button"
              onClick={() => selectDeck(deck.id)}
            >
              <strong>{deck.title}</strong>
              <span>
                {deck.level} · {displayCategory(deck.category)} · {deck.cardCount} thẻ
              </span>
            </button>
          ))}
          {!visibleDecks.length && <EmptyState compact>Chưa có bộ thẻ phù hợp với bộ lọc này.</EmptyState>}
        </div>
      </Panel>

      <Panel className="full-span" eyebrow="カード" title="Bộ thẻ đang chọn">
        <div className="knowledge-result-grid flashcard-card-list">
          {cards.slice(0, 8).map((card) => (
            <article className="knowledge-card" key={card.id}>
              <div>
                <TopicChip>{card.level || "JLPT"}</TopicChip>
                <TopicChip>{card.repetitions} lượt</TopicChip>
              </div>
              <h3>{card.frontText}</h3>
              {card.reading && <span className="knowledge-reading">{card.reading}</span>}
              <p>{card.backText}</p>
              <small>
                <Sparkles size={14} />
                Ôn lại: {formatDateTime(card.nextReviewAt)}
              </small>
            </article>
          ))}
          {!cards.length && <EmptyState compact>Chọn hoặc tạo một bộ thẻ.</EmptyState>}
        </div>
      </Panel>
    </section>
  );
}

function ReviewFeedbackPanel({ feedback }: { feedback: ReviewFeedback }) {
  const masteryPercent = feedback.masteryScore === undefined ? null : Math.round(feedback.masteryScore * 100);

  return (
    <div className="flashcard-feedback">
      <strong>{ratingLabels[feedback.rating].label} đã được lưu</strong>
      <span>
        {masteryPercent === null ? "Mức nhớ đã được cập nhật." : `Mức nhớ hiện tại: ${masteryPercent}%.`}
      </span>
      <span>Ôn lại: {formatDateTime(feedback.nextReviewAt)}</span>
      {feedback.intervalDays !== undefined && <span>Khoảng cách ôn mới: {feedback.intervalDays} ngày.</span>}
    </div>
  );
}

function displayCategory(value?: string | null): string {
  if (!value) {
    return "Kiến thức";
  }

  const labels: Record<CategoryFilter | "other", string> = {
    all: "Tất cả",
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    kanji: "Kanji",
    other: value
  };
  return labels[normalizeCategory(value)];
}

function deckMatchesFilter(deck: FlashcardDeckResponse, selectedLevel: string, filter: CategoryFilter): boolean {
  return sameLevel(deck.level, selectedLevel) && (filter === "all" || normalizeCategory(deck.category) === filter);
}

function cardMatchesFilter(card: FlashcardCardResponse, selectedLevel: string, filter: CategoryFilter): boolean {
  return sameLevel(card.level, selectedLevel) && (filter === "all" || normalizeCategory(card.sourceType) === filter);
}

function sameLevel(value: string | null | undefined, selectedLevel: string): boolean {
  return (value || "JLPT").toUpperCase() === selectedLevel.toUpperCase();
}

function normalizeCategory(value?: string | null): CategoryFilter | "other" {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("kanji")) {
    return "kanji";
  }
  if (normalized.includes("grammar")) {
    return "grammar";
  }
  if (normalized.includes("vocab")) {
    return "vocabulary";
  }
  return "other";
}

function compareJlptLevels(left: string, right: string): number {
  const order = ["N5", "N4", "N3", "N2", "N1"];
  const leftIndex = order.indexOf(left.toUpperCase());
  const rightIndex = order.indexOf(right.toUpperCase());
  if (leftIndex !== -1 || rightIndex !== -1) {
    return (leftIndex === -1 ? order.length : leftIndex) - (rightIndex === -1 ? order.length : rightIndex);
  }
  return left.localeCompare(right);
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "chưa có lịch";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}
