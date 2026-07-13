import { BookOpenText, DatabaseZap, Search, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../../shared/api";
import { IconTextButton, LoadingPanel, Panel, TopicChip } from "../../../shared/components";
import type { KnowledgeItemResponse } from "../../../shared/models";

type KnowledgeCategory = "vocabulary" | "grammar" | "kanji";

const categoryOptions: Array<{ value: KnowledgeCategory; label: string; description: string }> = [
  { value: "vocabulary", label: "Từ vựng", description: "ことば" },
  { value: "grammar", label: "Ngữ pháp", description: "文法" },
  { value: "kanji", label: "Kanji", description: "漢字" }
];

const quickQueries = ["食べる", "です", "行く", "日", "は", "学校"];

export function KnowledgeLookupView() {
  const [category, setCategory] = useState<KnowledgeCategory>("vocabulary");
  const [level, setLevel] = useState("N5");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [items, setItems] = useState<KnowledgeItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void searchKnowledge(submittedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, level, submittedQuery]);

  async function searchKnowledge(nextQuery: string) {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: nextQuery,
        level,
        limit: "24"
      });
      const data = await apiRequest<KnowledgeItemResponse[]>(`/knowledge/${category}?${params.toString()}`);
      setItems(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tra cứu kiến thức");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function chooseQuickQuery(value: string) {
    setQuery(value);
    setSubmittedQuery(value);
  }

  return (
    <section className="knowledge-lookup-grid">
      <div className="section-heading full-span">
        <p className="eyebrow">辞書</p>
        <h2>Từ điển Nhật - Việt N5/N4</h2>
      </div>

      <Panel className="knowledge-search-panel" eyebrow="Tra cứu" title="Tìm nghĩa và cách dùng">
        <div className="knowledge-category-list" aria-label="Nhóm kiến thức">
          {categoryOptions.map((option) => (
            <button
              className={category === option.value ? "knowledge-category active" : "knowledge-category"}
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
            >
              <DatabaseZap size={18} />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          ))}
        </div>

        <form className="knowledge-search-form" onSubmit={submit}>
          <label>
            Cấp độ
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>N5</option>
              <option>N4</option>
            </select>
          </label>
          <label>
            Từ hoặc mẫu câu
            <span className="input-shell">
              <Search size={18} />
              <input
                placeholder="Nhập tiếng Nhật, romaji hoặc nghĩa tiếng Việt"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </span>
          </label>
          <IconTextButton type="submit">
            <Search size={18} />
            Tra cứu
          </IconTextButton>
        </form>

        <div className="knowledge-quick-row" aria-label="Gợi ý tra cứu nhanh">
          {quickQueries.map((value) => (
            <button key={value} type="button" onClick={() => chooseQuickQuery(value)}>
              <Sparkles size={14} />
              {value}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="knowledge-results-panel" eyebrow="Kết quả" title={resultTitle(category, level, submittedQuery)}>
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <LoadingPanel>Đang tra từ điển...</LoadingPanel>
        ) : items.length ? (
          <div className="knowledge-result-grid">
            {items.map((item) => (
              <KnowledgeCard item={item} key={`${item.type}-${item.id}`} />
            ))}
          </div>
        ) : (
          <div className="empty-state compact">Chưa tìm thấy mục phù hợp. Thử đổi từ khóa hoặc cấp độ.</div>
        )}
      </Panel>
    </section>
  );
}

function KnowledgeCard({ item }: { item: KnowledgeItemResponse }) {
  return (
    <article className="knowledge-card">
      <div>
        <TopicChip>{displayType(item.type)}</TopicChip>
        {item.level && <TopicChip>{item.level}</TopicChip>}
      </div>
      <h3>{item.title || item.id}</h3>
      {item.reading && <span className="knowledge-reading">{item.reading}</span>}
      <p>{item.meaningVi || item.meaningEn || "Chưa có nghĩa tiếng Việt."}</p>
      <div className="dictionary-usage">
        <strong>Dùng khi nào?</strong>
        <span>{usageContext(item)}</span>
      </div>
      {item.source && (
        <small>
          <BookOpenText size={14} />
          {item.source}
        </small>
      )}
    </article>
  );
}

function resultTitle(category: KnowledgeCategory, level: string, query: string): string {
  const target = query ? `"${query}"` : "tất cả";
  return `${displayType(category)} ${level} - ${target}`;
}

function displayType(value: string): string {
  const labels: Record<string, string> = {
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    kanji: "Kanji",
    Vocabulary: "Từ vựng",
    GrammarPoint: "Ngữ pháp",
    Kanji: "Kanji"
  };

  return labels[value] ?? value;
}

function usageContext(item: KnowledgeItemResponse): string {
  const type = item.type.toLowerCase();
  if (type.includes("vocab")) {
    return "Dùng như một từ trong câu. Hãy xem nghĩa, cách đọc và đặt vào mẫu câu ngắn để nhớ theo ngữ cảnh.";
  }
  if (type.includes("grammar")) {
    return "Dùng như một mẫu ngữ pháp. Chú ý vị trí trong câu và sắc thái trước khi áp vào ví dụ riêng.";
  }
  if (type.includes("kanji")) {
    return "Dùng để nhận diện từ có kanji này. Nên học kèm âm đọc và một vài từ ghép thường gặp.";
  }
  return "Dùng để tra nhanh nghĩa và ngữ cảnh cơ bản. Nếu cần hỏi sâu hơn, dùng bong bóng VAJA ở góc màn hình.";
}
