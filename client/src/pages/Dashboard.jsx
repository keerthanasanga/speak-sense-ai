import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../services/api";
import { getAuthToken, getStoredUser, saveStoredUser } from "../utils/authStorage";
import { DAILY_CHALLENGES, ACHIEVEMENT_DEFINITIONS, SCORE_INSIGHTS } from "../data/interviewDatasets";
import "./dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [greeting, setGreeting] = useState("");
  const [activeTab, setActiveTab] = useState(location.pathname.toLowerCase());

  const [user, setUser] = useState(() => {
    try {
      const stored = getStoredUser();
      return {
        name: stored?.name || "Alex Johnson",
        avatar: "👨‍💻",
        level: stored?.experience || "Intermediate",
        streak: 15,
        interviewsCompleted: 24,
        averageScore: 87,
        notifications: 2,
        industry: stored?.industry || ""
      };
    } catch {
      return {
        name: "Alex Johnson",
        avatar: "👨‍💻",
        level: "Intermediate",
        streak: 15,
        interviewsCompleted: 24,
        averageScore: 87,
        notifications: 2,
        industry: ""
      };
    }
  });

  // Daily tasks
  const dailyTasks = [
    { id: 1, task: "Complete 1 mock interview", progress: 0, total: 1, icon: "🎯" },
    { id: 2, task: "Review feedback from yesterday", progress: 0, total: 1, icon: "📊" },
    { id: 3, task: "Practice behavioral questions", progress: 3, total: 5, icon: "💬" },
    { id: 4, task: "Learn new industry terms", progress: 2, total: 10, icon: "📚" }
  ];

  // AI Avatars
  const aiAvatars = [
    { id: 1, name: "Nova", role: "Technical Mentor", avatar: "🧠", status: "online", color: "#4f9eff" },
    { id: 2, name: "Atlas", role: "Career Coach", avatar: "🌟", status: "busy", color: "#9f7aea" },
    { id: 3, name: "Echo", role: "Industry Expert", avatar: "💼", status: "available", color: "#48bb78" },
    { id: 4, name: "Sage", role: "Feedback Analyst", avatar: "📊", status: "online", color: "#f687b3" }
  ];

  // Upcoming interviews
  const upcomingInterviews = [
    { company: "Google", position: "Software Engineer", date: "Tomorrow, 10:00 AM", color: "#4285f4" },
    { company: "Microsoft", position: "Product Manager", date: "Mar 15, 2:00 PM", color: "#00a4ef" },
    { company: "Amazon", position: "Data Scientist", date: "Mar 18, 11:00 AM", color: "#ff9900" }
  ];

  // Recent feedback
  const recentFeedback = [
    { id: 1, type: "Technical Interview", score: 85, feedback: "Good problem-solving, needs more optimization", date: "2 hours ago" },
    { id: 2, type: "Behavioral Interview", score: 92, feedback: "Excellent STAR method responses", date: "Yesterday" },
    { id: 3, type: "System Design", score: 78, feedback: "Work on scalability concepts", date: "3 days ago" }
  ];

  // Recommended courses
  const recommendedCourses = [
    { id: 1, title: "Advanced Algorithms", progress: 45, instructor: "Nova", duration: "6 hours", icon: "🧮" },
    { id: 2, title: "System Design Masterclass", progress: 20, instructor: "Atlas", duration: "8 hours", icon: "🏗️" },
    { id: 3, title: "Behavioral Interview Prep", progress: 60, instructor: "Echo", duration: "4 hours", icon: "🗣️" }
  ];

  // Daily challenge — pick based on day of year
  const todayChallenge = DAILY_CHALLENGES[new Date().getDate() % DAILY_CHALLENGES.length];

  // Achievements computed from user stats
  const userStats = {
    totalInterviews: user.interviewsCompleted,
    streak: user.streak,
    bestScore: user.averageScore + 5, // approximation
    avgScore: user.averageScore,
    resumeAnalyzed: false,
    viewedAllTabs: false,
    codeSessionsDone: 1,
  };
  const earnedAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.condition(userStats));
  const totalXP = earnedAchievements.reduce((sum, a) => sum + a.xp, 0);

  // Score insight
  const insight = Object.values(SCORE_INSIGHTS).find(i => user.averageScore >= i.min) || SCORE_INSIGHTS.needsWork;

  // Daily challenge timer state
  const [challengeExpanded, setChallengeExpanded] = useState(false);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    API.get("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          saveStoredUser(res.data.user);
          setUser((prev) => ({
            ...prev,
            name: res.data.user.name || prev.name,
            level: res.data.user.experience || prev.level,
            industry: res.data.user.industry || ""
          }));
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setActiveTab(location.pathname.toLowerCase());
  }, [location.pathname]);





  return (
    <div className="dashboard-container">
      {/* Neural Network Background */}
      <div className="dashboard-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
        <div className="bg-glow glow-3"></div>
      </div>

      {/* Main Content */}

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>{greeting}, {user.name}! 👋</h1>
            <p>Ready to ace your next interview? Here's your progress overview.</p>
          </div>
          <div className="quick-actions">
            <button className="action-btn primary" onClick={() => navigate("/planning")}>
              <span>🎯</span>
              New Interview
            </button>
            <button className="action-btn secondary" onClick={() => navigate("/practice")}>
              <span>⚡</span>
              Quick Practice
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-details">
              <span className="stat-label">Interviews Completed</span>
              <span className="stat-value-large">{user.interviewsCompleted}</span>
              <span className="stat-trend positive">+12% this week</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-details">
              <span className="stat-label">Average Score</span>
              <span className="stat-value-large">{user.averageScore}%</span>
              <span className="stat-trend positive">+5% improvement</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-details">
              <span className="stat-label">Current Streak</span>
              <span className="stat-value-large">{user.streak} days</span>
              <span className="stat-trend">Keep it up!</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-details">
              <span className="stat-label">Achievements</span>
              <span className="stat-value-large">12</span>
              <span className="stat-trend">3 new this month</span>
            </div>
          </div>
        </div>

        {/* ==================== FEATURE 1: Daily Challenge ==================== */}
        <div className="daily-challenge-card">
          <div className="dc-header">
            <div className="dc-badge">🎯 Daily Challenge</div>
            <div className="dc-meta">
              <span className={`dc-difficulty dc-${todayChallenge.difficulty}`}>{todayChallenge.difficulty}</span>
              <span className="dc-type">{todayChallenge.type}</span>
              <span className="dc-time">⏱ {todayChallenge.timeLimit}s</span>
            </div>
          </div>
          <p className="dc-question">{todayChallenge.question}</p>
          {challengeExpanded && (
            <div className="dc-tips">
              <div className="dc-tips-label">💡 Tips for this answer:</div>
              <ul>
                {todayChallenge.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
          <div className="dc-actions">
            <button className="dc-hint-btn" onClick={() => setChallengeExpanded(!challengeExpanded)}>
              {challengeExpanded ? "Hide Tips" : "Show Tips"}
            </button>
            <button className="dc-start-btn" onClick={() => navigate("/planning")}>
              Practice Now →
            </button>
          </div>
        </div>

        {/* ==================== FEATURE 2: Score Insight Banner ==================== */}
        <div className="insight-banner" style={{ borderColor: insight.color + "55", background: insight.color + "11" }}>
          <span className="insight-dot" style={{ background: insight.color }}></span>
          <div>
            <strong style={{ color: insight.color }}>Performance: {insight.label}</strong>
            <p>{insight.advice}</p>
          </div>
          <Link to="/results" className="insight-link">View Details →</Link>
        </div>

        {/* AI Avatars Section */}
        <div className="ai-avatars-section">
          <h2>Your AI Mentors</h2>
          <div className="avatars-grid">
            {aiAvatars.map(avatar => (
              <div key={avatar.id} className="avatar-card">
                <div className="avatar-status" style={{ backgroundColor: avatar.color }}>
                  <span className="status-dot"></span>
                </div>
                <div className="avatar-icon-large" style={{ background: `${avatar.color}20` }}>
                  {avatar.avatar}
                </div>
                <h3>{avatar.name}</h3>
                <p>{avatar.role}</p>
                <span className="avatar-status-text" style={{ color: avatar.color }}>
                  ● {avatar.status}
                </span>
                <button className="avatar-chat-btn">Chat Now</button>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="grid-left">
            {/* Daily Tasks */}
            <div className="tasks-section">
              <h2>Today's Tasks</h2>
              <div className="tasks-list">
                {dailyTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <span className="task-icon">{task.icon}</span>
                    <div className="task-content">
                      <span className="task-name">{task.task}</span>
                      <div className="task-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${(task.progress / task.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{task.progress}/{task.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="feedback-section">
              <h2>Recent Feedback</h2>
              <div className="feedback-list">
                {recentFeedback.map(feedback => (
                  <div key={feedback.id} className="feedback-item">
                    <div className="feedback-header">
                      <span className="feedback-type">{feedback.type}</span>
                      <span className="feedback-score" style={{
                        color: feedback.score >= 85 ? '#48bb78' : feedback.score >= 70 ? '#ecc94b' : '#f56565'
                      }}>{feedback.score}%</span>
                    </div>
                    <p className="feedback-comment">{feedback.feedback}</p>
                    <span className="feedback-time">{feedback.date}</span>
                  </div>
                ))}
              </div>
              <Link to="/feedback" className="view-all-link">View All Feedback →</Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="grid-right">
            {/* Upcoming Interviews */}
            <div className="upcoming-section">
              <h2>Upcoming Interviews</h2>
              <div className="upcoming-list">
                {upcomingInterviews.map((interview, index) => (
                  <div key={index} className="upcoming-item">
                    <div className="company-color" style={{ backgroundColor: interview.color }}></div>
                    <div className="interview-details">
                      <h3>{interview.company}</h3>
                      <p>{interview.position}</p>
                      <span className="interview-date">{interview.date}</span>
                    </div>
                    <button className="prepare-btn">Prepare</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Courses */}
            <div className="courses-section">
              <h2>Recommended Courses</h2>
              <div className="courses-list">
                {recommendedCourses.map(course => (
                  <div key={course.id} className="course-item">
                    <span className="course-icon">{course.icon}</span>
                    <div className="course-details">
                      <h3>{course.title}</h3>
                      <p>By {course.instructor} • {course.duration}</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <span className="progress-text">{course.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/courses" className="view-all-link">Browse All Courses →</Link>
            </div>

            {/* ==================== FEATURE 3: Achievements Panel ==================== */}
            <div className="achievements-section">
              <div className="ach-header">
                <h2>Achievements</h2>
                <span className="xp-badge">⚡ {totalXP} XP</span>
              </div>
              <div className="ach-grid">
                {ACHIEVEMENT_DEFINITIONS.map(ach => {
                  const earned = ach.condition(userStats);
                  return (
                    <div key={ach.id} className={`ach-item ${earned ? "earned" : "locked"}`} title={ach.desc}>
                      <span className="ach-icon">{ach.icon}</span>
                      <span className="ach-title">{ach.title}</span>
                      {earned && <span className="ach-xp">+{ach.xp} XP</span>}
                    </div>
                  );
                })}
              </div>
              <div className="ach-progress-row">
                <span>{earnedAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length} unlocked</span>
                <div className="ach-progress-bar">
                  <div className="ach-progress-fill" style={{ width: `${(earnedAchievements.length / ACHIEVEMENT_DEFINITIONS.length) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="tips-section">
              <h2>Quick Tips</h2>
              <div className="tips-list">
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  <p>Use the STAR method for behavioral questions</p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🎯</span>
                  <p>Practice 15 minutes daily to build confidence</p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📝</span>
                  <p>Review feedback after each interview session</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}