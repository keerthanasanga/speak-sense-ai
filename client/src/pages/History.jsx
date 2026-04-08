import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import PageFeaturePanel from "../components/PageFeaturePanel";
import "./history.css";

// ==================== FEATURE 7: Performance Trend Chart ====================
function PerformanceTrendChart({ interviews }) {
  const sorted = [...interviews].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sorted.length < 2) return null;

  const W = 500, H = 140, PAD = { t: 20, r: 20, b: 30, l: 40 };
  const scores = sorted.map(i => i.score);
  const minS = Math.max(0, Math.min(...scores) - 10);
  const maxS = Math.min(100, Math.max(...scores) + 5);
  const xStep = (W - PAD.l - PAD.r) / (sorted.length - 1);
  const yScale = (s) => PAD.t + ((maxS - s) / (maxS - minS)) * (H - PAD.t - PAD.b);

  const points = sorted.map((item, i) => ({
    x: PAD.l + i * xStep,
    y: yScale(item.score),
    score: item.score,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    role: item.role,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M${points[0].x},${H - PAD.b} ` +
    points.map(p => `L${p.x},${p.y}`).join(" ") +
    ` L${points[points.length - 1].x},${H - PAD.b} Z`;

  const [hovered, setHovered] = useState(null);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const avgY = yScale(avg);

  return (
    <div className="trend-chart-section">
      <h3 className="trend-title">📈 Score Trend</h3>
      <div className="trend-svg-wrapper">
        <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label="Performance trend chart">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Y-axis guides */}
          {[25, 50, 75, 100].map(val => {
            const y = yScale(Math.min(val, maxS));
            if (y < PAD.t || y > H - PAD.b) return null;
            return (
              <g key={val}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,4" />
                <text x={PAD.l - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#475569">{val}</text>
              </g>
            );
          })}
          {/* Average line */}
          {avgY >= PAD.t && avgY <= H - PAD.b && (
            <line x1={PAD.l} y1={avgY} x2={W - PAD.r} y2={avgY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
          )}
          {/* Area fill */}
          <path d={area} fill="url(#trendGrad)" />
          {/* Line */}
          <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {/* Data points */}
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <circle cx={p.x} cy={p.y} r={hovered === i ? 7 : 4} fill={hovered === i ? "#60a5fa" : "#3b82f6"} stroke="#0f172a" strokeWidth="2" />
              {hovered === i && (
                <g>
                  <rect x={p.x - 45} y={p.y - 40} width="90" height="30" rx="5" fill="#1e293b" stroke="rgba(59,130,246,0.5)" strokeWidth="1" />
                  <text x={p.x} y={p.y - 26} textAnchor="middle" fontSize="10" fill="#60a5fa" fontWeight="700">{p.score}%</text>
                  <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="9" fill="#94a3b8">{p.date}</text>
                </g>
              )}
              {/* X-axis labels */}
              <text x={p.x} y={H - PAD.b + 14} textAnchor="middle" fontSize="8" fill="#475569">{p.date}</text>
            </g>
          ))}
          {/* Avg label */}
          {avgY >= PAD.t && avgY <= H - PAD.b && (
            <text x={W - PAD.r + 2} y={avgY + 4} fontSize="8" fill="#f59e0b">avg</text>
          )}
        </svg>
      </div>
      <div className="trend-legend">
        <span className="trend-legend-item"><span className="dot blue"></span>Score per interview</span>
        <span className="trend-legend-item"><span className="dot amber"></span>Average ({avg}%)</span>
      </div>
    </div>
  );
}

// Mock data - In production, this would come from an API
const MOCK_INTERVIEW_HISTORY = [
  {
    id: 1,
    role: "Frontend Developer",
    company: "Google",
    date: "2024-03-15",
    score: 85,
    status: "Completed",
    type: "Technical",
    difficulty: "Hard",
    feedback: "Strong performance in React and system design",
    strengths: ["React concepts", "Problem solving", "Communication"],
    improvements: ["Optimization techniques", "Time management"],
    duration: "45 min",
    interviewer: "Sarah Chen"
  },
  {
    id: 2,
    role: "Backend Developer",
    company: "Microsoft",
    date: "2024-03-10",
    score: 72,
    status: "Completed",
    type: "System Design",
    difficulty: "Medium",
    feedback: "Good database knowledge, needs more scalability practice",
    strengths: ["Database design", "API architecture"],
    improvements: ["Scalability concepts", "Caching strategies"],
    duration: "50 min",
    interviewer: "Michael Rodriguez"
  },
  {
    id: 3,
    role: "Full Stack Developer",
    company: "Amazon",
    date: "2024-03-05",
    score: 68,
    status: "Completed",
    type: "Mixed",
    difficulty: "Hard",
    feedback: "Frontend skills are solid, backend needs improvement",
    strengths: ["UI implementation", "Responsive design"],
    improvements: ["Backend optimization", "AWS services"],
    duration: "60 min",
    interviewer: "Emily Watson"
  },
  {
    id: 4,
    role: "Data Scientist",
    company: "Meta",
    date: "2024-02-28",
    score: 91,
    status: "Completed",
    type: "Technical",
    difficulty: "Hard",
    feedback: "Excellent statistical knowledge and ML concepts",
    strengths: ["Machine Learning", "Python", "Statistics"],
    improvements: ["System design", "Production deployment"],
    duration: "55 min",
    interviewer: "David Kim"
  },
  {
    id: 5,
    role: "DevOps Engineer",
    company: "Netflix",
    date: "2024-02-20",
    score: 76,
    status: "Completed",
    type: "Technical",
    difficulty: "Medium",
    feedback: "Good CI/CD knowledge, needs more cloud experience",
    strengths: ["Docker", "Kubernetes", "CI/CD pipelines"],
    improvements: ["AWS services", "Infrastructure as code"],
    duration: "50 min",
    interviewer: "Lisa Thompson"
  },
  {
    id: 6,
    role: "Product Manager",
    company: "Apple",
    date: "2024-02-15",
    score: 82,
    status: "Completed",
    type: "Behavioral",
    difficulty: "Medium",
    feedback: "Strong product sense and leadership skills",
    strengths: ["Product strategy", "User research", "Team leadership"],
    improvements: ["Technical depth", "Data analysis"],
    duration: "45 min",
    interviewer: "James Wilson"
  },
  {
    id: 7,
    role: "Frontend Developer",
    company: "Twitter",
    date: "2024-02-10",
    score: 64,
    status: "Completed",
    type: "Technical",
    difficulty: "Medium",
    feedback: "Good HTML/CSS, needs more JavaScript practice",
    strengths: ["UI/UX implementation", "CSS animations"],
    improvements: ["JavaScript concepts", "Performance optimization"],
    duration: "40 min",
    interviewer: "Alex Morgan"
  },
  {
    id: 8,
    role: "Backend Developer",
    company: "Uber",
    date: "2024-02-05",
    score: 88,
    status: "Completed",
    type: "System Design",
    difficulty: "Hard",
    feedback: "Excellent system design and scalability knowledge",
    strengths: ["Distributed systems", "Database optimization"],
    improvements: ["Microservices", "Message queues"],
    duration: "55 min",
    interviewer: "Rachel Green"
  }
];

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getScoreConfig = (score) => {
  if (score >= 85) return { color: "#48bb78", label: "Excellent" };
  if (score >= 70) return { color: "#f6ad55", label: "Good" };
  if (score >= 60) return { color: "#fbbf24", label: "Average" };
  return { color: "#f56565", label: "Needs Practice" };
};

const getMonthOptions = (interviews) => {
  const months = [...new Set(interviews.map(i => {
    const date = new Date(i.date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();
  
  return months.map(month => ({
    value: month.split('-')[1],
    label: new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })
  }));
};

// Statistics calculation hook
const useInterviewStats = (interviews) => {
  return useMemo(() => {
    if (!interviews.length) {
      return {
        total: 0,
        average: 0,
        best: 0,
        recentCount: 0,
        mostAttemptedRole: 'N/A'
      };
    }

    const total = interviews.length;
    const average = Math.round(interviews.reduce((acc, curr) => acc + curr.score, 0) / total);
    const best = Math.max(...interviews.map(i => i.score));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = interviews.filter(i => new Date(i.date) > thirtyDaysAgo).length;
    
    const roleCounts = interviews.reduce((acc, curr) => {
      acc[curr.role] = (acc[curr.role] || 0) + 1;
      return acc;
    }, {});
    
    const mostAttemptedRole = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total, average, best, recentCount, mostAttemptedRole };
  }, [interviews]);
};

// Sub-components
const Background = () => (
  <div className="history-bg">
    <div className="bg-grid"></div>
    <div className="bg-glow glow-1"></div>
    <div className="bg-glow glow-2"></div>
    <div className="bg-glow glow-3"></div>
  </div>
);

const Header = ({ onExport }) => (
  <div className="history-header">
    <Link to="/dashboard" className="back-link">
      <span className="back-icon">←</span>
      Back to Dashboard
    </Link>
    <h1>Interview History</h1>
    <div className="header-actions">
      <button className="export-btn" onClick={onExport} aria-label="Export history">
        <span>📊</span>
        Export History
      </button>
    </div>
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-details">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  </div>
);

const StatisticsGrid = ({ stats }) => (
  <div className="stats-grid">
    <StatCard icon="🎯" label="Total Interviews" value={stats.total} />
    <StatCard icon="📊" label="Average Score" value={`${stats.average}%`} />
    <StatCard icon="🏆" label="Best Score" value={`${stats.best}%`} />
    <StatCard icon="📅" label="Last 30 Days" value={stats.recentCount} />
  </div>
);

const Filters = ({ filter, onFilterChange, monthOptions }) => (
  <div className="filters-section">
    <div className="filter-group">
      <label htmlFor="typeFilter">Filter by Type:</label>
      <select
        id="typeFilter"
        className="filter-select"
        value={filter.type}
        onChange={(e) => onFilterChange('type', e.target.value)}
        aria-label="Filter interviews by type"
      >
        <option value="all">All Interviews</option>
        <option value="technical">Technical</option>
        <option value="system design">System Design</option>
        <option value="behavioral">Behavioral</option>
        <option value="mixed">Mixed</option>
      </select>
    </div>

    <div className="filter-group">
      <label htmlFor="monthFilter">Filter by Month:</label>
      <select
        id="monthFilter"
        className="filter-select"
        value={filter.month}
        onChange={(e) => onFilterChange('month', e.target.value)}
        aria-label="Filter interviews by month"
      >
        <option value="all">All Months</option>
        {monthOptions.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  </div>
);

const InterviewCard = ({ interview }) => {
  const scoreConfig = getScoreConfig(interview.score);
  
  return (
    <div className="interview-card">
      <div className="interview-header">
        <div className="interview-title">
          <h3>{interview.role}</h3>
          <span className="company-name">{interview.company}</span>
        </div>
        <div 
          className="interview-score" 
          style={{ backgroundColor: scoreConfig.color }}
          aria-label={`Score: ${interview.score}% - ${scoreConfig.label}`}
        >
          <span className="score-value">{interview.score}</span>
          <span className="score-label">{scoreConfig.label}</span>
        </div>
      </div>

      <div className="interview-details">
        <DetailRow icon="📅" text={formatDate(interview.date)} />
        <DetailRow icon="⏱️" text={interview.duration} />
        <DetailRow icon="🎯" text={interview.type} />
        <DetailRow icon="📊" text={`Difficulty: ${interview.difficulty}`} />
        <DetailRow icon="👤" text={`Interviewer: ${interview.interviewer}`} />
      </div>

      <div className="interview-feedback">
        <p className="feedback-text">"{interview.feedback}"</p>
      </div>

      <div className="interview-strengths">
        <h4>✓ Strengths</h4>
        <div className="tags">
          {interview.strengths.map((strength, index) => (
            <span key={index} className="tag strength-tag">{strength}</span>
          ))}
        </div>
      </div>

      <div className="interview-improvements">
        <h4>⚡ Areas for Improvement</h4>
        <div className="tags">
          {interview.improvements.map((improvement, index) => (
            <span key={index} className="tag improvement-tag">{improvement}</span>
          ))}
        </div>
      </div>

      <div className="interview-actions">
        <Link to={`/feedback/${interview.id}`} className="view-details-btn">
          View Full Feedback →
        </Link>
        <Link 
          to={`/planning?role=${encodeURIComponent(interview.role)}`} 
          className="practice-again-btn"
        >
          Practice Again
        </Link>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, text }) => (
  <div className="detail-row">
    <span className="detail-icon">{icon}</span>
    <span className="detail-text">{text}</span>
  </div>
);

const EmptyState = () => (
  <div className="no-interviews">
    <span className="no-data-icon">📭</span>
    <h3>No Interviews Found</h3>
    <p>Try adjusting your filters or start a new interview</p>
    <Link to="/planning" className="start-new-btn">
      Start New Interview
    </Link>
  </div>
);

const PerformanceSummary = ({ interviews, stats }) => {
  const filteredStats = useInterviewStats(interviews);
  
  return (
    <div className="performance-summary">
      <h2>Performance Summary</h2>
      <div className="summary-stats">
        <SummaryItem label="Interviews Completed" value={interviews.length} />
        <SummaryItem label="Average Score" value={`${filteredStats.average}%`} />
        <SummaryItem label="Best Performance" value={`${filteredStats.best}%`} />
        <SummaryItem label="Most Attempted Role" value={filteredStats.mostAttemptedRole} />
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }) => (
  <div className="summary-item">
    <span className="summary-label">{label}</span>
    <span className="summary-value">{value}</span>
  </div>
);

const FooterActions = () => (
  <div className="history-footer">
    <Link to="/dashboard" className="secondary-btn">
      Back to Dashboard
    </Link>
    <Link to="/planning" className="primary-btn">
      Start New Interview
    </Link>
  </div>
);

// Main component
export default function History() {
  const [filters, setFilters] = useState({
    type: "all",
    month: "all"
  });

  const [interviews, setInterviews] = useState(MOCK_INTERVIEW_HISTORY);

  useEffect(() => {
    let active = true;

    API.get("/interview/history")
      .then((res) => {
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        if (active && items.length > 0) {
          setInterviews(items);
        }
      })
      .catch(() => {
        // keep mock fallback when history API is unavailable
      });

    return () => {
      active = false;
    };
  }, []);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      if (filters.type !== "all" && interview.type.toLowerCase() !== filters.type) {
        return false;
      }
      if (filters.month !== "all") {
        const interviewMonth = new Date(interview.date).getMonth() + 1;
        if (interviewMonth.toString() !== filters.month) {
          return false;
        }
      }
      return true;
    });
  }, [interviews, filters.type, filters.month]);

  const stats = useInterviewStats(interviews);
  const monthOptions = useMemo(() => getMonthOptions(interviews), [interviews]);

  const handleExport = useCallback(() => {
    // In production, this would generate a proper export (CSV/PDF)
    window.print();
  }, []);

  return (
    <div className="history-page">
      <Background />
      
      <div className="history-container">
        <Header onExport={handleExport} />

        <PageFeaturePanel pageKey="history" />
        
        <StatisticsGrid stats={stats} />
        
        <Filters 
          filter={filters}
          onFilterChange={handleFilterChange}
          monthOptions={monthOptions}
        />

        <div className="interviews-list" aria-live="polite">
          {filteredInterviews.length > 0 ? (
            filteredInterviews.map(interview => (
              <InterviewCard key={interview.id} interview={interview} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {filteredInterviews.length > 0 && (
          <>
            <PerformanceTrendChart interviews={filteredInterviews} />
            <PerformanceSummary
              interviews={filteredInterviews}
              stats={stats}
            />
          </>
        )}

        <FooterActions />
      </div>
    </div>
  );
}