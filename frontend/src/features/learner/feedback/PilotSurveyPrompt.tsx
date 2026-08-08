import { CheckCircle2, ChevronDown, ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "../../../shared/api";
import type { PilotSurveyRequest } from "../../../shared/models";

type PilotSurveyPromptProps = {
  token: string;
  surveyKey: string;
  baseSurvey: Pick<PilotSurveyRequest, "contextType" | "contextId" | "contextTitle">;
  onSubmitted?: (survey: PilotSurveyRequest) => void;
};

const susStatements = [
  "Tôi muốn dùng app này thường xuyên.",
  "App này hơi rối.",
  "App này dễ dùng.",
  "Tôi cần người khác hướng dẫn mới dùng được app.",
  "Các phần học đi liền với nhau.",
  "App có nhiều chỗ không thống nhất.",
  "Tôi nghĩ người mới có thể học nhanh cách dùng.",
  "App hơi nặng khi thao tác.",
  "Tôi tự tin khi dùng app.",
  "Tôi cần học thêm nhiều thứ trước khi dùng được app."
];

const ratingValues = [1, 2, 3, 4, 5];

export function PilotSurveyPrompt({ token, surveyKey, baseSurvey, onSubmitted }: PilotSurveyPromptProps) {
  const storageKey = `vaja.pilotSurvey.${surveyKey}`;
  const [hidden, setHidden] = useState(() => localStorage.getItem(storageKey) === "done");
  const [scores, setScores] = useState<Array<number | null>>(() => Array.from({ length: susStatements.length }, () => null));
  const [trustRating, setTrustRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(storageKey) === "done");
    setScores(Array.from({ length: susStatements.length }, () => null));
    setTrustRating(null);
    setComment("");
    setSending(false);
    setSent(false);
    setError(null);
    setExpanded(false);
  }, [storageKey]);

  if (hidden) {
    return null;
  }

  const ready = scores.every((score) => score !== null) && trustRating !== null;

  if (!expanded) {
    return (
      <div className="pilot-survey compact">
        <div className="pilot-survey-heading">
          <ClipboardList size={18} />
          <div>
            <strong>Khảo sát 1 phút</strong>
            <span>Chấm nhanh sau khi học để VAJA có số liệu SUS/trust cho user test.</span>
          </div>
        </div>
        <div className="study-feedback-actions">
          <button type="button" onClick={skip}>
            Bỏ qua
          </button>
          <button type="button" onClick={() => setExpanded(true)}>
            Mở khảo sát
            <ChevronDown size={15} />
          </button>
        </div>
      </div>
    );
  }

  async function submit() {
    if (!ready || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const survey: PilotSurveyRequest = {
        ...baseSurvey,
        susScores: scores.map((score) => score ?? 3),
        trustRating,
        comment: comment.trim() || null
      };
      await apiRequest("/personalization/me/pilot-surveys", {
        method: "POST",
        token,
        body: survey
      });
      onSubmitted?.(survey);
      localStorage.setItem(storageKey, "done");
      setSent(true);
      window.setTimeout(() => setHidden(true), 900);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Chưa gửi được khảo sát.");
    } finally {
      setSending(false);
    }
  }

  function skip() {
    localStorage.setItem(storageKey, "done");
    setHidden(true);
  }

  function updateScore(index: number, value: number) {
    setScores((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  return (
    <div className="pilot-survey">
      <div className="pilot-survey-heading">
        <ClipboardList size={18} />
        <div>
          <strong>Khảo sát nhanh sau bài học</strong>
          <span>Chọn 1-5 để lấy số liệu SUS và trust cho phần user test.</span>
        </div>
      </div>

      <div className="pilot-survey-scale">
        <span>1: không đồng ý</span>
        <span>5: đồng ý</span>
      </div>

      <div className="pilot-survey-list">
        {susStatements.map((statement, index) => (
          <RatingRow
            key={statement}
            label={`${index + 1}. ${statement}`}
            value={scores[index]}
            onChange={(value) => updateScore(index, value)}
          />
        ))}
      </div>

      <RatingRow label="Độ tin cậy vào VAJA Tutor" value={trustRating} onChange={setTrustRating} />

      <label className="pilot-survey-comment">
        <span>Ghi chú ngắn</span>
        <textarea
          maxLength={500}
          placeholder="Ví dụ: phần nào khó nhìn, phần nào dễ hiểu..."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>

      {error && <p className="study-feedback-error">{error}</p>}
      {sent && (
        <p className="study-feedback-sent">
          <CheckCircle2 size={15} />
          Đã ghi nhận khảo sát.
        </p>
      )}

      <div className="study-feedback-actions">
        <button type="button" onClick={skip}>
          Bỏ qua
        </button>
        <button type="button" disabled={!ready || sending} onClick={() => void submit()}>
          {sending ? <Loader2 className="spin" size={15} /> : null}
          Gửi khảo sát
        </button>
      </div>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="pilot-survey-question">
      <span>{label}</span>
      <div className="pilot-survey-rating-buttons">
        {ratingValues.map((item) => (
          <button
            aria-label={`${label} ${item}`}
            className={value === item ? "active" : ""}
            key={item}
            type="button"
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
