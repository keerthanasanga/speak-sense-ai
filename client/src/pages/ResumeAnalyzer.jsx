import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import PageFeaturePanel from "../components/PageFeaturePanel";
import "./resume-analyzer.css";

const SCORE_LABELS = { 90: "Excellent", 75: "Good", 60: "Fair", 0: "Needs Work" };

const getScoreLabel = (score) => {
  const threshold = [90, 75, 60, 0].find((t) => score >= t);
  return SCORE_LABELS[threshold] ?? "Needs Work";
};

const getScoreColor = (score) => {
  if (score >= 80) return "#10b981";
  if (score >= 65) return "#f59e0b";
  if (score >= 50) return "#ef8354";
  return "#ef4444";
};

const analyzeResumeLocally = (text) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasEmail = /@[\w.]+\.\w+/.test(text);
  const hasPhone = /\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGitHub = /github\.com/i.test(text);

  const actionVerbs = ["led", "built", "designed", "developed", "improved", "managed", "created",
    "delivered", "launched", "optimized", "architected", "mentored", "implemented", "reduced", "increased"];
  const verbCount = actionVerbs.filter((v) => new RegExp(`\\b${v}`, "i").test(text)).length;

  const hasMetrics = /\d+[%x]|\$[\d,]+|\d+[km]?\s*(users|customers|revenue|sales|growth)/i.test(text);
  const hasSkills = /(skills|technologies|tools|languages|frameworks)/i.test(text);
  const hasExperience = /(experience|work history|employment)/i.test(text);
  const hasEducation = /(education|degree|university|college|bachelor|master|phd)/i.test(text);
  const hasProjects = /(projects|portfolio|side project)/i.test(text);

  const sectionScore = [hasSkills, hasExperience, hasEducation, hasProjects].filter(Boolean).length * 10;
  const contactScore = [hasEmail, hasPhone, hasLinkedIn, hasGitHub].filter(Boolean).length * 6;
  const contentScore = Math.min(verbCount * 5 + (hasMetrics ? 15 : 0), 35);
  const lengthScore = wordCount >= 300 && wordCount <= 800 ? 15 : wordCount >= 150 ? 8 : 3;

  const overall = Math.min(Math.round(sectionScore + contactScore + contentScore + lengthScore), 99);

  const improvements = [];
  if (!hasEmail) improvements.push("Add a professional email address to your contact section.");
  if (!hasPhone) improvements.push("Include a phone number for recruiters to reach you.");
  if (!hasLinkedIn) improvements.push("Add your LinkedIn profile URL to boost credibility.");
  if (!hasGitHub && /(engineer|developer|programmer|coder)/i.test(text)) {
    improvements.push("Include your GitHub profile to showcase your code.");
  }
  if (verbCount < 4) improvements.push("Use more action verbs (e.g., Led, Built, Improved) to describe your work.");
  if (!hasMetrics) improvements.push("Quantify your achievements with numbers (e.g., 'Reduced load time by 40%').");
  if (!hasProjects) improvements.push("Add a Projects section to demonstrate hands-on experience.");
  if (wordCount < 300) improvements.push("Expand your resume — aim for 300–700 words for sufficient depth.");
  if (wordCount > 900) improvements.push("Trim your resume to 1–2 pages; focus on the most impactful points.");
  if (!hasSkills) improvements.push("Add a Skills section listing your technical and soft skills.");

  const strengths = [];
  if (hasEmail && hasPhone) strengths.push("Complete contact information included.");
  if (hasLinkedIn) strengths.push("LinkedIn profile linked — great for visibility.");
  if (verbCount >= 6) strengths.push("Strong use of action verbs throughout.");
  if (hasMetrics) strengths.push("Quantified achievements add strong credibility.");
  if (hasExperience && hasEducation) strengths.push("Both experience and education sections present.");
  if (hasProjects) strengths.push("Projects section highlights practical skills.");
  if (strengths.length === 0) strengths.push("Resume content is present and readable.");

  const categories = {
    contact: Math.min(contactScore * 4, 100),
    content: Math.min(contentScore * 3, 100),
    structure: Math.min(sectionScore * 2.5, 100),
    impact: hasMetrics ? 85 : verbCount >= 4 ? 60 : 35,
    length: lengthScore >= 15 ? 90 : lengthScore >= 8 ? 65 : 40
  };

  return { overall, improvements, strengths, categories, wordCount };
};

export default function ResumeAnalyzer() {
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const analyzeText = useCallback(async (text) => {
    if (!text.trim()) {
      setError("Please paste your resume text or upload a file.");
      return;
    }
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      // Try server-side analysis first
      const res = await API.post("/resume/analyze", { text });
      if (res.data?.analysis) {
        setResult(res.data.analysis);
        return;
      }
    } catch {
      // Fall back to local analysis
    }

    // Local analysis fallback
    await new Promise((r) => setTimeout(r, 800)); // simulate processing
    setResult(analyzeResumeLocally(text));
    setAnalyzing(false);
  }, []);

  const handleFileUpload = useCallback((file) => {
    if (!file) return;
    const validTypes = ["text/plain", "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
      setError("Please upload a .txt, .pdf, .doc, or .docx file.");
      return;
    }
    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setResumeText(typeof text === "string" ? text : "");
      setMode("text");
    };
    reader.onerror = () => setError("Failed to read file. Please try pasting text instead.");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleSubmit = (e) => {
    e.preventDefault();
    analyzeText(resumeText).finally(() => setAnalyzing(false));
  };

  return (
    <div className="resume-page">
      <div className="resume-bg">
        <div className="resume-bg-glow glow-a"></div>
        <div className="resume-bg-glow glow-b"></div>
      </div>

      <div className="resume-container">
        {/* Header */}
        <div className="resume-header">
          <Link to="/dashboard" className="resume-back">← Dashboard</Link>
          <div className="resume-title-block">
            <h1 className="resume-title">Resume Analyzer</h1>
            <p className="resume-subtitle">
              Get an instant score, strengths, and actionable improvements for your resume.
            </p>
          </div>
        </div>

        <PageFeaturePanel pageKey="resume" />

        <div className="resume-layout">
          {/* Input Panel */}
          <div className="resume-input-panel">
            {/* Mode Tabs */}
            <div className="resume-mode-tabs">
              <button
                className={`mode-tab ${mode === "text" ? "active" : ""}`}
                onClick={() => setMode("text")}
                type="button"
              >
                📝 Paste Text
              </button>
              <button
                className={`mode-tab ${mode === "file" ? "active" : ""}`}
                onClick={() => setMode("file")}
                type="button"
              >
                📄 Upload File
              </button>
            </div>

            <form onSubmit={handleSubmit} className="resume-form">
              {mode === "text" ? (
                <div className="resume-textarea-wrapper">
                  <label htmlFor="resumeText" className="resume-label">
                    Paste your resume content below
                  </label>
                  <textarea
                    id="resumeText"
                    className="resume-textarea"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your full resume here — including experience, skills, education, and contact info..."
                    rows={16}
                    aria-label="Resume text"
                  />
                  <div className="textarea-meta">
                    {resumeText.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>
              ) : (
                <div
                  className="resume-dropzone"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                  aria-label="Upload resume file"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    className="file-input-hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                  <div className="dropzone-icon">📄</div>
                  {fileName ? (
                    <>
                      <div className="dropzone-filename">{fileName}</div>
                      <div className="dropzone-hint">Click to change file</div>
                    </>
                  ) : (
                    <>
                      <div className="dropzone-prompt">Drag & drop your resume here</div>
                      <div className="dropzone-hint">or click to browse — .txt, .pdf, .doc, .docx</div>
                    </>
                  )}
                </div>
              )}

              {error && <p className="resume-error" role="alert">{error}</p>}

              <button
                type="submit"
                className="resume-analyze-btn"
                disabled={analyzing || (!resumeText.trim() && !fileName)}
              >
                {analyzing ? (
                  <><span className="btn-spinner"></span> Analyzing…</>
                ) : (
                  "Analyze Resume →"
                )}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          {result && (
            <div className="resume-results-panel">
              {/* Overall Score */}
              <div className="resume-score-card">
                <div className="score-ring-wrapper">
                  <svg viewBox="0 0 120 120" className="score-ring-svg">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={getScoreColor(result.overall)}
                      strokeWidth="10"
                      strokeDasharray={`${result.overall * 3.14} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      style={{ transition: "stroke-dasharray 1s ease" }}
                    />
                  </svg>
                  <div className="score-ring-inner">
                    <div className="score-number" style={{ color: getScoreColor(result.overall) }}>
                      {result.overall}
                    </div>
                    <div className="score-label">{getScoreLabel(result.overall)}</div>
                  </div>
                </div>
                <div className="score-meta">
                  <div className="score-meta-title">Overall Resume Score</div>
                  {result.wordCount && (
                    <div className="score-meta-words">{result.wordCount} words detected</div>
                  )}
                </div>
              </div>

              {/* Category Bars */}
              {result.categories && (
                <div className="resume-categories">
                  <h3 className="section-heading">Category Breakdown</h3>
                  {Object.entries(result.categories).map(([key, val]) => (
                    <div key={key} className="cat-row">
                      <span className="cat-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <div className="cat-bar-track">
                        <div
                          className="cat-bar-fill"
                          style={{
                            width: `${val}%`,
                            background: getScoreColor(val)
                          }}
                        />
                      </div>
                      <span className="cat-val" style={{ color: getScoreColor(val) }}>{val}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Strengths */}
              {result.strengths?.length > 0 && (
                <div className="resume-strengths">
                  <h3 className="section-heading">✅ Strengths</h3>
                  <ul className="feedback-list">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="feedback-item strength-item">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {result.improvements?.length > 0 && (
                <div className="resume-improvements">
                  <h3 className="section-heading">🔧 Improvements</h3>
                  <ul className="feedback-list">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="feedback-item improvement-item">{imp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="resume-cta">
                <Link to="/planning" className="resume-cta-btn primary">
                  Start Mock Interview →
                </Link>
                <button
                  type="button"
                  className="resume-cta-btn secondary"
                  onClick={() => { setResult(null); setResumeText(""); setFileName(""); }}
                >
                  Analyze Another
                </button>
              </div>
            </div>
          )}

          {/* Empty state prompt */}
          {!result && !analyzing && (
            <div className="resume-empty-state">
              <div className="empty-icon">📋</div>
              <h3>Your analysis will appear here</h3>
              <p>Paste your resume or upload a file to get an instant score, strengths, and actionable improvements.</p>
              <div className="empty-features">
                <div className="empty-feature">
                  <span>📊</span> Overall Score
                </div>
                <div className="empty-feature">
                  <span>✅</span> Strengths
                </div>
                <div className="empty-feature">
                  <span>🔧</span> Improvements
                </div>
                <div className="empty-feature">
                  <span>📈</span> Category Breakdown
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
