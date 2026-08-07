import { CheckCircle2, Loader2, MessageSquareHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "../../../shared/api";
import type { StudyFeedbackRequest } from "../../../shared/models";

type StudyFeedbackMode = "study" | "tutor";

type StudyFeedbackPromptProps = {
  token: string;
  feedbackKey: string;
  mode: StudyFeedbackMode;
  title: string;
  description: string;
  baseFeedback: Pick<StudyFeedbackRequest, "moment" | "contextType" | "contextId" | "contextTitle">;
  defaultActionChoice?: string;
  defaultPaceChoice?: string;
  onSubmitted?: (feedback: StudyFeedbackRequest) => void;
};

const ratingValues = [1, 2, 3, 4, 5];

export function StudyFeedbackPrompt({
  token,
  feedbackKey,
  mode,
  title,
  description,
  baseFeedback,
  defaultActionChoice,
  defaultPaceChoice,
  onSubmitted
}: StudyFeedbackPromptProps) {
  const storageKey = `vaja.studyFeedback.${feedbackKey}`;
  const [hidden, setHidden] = useState(() => localStorage.getItem(storageKey) === "done");
  const [rating, setRating] = useState<number | null>(null);
  const [clarityRating, setClarityRating] = useState<number | null>(null);
  const [trustRating, setTrustRating] = useState<number | null>(null);
  const [difficultyFit, setDifficultyFit] = useState<string | null>(null);
  const [actionChoice, setActionChoice] = useState<string | null>(defaultActionChoice ?? null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHidden(localStorage.getItem(storageKey) === "done");
    setRating(null);
    setClarityRating(null);
    setTrustRating(null);
    setDifficultyFit(null);
    setActionChoice(defaultActionChoice ?? null);
    setSending(false);
    setSent(false);
    setError(null);
  }, [defaultActionChoice, storageKey]);

  if (hidden) {
    return null;
  }

  const ready = mode === "tutor" ? Boolean(clarityRating && trustRating) : Boolean(rating && difficultyFit);

  async function submit() {
    if (!ready || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const feedback: StudyFeedbackRequest = {
        ...baseFeedback,
        rating,
        clarityRating,
        trustRating,
        difficultyFit,
        paceChoice: defaultPaceChoice,
        actionChoice
      };
      await apiRequest("/personalization/me/feedback", {
        method: "POST",
        token,
        body: feedback
      });
      onSubmitted?.(feedback);
      localStorage.setItem(storageKey, "done");
      setSent(true);
      window.setTimeout(() => setHidden(true), 900);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Chưa gửi được feedback.");
    } finally {
      setSending(false);
    }
  }

  function skip() {
    localStorage.setItem(storageKey, "done");
    setHidden(true);
  }

  return (
    <div className={`study-feedback ${mode}`}>
      <div className="study-feedback-heading">
        <MessageSquareHeart size={18} />
        <div>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
      </div>

      {mode === "tutor" ? (
        <div className="study-feedback-grid">
          <RatingPicker
            hint="1 là khó hiểu, 5 là rất rõ."
            label="Dễ hiểu"
            value={clarityRating}
            onChange={setClarityRating}
          />
          <RatingPicker
            hint="1 là chưa tin, 5 là tin được."
            label="Đáng tin"
            value={trustRating}
            onChange={setTrustRating}
          />
        </div>
      ) : (
        <>
          <RatingPicker
            hint="1 là khó hiểu, 5 là rất dễ hiểu."
            label="Độ dễ hiểu"
            value={rating}
            onChange={setRating}
          />
          <div className="study-feedback-question">
            <span className="study-feedback-question-title">Độ khó bài học</span>
            <div className="study-feedback-choice-row" aria-label="Độ khó bài học">
              <ChoiceButton active={difficultyFit === "TOO_EASY"} onClick={() => setDifficultyFit("TOO_EASY")}>
                Quá dễ
              </ChoiceButton>
              <ChoiceButton active={difficultyFit === "JUST_RIGHT"} onClick={() => setDifficultyFit("JUST_RIGHT")}>
                Vừa sức
              </ChoiceButton>
              <ChoiceButton active={difficultyFit === "TOO_HARD"} onClick={() => setDifficultyFit("TOO_HARD")}>
                Hơi khó
              </ChoiceButton>
            </div>
          </div>
          <div className="study-feedback-question">
            <span className="study-feedback-question-title">Bạn muốn làm gì tiếp?</span>
            <div className="study-feedback-choice-row" aria-label="Mong muốn tiếp theo">
              <ChoiceButton active={actionChoice === "REVIEW_AGAIN"} onClick={() => setActionChoice("REVIEW_AGAIN")}>
                Ôn lại
              </ChoiceButton>
              <ChoiceButton active={actionChoice === "MOVE_ON"} onClick={() => setActionChoice("MOVE_ON")}>
                Đi tiếp
              </ChoiceButton>
            </div>
          </div>
        </>
      )}

      {error && <p className="study-feedback-error">{error}</p>}
      {sent && (
        <p className="study-feedback-sent">
          <CheckCircle2 size={15} />
          Đã ghi nhận.
        </p>
      )}

      <div className="study-feedback-actions">
        <button type="button" onClick={skip}>
          Bỏ qua
        </button>
        <button type="button" disabled={!ready || sending} onClick={() => void submit()}>
          {sending ? <Loader2 className="spin" size={15} /> : null}
          Gửi
        </button>
      </div>
    </div>
  );
}

function RatingPicker({
  hint,
  label,
  value,
  onChange
}: {
  hint: string;
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="study-feedback-rating">
      <div className="study-feedback-question-copy">
        <span className="study-feedback-question-title">{label}</span>
        <small>{hint}</small>
      </div>
      <div className="study-feedback-rating-buttons">
        {ratingValues.map((item) => (
          <button
            className={value === item ? "active" : ""}
            key={item}
            type="button"
            aria-label={`${label} ${item}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <small className="study-feedback-selection">{value ? `Đã chọn ${value}/5` : "Chưa chọn điểm"}</small>
    </div>
  );
}

function ChoiceButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick}>
      {children}
    </button>
  );
}
