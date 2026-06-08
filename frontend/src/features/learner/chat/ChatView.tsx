import { Bot, Loader2, MessageSquarePlus, Send, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest, ApiError } from "../../../shared/api";
import type { ChatMessageResponse, ChatResponse, ChatSessionResponse, SourceResponse } from "../../../shared/models";

const suggestions = [
  "食べます khác 食べる như thế nào?",
  "Giải thích trợ từ は và が",
  "Lập ví dụ N5 với あります",
  "Tôi yếu ngữ pháp nào?"
];

const contextLabels: Record<string, string> = {
  Vocabulary: "Từ vựng",
  Grammar: "Ngữ pháp",
  Kanji: "Kanji",
  "Assessment review": "Ôn lỗi kiểm tra",
  Japanese: "Tiếng Nhật"
};

export function ChatView() {
  const { accessToken } = useAuth();
  const token = accessToken ?? "";
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [contextTopic, setContextTopic] = useState("JLPT N5");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  async function loadSessions() {
    setError(null);
    try {
      const data = await apiRequest<ChatSessionResponse[]>("/chat/sessions?limit=12", { token });
      setSessions(data);
      if (!activeSessionId && data[0]) {
        setActiveSessionId(data[0].id);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải buổi chat");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(sessionId: string) {
    setError(null);
    try {
      const data = await apiRequest<ChatMessageResponse[]>(`/chat/sessions/${sessionId}/messages?limit=100`, {
        token
      });
      setMessages(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải tin nhắn");
    }
  }

  useEffect(() => {
    void loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      void loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, text = input) {
    event?.preventDefault();
    const message = text.trim();
    if (!message || sending) {
      return;
    }

    setSending(true);
    setError(null);
    const optimisticUser: ChatMessageResponse = {
      id: crypto.randomUUID(),
      sessionId: activeSessionId ?? "pending",
      role: "USER",
      content: message,
      sources: [],
      confidence: null,
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, optimisticUser]);
    setInput("");

    try {
      const response = await apiRequest<ChatResponse>("/chat", {
        method: "POST",
        token,
        body: {
          message,
          contextTopic,
          sessionId: activeSessionId
        }
      });
      setActiveSessionId(response.sessionId);
      const assistant: ChatMessageResponse = {
        id: crypto.randomUUID(),
        sessionId: response.sessionId,
        role: "ASSISTANT",
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        createdAt: new Date().toISOString()
      };
      setMessages((current) => [...current, assistant]);
      await loadSessions();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-layout">
      <aside className="workspace-panel chat-sidebar">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">記憶</p>
            <h3>Buổi học</h3>
          </div>
          <button
            className="icon-button"
            type="button"
            title="Tạo buổi chat mới"
            onClick={() => {
              setActiveSessionId(null);
              setMessages([]);
            }}
          >
            <MessageSquarePlus size={18} />
          </button>
        </div>
        <div className="session-list">
          {loading ? (
            <div className="loading-inline">Đang tải buổi học...</div>
          ) : sessions.length ? (
            sessions.map((session) => (
              <button
                className={session.id === activeSessionId ? "session-button active" : "session-button"}
                key={session.id}
                type="button"
                onClick={() => setActiveSessionId(session.id)}
              >
                <strong>{session.title || "Buổi học với VAJA"}</strong>
                <span>{displayContext(session.contextTopic || "Japanese")}</span>
              </button>
            ))
          ) : (
            <div className="empty-state compact">Chưa có buổi học nào.</div>
          )}
        </div>
      </aside>

      <section className="workspace-panel chat-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">AI 先生</p>
            <h3>Hỏi điều bạn chưa hiểu</h3>
          </div>
          <label className="context-select">
            Chủ đề
            <select value={contextTopic} onChange={(event) => setContextTopic(event.target.value)}>
              <option>JLPT N5</option>
              <option value="Vocabulary">Từ vựng</option>
              <option value="Grammar">Ngữ pháp</option>
              <option value="Kanji">Kanji</option>
              <option value="Assessment review">Ôn lỗi kiểm tra</option>
            </select>
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="suggestion-row">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => void sendMessage(undefined, suggestion)}>
              <Sparkles size={15} />
              {suggestion}
            </button>
          ))}
        </div>

        <div className="message-list" aria-live="polite">
          {messages.length ? (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          ) : (
            <div className="empty-chat">
              <Bot size={34} />
              <strong>Bắt đầu bằng một câu hỏi tiếng Nhật.</strong>
              <span>Ví dụ: hỏi nghĩa từ, so sánh ngữ pháp, hoặc nhờ đặt câu mẫu.</span>
            </div>
          )}
          {sending && (
            <div className="message-row assistant">
              <div className="message-bubble">
                <Loader2 className="spin" size={18} />
                Đang tìm cách giải thích dễ hiểu...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-composer" onSubmit={sendMessage}>
          <input
            placeholder="Hỏi gì đó về tiếng Nhật..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button className="icon-button send-button" type="submit" disabled={sending || !input.trim()}>
            <Send size={19} />
          </button>
        </form>
      </section>
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessageResponse }) {
  const assistant = message.role === "ASSISTANT";
  return (
    <div className={`message-row ${assistant ? "assistant" : "user"}`}>
      <div className="message-bubble">
        <p>{message.content}</p>
        {assistant && (
          <div className="source-block">
            <span>Độ tin cậy {Math.round((message.confidence ?? 0) * 100)}%</span>
            <SourceList sources={message.sources ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: SourceResponse[] }) {
  if (!sources.length) {
    return <span>Chưa có nguồn tham khảo</span>;
  }

  return (
    <div className="source-list">
      {sources.slice(0, 4).map((source) => (
        <span key={`${source.type}-${source.id}`}>
          {displaySourceType(source.type)}: {source.title || source.id}
        </span>
      ))}
    </div>
  );
}

function displayContext(value: string): string {
  return contextLabels[value] ?? value;
}

function displaySourceType(value: string): string {
  const labels: Record<string, string> = {
    graph: "Đồ thị",
    vector: "Vector",
    knowledge: "Kiến thức"
  };
  return labels[value.toLowerCase()] ?? value;
}
