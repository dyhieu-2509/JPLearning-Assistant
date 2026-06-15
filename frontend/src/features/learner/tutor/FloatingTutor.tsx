import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "../../../shared/api";
import type { ChatResponse, SourceResponse } from "../../../shared/models";

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
};

export function FloatingTutor({ token, contextTopic, suggestions }: FloatingTutorProps) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
  }, [contextTopic]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, open]);

  async function ask(event?: FormEvent<HTMLFormElement>, text = input) {
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
          contextTopic,
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
          confidence: response.confidence
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
      <section className="floating-tutor" aria-label="Hỏi VAJA nhanh">
        <button className="floating-tutor-bar" type="button" aria-label="Mở hỏi VAJA" onClick={() => setOpen(true)}>
          <span className="floating-tutor-icon">
            <Bot size={20} />
          </span>
          <span>
            <strong>Hỏi VAJA</strong>
            <small>Đang bí về {displayContext(contextTopic)}</small>
          </span>
          <Sparkles size={18} />
        </button>
      </section>
    );
  }

  return (
    <section className="floating-tutor open" aria-label="Hỏi VAJA nhanh">
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

        <div className="floating-suggestion-row">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" disabled={sending} onClick={() => void ask(undefined, suggestion)}>
              <MessageCircle size={14} />
              {suggestion}
            </button>
          ))}
        </div>

        <div className="floating-message-list" aria-live="polite">
          {messages.length ? (
            messages.map((message) => <FloatingMessageBubble key={message.id} message={message} />)
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

function FloatingMessageBubble({ message }: { message: TutorMessage }) {
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
      </div>
    </div>
  );
}

function displayContext(value: string): string {
  const labels: Record<string, string> = {
    dashboard: "tiến độ hôm nay",
    flashcards: "thẻ nhớ",
    knowledge: "tra cứu kiến thức",
    assessment: "kiểm tra nhanh",
    planner: "lộ trình học",
    "JLPT N5": "JLPT N5"
  };

  return labels[value] ?? value;
}
