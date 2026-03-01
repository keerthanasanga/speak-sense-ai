import React, { useState, useEffect } from 'react';
import './resume.css';

const Resume = () => {
  // State management
  const [jobRole, setJobRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Dummy data constants
  const dummyData = {
    sampleResumes: {
      frontend: {
        text: "Experienced Frontend Developer with 5 years of expertise in React, Vue.js, and Angular. Proficient in HTML5, CSS3, JavaScript (ES6+), and responsive design. Strong experience with state management (Redux, Vuex), Webpack, and modern frontend tooling. Implemented 10+ single-page applications with 95%+ Lighthouse scores. Skilled in UI/UX principles and cross-browser compatibility.",
        keywords: ["react", "vue", "angular", "javascript", "html5", "css3", "redux", "webpack", "responsive", "frontend"]
      },
      backend: {
        text: "Backend Developer specializing in Node.js, Python, and Java. Designed and implemented RESTful APIs for 15+ microservices. Experience with PostgreSQL, MongoDB, and Redis. Implemented authentication systems and optimized database queries resulting in 40% performance improvement. Knowledge of Docker, Kubernetes, and cloud platforms (AWS, GCP).",
        keywords: ["node.js", "python", "java", "api", "microservices", "postgresql", "mongodb", "redis", "docker", "aws"]
      },
      fullstack: {
        text: "Full Stack Developer with expertise in MERN stack (MongoDB, Express.js, React, Node.js). Built 8+ full-stack applications from scratch. Experience with TypeScript, Next.js, and GraphQL. Implemented real-time features using Socket.io. Strong understanding of RESTful architecture, database design, and cloud deployment.",
        keywords: ["mern", "mongodb", "express", "react", "node.js", "typescript", "graphql", "rest api", "fullstack", "database"]
      },
      "data-scientist": {
        text: "Data Scientist with Master's degree in Computer Science. Proficient in Python, R, and SQL. Experience with machine learning frameworks (TensorFlow, PyTorch, scikit-learn). Developed predictive models achieving 92% accuracy. Expertise in data visualization, statistical analysis, and big data technologies (Spark, Hadoop).",
        keywords: ["python", "machine learning", "tensorflow", "pytorch", "sql", "data analysis", "statistics", "visualization", "spark", "ai"]
      },
      devops: {
        text: "DevOps Engineer with 4 years of experience in CI/CD pipelines, infrastructure automation, and cloud computing. Expertise in Jenkins, GitLab CI, Terraform, and Ansible. Managed Kubernetes clusters and implemented monitoring solutions with Prometheus and Grafana. AWS Certified Solutions Architect.",
        keywords: ["devops", "ci/cd", "jenkins", "kubernetes", "docker", "terraform", "ansible", "aws", "monitoring", "automation"]
      },
      "product-manager": {
        text: "Product Manager with MBA and 6 years of experience in SaaS products. Led cross-functional teams to deliver 5 major product launches. Expertise in market research, user stories, and product roadmap planning. Proficient in Agile methodologies, Jira, and product analytics tools. Increased user engagement by 60% through feature optimization.",
        keywords: ["product management", "agile", "roadmap", "user stories", "market research", "analytics", "saas", "leadership", "strategy", "jira"]
      }
    },

    weightageCriteria: {
      frontend: { technical: 40, experience: 25, projects: 20, education: 15 },
      backend: { technical: 45, experience: 25, projects: 15, education: 15 },
      fullstack: { technical: 40, experience: 30, projects: 20, education: 10 },
      "data-scientist": { technical: 50, experience: 20, projects: 20, education: 10 },
      devops: { technical: 45, experience: 25, projects: 20, education: 10 },
      "product-manager": { technical: 25, experience: 40, projects: 20, education: 15 }
    }
  };

  // Job roles array for select dropdown
  const jobRoles = [
    { value: 'frontend', label: 'Frontend Developer' },
    { value: 'backend', label: 'Backend Developer' },
    { value: 'fullstack', label: 'Full Stack Developer' },
    { value: 'data-scientist', label: 'Data Scientist' },
    { value: 'devops', label: 'DevOps Engineer' },
    { value: 'product-manager', label: 'Product Manager' }
  ];

  // Load sample data when role changes
  useEffect(() => {
    if (jobRole && dummyData.sampleResumes[jobRole]) {
      setResumeText(dummyData.sampleResumes[jobRole].text);
    }
  }, [jobRole]);

  // file upload state
  const [fileName, setFileName] = useState('');

  // handle file selection (only plain text supported client-side)
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    // Accept plain text files client-side. For other types, instruct user to paste or use server upload.
    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        setResumeText(String(reader.result));
      };
      reader.onerror = () => setError('Failed to read file.');
      reader.readAsText(file);
    } else {
      setError('Only .txt files are supported for client-side analysis. Paste text or convert your resume to .txt.');
      setResumeText('');
    }
  };

  // Calculate technical score
  const calculateTechnicalScore = (text, role) => {
    const technicalTerms = {
      frontend: ["react", "vue", "angular", "javascript", "html", "css", "redux", "webpack", "typescript", "ui/ux"],
      backend: ["node.js", "python", "java", "api", "database", "sql", "nosql", "microservices", "docker", "cloud"],
      fullstack: ["frontend", "backend", "database", "api", "react", "node.js", "mongodb", "express", "fullstack"],
      "data-scientist": ["python", "machine learning", "ai", "tensorflow", "pytorch", "data", "analytics", "statistics"],
      devops: ["devops", "ci/cd", "docker", "kubernetes", "cloud", "aws", "automation", "infrastructure"],
      "product-manager": ["product", "agile", "scrum", "roadmap", "strategy", "market", "user", "analytics"]
    };
    
    const terms = technicalTerms[role] || technicalTerms.frontend;
    const matches = terms.filter(term => text.toLowerCase().includes(term.toLowerCase()));
    return (matches.length / terms.length) * 100;
  };

  // Calculate experience score
  const calculateExperienceScore = (text) => {
    const experienceIndicators = [
      "experience", "years", "worked", "developed", "implemented",
      "designed", "created", "built", "managed", "led"
    ];
    
    const yearMatches = text.match(/\d+\+?\s*(?:years?|yrs?)/gi) || [];
    const experienceYears = yearMatches.reduce((sum, match) => {
      const years = parseInt(match.match(/\d+/)[0]);
      return sum + years;
    }, 0);
    
    const indicatorMatches = experienceIndicators.filter(ind => 
      text.toLowerCase().includes(ind.toLowerCase())
    ).length;
    
    const baseScore = Math.min(experienceYears * 10, 70);
    const indicatorBonus = (indicatorMatches / experienceIndicators.length) * 30;
    
    return Math.min(baseScore + indicatorBonus, 100);
  };

  // Calculate projects score
  const calculateProjectsScore = (text) => {
    const projectIndicators = [
      "project", "built", "created", "developed", "launched",
      "application", "app", "website", "system", "platform"
    ];
    
    const numberMatches = text.match(/\d+\+?\s*(?:projects?|applications?|apps?)/gi) || [];
    const projectCount = numberMatches.reduce((sum, match) => {
      const count = parseInt(match.match(/\d+/)[0]);
      return sum + count;
    }, 0);
    
    const indicatorMatches = projectIndicators.filter(ind => 
      text.toLowerCase().includes(ind.toLowerCase())
    ).length;
    
    const countScore = Math.min(projectCount * 10, 60);
    const indicatorBonus = (indicatorMatches / projectIndicators.length) * 40;
    
    return Math.min(countScore + indicatorBonus, 100);
  };

  // Calculate education score
  const calculateEducationScore = (text) => {
    const educationKeywords = [
      "bachelor", "master", "phd", "degree", "university",
      "college", "computer science", "engineering", "mba", "certification"
    ];
    
    const degreeMatches = educationKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    return Math.min((degreeMatches / educationKeywords.length) * 100, 100);
  };

  // Main calculation function
  const calculateResumeWeightage = (text, role) => {
    const roleKey = role.toLowerCase();
    const sampleData = dummyData.sampleResumes[roleKey] || dummyData.sampleResumes.frontend;
    const weightage = dummyData.weightageCriteria[roleKey] || dummyData.weightageCriteria.frontend;
    
    const textToAnalyze = text || sampleData.text;
    const keywords = sampleData.keywords;
    
    const matchedKeywords = keywords.filter(keyword => 
      textToAnalyze.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const keywordMatchCount = matchedKeywords.length;
    const totalKeywords = keywords.length;
    const keywordScore = (keywordMatchCount / totalKeywords) * 100;
    
    const technicalScore = calculateTechnicalScore(textToAnalyze, roleKey);
    const experienceScore = calculateExperienceScore(textToAnalyze);
    const projectsScore = calculateProjectsScore(textToAnalyze);
    const educationScore = calculateEducationScore(textToAnalyze);
    
    const totalScore = (
      (technicalScore * weightage.technical / 100) +
      (experienceScore * weightage.experience / 100) +
      (projectsScore * weightage.projects / 100) +
      (educationScore * weightage.education / 100)
    );
    
    return {
      totalScore: Math.round(totalScore),
      keywordMatchCount,
      totalKeywords,
      keywordScore: Math.round(keywordScore),
      matchedKeywords,
      missingKeywords: keywords.filter(k => !matchedKeywords.includes(k)),
      categoryScores: {
        technical: Math.round(technicalScore),
        experience: Math.round(experienceScore),
        projects: Math.round(projectsScore),
        education: Math.round(educationScore)
      },
      weightage,
      role: roleKey.charAt(0).toUpperCase() + roleKey.slice(1).replace('-', ' ')
    };
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  // Get score message
  const getScoreMessage = (score) => {
    if (score >= 80) return "🚀 Excellent! You're a top candidate!";
    if (score >= 60) return "👍 Good profile with room for improvement";
    if (score >= 40) return "⚠️ Average - consider enhancing your resume";
    return "❌ Needs significant improvement";
  };

  // Handle form submission
  const handleAnalyze = () => {
    if (!jobRole) {
      setError('Please select a job role');
      return;
    }

    setLoading(true);
    setError('');
    setShowResult(false);

    // Simulate API call
    setTimeout(() => {
      try {
        const analysis = calculateResumeWeightage(resumeText, jobRole);
        setAnalysisResult(analysis);
        setShowResult(true);
      } catch (err) {
        setError('An error occurred during analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="resume-page">
      <div className="resume-header">
        <h1>📄 AI Resume <span>Analyzer</span></h1>
        <p>Get instant insights about your resume with professional weightage scores</p>
      </div>

      <div className="resume-card">
        <div className="form-group">
          <label>🎯 Select Job Role</label>
          <select 
            value={jobRole} 
            onChange={(e) => setJobRole(e.target.value)}
            disabled={loading}
          >
            <option value="">Choose a role...</option>
            {jobRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>📁 Upload Resume File (.txt)</label>
          <div className="file-input-wrapper">
            <input
              className="file-input"
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              disabled={loading}
            />
            <div className="file-name">{fileName || 'No file selected'}</div>
          </div>
          <div className="helper-text">Tip: Upload a plain .txt resume for instant analysis. You can also paste text by choosing a role and pasting into this area.</div>
        </div>

        <button 
          className={`analyze-btn ${loading ? 'loading' : ''}`}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : '🔍 Analyze Resume'}
        </button>
        
        {error && <div className="error">{error}</div>}
      </div>

      {showResult && analysisResult && (
        <div className="result-card">
          <h2>📊 Resume Analysis Report</h2>
          <div className="analysis-content">
            <AnalysisReport 
              analysis={analysisResult} 
              getScoreColor={getScoreColor}
              getScoreMessage={getScoreMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Analysis Report Component
const AnalysisReport = ({ analysis, getScoreColor, getScoreMessage }) => {
  return (
    <div className="analysis-report">
      {/* Overall Score */}
      <div className="overall-score">
        <div className="score-label">Overall Resume Weightage</div>
        <div className="score-value">{analysis.totalScore}%</div>
        <div className="score-message">{getScoreMessage(analysis.totalScore)}</div>
      </div>

      {/* Category Scores */}
      <div className="category-scores">
        {Object.entries(analysis.categoryScores).map(([category, score]) => (
          <div key={category} className="category-item">
            <div className="category-header">
              <span className="category-name">{category}</span>
              <span className="category-score" style={{ color: getScoreColor(score) }}>
                {score}%
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score)
                }}
              />
            </div>
            <div className="category-weightage">
              Weightage: {analysis.weightage[category]}%
            </div>
          </div>
        ))}
      </div>

      {/* Keyword Analysis */}
      <div className="keyword-analysis">
        <h3>🔑 Keyword Analysis</h3>
        <div className="keyword-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${analysis.keywordScore}%`,
                backgroundColor: getScoreColor(analysis.keywordScore)
              }}
            />
          </div>
          <span className="keyword-count" style={{ color: getScoreColor(analysis.keywordScore) }}>
            {analysis.keywordMatchCount}/{analysis.totalKeywords} keywords
          </span>
        </div>

        <div className="keyword-lists">
          <div className="matched-keywords">
            <p className="keyword-title success">✅ Matched Keywords</p>
            <div className="keyword-tags">
              {analysis.matchedKeywords.map(keyword => (
                <span key={keyword} className="tag success-tag">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="missing-keywords">
            <p className="keyword-title error">❌ Missing Keywords</p>
            <div className="keyword-tags">
              {analysis.missingKeywords.map(keyword => (
                <span key={keyword} className="tag error-tag">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations">
        <h3>💡 Recommendations</h3>
        <ul>
          {analysis.missingKeywords.slice(0, 5).map(keyword => (
            <li key={keyword}>
              <span className="bullet">•</span>
              <span>Add experience with <strong>{keyword}</strong> to improve your {analysis.role} profile</span>
            </li>
          ))}
          {analysis.categoryScores.experience < 70 && (
            <li>
              <span className="bullet">•</span>
              <span>Quantify your experience with specific numbers and achievements</span>
            </li>
          )}
          {analysis.categoryScores.projects < 70 && (
            <li>
              <span className="bullet">•</span>
              <span>Highlight more projects and include links to your portfolio/GitHub</span>
            </li>
          )}
        </ul>
      </div>

      {/* Role Info */}
      <div className="role-info">
        <p>📌 Role: {analysis.role} Developer</p>
        <p>📊 Percentile: {
          analysis.totalScore >= 80 ? 'Top 10% candidates' :
          analysis.totalScore >= 60 ? 'Above average' :
          analysis.totalScore >= 40 ? 'Average' : 'Needs improvement'
        }</p>
      </div>
    </div>
  );
};

export default Resume;