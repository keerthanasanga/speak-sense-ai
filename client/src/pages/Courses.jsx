import { useState } from "react";
import { Link } from "react-router-dom";
import PageFeaturePanel from "../components/PageFeaturePanel";
import "./course.css";

export default function Courses() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([1, 3, 5]); // Mock enrolled courses

  // Course categories
  const categories = [
    { id: "all", name: "All Courses", icon: "📚" },
    { id: "frontend", name: "Frontend", icon: "🎨" },
    { id: "backend", name: "Backend", icon: "⚙️" },
    { id: "fullstack", name: "Full Stack", icon: "🚀" },
    { id: "mobile", name: "Mobile", icon: "📱" },
    { id: "devops", name: "DevOps", icon: "☁️" },
    { id: "datascience", name: "Data Science", icon: "📊" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "ai", name: "AI & ML", icon: "🤖" }
  ];

  // Course levels
  const levels = [
    { id: "all", name: "All Levels" },
    { id: "beginner", name: "Beginner" },
    { id: "intermediate", name: "Intermediate" },
    { id: "advanced", name: "Advanced" }
  ];

  // Courses data
  const courses = [
    // Frontend Courses
    {
      id: 1,
      title: "Complete React Developer Course",
      description: "Master React.js from basics to advanced concepts including Hooks, Context, Redux, and Next.js",
      category: "frontend",
      level: "intermediate",
      duration: "32 hours",
      lessons: 48,
      students: 15420,
      rating: 4.8,
      instructor: "Sarah Johnson",
      instructorRole: "Senior Frontend Engineer at Google",
      instructorAvatar: "👩‍💻",
      price: "$89.99",
      enrolled: true,
      progress: 65,
      tags: ["React", "JavaScript", "Next.js", "Redux"],
      image: "🎨",
      color: "#4f9eff",
      curriculum: [
        { section: "React Fundamentals", lessons: 8, duration: "4 hours" },
        { section: "Hooks Deep Dive", lessons: 10, duration: "6 hours" },
        { section: "State Management with Redux", lessons: 12, duration: "8 hours" },
        { section: "Next.js Framework", lessons: 10, duration: "8 hours" },
        { section: "Building Real Projects", lessons: 8, duration: "6 hours" }
      ]
    },
    {
      id: 2,
      title: "Vue.js - The Complete Guide",
      description: "Learn Vue.js from scratch including Vuex, Vue Router, Composition API, and building real-world applications",
      category: "frontend",
      level: "beginner",
      duration: "28 hours",
      lessons: 42,
      students: 12350,
      rating: 4.7,
      instructor: "Michael Chen",
      instructorRole: "Frontend Architect at Meta",
      instructorAvatar: "👨‍💻",
      price: "$79.99",
      enrolled: false,
      progress: 0,
      tags: ["Vue.js", "JavaScript", "Vuex", "Vue Router"],
      image: "🖼️",
      color: "#48bb78"
    },
    {
      id: 3,
      title: "Angular - The Complete Guide",
      description: "Master Angular 17+ with TypeScript, RxJS, NgRx, and build enterprise-level applications",
      category: "frontend",
      level: "intermediate",
      duration: "35 hours",
      lessons: 52,
      students: 9870,
      rating: 4.6,
      instructor: "David Kim",
      instructorRole: "Senior Engineer at Microsoft",
      instructorAvatar: "👨‍🏫",
      price: "$94.99",
      enrolled: true,
      progress: 30,
      tags: ["Angular", "TypeScript", "RxJS", "NgRx"],
      image: "🅰️",
      color: "#f56565"
    },

    // Backend Courses
    {
      id: 4,
      title: "Node.js Masterclass",
      description: "Build scalable backend applications with Node.js, Express, MongoDB, and microservices",
      category: "backend",
      level: "intermediate",
      duration: "30 hours",
      lessons: 45,
      students: 18760,
      rating: 4.9,
      instructor: "Alex Rodriguez",
      instructorRole: "Backend Lead at Netflix",
      instructorAvatar: "👨‍🔧",
      price: "$84.99",
      enrolled: false,
      progress: 0,
      tags: ["Node.js", "Express", "MongoDB", "Microservices"],
      image: "🚂",
      color: "#9f7aea"
    },
    {
      id: 5,
      title: "Python Backend Development",
      description: "Master Python backend development with Django, Flask, FastAPI, and PostgreSQL",
      category: "backend",
      level: "beginner",
      duration: "26 hours",
      lessons: 38,
      students: 21340,
      rating: 4.8,
      instructor: "Lisa Thompson",
      instructorRole: "Senior Developer at Instagram",
      instructorAvatar: "👩‍🔬",
      price: "$74.99",
      enrolled: true,
      progress: 85,
      tags: ["Python", "Django", "Flask", "FastAPI"],
      image: "🐍",
      color: "#f687b3"
    },
    {
      id: 6,
      title: "Java Spring Boot Mastery",
      description: "Build enterprise applications with Spring Boot, Spring Security, JPA, and microservices",
      category: "backend",
      level: "advanced",
      duration: "40 hours",
      lessons: 58,
      students: 8760,
      rating: 4.7,
      instructor: "James Wilson",
      instructorRole: "Architect at Amazon",
      instructorAvatar: "👨‍🎓",
      price: "$109.99",
      enrolled: false,
      progress: 0,
      tags: ["Java", "Spring Boot", "Microservices", "JPA"],
      image: "☕",
      color: "#f6ad55"
    },

    // Full Stack Courses
    {
      id: 7,
      title: "MERN Stack Development",
      description: "Build complete web applications with MongoDB, Express, React, and Node.js",
      category: "fullstack",
      level: "intermediate",
      duration: "38 hours",
      lessons: 55,
      students: 25430,
      rating: 4.9,
      instructor: "Sarah Johnson",
      instructorRole: "Full Stack Lead at Google",
      instructorAvatar: "👩‍💻",
      price: "$99.99",
      enrolled: false,
      progress: 0,
      tags: ["MongoDB", "Express", "React", "Node.js"],
      image: "⚛️",
      color: "#4f9eff"
    },
    {
      id: 8,
      title: "MEAN Stack Development",
      description: "Master full stack development with MongoDB, Express, Angular, and Node.js",
      category: "fullstack",
      level: "intermediate",
      duration: "36 hours",
      lessons: 50,
      students: 12450,
      rating: 4.7,
      instructor: "David Kim",
      instructorRole: "Tech Lead at Microsoft",
      instructorAvatar: "👨‍💻",
      price: "$94.99",
      enrolled: true,
      progress: 45,
      tags: ["MongoDB", "Express", "Angular", "Node.js"],
      image: "🅰️",
      color: "#f56565"
    },

    // Mobile Development
    {
      id: 9,
      title: "React Native - Build Mobile Apps",
      description: "Create cross-platform mobile apps for iOS and Android with React Native",
      category: "mobile",
      level: "intermediate",
      duration: "32 hours",
      lessons: 46,
      students: 16540,
      rating: 4.8,
      instructor: "Emily Watson",
      instructorRole: "Mobile Lead at Uber",
      instructorAvatar: "👩‍💻",
      price: "$89.99",
      enrolled: false,
      progress: 0,
      tags: ["React Native", "iOS", "Android", "Expo"],
      image: "📱",
      color: "#48bb78"
    },
    {
      id: 10,
      title: "Flutter Development",
      description: "Build beautiful native apps for iOS and Android with Flutter and Dart",
      category: "mobile",
      level: "beginner",
      duration: "28 hours",
      lessons: 42,
      students: 18970,
      rating: 4.8,
      instructor: "Rachel Green",
      instructorRole: "Mobile Developer at Google",
      instructorAvatar: "👩‍🎨",
      price: "$79.99",
      enrolled: true,
      progress: 20,
      tags: ["Flutter", "Dart", "iOS", "Android"],
      image: "🦋",
      color: "#f687b3"
    },

    // DevOps Courses
    {
      id: 11,
      title: "Docker & Kubernetes Mastery",
      description: "Master containerization and orchestration with Docker and Kubernetes",
      category: "devops",
      level: "intermediate",
      duration: "34 hours",
      lessons: 48,
      students: 21340,
      rating: 4.9,
      instructor: "Michael Chen",
      instructorRole: "DevOps Engineer at Netflix",
      instructorAvatar: "👨‍🔧",
      price: "$94.99",
      enrolled: false,
      progress: 0,
      tags: ["Docker", "Kubernetes", "DevOps", "Containers"],
      image: "🐳",
      color: "#9f7aea"
    },
    {
      id: 12,
      title: "AWS Certified Solutions Architect",
      description: "Complete AWS certification preparation with hands-on projects",
      category: "devops",
      level: "advanced",
      duration: "42 hours",
      lessons: 62,
      students: 32450,
      rating: 4.9,
      instructor: "Alex Rodriguez",
      instructorRole: "Cloud Architect at Amazon",
      instructorAvatar: "👨‍🏫",
      price: "$129.99",
      enrolled: true,
      progress: 15,
      tags: ["AWS", "Cloud", "DevOps", "Certification"],
      image: "☁️",
      color: "#f6ad55"
    },

    // Data Science Courses
    {
      id: 13,
      title: "Python for Data Science",
      description: "Master data analysis, visualization, and machine learning with Python",
      category: "datascience",
      level: "beginner",
      duration: "30 hours",
      lessons: 44,
      students: 28760,
      rating: 4.8,
      instructor: "Lisa Thompson",
      instructorRole: "Data Scientist at Meta",
      instructorAvatar: "👩‍🔬",
      price: "$84.99",
      enrolled: false,
      progress: 0,
      tags: ["Python", "Pandas", "NumPy", "Matplotlib"],
      image: "📈",
      color: "#f687b3"
    },
    {
      id: 14,
      title: "Machine Learning A-Z",
      description: "Complete machine learning course with Python and scikit-learn",
      category: "datascience",
      level: "intermediate",
      duration: "38 hours",
      lessons: 54,
      students: 19870,
      rating: 4.8,
      instructor: "James Wilson",
      instructorRole: "ML Engineer at Google",
      instructorAvatar: "👨‍🔬",
      price: "$99.99",
      enrolled: true,
      progress: 40,
      tags: ["Machine Learning", "Python", "scikit-learn", "AI"],
      image: "🤖",
      color: "#4f9eff"
    },

    // Security Courses
    {
      id: 15,
      title: "Ethical Hacking & Cybersecurity",
      description: "Learn ethical hacking, penetration testing, and security best practices",
      category: "security",
      level: "intermediate",
      duration: "36 hours",
      lessons: 52,
      students: 15430,
      rating: 4.7,
      instructor: "David Kim",
      instructorRole: "Security Engineer at Microsoft",
      instructorAvatar: "👨‍💻",
      price: "$94.99",
      enrolled: false,
      progress: 0,
      tags: ["Security", "Hacking", "Penetration Testing", "Cybersecurity"],
      image: "🔐",
      color: "#f56565"
    },

    // AI & ML Courses
    {
      id: 16,
      title: "Deep Learning Specialization",
      description: "Master deep learning with neural networks, TensorFlow, and PyTorch",
      category: "ai",
      level: "advanced",
      duration: "44 hours",
      lessons: 64,
      students: 18760,
      rating: 4.9,
      instructor: "Sarah Johnson",
      instructorRole: "AI Researcher at OpenAI",
      instructorAvatar: "👩‍🏫",
      price: "$139.99",
      enrolled: true,
      progress: 25,
      tags: ["Deep Learning", "TensorFlow", "PyTorch", "Neural Networks"],
      image: "🧠",
      color: "#9f7aea"
    }
  ];

  // Filter courses based on category, level, and search
  const filteredCourses = courses.filter(course => {
    if (selectedCategory !== "all" && course.category !== selectedCategory) return false;
    if (selectedLevel !== "all" && course.level !== selectedLevel) return false;
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !course.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get category-wise counts
  const categoryCounts = categories.reduce((acc, category) => {
    if (category.id === "all") {
      acc[category.id] = courses.length;
    } else {
      acc[category.id] = courses.filter(c => c.category === category.id).length;
    }
    return acc;
  }, {});

  // Calculate statistics
  const totalCourses = courses.length;
  const totalStudents = courses.reduce((acc, course) => acc + course.students, 0);
  const enrolledCount = courses.filter(c => c.enrolled).length;
  const completedCourses = courses.filter(c => c.progress === 100).length;

  const handleEnroll = (courseId) => {
    setEnrolledCourses([...enrolledCourses, courseId]);
    // Here you would typically make an API call to enroll
    alert(`Successfully enrolled in course!`);
  };

  return (
    <div className="courses-page">
      {/* Background Elements */}
      <div className="courses-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
        <div className="bg-glow glow-3"></div>
      </div>

      <div className="courses-container">
        {/* Header */}
        <div className="courses-header">
          <Link to="/dashboard" className="back-link">
            <span className="back-icon">←</span>
            Back to Dashboard
          </Link>
          <h1>Software Development Courses</h1>
          <div className="header-actions">
            <Link to="/my-learning" className="my-learning-btn">
              <span>📚</span>
              My Learning
            </Link>
          </div>
        </div>

        <PageFeaturePanel pageKey="courses" />

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-details">
              <span className="stat-label">Total Courses</span>
              <span className="stat-value">{totalCourses}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-details">
              <span className="stat-label">Active Students</span>
              <span className="stat-value">{totalStudents.toLocaleString()}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-details">
              <span className="stat-label">Enrolled</span>
              <span className="stat-value">{enrolledCount}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-details">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{completedCourses}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name} ({categoryCounts[cat.id]})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Level:</label>
              <select 
                className="filter-select"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                {levels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Quick Navigation */}
        <div className="category-nav">
          {categories.filter(c => c.id !== "all").map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="courses-grid">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-image" style={{ background: `linear-gradient(135deg, ${course.color}20, ${course.color}40)` }}>
                  <span className="course-emoji">{course.image}</span>
                  {course.enrolled && (
                    <div className="course-badge" style={{ background: course.color }}>
                      {course.progress}% Complete
                    </div>
                  )}
                </div>

                <div className="course-content">
                  <div className="course-header">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-rating">
                      <span className="rating-stars">★</span>
                      <span className="rating-value">{course.rating}</span>
                    </div>
                  </div>

                  <p className="course-description">{course.description}</p>

                  <div className="course-tags">
                    {course.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="course-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="course-meta">
                    <div className="meta-item">
                      <span className="meta-icon">⏱️</span>
                      <span>{course.duration}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📚</span>
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="course-instructor">
                    <span className="instructor-avatar">{course.instructorAvatar}</span>
                    <div className="instructor-info">
                      <span className="instructor-name">{course.instructor}</span>
                      <span className="instructor-role">{course.instructorRole}</span>
                    </div>
                  </div>

                  <div className="course-footer">
                    <div className="course-price">{course.price}</div>
                    {course.enrolled ? (
                      <div className="progress-section">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${course.progress}%`, background: course.color }}
                          ></div>
                        </div>
                        <Link to={`/course/${course.id}`} className="continue-btn">
                          Continue →
                        </Link>
                      </div>
                    ) : (
                      <button 
                        className="enroll-btn"
                        onClick={() => handleEnroll(course.id)}
                        style={{ background: course.color }}
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-courses">
              <span className="no-data-icon">📭</span>
              <h3>No Courses Found</h3>
              <p>Try adjusting your filters or search criteria</p>
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedLevel("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Course Categories Summary */}
        <div className="categories-summary">
          <h2>Browse by Category</h2>
          <div className="categories-grid">
            {categories.filter(c => c.id !== "all").map(category => {
              const categoryCourses = courses.filter(c => c.category === category.id);
              const avgRating = (categoryCourses.reduce((acc, c) => acc + c.rating, 0) / categoryCourses.length).toFixed(1);
              
              return (
                <div 
                  key={category.id} 
                  className="category-summary-card"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="summary-icon">{category.icon}</span>
                  <h3>{category.name}</h3>
                  <div className="summary-stats">
                    <span>{categoryCourses.length} Courses</span>
                    <span>★ {avgRating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="courses-footer">
          <Link to="/dashboard" className="secondary-btn">
            Back to Dashboard
          </Link>
          <Link to="/my-learning" className="primary-btn">
            View My Learning
          </Link>
        </div>
      </div>
    </div>
  );
}