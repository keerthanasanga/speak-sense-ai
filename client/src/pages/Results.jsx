import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./results.css";

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [animatedScores, setAnimatedScores] = useState({});
  
  // Get data from navigation state with safe defaults
  const { feedback, answers, selections, jobRole } = location.state || {};

  // If no data, redirect to dashboard
  useEffect(() => {
    if (!feedback) {
      navigate('/dashboard');
    }
  }, [feedback, navigate]);

  // Safe defaults for all data
  const safeFeedback = feedback || {
    overallScore: 0,
    strengths: [],
    improvements: [],
    summary: "No feedback available",
    questionFeedback: []
  };

  const safeAnswers = answers || [];
  const safeSelections = selections || {};
  const safeJobRole = jobRole || "General Interview";

  // Mock data for additional analytics (in real app, this would come from backend)
  const mockAnalytics = {
    confidence: {
      score: safeFeedback.overallScore || 78,
      level: safeFeedback.overallScore >= 80 ? "High" : safeFeedback.overallScore >= 60 ? "Moderate" : "Needs Improvement",
      breakdown: [
        { phase: "Introduction", score: safeFeedback.overallScore || 78 },
        { phase: "Technical Answers", score: (safeFeedback.overallScore || 78) - 5 },
        { phase: "Behavioral Responses", score: (safeFeedback.overallScore || 78) + 3 },
        { phase: "Closing Statements", score: (safeFeedback.overallScore || 78) - 2 }
      ],
      timeline: [
        { minute: 1, level: safeFeedback.overallScore || 78 },
        { minute: 2, level: (safeFeedback.overallScore || 78) + 2 },
        { minute: 3, level: (safeFeedback.overallScore || 78) - 3 },
        { minute: 4, level: (safeFeedback.overallScore || 78) + 1 },
        { minute: 5, level: (safeFeedback.overallScore || 78) - 1 },
        { minute: 6, level: (safeFeedback.overallScore || 78) + 4 },
        { minute: 7, level: (safeFeedback.overallScore || 78) + 2 },
        { minute: 8, level: (safeFeedback.overallScore || 78) - 2 }
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
      technical: safeFeedback.overallScore ? safeFeedback.overallScore - 5 : 70,
      behavioral: safeFeedback.overallScore ? safeFeedback.overallScore + 3 : 75,
      communication: safeFeedback.overallScore ? safeFeedback.overallScore - 2 : 72,
      problemSolving: safeFeedback.overallScore ? safeFeedback.overallScore - 8 : 65,
      clarity: safeFeedback.overallScore ? safeFeedback.overallScore + 2 : 74
    }
  };

  // Use actual feedback data if available
  const results = {
    overall: {
      score: safeFeedback.overallScore || 0,
      percentile: 85,
      grade: safeFeedback.overallScore >= 90 ? "A" : 
             safeFeedback.overallScore >= 80 ? "B+" :
             safeFeedback.overallScore >= 70 ? "B" :
             safeFeedback.overallScore >= 60 ? "C" : "D",
      timeSpent: "32 minutes",
      questionsAttempted: safeAnswers.length || 0,
      totalQuestions: safeFeedback.questionCount || safeAnswers.length || 0,
      role: safeJobRole,
      difficulty: safeSelections.difficulty?.name || "Intermediate",
      type: safeSelections.type?.name || "Mixed"
    },
    
    confidence: mockAnalytics.confidence,
    speaking: mockAnalytics.speaking,
    grammar: mockAnalytics.grammar,
    sentenceStructure: mockAnalytics.sentenceStructure,
    categories: mockAnalytics.categories,

    questionAnalysis: (safeFeedback.questionFeedback && safeFeedback.questionFeedback.length > 0) 
      ? safeFeedback.questionFeedback.map((q, index) => ({
          id: index + 1,
          question: q.question || "Question",
          answer: safeAnswers[index]?.answer || "",
          score: q.score || 70,
          feedback: q.comment || "Good response",
          strengths: q.strengths || [
            "Good communication",
            "Relevant experience shown"
          ],
          improvements: q.improvements || [
            "Add more specific examples",
            "Quantify achievements"
          ]
        }))
      : safeAnswers.map((answer, index) => ({
          id: index + 1,
          question: answer.question || "Question",
          answer: answer.answer || "",
          score: 75,
          feedback: "Good response",
          strengths: [
            "Good communication",
            "Relevant experience shown"
          ],
          improvements: [
            "Add more specific examples",
            "Quantify achievements"
          ]
        })),

    feedback: {
      positive: safeFeedback.strengths || [
        "Good communication skills",
        "Clear responses",
        "Relevant experience"
      ],
      improvements: safeFeedback.improvements || [
        "Provide more examples",
        "Quantify achievements",
        "Elaborate on details"
      ],
      summary: safeFeedback.summary || "Good interview performance"
    }
  };

  // Calculate pie chart data
  const pieData = [
    { name: "Technical", value: results.categories.technical, color: "#4f9eff" },
    { name: "Behavioral", value: results.categories.behavioral, color: "#48bb78" },
    { name: "Communication", value: results.categories.communication, color: "#f687b3" },
    { name: "Problem Solving", value: results.categories.problemSolving, color: "#9f7aea" },
    { name: "Clarity", value: results.categories.clarity, color: "#f6ad55" }
  ];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    try {
      const summary = JSON.parse(localStorage.getItem("latestInterviewSummary") || "null");
      setLatestSummary(summary);
    } catch {
      setLatestSummary(null);
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
  }, [results]);

  if (!feedback) {
    return <div className="loading">Loading...</div>;
  }

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
        {/* Header with Interview Info */}
        <div className="results-header">
          <Link to="/dashboard" className="back-link">
            <span className="back-icon">←</span>
            Back to Dashboard
          </Link>
          <div className="header-title">
            <h1>Interview Results & Analytics</h1>
            <div className="interview-info-badges">
              <span className="role-badge">{results.overall.role}</span>
              <span className="difficulty-badge" style={{
                background: safeSelections.difficulty?.id === 1 ? '#48bb78' :
                           safeSelections.difficulty?.id === 2 ? '#ecc94b' :
                           safeSelections.difficulty?.id === 3 ? '#f56565' : '#9f7aea'
              }}>
                {results.overall.difficulty}
              </span>
              <span className="type-badge">{results.overall.type}</span>
            </div>
          </div>
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
                    <span className="score-value">{results.overall.score}%</span>
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
                          .reduce((sum, i) => sum + (i.value / total) * 360, 0);
                        
                        return (
                          <div
                            key={item.name}
                            className="pie-slice"
                            style={{
                              background: `conic-gradient(from ${rotation}deg, ${item.color} ${(item.value / total) * 360}deg, transparent ${(item.value / total) * 360}deg)`,
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

              {/* Summary */}
              <div className="summary-card">
                <h4>📋 Interview Summary</h4>
                <p>{results.feedback.summary}</p>
                <div className="summary-stats">
                  <div className="stat">
                    <span>Questions Answered</span>
                    <strong>{results.overall.questionsAttempted}/{results.overall.totalQuestions}</strong>
                  </div>
                  <div className="stat">
                    <span>Time Spent</span>
                    <strong>{results.overall.timeSpent}</strong>
                  </div>
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
                        <p>{Math.max(...results.confidence.timeline.map(t => t.level))}%</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📉</span>
                      <div>
                        <strong>Lowest</strong>
                        <p>{Math.min(...results.confidence.timeline.map(t => t.level))}%</p>
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
              
              <div className="questions-list">
                {results.questionAnalysis && results.questionAnalysis.length > 0 ? (
                  results.questionAnalysis.map((q, index) => (
                    <div key={q.id || index} className="question-card">
                      <div className="question-header">
                        <span className="question-number">Q{index + 1}</span>
                        <h3>{q.question || "Question"}</h3>
                        <div className="question-score" style={{
                          background: `conic-gradient(${q.score >= 80 ? '#48bb78' : q.score >= 60 ? '#f6ad55' : '#f56565'} ${q.score * 3.6}deg, #1a2634 ${q.score * 3.6}deg)`
                        }}>
                          <span>{q.score}</span>
                        </div>
                      </div>
                      
                      <p className="question-feedback">{q.feedback || "Good response"}</p>
                      
                      {/* Show actual answer if available */}
                      {q.answer && (
                        <div className="user-answer">
                          <h4>Your Answer:</h4>
                          <p>"{q.answer}"</p>
                        </div>
                      )}
                      
                      <div className="question-details">
                        <div className="strengths">
                          <h4>✓ Strengths</h4>
                          <ul>
                            {q.strengths && q.strengths.length > 0 ? (
                              q.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))
                            ) : (
                              <li>Good response structure</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="improvements">
                          <h4>⚡ Improvements</h4>
                          <ul>
                            {q.improvements && q.improvements.length > 0 ? (
                              q.improvements.map((imp, i) => (
                                <li key={i}>{imp}</li>
                              ))
                            ) : (
                              <li>Add more specific details</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-questions">
                    <p>No question data available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="results-footer">
          <Link to="/dashboard" className="secondary-btn">
            Go to Dashboard
          </Link>
          <Link to="/planning" className="primary-btn">
            Practice Again
          </Link>
        </div>
      </div>

      {/* Enhanced styles with larger fonts */}
      <style>{`
        .results-page {
          font-size: 18px;
          line-height: 1.6;
        }

        .results-header h1 {
          font-size: 36px;
          margin-bottom: 15px;
        }

        .score-value {
          font-size: 42px;
          font-weight: bold;
        }

        .score-label {
          font-size: 18px;
        }

        .score-grade {
          font-size: 16px;
        }

        .question-card h3 {
          font-size: 20px;
          line-height: 1.5;
        }

        .question-feedback {
          font-size: 18px;
        }

        .user-answer p {
          font-size: 18px;
          line-height: 1.7;
        }

        .strengths li, .improvements li {
          font-size: 17px;
          margin-bottom: 10px;
        }

        .feedback-card li {
          font-size: 17px;
          margin-bottom: 12px;
        }

        .summary-card p {
          font-size: 18px;
          line-height: 1.8;
        }

        .summary-stats .stat strong {
          font-size: 22px;
        }

        .summary-stats .stat span {
          font-size: 16px;
        }

        .tab-btn {
          font-size: 18px;
          padding: 12px 24px;
        }

        .back-link, .share-btn, .new-interview-btn {
          font-size: 17px;
        }

        .interview-info-badges {
          font-size: 16px;
        }

        .role-badge, .difficulty-badge, .type-badge {
          font-size: 15px;
          padding: 6px 16px;
        }

        .chart-card h3 {
          font-size: 22px;
          margin-bottom: 20px;
        }

        .legend-label {
          font-size: 17px;
        }

        .legend-value {
          font-size: 17px;
          font-weight: 600;
        }

        .bar-label {
          font-size: 17px;
        }

        .bar-value {
          font-size: 15px;
        }

        .phase-name {
          font-size: 17px;
        }

        .phase-bar-value {
          font-size: 15px;
        }

        .stat-item strong {
          font-size: 18px;
        }

        .stat-item p {
          font-size: 20px;
          font-weight: bold;
        }

        .metric-label {
          font-size: 16px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
        }

        .distribution-segment .segment-value {
          font-size: 16px;
          font-weight: bold;
        }

        .distribution-segment .segment-label {
          font-size: 14px;
        }

        .mistake-type {
          font-size: 17px;
        }

        .mistake-severity {
          font-size: 14px;
        }

        .structure-label {
          font-size: 17px;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-size: 24px;
          color: #90caf9;
          background: linear-gradient(135deg, #0a1929 0%, #1a2f3f 100%);
        }

        .no-questions {
          text-align: center;
          padding: 60px;
          background: #132f4c;
          border-radius: 16px;
          color: #90caf9;
          font-size: 20px;
        }

        /* Rest of the original CSS remains */
        .interview-info-badges {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          justify-content: center;
        }

        .role-badge {
          background: #1e3a5f;
          color: #bbdefb;
          border: 1px solid #3b82f6;
        }

        .type-badge {
          background: #2d4b6e;
          color: #e5e9f0;
        }

        .header-title {
          text-align: center;
        }

        .summary-card {
          background: #0d2a40;
          border-radius: 16px;
          padding: 30px;
          margin-top: 30px;
          border: 1px solid #2d4b6e;
        }

        .summary-card h4 {
          color: #90caf9;
          margin-bottom: 20px;
          font-size: 22px;
        }

        .summary-stats {
          display: flex;
          gap: 40px;
          justify-content: center;
          border-top: 1px solid #2d4b6e;
          padding-top: 25px;
          margin-top: 20px;
        }

        .summary-stats .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .user-answer {
          background: #1a3349;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          border-left: 5px solid #4caf50;
        }

        .user-answer h4 {
          color: #90caf9;
          font-size: 18px;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
}