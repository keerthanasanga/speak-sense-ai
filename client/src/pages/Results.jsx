import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getStoredUser } from "../utils/authStorage";
import { COMMON_MISTAKES, STUDY_PLAN_TEMPLATES, SALARY_DATA } from "../data/interviewDatasets";
import "./results.css";

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [animatedScores, setAnimatedScores] = useState({});
  const [latestSummary, setLatestSummary] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [dbSaveStatus, setDbSaveStatus] = useState("unknown");
  const [profile, setProfile] = useState(() => {
    try {
      return getStoredUser();
    } catch {
      return null;
    }
  });

  // Mock data for the interview results
  const fallbackResults = {
    overall: {
      score: 78,
      percentile: 85,
      grade: "B+",
      timeSpent: "32 minutes",
      questionsAttempted: 12,
      totalQuestions: 15
    },
    
    confidence: {
      score: 82,
      level: "High",
      breakdown: [
        { phase: "Introduction", score: 90 },
        { phase: "Technical Answers", score: 75 },
        { phase: "Behavioral Responses", score: 85 },
        { phase: "Closing Statements", score: 78 }
      ],
      timeline: [
        { minute: 1, level: 85 },
        { minute: 2, level: 88 },
        { minute: 3, level: 82 },
        { minute: 4, level: 79 },
        { minute: 5, level: 84 },
        { minute: 6, level: 81 },
        { minute: 7, level: 86 },
        { minute: 8, level: 83 }
      ]
    },

    speaking: {
      speed: 68,
      pace: "Moderate",
      clarity: 85,
      breakdown: {
        tooFast: 15,
        moderate: 70,
        tooSlow: 15
      },
      wordsPerMinute: 145,
      pauses: 23,
      fillerWords: 12
    },

    grammar: {
      score: 74,
      mistakes: 18,
      categories: [
        { type: "Subject-Verb Agreement", count: 5, severity: "high" },
        { type: "Tense Consistency", count: 4, severity: "medium" },
        { type: "Article Usage", count: 3, severity: "low" },
        { type: "Preposition Errors", count: 3, severity: "medium" },
        { type: "Word Choice", count: 3, severity: "low" }
      ]
    },

    sentenceStructure: {
      score: 81,
      averageLength: 15.2,
      complexity: "Moderate",
      breakdown: {
        simple: 35,
        compound: 45,
        complex: 20
      }
    },

    categories: {
      technical: 76,
      behavioral: 84,
      communication: 79,
      problemSolving: 73,
      clarity: 81
    },

    questionAnalysis: [
      {
        id: 1,
        question: "Tell me about yourself",
        answer: "I am a software engineer with 4 years of experience building React and Node.js products.",
        score: 85,
        feedback: "Good introduction, could be more concise",
        strengths: ["Clear structure", "Relevant experience"],
        improvements: ["Reduce length", "Add more achievements"]
      },
      {
        id: 2,
        question: "Explain a challenging project",
        answer: "I led a migration to microservices and reduced API latency by 38% after profiling bottlenecks.",
        score: 72,
        feedback: "Good technical details, needs more impact",
        strengths: ["Technical depth", "Problem explanation"],
        improvements: ["Highlight results", "Use STAR method"]
      },
      {
        id: 3,
        question: "How do you handle conflicts?",
        answer: "I align on shared goals, listen actively, and agree on a clear action plan with owners and dates.",
        score: 88,
        feedback: "Excellent example, well-structured",
        strengths: ["Clear example", "Good resolution"],
        improvements: ["Add more specific details"]
      },
      {
        id: 4,
        question: "Technical: Array manipulation",
        answer: "I explained a two-pointer approach and then optimized memory by avoiding intermediate arrays.",
        score: 68,
        feedback: "Correct approach, needs optimization",
        strengths: ["Understanding of problem", "Basic solution"],
        improvements: ["Optimize time complexity", "Consider edge cases"]
      },
      {
        id: 5,
        question: "Future career goals",
        answer: "I want to become a senior engineer focused on reliable distributed systems and mentoring teams.",
        score: 76,
        feedback: "Good vision, could be more specific",
        strengths: ["Clear direction", "Ambition shown"],
        improvements: ["Add timeline", "Be more specific"]
      }
    ],

    feedback: {
      positive: [
        "Good eye contact throughout",
        "Clear articulation",
        "Well-structured responses",
        "Professional demeanor"
      ],
      improvements: [
        "Reduce filler words (um, uh, like)",
        "Slow down during technical explanations",
        "Provide more quantifiable achievements",
        "Practice closing statements"
      ]
    },

    // Required by RoleSuggestions, StudyPlanTab, and CommonMistakesTab
    categories: {
      technical: 75,
      behavioral: 80,
      communication: 82,
      problemSolving: 72,
      clarity: 78,
    }
  };

  const results = useMemo(() => {
    if (!latestReport?.overview) {
      return fallbackResults;
    }

    const timeline = Array.isArray(latestReport.confidenceTimeline) && latestReport.confidenceTimeline.length
      ? latestReport.confidenceTimeline
      : fallbackResults.confidence.timeline;

    const confidenceScore = Math.round(
      timeline.reduce((sum, item) => sum + toFiniteNumber(item.level, 0), 0) / Math.max(timeline.length, 1)
    );

    const hasStoredQuestionAnalysis = Array.isArray(latestReport.questionAnalysis) && latestReport.questionAnalysis.length;

    const questionAnalysis = hasStoredQuestionAnalysis
      ? latestReport.questionAnalysis.map((item, index) => ({
          id: item.id || index + 1,
          question: item.question || `Interview question ${index + 1}`,
          answer: item.answer || "",
          score: toFiniteNumber(item.score, 0),
          correctnessLabel: item.correctnessLabel || "",
          feedback: item.feedback || "Answer reviewed successfully.",
          strengths: Array.isArray(item.strengths) && item.strengths.length
            ? item.strengths
            : ["Attempted this question"],
          improvements: Array.isArray(item.improvements) && item.improvements.length
            ? item.improvements
            : ["Add a more specific example"],
        }))
      : [];

    const grammarMistakes = toFiniteNumber(latestReport.grammar?.mistakes, 0);
    const grammarScore = toFiniteNumber(latestReport.grammar?.score, 0);
    const reportOverviewScore = toFiniteNumber(latestReport.overview?.score, fallbackResults.overall.score);
    const reportTimeSpentSeconds = toFiniteNumber(latestReport.overview?.timeSpentSeconds, 0);
    const reportQuestionsAttempted = toFiniteNumber(latestReport.overview?.questionsAttempted, 0);
    const reportTotalQuestions = toFiniteNumber(latestReport.overview?.totalQuestions, fallbackResults.overall.totalQuestions);
    const reportWpm = toFiniteNumber(latestReport.speaking?.wordsPerMinute, 0);
    const reportSpeakingClarity = toFiniteNumber(latestReport.speaking?.clarity, fallbackResults.speaking.clarity);
    const reportPauses = toFiniteNumber(latestReport.speaking?.pauses, 0);
    const reportFillerWords = toFiniteNumber(latestReport.speaking?.fillerWords, 0);

    return {
      overall: {
        score: reportOverviewScore,
        percentile: fallbackResults.overall.percentile,
        grade: latestReport.overview?.grade || fallbackResults.overall.grade,
        timeSpent: `${Math.max(1, Math.round(reportTimeSpentSeconds / 60))} minutes`,
        questionsAttempted: reportQuestionsAttempted,
        totalQuestions: reportTotalQuestions,
      },
      confidence: {
        score: confidenceScore,
        level: confidenceScore >= 80 ? "High" : confidenceScore >= 65 ? "Moderate" : "Low",
        breakdown: [
          { phase: "Opening", score: timeline[0]?.level || confidenceScore },
          { phase: "Mid Interview", score: timeline[Math.floor(timeline.length / 2)]?.level || confidenceScore },
          { phase: "Closing", score: timeline[timeline.length - 1]?.level || confidenceScore },
        ],
        timeline,
      },
      speaking: {
        speed: reportWpm,
        pace: reportWpm > 165
          ? "Fast"
          : reportWpm < 95
            ? "Slow"
            : "Moderate",
        clarity: reportSpeakingClarity,
        breakdown: fallbackResults.speaking.breakdown,
        wordsPerMinute: reportWpm,
        pauses: reportPauses,
        fillerWords: reportFillerWords,
      },
      grammar: {
        score: grammarScore,
        mistakes: grammarMistakes,
        categories: [
          { type: "Detected Grammar Issues", count: grammarMistakes, severity: grammarMistakes >= 8 ? "high" : grammarMistakes >= 4 ? "medium" : "low" },
          { type: "Sentence Quality", count: Math.max(0, Math.round((100 - grammarScore) / 8)), severity: grammarScore < 70 ? "medium" : "low" },
        ],
      },
      sentenceStructure: fallbackResults.sentenceStructure,
      categories: {
        technical: toFiniteNumber(latestReport.categories?.technical, fallbackResults.categories.technical),
        behavioral: toFiniteNumber(latestReport.categories?.behavioral, fallbackResults.categories.behavioral),
        communication: toFiniteNumber(latestReport.categories?.communication, fallbackResults.categories.communication),
        problemSolving: toFiniteNumber(latestReport.categories?.problemSolving, fallbackResults.categories.problemSolving),
        clarity: toFiniteNumber(latestReport.categories?.clarity, fallbackResults.categories.clarity),
      },
      questionAnalysis,
      feedback: {
        positive: Array.isArray(latestReport.feedback?.positive) && latestReport.feedback.positive.length
          ? latestReport.feedback.positive
          : fallbackResults.feedback.positive,
        improvements: Array.isArray(latestReport.feedback?.improvements) && latestReport.feedback.improvements.length
          ? latestReport.feedback.improvements
          : fallbackResults.feedback.improvements,
      },
    };
  }, [latestReport]);

  // Calculate pie chart data
  const pieData = [
    { name: "Technical", value: results.categories.technical, color: "#4f9eff" },
    { name: "Behavioral", value: results.categories.behavioral, color: "#48bb78" },
    { name: "Communication", value: results.categories.communication, color: "#f687b3" },
    { name: "Problem Solving", value: results.categories.problemSolving, color: "#9f7aea" },
    { name: "Clarity", value: results.categories.clarity, color: "#f6ad55" }
  ];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  const safePieTotal = total > 0 ? total : 1;
  const confidenceLevels = results.confidence.timeline.map((t) => toFiniteNumber(t.level, 0));
  const peakConfidence = confidenceLevels.length ? Math.max(...confidenceLevels) : 0;
  const lowestConfidence = confidenceLevels.length ? Math.min(...confidenceLevels) : 0;

  useEffect(() => {
    try {
      const summary = JSON.parse(localStorage.getItem("latestInterviewSummary") || "null");
      setLatestSummary(summary);
      const report = JSON.parse(localStorage.getItem("latestInterviewReport") || "null");
      setLatestReport(report);

      const routeStatus = location.state?.dbSaveStatus;
      const storedStatus = localStorage.getItem("latestInterviewDbSaveStatus");
      const resolvedStatus = routeStatus || storedStatus || "unknown";
      setDbSaveStatus(resolvedStatus);

      if (routeStatus) {
        localStorage.setItem("latestInterviewDbSaveStatus", routeStatus);
      }
    } catch {
      setLatestSummary(null);
      setLatestReport(null);
      setDbSaveStatus("unknown");
    }

    const timer = setTimeout(() => {
      setAnimatedScores({
        overall: results.overall.score,
        confidence: results.confidence.score,
        speaking: results.speaking.speed,
        grammar: results.grammar.score,
        sentence: results.sentenceStructure.score
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [location.state, results]);

  const getCorrectnessBadge = (question) => {
    const label = question?.correctnessLabel;
    if (label === "correct") return { text: "✅ Correct", className: "correct" };
    if (label === "partially-correct") return { text: "🟡 Partially Correct", className: "partial" };
    if (label === "needs-improvement") return { text: "❌ Needs Improvement", className: "incorrect" };

    if ((question?.score || 0) >= 80) return { text: "✅ Correct", className: "correct" };
    if ((question?.score || 0) >= 65) return { text: "🟡 Partially Correct", className: "partial" };
    return { text: "❌ Needs Improvement", className: "incorrect" };
  };

  return (
    <div className="results-page">
      {/* Background Elements */}
      <div className="results-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
        <div className="bg-glow glow-3"></div>
      </div>

      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <Link to="/dashboard" className="back-link">
            <span className="back-icon">←</span>
            Back to Dashboard
          </Link>
          <h1>Interview Results & Analytics</h1>
          {profile?.industry && (
            <div className="industry-chip">{profile.industry}</div>
          )}
          <div className="header-actions">
            <button className="share-btn" onClick={() => window.print()}>
              <span>📊</span>
              Export Report
            </button>
            <Link to="/planning" className="new-interview-btn">
              <span>🎯</span>
              New Interview
            </Link>
          </div>
        </div>

        {dbSaveStatus !== "unknown" && (
          <div className={`db-save-status ${dbSaveStatus === "saved" ? "saved" : "failed"}`} role="status" aria-live="polite">
            {dbSaveStatus === "saved"
              ? "✅ Saved to database"
              : "⚠️ Could not save to database. Showing local results for this session."}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="results-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'confidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('confidence')}
          >
            📈 Confidence
          </button>
          <button
            className={`tab-btn ${activeTab === 'speaking' ? 'active' : ''}`}
            onClick={() => setActiveTab('speaking')}
          >
            🎤 Speaking
          </button>
          <button
            className={`tab-btn ${activeTab === 'grammar' ? 'active' : ''}`}
            onClick={() => setActiveTab('grammar')}
          >
            📝 Grammar
          </button>
          <button
            className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            ❓ Questions
          </button>
          <button
            className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            🎯 Role Match
          </button>
          <button
            className={`tab-btn ${activeTab === 'mistakes' ? 'active' : ''}`}
            onClick={() => setActiveTab('mistakes')}
          >
            ⚠️ Mistakes
          </button>
          <button
            className={`tab-btn ${activeTab === 'studyplan' ? 'active' : ''}`}
            onClick={() => setActiveTab('studyplan')}
          >
            📅 Study Plan
          </button>
        </div>

        {/* Main Content */}
        <div className="results-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {latestSummary && (
                <div className="session-summary-card">
                  <h3>Latest Session</h3>
                  <p>
                    Interviewer: <strong>{latestSummary.interviewer || 'AI Coach'}</strong> · 
                    Mode: <strong>{latestSummary.mode}</strong> · 
                    Difficulty: <strong>{latestSummary.config?.difficulty || 'intermediate'}</strong>
                  </p>
                  <p>
                    Focus: <strong>{latestSummary.config?.mode || 'balanced'}</strong> · 
                    Questions: <strong>{latestSummary.questionsAnswered || 0}</strong>
                  </p>
                </div>
              )}

              {/* Score Cards */}
              <div className="score-cards">
                <div className="score-card overall">
                  <div className="score-icon">🎯</div>
                  <div className="score-details">
                    <span className="score-label">Overall Score</span>
                    <span className="score-value">{results.overall.score}</span>
                    <span className="score-grade">Grade {results.overall.grade}</span>
                  </div>
                  <div className="progress-ring">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#1a2634" strokeWidth="8"/>
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#4f9eff"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - results.overall.score / 100)}`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>
                </div>

                <div className="score-card">
                  <div className="score-icon">⚡</div>
                  <div className="score-details">
                    <span className="score-label">Confidence</span>
                    <span className="score-value">{results.confidence.score}%</span>
                    <span className="score-grade">{results.confidence.level}</span>
                  </div>
                </div>

                <div className="score-card">
                  <div className="score-icon">🎤</div>
                  <div className="score-details">
                    <span className="score-label">Speaking</span>
                    <span className="score-value">{results.speaking.wordsPerMinute}</span>
                    <span className="score-grade">wpm</span>
                  </div>
                </div>

                <div className="score-card">
                  <div className="score-icon">📝</div>
                  <div className="score-details">
                    <span className="score-label">Grammar</span>
                    <span className="score-value">{results.grammar.score}%</span>
                    <span className="score-grade">{results.grammar.mistakes} mistakes</span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="charts-grid">
                {/* Pie Chart */}
                <div className="chart-card">
                  <h3>Performance Breakdown</h3>
                  <div className="pie-chart-container">
                    <div className="pie-chart">
                      {pieData.map((item, index) => {
                        const rotation = pieData
                          .slice(0, index)
                          .reduce((sum, i) => sum + (i.value / safePieTotal) * 360, 0);
                        
                        return (
                          <div
                            key={item.name}
                            className="pie-slice"
                            style={{
                              background: `conic-gradient(from ${rotation}deg, ${item.color} ${(item.value / safePieTotal) * 360}deg, transparent ${(item.value / safePieTotal) * 360}deg)`,
                            }}
                          >
                            <div className="slice-tooltip">
                              <span>{item.name}: {item.value}%</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pie-center">
                        <span className="center-value">{results.overall.score}</span>
                        <span className="center-label">Overall</span>
                      </div>
                    </div>
                    
                    <div className="pie-legend">
                      {pieData.map(item => (
                        <div key={item.name} className="legend-item">
                          <span className="legend-color" style={{ background: item.color }}></span>
                          <span className="legend-label">{item.name}</span>
                          <span className="legend-value">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bar Chart - Category Scores */}
                <div className="chart-card">
                  <h3>Category Scores</h3>
                  <div className="bar-chart">
                    {Object.entries(results.categories).map(([key, value]) => (
                      <div key={key} className="bar-item">
                        <span className="bar-label">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${value}%`,
                              background: value >= 80 ? '#48bb78' : value >= 60 ? '#f6ad55' : '#f56565'
                            }}
                          >
                            <span className="bar-value">{value}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confidence Timeline */}
              <div className="timeline-card">
                <h3>Confidence Throughout Interview</h3>
                <div className="timeline-chart">
                  {results.confidence.timeline.map((point, index) => (
                    <div key={index} className="timeline-bar-container">
                      <div 
                        className="timeline-bar"
                        style={{ 
                          height: `${point.level}%`,
                          background: point.level >= 80 ? '#48bb78' : point.level >= 60 ? '#f6ad55' : '#f56565'
                        }}
                      >
                        <span className="bar-value">{point.level}%</span>
                      </div>
                      <span className="bar-label">{point.minute}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Cards */}
              <div className="feedback-cards">
                <div className="feedback-card positive">
                  <h4>✨ Strengths</h4>
                  <ul>
                    {results.feedback.positive.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="feedback-card improvements">
                  <h4>🎯 Areas for Improvement</h4>
                  <ul>
                    {results.feedback.improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'confidence' && (
            <div className="confidence-tab">
              <h2>Confidence Analysis</h2>
              
              <div className="confidence-breakdown">
                <div className="breakdown-card">
                  <h3>Confidence by Phase</h3>
                  {results.confidence.breakdown.map((phase, index) => (
                    <div key={index} className="phase-item">
                      <span className="phase-name">{phase.phase}</span>
                      <div className="phase-bar-container">
                        <div 
                          className="phase-bar-fill"
                          style={{ 
                            width: `${phase.score}%`,
                            background: phase.score >= 80 ? '#48bb78' : phase.score >= 60 ? '#f6ad55' : '#f56565'
                          }}
                        >
                          <span className="phase-bar-value">{phase.score}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="stats-card">
                  <h3>Key Metrics</h3>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-icon">📊</span>
                      <div>
                        <strong>Average</strong>
                        <p>{results.confidence.score}%</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📈</span>
                      <div>
                        <strong>Peak</strong>
                        <p>{peakConfidence}%</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📉</span>
                      <div>
                        <strong>Lowest</strong>
                        <p>{lowestConfidence}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'speaking' && (
            <div className="speaking-tab">
              <h2>Speaking Analysis</h2>
              
              <div className="speaking-grid">
                <div className="distribution-card">
                  <h3>Speaking Speed Distribution</h3>
                  <div className="distribution-chart">
                    <div className="distribution-segment" style={{ width: `${results.speaking.breakdown.tooFast}%` }}>
                      <span className="segment-value">{results.speaking.breakdown.tooFast}%</span>
                      <span className="segment-label">Too Fast</span>
                    </div>
                    <div className="distribution-segment moderate" style={{ width: `${results.speaking.breakdown.moderate}%` }}>
                      <span className="segment-value">{results.speaking.breakdown.moderate}%</span>
                      <span className="segment-label">Moderate</span>
                    </div>
                    <div className="distribution-segment" style={{ width: `${results.speaking.breakdown.tooSlow}%` }}>
                      <span className="segment-value">{results.speaking.breakdown.tooSlow}%</span>
                      <span className="segment-label">Too Slow</span>
                    </div>
                  </div>
                </div>

                <div className="metrics-grid-small">
                  <div className="metric-box">
                    <span className="metric-icon">⚡</span>
                    <div>
                      <span className="metric-label">Words/Min</span>
                      <span className="metric-value">{results.speaking.wordsPerMinute}</span>
                    </div>
                  </div>
                  <div className="metric-box">
                    <span className="metric-icon">⏸️</span>
                    <div>
                      <span className="metric-label">Pauses</span>
                      <span className="metric-value">{results.speaking.pauses}</span>
                    </div>
                  </div>
                  <div className="metric-box">
                    <span className="metric-icon">🗣️</span>
                    <div>
                      <span className="metric-label">Filler Words</span>
                      <span className="metric-value">{results.speaking.fillerWords}</span>
                    </div>
                  </div>
                  <div className="metric-box">
                    <span className="metric-icon">🎯</span>
                    <div>
                      <span className="metric-label">Clarity</span>
                      <span className="metric-value">{results.speaking.clarity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grammar' && (
            <div className="grammar-tab">
              <h2>Grammar & Structure Analysis</h2>
              
              <div className="grammar-grid">
                <div className="mistakes-card">
                  <h3>Grammar Mistakes</h3>
                  {results.grammar.categories.map((category, index) => (
                    <div key={index} className="mistake-item">
                      <div className="mistake-header">
                        <span className="mistake-type">{category.type}</span>
                        <span className={`mistake-severity ${category.severity}`}>
                          {category.severity}
                        </span>
                      </div>
                      <div className="mistake-bar-container">
                        <div 
                          className="mistake-bar-fill"
                          style={{ 
                            width: `${(category.count / 10) * 100}%`,
                            background: category.severity === 'high' ? '#f56565' : 
                                      category.severity === 'medium' ? '#f6ad55' : '#48bb78'
                          }}
                        >
                          <span className="mistake-count">{category.count}x</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="structure-card">
                  <h3>Sentence Structure</h3>
                  {Object.entries(results.sentenceStructure.breakdown).map(([key, value]) => (
                    <div key={key} className="structure-item">
                      <span className="structure-label">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      <div className="structure-bar-container">
                        <div 
                          className="structure-bar-fill"
                          style={{ 
                            width: `${value}%`,
                            background: key === 'simple' ? '#4f9eff' : 
                                      key === 'compound' ? '#48bb78' : '#9f7aea'
                          }}
                        >
                          <span className="structure-bar-value">{value}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="questions-tab">
              <h2>Question Analysis</h2>

              {results.questionAnalysis.length === 0 && (
                <div className="question-empty-state" role="status">
                  No captured question-answer pairs were found for this session. Complete at least one response to generate detailed Q&A analysis.
                </div>
              )}
              
              <div className="questions-list">
                {results.questionAnalysis.map((q, index) => {
                  const badge = getCorrectnessBadge(q);

                  return (
                  <div key={q.id} className="question-card">
                    <div className="question-header">
                      <span className="question-number">Q{index + 1}</span>
                      <div className="question-meta">
                        <h3>{q.question}</h3>
                        <span className={`question-correctness-badge ${badge.className}`}>{badge.text}</span>
                      </div>
                      <div className="question-score" style={{
                        background: `conic-gradient(${q.score >= 80 ? '#48bb78' : q.score >= 60 ? '#f6ad55' : '#f56565'} ${q.score * 3.6}deg, #1a2634 ${q.score * 3.6}deg)`
                      }}>
                        <span>{q.score}</span>
                      </div>
                    </div>
                    
                    <p className="question-feedback">{q.feedback}</p>

                    <div className="question-answer">
                      <h4>Your Answer</h4>
                      <p>{q.answer?.trim() ? q.answer : "No answer captured for this question."}</p>
                    </div>
                    
                    <div className="question-details">
                      <div className="strengths">
                        <h4>✓ Strengths</h4>
                        <ul>
                          {q.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="improvements">
                        <h4>⚡ Improvements</h4>
                        <ul>
                          {q.improvements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <RoleSuggestions results={results} />
          )}

          {/* ==================== FEATURE 4: Common Mistakes Tab ==================== */}
          {activeTab === 'mistakes' && (
            <CommonMistakesTab overallScore={results.overall.score} />
          )}

          {/* ==================== FEATURE 5: Study Plan Tab ==================== */}
          {activeTab === 'studyplan' && (
            <StudyPlanTab results={results} />
          )}
        </div>

        {/* Action Buttons */}
        <div className="results-footer">
          <Link to="/dashboard" className="secondary-btn">
            Go to Dashboard
          </Link>
          <Link to="/resume-analyzer" className="secondary-btn">
            📋 Analyze Resume
          </Link>
          <Link to="/planning" className="primary-btn">
            Practice Again
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Role Suggestions Component ────────────────────────────────────────────
const ROLE_DEFINITIONS = [
  {
    title: "Software Engineer",
    icon: "💻",
    color: "#60a5fa",
    description: "Build scalable systems and ship reliable software products.",
    weights: { technical: 0.45, problemSolving: 0.3, communication: 0.15, behavioral: 0.1 },
    minScore: 60,
    tips: ["Practice LeetCode-style algorithms", "Study system design fundamentals", "Prepare STAR-method behavioral answers"]
  },
  {
    title: "Product Manager",
    icon: "🗂️",
    color: "#f472b6",
    description: "Lead cross-functional teams to define and ship great products.",
    weights: { behavioral: 0.4, communication: 0.35, problemSolving: 0.15, technical: 0.1 },
    minScore: 65,
    tips: ["Practice product sense questions", "Study metrics and KPI frameworks", "Prepare case studies on past product decisions"]
  },
  {
    title: "Data Analyst",
    icon: "📊",
    color: "#34d399",
    description: "Turn raw data into actionable business insights.",
    weights: { technical: 0.35, problemSolving: 0.35, communication: 0.2, behavioral: 0.1 },
    minScore: 58,
    tips: ["Strengthen SQL and Python skills", "Practice data interpretation exercises", "Prepare storytelling from data examples"]
  },
  {
    title: "Business Analyst",
    icon: "📈",
    color: "#f59e0b",
    description: "Bridge business needs and technical solutions for organizations.",
    weights: { communication: 0.4, behavioral: 0.3, problemSolving: 0.2, technical: 0.1 },
    minScore: 60,
    tips: ["Study requirements gathering techniques", "Practice stakeholder communication scenarios", "Review process improvement frameworks"]
  },
  {
    title: "UX/UI Designer",
    icon: "🎨",
    color: "#a78bfa",
    description: "Create user-centered experiences that are intuitive and delightful.",
    weights: { communication: 0.35, behavioral: 0.3, problemSolving: 0.25, technical: 0.1 },
    minScore: 55,
    tips: ["Build and explain your portfolio", "Practice user research presentation", "Study design system principles"]
  },
  {
    title: "DevOps / Cloud Engineer",
    icon: "☁️",
    color: "#22d3ee",
    description: "Automate and scale infrastructure for high-reliability systems.",
    weights: { technical: 0.5, problemSolving: 0.3, communication: 0.1, behavioral: 0.1 },
    minScore: 65,
    tips: ["Master CI/CD pipeline concepts", "Study Kubernetes and container orchestration", "Practice incident response scenarios"]
  },
  {
    title: "Technical Project Manager",
    icon: "🗓️",
    color: "#fb7185",
    description: "Drive technical projects from planning to delivery on time and within scope.",
    weights: { behavioral: 0.35, communication: 0.35, technical: 0.2, problemSolving: 0.1 },
    minScore: 62,
    tips: ["Practice Agile / Scrum terminology", "Prepare for risk management questions", "Study stakeholder management strategies"]
  },
  {
    title: "ML / AI Engineer",
    icon: "🤖",
    color: "#818cf8",
    description: "Design and deploy machine learning models that solve real-world problems.",
    weights: { technical: 0.5, problemSolving: 0.35, communication: 0.1, behavioral: 0.05 },
    minScore: 68,
    tips: ["Study ML fundamentals and model evaluation", "Practice system design for ML pipelines", "Review common ML interview questions"]
  }
];

// ─── Common Mistakes Component ───────────────────────────────────────────────
function CommonMistakesTab({ overallScore }) {
  const [filterCat, setFilterCat] = useState("All");
  const categories = ["All", ...new Set(COMMON_MISTAKES.map(m => m.category))];
  const filtered = filterCat === "All" ? COMMON_MISTAKES : COMMON_MISTAKES.filter(m => m.category === filterCat);
  const severityColor = { critical: "#ef4444", high: "#f59e0b", medium: "#3b82f6" };

  return (
    <div className="mistakes-tab">
      <div className="mistakes-header">
        <h2>⚠️ Common Interview Mistakes</h2>
        <p className="mistakes-subtitle">
          {overallScore < 70
            ? "Based on your scores, pay close attention to these common pitfalls."
            : "You're performing well — use this as a checklist to stay sharp."}
        </p>
        <div className="mistakes-filter">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-pill ${filterCat === cat ? "active" : ""}`}
              onClick={() => setFilterCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="mistakes-list">
        {filtered.map((item, i) => (
          <div key={i} className="mistake-card" style={{ borderLeftColor: severityColor[item.severity] }}>
            <div className="mistake-top">
              <span className="mistake-icon">{item.icon}</span>
              <div className="mistake-body">
                <div className="mistake-label">
                  <span className="mistake-cat">{item.category}</span>
                  <span className="mistake-sev" style={{ color: severityColor[item.severity] }}>
                    {item.severity}
                  </span>
                </div>
                <p className="mistake-text">{item.mistake}</p>
              </div>
            </div>
            <div className="mistake-fix">
              <span className="fix-label">✅ Fix:</span> {item.fix}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Study Plan Component ─────────────────────────────────────────────────────
function StudyPlanTab({ results }) {
  const overall = results.overall.score;
  const scores = results.categories || {};

  // Find weakest area
  const areaMap = {
    technical: "technical",
    communication: "communication",
    behavioral: "behavioral",
  };

  let weakestKey = "communication";
  let lowestScore = Infinity;
  Object.entries(areaMap).forEach(([key]) => {
    const s = scores[key] || overall;
    if (s < lowestScore) { lowestScore = s; weakestKey = key; }
  });

  const plan = STUDY_PLAN_TEMPLATES[weakestKey] || STUDY_PLAN_TEMPLATES.communication;
  const [selectedWeek, setSelectedWeek] = useState(0);
  const week = plan.weeks[selectedWeek];

  return (
    <div className="studyplan-tab">
      <div className="sp-header">
        <h2>📅 Your Personalized Study Plan</h2>
        <p className="sp-subtitle">
          Based on your performance, your weakest area is <strong>{weakestKey}</strong>.
          Here is a {plan.duration} plan to improve it.
        </p>
      </div>
      <div className="sp-week-tabs">
        {plan.weeks.map((w, i) => (
          <button
            key={i}
            className={`sp-week-btn ${selectedWeek === i ? "active" : ""}`}
            onClick={() => setSelectedWeek(i)}
          >
            Week {w.week}: {w.focus}
          </button>
        ))}
      </div>
      <div className="sp-tasks">
        {week.tasks.map((task, i) => (
          <div key={i} className="sp-task-row">
            <div className="sp-day">{task.day}</div>
            <div className="sp-task-content">
              <span className="sp-task-num">{i + 1}</span>
              <span className="sp-task-text">{task.task}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="sp-note">
        💡 Consistency beats intensity. 20 focused minutes daily outperforms 3-hour weekend cramming sessions.
      </div>
    </div>
  );
}

function RoleSuggestions({ results }) {
  const scores = results.categories;
  const overall = results.overall.score;

  const roleScores = ROLE_DEFINITIONS.map((role) => {
    const rawScore = Object.entries(role.weights).reduce((sum, [cat, weight]) => {
      return sum + (scores[cat] || overall) * weight;
    }, 0);
    const finalScore = Math.round(Math.min(rawScore, 99));
    const eligible = finalScore >= role.minScore;
    return { ...role, score: finalScore, eligible };
  });

  const eligible = roleScores.filter((r) => r.eligible).sort((a, b) => b.score - a.score);
  const stretch = roleScores.filter((r) => !r.eligible).sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div className="roles-tab">
      <div className="roles-header-block">
        <h2>Career Role Match</h2>
        <p className="roles-subtitle">
          Based on your interview performance across technical, behavioral, and communication dimensions,
          here are the roles you are best matched for.
        </p>
      </div>

      {eligible.length > 0 && (
        <div className="roles-section">
          <h3 className="roles-section-title">✅ You are eligible for these roles</h3>
          <div className="roles-grid">
            {eligible.map((role) => (
              <div key={role.title} className="role-card" style={{ borderColor: role.color + "44" }}>
                <div className="role-card-header">
                  <span className="role-icon">{role.icon}</span>
                  <div className="role-score-pill" style={{ background: role.color + "22", color: role.color }}>
                    {role.score}% match
                  </div>
                </div>
                <h4 className="role-title" style={{ color: role.color }}>{role.title}</h4>
                <p className="role-desc">{role.description}</p>
                <div className="role-match-bar-track">
                  <div
                    className="role-match-bar-fill"
                    style={{ width: `${role.score}%`, background: role.color }}
                  />
                </div>
                <div className="role-tips">
                  <div className="role-tips-label">Preparation tips:</div>
                  <ul>
                    {role.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stretch.length > 0 && (
        <div className="roles-section">
          <h3 className="roles-section-title">🚀 Stretch goals — improve your scores to qualify</h3>
          <div className="roles-grid roles-grid-stretch">
            {stretch.map((role) => (
              <div key={role.title} className="role-card role-card-stretch">
                <div className="role-card-header">
                  <span className="role-icon">{role.icon}</span>
                  <div className="role-score-pill stretch-pill">
                    {role.score}% / {role.minScore}% needed
                  </div>
                </div>
                <h4 className="role-title">{role.title}</h4>
                <p className="role-desc">{role.description}</p>
                <div className="role-match-bar-track">
                  <div
                    className="role-match-bar-fill stretch-bar"
                    style={{ width: `${role.score}%` }}
                  />
                  <div
                    className="role-match-bar-threshold"
                    style={{ left: `${role.minScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== FEATURE 8: Salary Insights ==================== */}
      {eligible.length > 0 && (
        <div className="salary-insights-section">
          <h3 className="roles-section-title">💰 Salary Insights for Your Matched Roles</h3>
          <div className="salary-grid">
            {eligible.slice(0, 4).map(role => {
              // Fuzzy match role.title to SALARY_DATA keys
              const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
              const salDataKey = Object.keys(SALARY_DATA).find(k =>
                normalize(k).includes(normalize(role.title).slice(0, 8)) ||
                normalize(role.title).includes(normalize(k).slice(0, 8))
              );
              const salData = salDataKey ? SALARY_DATA[salDataKey] : SALARY_DATA[role.title];
              if (!salData) return null;
              return (
                <div key={role.title} className="salary-card" style={{ borderColor: role.color + "33" }}>
                  <div className="salary-card-header">
                    <span className="salary-icon">{role.icon}</span>
                    <span className="salary-role" style={{ color: role.color }}>{role.title}</span>
                  </div>
                  <div className="salary-levels">
                    {[
                      { label: "Entry", data: salData.entry },
                      { label: "Mid", data: salData.mid },
                      { label: "Senior", data: salData.senior },
                    ].map(({ label, data }) => (
                      <div key={label} className="salary-level-row">
                        <span className="salary-level-label">{label}</span>
                        <span className="salary-range">
                          ${(data.min / 1000).toFixed(0)}k – ${(data.max / 1000).toFixed(0)}k
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="salary-meta">
                    <span className="salary-meta-item">📡 {salData.demand}</span>
                    <span className="salary-meta-item">📈 {salData.growth}</span>
                    <span className="salary-meta-item">🌐 Remote: {salData.remote}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="salary-disclaimer">Salary ranges are approximate US market data for 2025. Actual compensation varies by location, company, and experience.</p>
        </div>
      )}

      <div className="roles-footer-note">
        <span>💡</span>
        <span>Scores are based on your interview performance. Complete more interviews to refine your match accuracy.</span>
      </div>
    </div>
  );
}