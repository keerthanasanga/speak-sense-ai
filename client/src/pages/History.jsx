import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import "./history.css";

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

  // In production, this would be fetched from an API
  const [interviews] = useState(MOCK_INTERVIEW_HISTORY);

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
          <PerformanceSummary 
            interviews={filteredInterviews} 
            stats={stats}
          />
        )}

        <FooterActions />
      </div>
    </div>
  );
}