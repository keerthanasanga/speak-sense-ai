const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /audio\/|video\/|application\/octet-stream/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only audio and video files are allowed"));
    }
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uploads: fs.existsSync(uploadDir)
    }
  });
});

// Question database based on job roles
const questionDatabase = {
  "Software Engineer": {
    technical: [
      "Explain the difference between let, const, and var in JavaScript.",
      "How does React's virtual DOM work and why is it efficient?",
      "Describe your experience with RESTful APIs and how you handle errors.",
      "What is the significance of closures in JavaScript? Give an example.",
      "How do you optimize web application performance? List specific techniques.",
      "Explain the concept of state management in React. Compare Redux and Context API.",
      "What are Web Workers and when would you use them?",
      "Describe the event loop in JavaScript.",
      "How do you handle security concerns in web applications?",
      "Explain your experience with testing frameworks (Jest, Mocha, etc.)."
    ],
    behavioral: [
      "Tell me about a challenging project you worked on and how you overcame obstacles.",
      "How do you handle disagreements with team members about technical decisions?",
      "Describe your approach to learning new technologies and staying updated.",
      "Tell me about a time when you had to meet a tight deadline.",
      "How do you prioritize tasks when working on multiple projects?",
      "Describe a situation where you had to debug a complex issue.",
      "How do you ensure code quality in your projects?",
      "Tell me about a time you received constructive criticism and how you handled it."
    ]
  },
  "Product Manager": {
    technical: [
      "How do you prioritize features in a product backlog? What frameworks do you use?",
      "Describe your experience with agile methodologies and Scrum ceremonies.",
      "How do you conduct market research and competitive analysis?",
      "Explain how you define and track KPIs for product success.",
      "How do you create and validate user personas?",
      "Describe your process for writing user stories and acceptance criteria.",
      "How do you handle technical debt in product planning?",
      "What tools do you use for product roadmap planning?"
    ],
    behavioral: [
      "Tell me about a product you successfully launched from concept to market.",
      "How do you handle conflicting stakeholder expectations?",
      "Describe a time when you had to make a difficult product decision with limited data.",
      "How do you gather and incorporate user feedback into your product decisions?",
      "Tell me about a product failure and what you learned from it.",
      "How do you motivate your team during challenging times?",
      "Describe your communication strategy with different stakeholders."
    ]
  },
  "Data Scientist": {
    technical: [
      "Explain the difference between supervised and unsupervised learning with examples.",
      "How do you handle imbalanced datasets? What techniques do you use?",
      "What metrics do you use to evaluate model performance for classification vs regression?",
      "Explain feature engineering and its importance in model performance.",
      "How do you detect and handle outliers in your data?",
      "Describe your experience with deep learning frameworks (TensorFlow, PyTorch).",
      "What is cross-validation and why is it important?",
      "Explain the bias-variance tradeoff in machine learning."
    ],
    behavioral: [
      "Describe a data science project from data collection to deployment.",
      "How do you communicate complex findings to non-technical stakeholders?",
      "Tell me about a time when your model didn't perform as expected and how you debugged it.",
      "How do you stay updated with the latest developments in data science?",
      "Describe a situation where you had to work with incomplete or messy data.",
      "How do you ensure your models are fair and unbiased?"
    ]
  },
  "UX Designer": {
    technical: [
      "Walk me through your complete design process from research to handoff.",
      "How do you conduct user research and usability testing?",
      "Explain your approach to creating and validating user personas.",
      "How do you create and test prototypes at different fidelity levels?",
      "What design tools are you proficient with and why do you prefer them?",
      "How do you ensure your designs are accessible (WCAG guidelines)?",
      "Explain how you use design systems and component libraries.",
      "How do you measure the success of your designs?"
    ],
    behavioral: [
      "Describe a project where you significantly improved user experience.",
      "How do you handle feedback and criticism on your designs?",
      "Tell me about a time when you had to advocate for user needs against business requirements.",
      "How do you collaborate with developers to ensure design implementation?",
      "Describe a situation where you had to redesign based on user feedback.",
      "How do you balance creativity with usability constraints?"
    ]
  },
  "DevOps Engineer": {
    technical: [
      "Explain your experience with CI/CD pipelines and tools you've used.",
      "How do you handle infrastructure as code? Experience with Terraform/CloudFormation?",
      "Describe your monitoring and logging strategy for production systems.",
      "How do you handle containerization with Docker and orchestration with Kubernetes?",
      "Explain your approach to security in the DevOps lifecycle.",
      "How do you manage configuration across different environments?",
      "Describe your experience with cloud platforms (AWS/Azure/GCP).",
      "How do you handle database migrations in production?"
    ],
    behavioral: [
      "Tell me about a time you handled a major production incident.",
      "How do you balance speed of deployment with system stability?",
      "Describe how you've improved system reliability and performance.",
      "How do you collaborate with development teams to improve deployment processes?",
      "Tell me about a challenging automation problem you solved."
    ]
  }
};

// Interview Session Schema
const InterviewSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRole: { type: String, required: true },
  avatarId: { type: String },
  avatarName: String,
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: { 
    type: String, 
    enum: ['active', 'completed', 'abandoned'], 
    default: 'active' 
  },
  answers: [{
    question: String,
    answer: String,
    audioUrl: String,
    videoUrl: String,
    timestamp: Date,
    duration: Number,
    questionType: { type: String, enum: ['technical', 'behavioral'] }
  }],
  feedback: {
    overallScore: Number,
    technicalScore: Number,
    behavioralScore: Number,
    strengths: [String],
    improvements: [String],
    summary: String,
    detailedFeedback: [{
      questionNumber: Number,
      question: String,
      score: Number,
      strengths: String,
      improvements: String,
      keywords: [String]
    }]
  }
}, { timestamps: true });

const InterviewSession = mongoose.model('InterviewSession', InterviewSessionSchema);

// API Endpoints for Interview

// Get questions for a specific role
app.get("/api/interview/questions", async (req, res) => {
  try {
    const { role, type = 'all', count = 5 } = req.query;
    
    if (!role) {
      return res.status(400).json({ success: false, error: "Role is required" });
    }

    const questions = questionDatabase[role];
    
    if (!questions) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }

    let selectedQuestions = [];
    if (type === 'technical') {
      selectedQuestions = questions.technical.slice(0, count);
    } else if (type === 'behavioral') {
      selectedQuestions = questions.behavioral.slice(0, count);
    } else {
      // Mix technical and behavioral questions
      const technicalCount = Math.ceil(count / 2);
      const behavioralCount = Math.floor(count / 2);
      selectedQuestions = [
        ...questions.technical.slice(0, technicalCount),
        ...questions.behavioral.slice(0, behavioralCount)
      ];
    }

    // Shuffle questions for variety
    selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

    res.json({ 
      success: true, 
      questions: selectedQuestions,
      totalAvailable: questions.technical.length + questions.behavioral.length,
      role: role,
      type: type
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Create new interview session
app.post("/api/interview/session/create", async (req, res) => {
  try {
    const { userId, jobRole, avatarId, avatarName } = req.body;
    
    if (!userId || !jobRole) {
      return res.status(400).json({ success: false, error: "UserId and jobRole are required" });
    }

    const sessionId = new mongoose.Types.ObjectId().toString();
    
    const session = new InterviewSession({
      sessionId,
      userId,
      jobRole,
      avatarId,
      avatarName,
      startTime: new Date(),
      status: 'active'
    });

    await session.save();

    res.json({
      success: true,
      sessionId,
      message: "Interview session created successfully"
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Submit interview answer with recording
app.post("/api/interview/submit-answer", upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { sessionId, question, answer, questionIndex, questionType, duration } = req.body;
    const audioFile = req.files && req.files['audio'] ? req.files['audio'][0] : null;
    const videoFile = req.files && req.files['video'] ? req.files['video'][0] : null;

    if (!sessionId || !question || !answer) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const session = await InterviewSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    // Save answer with file URLs
    const answerData = {
      question,
      answer,
      questionType: questionType || 'technical',
      timestamp: new Date(),
      duration: duration || 0,
      audioUrl: audioFile ? `/uploads/${audioFile.filename}` : null,
      videoUrl: videoFile ? `/uploads/${videoFile.filename}` : null
    };

    session.answers.push(answerData);
    await session.save();

    res.json({
      success: true,
      message: "Answer submitted successfully",
      data: {
        questionIndex: session.answers.length - 1,
        ...answerData
      }
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Generate feedback using AI
app.post("/api/interview/generate-feedback", async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await InterviewSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    // Analyze answers and generate feedback
    const answers = session.answers;
    const jobRole = session.jobRole;

    // Calculate scores based on answer quality
    let totalScore = 0;
    let technicalScore = 0;
    let behavioralScore = 0;
    let technicalCount = 0;
    let behavioralCount = 0;

    const detailedFeedback = answers.map((answer, index) => {
      // Simple scoring based on answer length and keywords
      const wordCount = answer.answer.split(/\s+/).length;
      const hasKeywords = checkKeywords(answer.answer, jobRole, answer.questionType);
      
      let score = 70; // Base score
      if (wordCount > 50) score += 10;
      if (wordCount > 100) score += 5;
      if (hasKeywords) score += 15;
      
      score = Math.min(score, 100);

      if (answer.questionType === 'technical') {
        technicalScore += score;
        technicalCount++;
      } else {
        behavioralScore += score;
        behavioralCount++;
      }
      
      totalScore += score;

      return {
        questionNumber: index + 1,
        question: answer.question,
        score: score,
        strengths: generateStrengths(answer.answer, answer.questionType),
        improvements: generateImprovements(answer.answer, answer.questionType),
        keywords: extractKeywords(answer.answer)
      };
    });

    // Calculate averages
    const avgTotalScore = Math.round(totalScore / answers.length);
    const avgTechnicalScore = technicalCount > 0 ? Math.round(technicalScore / technicalCount) : 0;
    const avgBehavioralScore = behavioralCount > 0 ? Math.round(behavioralScore / behavioralCount) : 0;

    // Generate overall feedback
    const feedback = {
      overallScore: avgTotalScore,
      technicalScore: avgTechnicalScore,
      behavioralScore: avgBehavioralScore,
      strengths: generateOverallStrengths(answers, jobRole),
      improvements: generateOverallImprovements(answers, jobRole),
      summary: generateSummary(avgTotalScore, jobRole, answers.length),
      detailedFeedback: detailedFeedback
    };

    // Update session with feedback
    session.feedback = feedback;
    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error("Error generating feedback:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get interview session details
app.get("/api/interview/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await InterviewSession.findOne({ sessionId })
      .populate('userId', 'name email');
    
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
const getDbStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  const readyState = mongoose.connection.readyState;
  return states[readyState] || "unknown";
};

app.get(["/health", "/api/health"], (_req, res) => {
  const database = getDbStatus();
  const healthy = database === "connected" || process.env.NODE_ENV === "test";

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "speak-sense-server",
    database
  });
});

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

// Get user's interview history
app.get("/api/interview/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const sessions = await InterviewSession.find({ 
      userId,
      status: 'completed'
    })
    .sort({ endTime: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('sessionId jobRole avatarName startTime endTime feedback.overallScore answers');

    const total = await InterviewSession.countDocuments({ 
      userId,
      status: 'completed'
    });

    res.json({
      success: true,
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete interview session
app.delete("/api/interview/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await InterviewSession.findOneAndDelete({ sessionId });
    
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    // Delete associated files
    if (session.answers) {
      session.answers.forEach(answer => {
        if (answer.audioUrl) {
          const audioPath = path.join(__dirname, answer.audioUrl);
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        }
        if (answer.videoUrl) {
          const videoPath = path.join(__dirname, answer.videoUrl);
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        }
      });
    }

    res.json({
      success: true,
      message: "Session deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Helper functions for feedback generation
function checkKeywords(answer, jobRole, questionType) {
  const keywords = {
    "Software Engineer": {
      technical: ['react', 'javascript', 'api', 'database', 'algorithm', 'performance', 'testing', 'debug', 'optimization', 'security'],
      behavioral: ['team', 'project', 'deadline', 'challenge', 'solution', 'collaboration', 'communication', 'learning']
    },
    "Product Manager": {
      technical: ['roadmap', 'priority', 'kpi', 'metric', 'user story', 'agile', 'scrum', 'market'],
      behavioral: ['stakeholder', 'decision', 'feedback', 'launch', 'customer', 'team', 'strategy']
    }
  };

  const roleKeywords = keywords[jobRole] || keywords["Software Engineer"];
  const typeKeywords = roleKeywords[questionType] || roleKeywords.technical;
  
  const answerLower = answer.toLowerCase();
  return typeKeywords.some(keyword => answerLower.includes(keyword));
}

function generateStrengths(answer, questionType) {
  const wordCount = answer.split(/\s+/).length;
  if (wordCount > 100) {
    return "Comprehensive answer with good detail";
  } else if (wordCount > 50) {
    return "Good explanation with relevant details";
  } else {
    return "Clear and concise response";
  }
}

function generateImprovements(answer, questionType) {
  const wordCount = answer.split(/\s+/).length;
  if (wordCount < 30) {
    return "Consider providing more specific examples";
  } else if (!answer.includes('because') && !answer.includes('therefore')) {
    return "Try to explain the reasoning behind your answers";
  } else {
    return "Good answer - continue providing this level of detail";
  }
}

function extractKeywords(answer) {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = answer.toLowerCase().split(/\W+/);
  const keywords = words
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5);
  return [...new Set(keywords)];
}

function generateOverallStrengths(answers, jobRole) {
  const strengths = [];
  
  if (answers.length >= 5) {
    strengths.push("Completed all questions thoroughly");
  }
  
  const avgLength = answers.reduce((sum, a) => sum + a.answer.split(/\s+/).length, 0) / answers.length;
  if (avgLength > 80) {
    strengths.push("Provided detailed and comprehensive responses");
  } else if (avgLength > 50) {
    strengths.push("Good balance of detail in responses");
  }
  
  strengths.push("Demonstrated knowledge of core concepts");
  strengths.push("Clear communication style");
  
  return strengths.slice(0, 4);
}

function generateOverallImprovements(answers, jobRole) {
  const improvements = [];
  
  const shortAnswers = answers.filter(a => a.answer.split(/\s+/).length < 30);
  if (shortAnswers.length > 0) {
    improvements.push("Provide more specific examples in your responses");
  }
  
  improvements.push("Quantify achievements with metrics where possible");
  improvements.push("Elaborate more on technical challenges and solutions");
  improvements.push("Include more industry best practices in your answers");
  
  return improvements.slice(0, 4);
}

function generateSummary(score, jobRole, answerCount) {
  if (score >= 90) {
    return `Excellent performance! You demonstrated exceptional knowledge for the ${jobRole} position. Your responses were comprehensive and showed deep understanding of both technical and behavioral aspects.`;
  } else if (score >= 80) {
    return `Good job! You showed solid understanding of ${jobRole} concepts. Your answers were well-structured and relevant. With a few more specific examples, you could achieve an excellent score.`;
  } else if (score >= 70) {
    return `Satisfactory performance. You have foundational knowledge for the ${jobRole} role. Focus on providing more detailed explanations and real-world examples in your responses.`;
  } else {
    return `You've completed ${answerCount} questions. Continue practicing and focus on structuring your answers with specific examples, technical details, and clear explanations to improve your performance.`;
  }
}

// Resume analysis endpoint
app.post("/analyze-resume", (req, res) => {
  try {
    const { resumeText, jobRole } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ success: false, message: "No resume provided." });
    }

    const wordCount = resumeText.split(/\s+/).length;
    const skills = extractSkillsFromResume(resumeText, jobRole);
    const experience = estimateExperience(resumeText);
    const suggestions = generateResumeSuggestions(resumeText, jobRole);
    
    const analysis = {
      summary: `Resume analysis for ${jobRole || 'general'} position. Word count: ${wordCount}.`,
      wordCount,
      estimatedExperience: experience,
      keySkills: skills,
      suggestions: suggestions,
      score: calculateResumeScore(resumeText, jobRole)
    };

    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({ success: false, message: "Error analyzing resume" });
  }
});

function extractSkillsFromResume(resumeText, jobRole) {
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'mongodb',
    'aws', 'docker', 'kubernetes', 'agile', 'scrum', 'leadership',
    'communication', 'project management', 'data analysis', 'machine learning'
  ];
  
  const text = resumeText.toLowerCase();
  return commonSkills.filter(skill => text.includes(skill)).slice(0, 8);
}

function estimateExperience(resumeText) {
  const yearMatches = resumeText.match(/\b(19|20)\d{2}\b/g) || [];
  if (yearMatches.length > 0) {
    const years = yearMatches.map(y => parseInt(y));
    const recentYear = Math.max(...years);
    return new Date().getFullYear() - recentYear;
  }
  return 'Unknown';
}

function generateResumeSuggestions(resumeText, jobRole) {
  const suggestions = [];
  
  if (resumeText.split(/\s+/).length < 300) {
    suggestions.push("Consider adding more detail to your work experience");
  }
  
  if (!resumeText.match(/\d+%/)) {
    suggestions.push("Add quantifiable achievements with percentages");
  }
  
  suggestions.push("Tailor your resume more specifically to the job description");
  suggestions.push("Include relevant certifications and courses");
  
  return suggestions;
}

function calculateResumeScore(resumeText, jobRole) {
  let score = 70; // Base score
  
  // Add points for length
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount > 500) score += 10;
  else if (wordCount > 300) score += 5;
  
  // Add points for skills
  const skills = extractSkillsFromResume(resumeText, jobRole);
  score += skills.length * 2;
  
  return Math.min(score, 100);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: "File too large. Maximum size is 50MB." 
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
  
  res.status(500).json({ 
    success: false, 
    error: "Something went wrong!" 
  });
});

// Database connection
if (process.env.NODE_ENV !== "test") {
  const uri = process.env.MONGO_URI || "";
  if (!uri) {
    console.error("❌ MONGO_URI environment variable is not defined. Please set it in your .env file or environment.");
    console.error("   Example: MONGO_URI=mongodb://localhost:27017/mydb \nor a valid Atlas SRV string");
    process.exit(1);
  }

  console.log(`🔗 Attempting MongoDB connection to: ${uri.startsWith("mongodb+") ? "<srv>" : uri}`);

  mongoose.connect(uri)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
      console.error("❌ MongoDB Connection Error:", err.message || err);
      if (err.code === 'ENOTFOUND' || err.message?.includes('ENOTFOUND')) {
        console.error("   The host could not be resolved. Check your URI and network connectivity.");
      }
      process.exit(1);
    });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Upload directory: ${uploadDir}`);
  });
}

module.exports = app;