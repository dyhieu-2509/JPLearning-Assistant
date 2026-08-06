import { Bot, Lightbulb, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "../../../shared/api";
import type { ChatResponse, SourceResponse } from "../../../shared/models";
import { StudyFeedbackPrompt } from "../feedback/StudyFeedbackPrompt";

type FloatingTutorProps = {
  token: string;
  contextTopic: string;
  suggestions: string[];
};

type TutorMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: SourceResponse[];
  confidence?: number | null;
  sessionId?: string | null;
  contextTopic?: string;
};

type TutorNudge = {
  id: string;
  title: string;
  preview: string;
  message: string;
  actionLabel?: string;
  contextTopic?: string;
};

export function FloatingTutor({ token, contextTopic, suggestions }: FloatingTutorProps) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nudge, setNudge] = useState<TutorNudge | null>(null);
  const [seenNudgeId, setSeenNudgeId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const hasUnreadNudge = Boolean(nudge && nudge.id !== seenNudgeId);

  useEffect(() => {
    setOpen(false);
    setSessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
    setNudge(null);
    setSeenNudgeId(null);
  }, [contextTopic]);

  useEffect(() => {
    function receiveTutorNudge(event: Event) {
      const detail = (event as CustomEvent<TutorNudge>).detail;
      if (!detail?.id || !detail.message) {
        return;
      }
      setNudge(detail);
      if (open) {
        setSeenNudgeId(detail.id);
      }
    }

    window.addEventListener("vaja:tutor-nudge", receiveTutorNudge);
    return () => window.removeEventListener("vaja:tutor-nudge", receiveTutorNudge);
  }, [open]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, open]);

  function openTutor() {
    setOpen(true);
    if (nudge) {
      setSeenNudgeId(nudge.id);
    }
  }

  async function ask(event?: FormEvent<HTMLFormElement>, text = input, askContextTopic = contextTopic) {
    event?.preventDefault();
    const message = text.trim();

    if (!message || sending) {
      return;
    }

    setOpen(true);
    setSending(true);
    setError(null);
    setInput("");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "USER",
        content: message
      }
    ]);

    try {
      const response = await apiRequest<ChatResponse>("/chat", {
        method: "POST",
        token,
        body: {
          message,
          contextTopic: askContextTopic,
          sessionId
        }
      });
      setSessionId(response.sessionId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: response.answer,
          sources: response.sources,
          confidence: response.confidence,
          sessionId: response.sessionId,
          contextTopic: askContextTopic
        }
      ]);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể hỏi trợ lý lúc này");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <section
        className={hasUnreadNudge ? "floating-tutor has-nudge" : "floating-tutor"}
        aria-label="Hỏi VAJA nhanh"
        data-tour="floating-tutor"
      >
        <button
          className="floating-tutor-bar"
          type="button"
          aria-label={hasUnreadNudge ? "Mở hỏi VAJA, có 1 gợi ý mới" : "Mở hỏi VAJA"}
          onClick={openTutor}
        >
          <span className="floating-tutor-icon">
            <Bot size={20} />
            {hasUnreadNudge && <span className="floating-tutor-badge">1</span>}
          </span>
          <span>
            <strong>{hasUnreadNudge ? nudge?.title ?? "VAJA có gợi ý" : "Hỏi VAJA"}</strong>
            <small>{hasUnreadNudge ? nudge?.preview : `Đang bí về ${displayContext(contextTopic)}`}</small>
          </span>
          <Sparkles size={18} />
        </button>
      </section>
    );
  }

  return (
    <section className="floating-tutor open" aria-label="Hỏi VAJA nhanh" data-tour="floating-tutor">
      <div className="floating-tutor-panel">
        <header className="floating-tutor-header">
          <div>
            <p className="eyebrow">質問</p>
            <h2>Hỏi nhanh VAJA</h2>
            <span>{displayContext(contextTopic)}</span>
          </div>
          <button className="icon-button" type="button" title="Thu gọn" onClick={() => setOpen(false)}>
            <X size={19} />
          </button>
        </header>

        {nudge && (
          <div className="floating-nudge-card">
            <Lightbulb size={18} />
            <div>
              <strong>{nudge.title}</strong>
              <span>{nudge.preview}</span>
            </div>
            <button
              type="button"
              disabled={sending}
              onClick={() => {
                setSeenNudgeId(nudge.id);
                void ask(undefined, nudge.message, nudge.contextTopic ?? contextTopic);
              }}
            >
              {nudge.actionLabel ?? "Hỏi gợi ý"}
            </button>
          </div>
        )}

        <div className="floating-suggestion-row">
          {nudge && (
            <button
              type="button"
              disabled={sending}
              onClick={() => {
                setSeenNudgeId(nudge.id);
                void ask(undefined, nudge.message, nudge.contextTopic ?? contextTopic);
              }}
            >
              <Lightbulb size={14} />
              {nudge.actionLabel ?? "Gợi ý câu này"}
            </button>
          )}
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" disabled={sending} onClick={() => void ask(undefined, suggestion)}>
              <MessageCircle size={14} />
              {suggestion}
            </button>
          ))}
        </div>

        <div className="floating-message-list" aria-live="polite">
          {messages.length ? (
            messages.map((message) => (
              <FloatingMessageBubble key={message.id} message={message} token={token} />
            ))
          ) : (
            <div className="floating-empty-state">
              <Bot size={30} />
              <strong>VAJA trả lời bằng tiếng Việt.</strong>
              <span>Hỏi khi bạn bí từ, bí ngữ pháp hoặc muốn có ví dụ dễ nhớ.</span>
            </div>
          )}
          {sending && (
            <div className="floating-message-row assistant">
              <div className="floating-message-bubble">
                <Loader2 className="spin" size={17} />
                Đang chuẩn bị lời giải thích dễ hiểu...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <form className="floating-composer" onSubmit={ask}>
          <input
            placeholder="Hỏi mẫu câu, từ vựng, kanji..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button className="icon-button send-button" type="submit" disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </section>
  );
}

function FloatingMessageBubble({ message, token }: { message: TutorMessage; token: string }) {
  const assistant = message.role === "ASSISTANT";

  return (
    <div className={`floating-message-row ${assistant ? "assistant" : "user"}`}>
      <div className="floating-message-bubble">
        <p>{message.content}</p>
        {assistant && (
          <div className="floating-source-block">
            <span>Độ tin cậy {Math.round((message.confidence ?? 0) * 100)}%</span>
            {message.sources?.length ? (
              <div className="source-list">
                {message.sources.slice(0, 3).map((source) => (
                  <span key={`${source.type}-${source.id}`}>{source.title || source.id}</span>
                ))}
              </div>
            ) : (
              <span>Chưa có nguồn tham khảo</span>
            )}
          </div>
        )}
        {assistant && (
          <StudyFeedbackPrompt
            token={token}
            feedbackKey={`tutor.${message.id}`}
            mode="tutor"
            title="Câu trả lời này có ổn không?"
            description="Chấm nhanh để đo clarity và trust."
            baseFeedback={{
              moment: "TUTOR",
              contextType: "floating_tutor",
              contextId: message.sessionId ?? message.id,
              contextTitle: message.contextTopic ?? "tutor answer"
            }}
            defaultActionChoice="MOVE_ON"
          />
        )}
      </div>
    </div>
  );
}

function displayContext(value: string): string {
  const labels: Record<string, string> = {
    dashboard: "tiến độ hôm nay",
    study: "bài đang học",
    flashcards: "thẻ nhớ",
    knowledge: "tra cứu kiến thức",
    assessment: "kiểm tra nhanh",
    "JLPT N5": "JLPT N5"
  };

  return labels[value] ?? value;
}
