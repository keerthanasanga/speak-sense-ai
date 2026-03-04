import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DOMAIN_TIPS } from "../data/interviewDatasets";
import "./planning.css";

export default function Planning() {
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Software Domains with detailed information
  const domains = [
    {
      id: 1,
      name: "Frontend Development",
      icon: "🎨",
      color: "#4f9eff",
      description: "React, Vue, Angular, UI/UX",
      roles: [
        "Frontend Developer",
        "UI Developer",
        "React Specialist",
        "Vue.js Developer",
        "Angular Developer"
      ]
    },
    {
      id: 2,
      name: "Backend Development",
      icon: "⚙️",
      color: "#48bb78",
      description: "Node.js, Python, Java, Databases",
      roles: [
        "Backend Developer",
        "API Developer",
        "Database Engineer",
        "Microservices Specialist",
        "System Architect"
      ]
    },
    {
      id: 3,
      name: "Full Stack Development",
      icon: "🚀",
      color: "#f687b3",
      description: "MERN, MEAN, JAMstack",
      roles: [
        "Full Stack Developer",
        "MERN Stack Developer",
        "MEAN Stack Developer",
        "JAMstack Developer",
        "Web Architect"
      ]
    },
    {
      id: 4,
      name: "Mobile Development",
      icon: "📱",
      color: "#9f7aea",
      description: "iOS, Android, React Native, Flutter",
      roles: [
        "iOS Developer",
        "Android Developer",
        "React Native Developer",
        "Flutter Developer",
        "Mobile Architect"
      ]
    },
    {
      id: 5,
      name: "DevOps & Cloud",
      icon: "☁️",
      color: "#f6ad55",
      description: "AWS, Azure, Docker, Kubernetes",
      roles: [
        "DevOps Engineer",
        "Cloud Architect",
        "Site Reliability Engineer",
        "Platform Engineer",
        "Infrastructure Specialist"
      ]
    },
    {
      id: 6,
      name: "Data Science & AI",
      icon: "🤖",
      color: "#fc8181",
      description: "Machine Learning, Python, TensorFlow",
      roles: [
        "Data Scientist",
        "ML Engineer",
        "AI Specialist",
        "Data Analyst",
        "Business Intelligence"
      ]
    },
    {
      id: 7,
      name: "Security Engineering",
      icon: "🔒",
      color: "#4fd1c5",
      description: "Cybersecurity, Ethical Hacking",
      roles: [
        "Security Engineer",
        "Penetration Tester",
        "Security Analyst",
        "Cryptographer",
        "Security Architect"
      ]
    },
    {
      id: 8,
      name: "QA & Testing",
      icon: "🧪",
      color: "#e9d8fd",
      description: "Manual, Automation, Performance",
      roles: [
        "QA Engineer",
        "Test Automation Engineer",
        "Performance Tester",
        "SDET",
        "Quality Analyst"
      ]
    }
  ];

  // Difficulty levels
  const difficulties = [
    { id: 1, name: "Beginner", icon: "🌱", color: "#48bb78", description: "For entry-level positions" },
    { id: 2, name: "Intermediate", icon: "📊", color: "#ecc94b", description: "For experienced professionals" },
    { id: 3, name: "Advanced", icon: "⚡", color: "#f56565", description: "For senior roles" },
    { id: 4, name: "Expert", icon: "🏆", color: "#9f7aea", description: "For architect & lead positions" }
  ];

  // Interview types
  const interviewTypes = [
    { id: 1, name: "Technical", icon: "💻", description: "Coding & problem-solving" },
    { id: 2, name: "System Design", icon: "🏗️", description: "Architecture & scalability" },
    { id: 3, name: "Behavioral", icon: "🗣️", description: "Soft skills & experience" },
    { id: 4, name: "Mixed", icon: "🔄", description: "Complete interview package" }
  ];

  const handleStartInterview = () => {
    if (selectedDomain && selectedRole && selectedDifficulty && selectedType) {
      navigate("/interview", {
        state: {
          domain: selectedDomain,
          role: selectedRole,
          difficulty: selectedDifficulty,
          type: selectedType
        }
      });
    }
  };

  const isFormValid = selectedDomain && selectedRole && selectedDifficulty && selectedType;

  return (
    <div className="planning-page">
      {/* Background Elements */}
      <div className="planning-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      <div className="planning-container">
        {/* Header */}
        <div className="planning-header">
          <Link to="/dashboard" className="back-link">
            <span className="back-icon">←</span>
            Back to Dashboard
          </Link>
          <h1>Interview Configuration</h1>
          <div className="header-progress">
            <span className="progress-step">Configure</span>
            <span className="progress-arrow">→</span>
            <span className="progress-step">Practice</span>
            <span className="progress-arrow">→</span>
            <span className="progress-step">Feedback</span>
          </div>
        </div>

        <div className="planning-content">
          {/* Left Side - Selection Area */}
          <div className="selection-area">
            {/* Domain Selection */}
            <div className="selection-section">
              <h2>
                <span className="section-icon">🎯</span>
                Select Domain
              </h2>
              <div className="domains-grid">
                {domains.map(domain => (
                  <div
                    key={domain.id}
                    className={`domain-card ${selectedDomain?.id === domain.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDomain(domain);
                      setSelectedRole(null);
                      setShowDetails(true);
                    }}
                    style={{ borderColor: selectedDomain?.id === domain.id ? domain.color : 'transparent' }}
                  >
                    <div className="domain-icon" style={{ background: `${domain.color}20` }}>
                      <span style={{ color: domain.color }}>{domain.icon}</span>
                    </div>
                    <h3>{domain.name}</h3>
                    <p>{domain.description}</p>
                    {selectedDomain?.id === domain.id && (
                      <div className="selected-badge" style={{ background: domain.color }}>
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Role Selection - Shows only after domain is selected */}
            {selectedDomain && (
              <div className="selection-section fade-in">
                <h2>
                  <span className="section-icon">👥</span>
                  Select Role
                </h2>
                <div className="roles-grid">
                  {selectedDomain.roles.map((role, index) => (
                    <div
                      key={index}
                      className={`role-card ${selectedRole === role ? 'selected' : ''}`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <span className="role-icon">📌</span>
                      <span className="role-name">{role}</span>
                      {selectedRole === role && (
                        <span className="role-check">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two Column Layout for Difficulty & Type */}
            {selectedDomain && selectedRole && (
              <div className="two-column fade-in">
                {/* Difficulty Selection */}
                <div className="selection-section">
                  <h2>
                    <span className="section-icon">📊</span>
                    Difficulty Level
                  </h2>
                  <div className="difficulty-grid">
                    {difficulties.map(difficulty => (
                      <div
                        key={difficulty.id}
                        className={`difficulty-card ${selectedDifficulty?.id === difficulty.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDifficulty(difficulty)}
                        style={{ borderColor: selectedDifficulty?.id === difficulty.id ? difficulty.color : 'transparent' }}
                      >
                        <div className="difficulty-header">
                          <span className="difficulty-icon">{difficulty.icon}</span>
                          <span className="difficulty-name">{difficulty.name}</span>
                        </div>
                        <p className="difficulty-description">{difficulty.description}</p>
                        {selectedDifficulty?.id === difficulty.id && (
                          <div className="difficulty-progress">
                            <div className="progress-dots">
                              {[...Array(difficulty.id)].map((_, i) => (
                                <span key={i} className="dot" style={{ background: difficulty.color }}></span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Type Selection */}
                <div className="selection-section">
                  <h2>
                    <span className="section-icon">🎙️</span>
                    Interview Type
                  </h2>
                  <div className="type-grid">
                    {interviewTypes.map(type => (
                      <div
                        key={type.id}
                        className={`type-card ${selectedType?.id === type.id ? 'selected' : ''}`}
                        onClick={() => setSelectedType(type)}
                      >
                        <div className="type-icon">{type.icon}</div>
                        <h4>{type.name}</h4>
                        <p>{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Summary & Actions */}
          <div className="summary-area">
            <div className="summary-card">
              <h3>Interview Summary</h3>
              
              {selectedDomain ? (
                <div className="summary-details">
                  <div className="summary-item">
                    <span className="summary-label">Domain:</span>
                    <span className="summary-value">
                      {selectedDomain.icon} {selectedDomain.name}
                    </span>
                  </div>
                  
                  {selectedRole && (
                    <div className="summary-item">
                      <span className="summary-label">Role:</span>
                      <span className="summary-value">📌 {selectedRole}</span>
                    </div>
                  )}
                  
                  {selectedDifficulty && (
                    <div className="summary-item">
                      <span className="summary-label">Difficulty:</span>
                      <span className="summary-value">
                        {selectedDifficulty.icon} {selectedDifficulty.name}
                      </span>
                    </div>
                  )}
                  
                  {selectedType && (
                    <div className="summary-item">
                      <span className="summary-label">Type:</span>
                      <span className="summary-value">
                        {selectedType.icon} {selectedType.name}
                      </span>
                    </div>
                  )}

                  {/* Estimated Stats */}
                  {isFormValid && (
                    <div className="summary-stats">
                      <div className="stat-item">
                        <span className="stat-icon">⏱️</span>
                        <div>
                          <span className="stat-label">Duration</span>
                          <span className="stat-value">30-45 min</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">📝</span>
                        <div>
                          <span className="stat-label">Questions</span>
                          <span className="stat-value">10-12</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">📊</span>
                        <div>
                          <span className="stat-label">Difficulty</span>
                          <span className="stat-value">{selectedDifficulty.name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="summary-placeholder">
                  <p>Select a domain to begin</p>
                  <span className="placeholder-icon">👆</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className={`start-btn ${!isFormValid ? 'disabled' : ''}`}
                  onClick={handleStartInterview}
                  disabled={!isFormValid}
                >
                  {isFormValid ? (
                    <>
                      <span>Start Interview</span>
                      <span className="btn-icon">→</span>
                    </>
                  ) : (
                    <span>Complete all selections</span>
                  )}
                </button>
                
                <Link to="/dashboard" className="cancel-btn">
                  Cancel
                </Link>
              </div>

              {/* ==================== FEATURE 6: Domain Tips Panel ==================== */}
              {selectedDomain && (() => {
                // Map domain name to dataset key
                const tipKey = Object.keys(DOMAIN_TIPS).find(k =>
                  selectedDomain.name.toLowerCase().includes(k.toLowerCase().split(" ")[0])
                ) || Object.keys(DOMAIN_TIPS)[0];
                const tips = DOMAIN_TIPS[tipKey] || DOMAIN_TIPS["Frontend"];
                const shown = tips.slice(0, 5);
                return (
                  <div className="domain-tips-panel">
                    <h4>💡 {tipKey} Interview Tips</h4>
                    <ul className="domain-tips-list">
                      {shown.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                    <p className="domain-tips-more">+{tips.length - 5} more tips during your session</p>
                  </div>
                );
              })()}

              {isFormValid && (
                <div className="preparation-tips">
                  <h4>📋 Before You Start</h4>
                  <ul>
                    <li>Find a quiet place with good lighting</li>
                    <li>Test your microphone and camera</li>
                    <li>Have a glass of water nearby</li>
                    <li>Take deep breaths and stay confident</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}