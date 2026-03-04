import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { SAMPLE_QUESTION_BANK } from "../data/interviewDatasets";
import "./question-bank.css";

const ALL_QUESTIONS = [
  ...SAMPLE_QUESTION_BANK.behavioral.map(q => ({ ...q, category: "Behavioral" })),
  ...SAMPLE_QUESTION_BANK.technical.map(q => ({ ...q, category: "Technical" })),
  ...(SAMPLE_QUESTION_BANK["system-design"] || []).map(q => ({ ...q, category: "System Design" })),
];

const DIFF_COLORS = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444" };
const CAT_COLORS = { Behavioral: "#a78bfa", Technical: "#60a5fa", "System Design": "#34d399" };

export default function QuestionBank() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterDiff, setFilterDiff] = useState("All");
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qb_bookmarks") || "[]"); } catch { return []; }
  });
  const [expandedId, setExpandedId] = useState(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const categories = ["All", "Behavioral", "Technical", "System Design"];
  const difficulties = ["All", "easy", "medium", "hard"];

  const filtered = useMemo(() => {
    return ALL_QUESTIONS.filter(q => {
      if (showBookmarksOnly && !bookmarks.includes(q.id)) return false;
      if (filterCat !== "All" && q.category !== filterCat) return false;
      if (filterDiff !== "All" && q.difficulty !== filterDiff) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        return q.q.toLowerCase().includes(s) || (q.tags || []).some(t => t.toLowerCase().includes(s));
      }
      return true;
    });
  }, [search, filterCat, filterDiff, showBookmarksOnly, bookmarks]);

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
      localStorage.setItem("qb_bookmarks", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="qb-page">
      <div className="qb-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      <div className="qb-container">
        {/* Header */}
        <div className="qb-header">
          <Link to="/dashboard" className="back-link">← Dashboard</Link>
          <div className="qb-header-text">
            <h1>Question Bank</h1>
            <p>Browse, search, and bookmark {ALL_QUESTIONS.length} curated interview questions</p>
          </div>
          <div className="qb-header-stats">
            <span className="qb-stat">{ALL_QUESTIONS.length} Questions</span>
            <span className="qb-stat">{bookmarks.length} Bookmarked</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="qb-controls">
          <div className="qb-search-wrap">
            <span className="qb-search-icon">🔍</span>
            <input
              type="text"
              className="qb-search"
              placeholder="Search questions or tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="qb-clear-btn" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <div className="qb-filters">
            <div className="qb-filter-group">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`qb-filter-btn ${filterCat === cat ? "active" : ""}`}
                  onClick={() => setFilterCat(cat)}
                  style={filterCat === cat && cat !== "All" ? { background: CAT_COLORS[cat] + "22", borderColor: CAT_COLORS[cat] + "66", color: CAT_COLORS[cat] } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="qb-filter-group">
              {difficulties.map(diff => (
                <button
                  key={diff}
                  className={`qb-filter-btn ${filterDiff === diff ? "active" : ""}`}
                  onClick={() => setFilterDiff(diff)}
                  style={filterDiff === diff && diff !== "All" ? { background: DIFF_COLORS[diff] + "22", borderColor: DIFF_COLORS[diff] + "66", color: DIFF_COLORS[diff] } : {}}
                >
                  {diff === "All" ? "All Levels" : diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
            <button
              className={`qb-bookmark-toggle ${showBookmarksOnly ? "active" : ""}`}
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            >
              {showBookmarksOnly ? "🔖 Bookmarked" : "🔖 Show Saved"}
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="qb-count">
          Showing <strong>{filtered.length}</strong> question{filtered.length !== 1 ? "s" : ""}
          {search && <span> matching "<em>{search}</em>"</span>}
        </div>

        {/* Question List */}
        <div className="qb-list">
          {filtered.length === 0 ? (
            <div className="qb-empty">
              <span className="qb-empty-icon">🔍</span>
              <p>No questions match your filters.</p>
              <button className="qb-reset-btn" onClick={() => { setSearch(""); setFilterCat("All"); setFilterDiff("All"); setShowBookmarksOnly(false); }}>
                Reset Filters
              </button>
            </div>
          ) : (
            filtered.map(q => {
              const isExpanded = expandedId === q.id;
              const isBookmarked = bookmarks.includes(q.id);
              return (
                <div key={q.id} className={`qb-card ${isExpanded ? "expanded" : ""}`}>
                  <div className="qb-card-top" onClick={() => setExpandedId(isExpanded ? null : q.id)}>
                    <div className="qb-card-meta">
                      <span className="qb-cat-badge" style={{ background: (CAT_COLORS[q.category] || "#60a5fa") + "22", color: CAT_COLORS[q.category] || "#60a5fa" }}>
                        {q.category}
                      </span>
                      <span className="qb-diff-badge" style={{ color: DIFF_COLORS[q.difficulty] || "#94a3b8" }}>
                        ● {q.difficulty}
                      </span>
                    </div>
                    <p className="qb-question-text">{q.q}</p>
                    <div className="qb-card-actions">
                      <button
                        className={`qb-bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
                        onClick={e => { e.stopPropagation(); toggleBookmark(q.id); }}
                        title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                      >
                        {isBookmarked ? "🔖" : "☆"}
                      </button>
                      <span className="qb-expand-icon">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="qb-card-body">
                      {q.tags && q.tags.length > 0 && (
                        <div className="qb-tags">
                          {q.tags.map(tag => (
                            <span key={tag} className="qb-tag" onClick={() => setSearch(tag)}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="qb-tips-section">
                        <div className="qb-tips-label">💡 How to approach this question:</div>
                        <ul className="qb-tips-list">
                          {q.category === "Behavioral" && (
                            <>
                              <li>Use the STAR method: Situation, Task, Action, Result</li>
                              <li>Keep your answer to 2 minutes maximum</li>
                              <li>Quantify the impact whenever possible</li>
                            </>
                          )}
                          {q.category === "Technical" && (
                            <>
                              <li>Clarify the question scope before diving in</li>
                              <li>Think out loud — explain your reasoning</li>
                              <li>Start with a simple solution, then optimize</li>
                            </>
                          )}
                          {q.category === "System Design" && (
                            <>
                              <li>Start with requirements and capacity estimation</li>
                              <li>Draw the high-level architecture first</li>
                              <li>Address trade-offs and failure scenarios</li>
                            </>
                          )}
                        </ul>
                      </div>
                      <Link
                        to="/planning"
                        className="qb-practice-link"
                      >
                        Practice This Type →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
