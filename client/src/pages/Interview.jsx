import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/interview.css";

const Avatar = ({ 
  avatar, 
  question, 
  isAsking, 
  onReady, 
  onQuestionAnswer,
  jobRole: propJobRole,
  onComplete,
  sessionId: propSessionId 
}) => {
  const navigate = useNavigate();
  // Get selections from planning page via location state
  const location = useLocation();
  const planningSelections = location.state || {};
  
  // State management
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [avatarImageUrl, setAvatarImageUrl] = useState("");
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [micPermission, setMicPermission] = useState("prompt");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false); // Prevent multiple submissions
  
  // Extract selections from planning page
  const selectedDomain = planningSelections.domain || {};
  const selectedRole = planningSelections.role || "General Interview";
  const selectedDifficulty = planningSelections.difficulty || { name: "Intermediate", id: 2 };
  const selectedType = planningSelections.type || { name: "Mixed", id: 4 };
  
  // Determine job role based on selections
  const jobRole = selectedRole || propJobRole || "General Interview";
  
  // Refs
  const recognitionRef = useRef(null);
  const speechSynthRef = useRef(null);
  const currentQuestionRef = useRef(null); // Track current question to prevent duplicates
  const currentQuestionIndexRef = useRef(0); // NEW: Track current index with ref
  const questionsRef = useRef([]); // NEW: Track questions with ref
  const nextQuestionIndexRef = useRef(null); // NEW: Track next question index

  // Avatar configurations
  const getAvatarImageUrl = (avatarName) => {
    const avatarMap = {
      Alex: "avatar.png",
      Sarah: "avatar.png",
      Michael: "avatar.png",
      Emma: "avatar.png",
      David: "avatar.png",
      Lisa: "avatar.png"
    };
    return avatarMap[avatar?.name] || avatarMap.Alex;
  };

  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarSelect, setShowAvatarSelect] = useState(true);
  const [useChat, setUseChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewActive, setInterviewActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Avatar posture state
  const [avatarPosture, setAvatarPosture] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  // Hover preview posture
  const [hoveredAvatarId, setHoveredAvatarId] = useState(null);
  // Feedback sidebar
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [interviewConfig, setInterviewConfig] = useState({
    mode: "balanced",
    difficulty: "intermediate",
    questionCount: 5
  });

  const videoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const timerRef = useRef(null);
  const speakTimerRef = useRef(null);

  const avatarCatalog = {
    default: [
      { id: 1, name: "Alex", gender: "male", role: "Technical Interviewer", avatar: "👨‍💼", color: "#4f9eff", bgColor: "linear-gradient(135deg, #0066cc, #004080)" },
      { id: 2, name: "Sarah", gender: "female", role: "HR Specialist", avatar: "👩‍💼", color: "#f687b3", bgColor: "linear-gradient(135deg, #d53f8c, #97266d)" },
      { id: 3, name: "Michael", gender: "male", role: "Senior Developer", avatar: "👨‍💻", color: "#48bb78", bgColor: "linear-gradient(135deg, #2f855a, #1e4b3c)" },
      { id: 4, name: "Luna", species: "animal", role: "Confidence Coach (Owl)", avatar: "🦉", color: "#9f7aea", bgColor: "linear-gradient(135deg, #5b21b6, #312e81)" },
      { id: 5, name: "Rex", species: "animal", role: "Behavior Mentor (Fox)", avatar: "🦊", color: "#ed8936", bgColor: "linear-gradient(135deg, #dd6b20, #9c4221)" },
      { id: 6, name: "Coco", species: "animal", role: "Communication Coach (Panda)", avatar: "🐼", color: "#38b2ac", bgColor: "linear-gradient(135deg, #0f766e, #234e52)" }
    ],
    software: [
      { id: 11, name: "Nova", gender: "female", role: "Frontend Architect", avatar: "👩‍💻", color: "#60a5fa", bgColor: "linear-gradient(135deg, #2563eb, #0f172a)" },
      { id: 12, name: "Kai", gender: "male", role: "System Design Lead", avatar: "👨‍💻", color: "#22d3ee", bgColor: "linear-gradient(135deg, #0e7490, #0f172a)" },
      { id: 13, name: "Byte", species: "animal", role: "Coding Pace Coach (Otter)", avatar: "🦦", color: "#34d399", bgColor: "linear-gradient(135deg, #047857, #052e16)" }
    ],
    data: [
      { id: 21, name: "Iris", gender: "female", role: "ML Interviewer", avatar: "👩‍🔬", color: "#818cf8", bgColor: "linear-gradient(135deg, #4338ca, #1f2937)" },
      { id: 22, name: "Atlas", gender: "male", role: "Analytics Lead", avatar: "👨‍🔬", color: "#2dd4bf", bgColor: "linear-gradient(135deg, #0f766e, #1f2937)" },
      { id: 23, name: "Pixel", species: "animal", role: "Insight Coach (Koala)", avatar: "🐨", color: "#f472b6", bgColor: "linear-gradient(135deg, #9d174d, #3f3f46)" }
    ]
  };

  const avatars = useMemo(() => {
    const industry = (userProfile?.industry || "").toLowerCase();
    if (industry.includes("software") || industry.includes("technology") || industry.includes("it")) {
      return [...avatarCatalog.software, ...avatarCatalog.default.slice(3)];
    }
    if (industry.includes("data") || industry.includes("ml") || industry.includes("machine")) {
      return [...avatarCatalog.data, ...avatarCatalog.default.slice(0, 3)];
    }
    return avatarCatalog.default;
  }, [userProfile]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    API.get("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setUserProfile(res.data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    setAvatarImageUrl(getAvatarImageUrl(avatar?.name));
  }, [avatar]);

  // Load questions based on selections from planning page
  useEffect(() => {
    loadQuestionsForRole(jobRole, selectedDifficulty, selectedType);
  }, [jobRole, selectedDifficulty, selectedType]);

  // NEW: Keep refs in sync with state
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      setMicPermission("prompt");
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError("Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
        setMicPermission("denied");
        return false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setMicPermission("granted");
      return true;
    } catch (err) {
      console.error("Microphone permission error:", err);
      setMicPermission("denied");
      setError("Microphone access denied. Please enable microphone access and refresh the page.");
      return false;
    }
  };

  // Initialize on mount
  useEffect(() => {
    requestMicrophonePermission();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Start interview when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && micPermission === "granted" && !interviewStarted && !feedback && !welcomeSpoken) {
      setInterviewStarted(true);
      // Small delay to ensure everything is ready
      setTimeout(() => {
        startInterview();
      }, 1000);
    }
  }, [questions, micPermission, interviewStarted, feedback, welcomeSpoken]);

  // Load questions based on role, difficulty, and interview type
  const loadQuestionsForRole = async (role, difficulty, type) => {
    setIsLoading(true);
    try {
      console.log("Loading questions for:", { role, difficulty, type });
      
      // Comprehensive question database organized by role, difficulty, and type
      const questionDatabase = {
        "Software Engineer": {
          technical: {
            beginner: [
              "What is the difference between let, const, and var in JavaScript?",
              "Explain what React components are and how they work.",
              "What is the purpose of package.json in a Node.js project?",
              "Describe the difference between props and state in React.",
              "What are JavaScript promises and how do they work?"
            ],
            intermediate: [
              "Explain the virtual DOM and how React uses it for performance optimization.",
              "How do you handle state management in large-scale React applications?",
              "Describe your experience with RESTful API design and implementation.",
              "What are React hooks and how have they changed component development?",
              "Explain how you would optimize the performance of a React application."
            ],
            advanced: [
              "Describe the architecture of a scalable React application with proper state management.",
              "How would you implement server-side rendering in a React application?",
              "Explain micro-frontend architecture and when you would use it.",
              "How do you handle real-time data synchronization in a web application?",
              "Describe your experience with WebAssembly and its use cases."
            ],
            expert: [
              "Design a high-performance, globally distributed web application architecture.",
              "Explain how you would implement a custom React renderer for a specific platform.",
              "Describe the internals of React's reconciliation algorithm and its optimizations.",
              "How would you build a real-time collaborative editing system like Google Docs?",
              "Design a system for handling millions of concurrent WebSocket connections."
            ]
          },
          behavioral: {
            beginner: [
              "Tell me about yourself and your journey into software development.",
              "Why are you interested in a software engineering role?",
              "Describe a project you worked on during your studies or bootcamp.",
              "How do you handle feedback on your code?",
              "What programming languages are you most comfortable with and why?"
            ],
            intermediate: [
              "Describe a challenging technical problem you solved recently.",
              "How do you handle disagreements with team members about technical decisions?",
              "Tell me about a time you had to learn a new technology quickly.",
              "How do you ensure code quality in your projects?",
              "Describe your experience working in an agile development team."
            ],
            advanced: [
              "Tell me about a project where you had to make significant architectural decisions.",
              "How do you mentor junior developers on your team?",
              "Describe a time when you had to deal with technical debt.",
              "How do you stay updated with the latest technologies and best practices?",
              "Tell me about a situation where you had to push back against unrealistic deadlines."
            ],
            expert: [
              "Describe your approach to building and leading high-performing engineering teams.",
              "How have you influenced technical strategy at an organizational level?",
              "Tell me about a time you had to navigate complex organizational politics to achieve a technical goal.",
              "How do you balance technical excellence with business constraints?",
              "Describe your philosophy on software architecture and how it has evolved."
            ]
          },
          systemDesign: {
            beginner: [
              "Design a URL shortening service like TinyURL.",
              "How would you design a simple task management application?",
              "Design the database schema for a blog platform.",
              "How would you architect a real-time chat application?",
              "Design a basic e-commerce product listing page."
            ],
            intermediate: [
              "Design Twitter's timeline and tweet posting functionality.",
              "How would you design Instagram's photo sharing and feed features?",
              "Design a scalable video streaming platform like YouTube.",
              "How would you architect a ride-sharing application like Uber?",
              "Design a notification system for a social media platform."
            ],
            advanced: [
              "Design a globally distributed database system with strong consistency.",
              "How would you architect a real-time collaborative document editor?",
              "Design a high-frequency trading platform with low latency requirements.",
              "How would you build a recommendation system for a streaming service?",
              "Design a distributed caching system for a global e-commerce platform."
            ],
            expert: [
              "Design a system that can handle millions of concurrent users for a live streaming event.",
              "How would you architect a platform that processes petabytes of data in real-time?",
              "Design a fault-tolerant, self-healing distributed system.",
              "How would you build a multi-tenant SaaS platform with custom isolation requirements?",
              "Design a system for real-time fraud detection at global scale."
            ]
          }
        },
        "Frontend Developer": {
          technical: {
            beginner: [
              "Explain the box model in CSS and how it affects layout.",
              "What is the difference between inline, block, and inline-block elements?",
              "How do you center a div both horizontally and vertically?",
              "Explain the concept of responsive design and how you implement it.",
              "What are semantic HTML elements and why are they important?"
            ],
            intermediate: [
              "Describe the difference between CSS Grid and Flexbox and when to use each.",
              "How do you handle state management in React applications?",
              "Explain the concept of CSS-in-JS and its benefits and drawbacks.",
              "How do you optimize web performance for frontend applications?",
              "Describe your experience with modern build tools like Webpack or Vite."
            ],
            advanced: [
              "Explain the rendering pipeline in modern browsers.",
              "How would you implement a design system with reusable components?",
              "Describe your approach to implementing complex animations with smooth performance.",
              "How do you handle accessibility (a11y) in web applications?",
              "Explain how you would implement internationalization (i18n) in a React app."
            ],
            expert: [
              "Design a component library with advanced theming capabilities.",
              "How would you implement a virtual scrolling solution for large datasets?",
              "Explain the internals of React's fiber architecture.",
              "How do you architect a micro-frontend application?",
              "Describe how you would implement real-time collaborative features in a frontend app."
            ]
          },
          behavioral: {
            beginner: [
              "Tell me about your journey into frontend development.",
              "What frontend frameworks are you most comfortable with and why?",
              "Describe a frontend project you're particularly proud of.",
              "How do you handle design feedback from stakeholders?",
              "What resources do you use to learn new frontend technologies?"
            ],
            intermediate: [
              "Tell me about a challenging UI problem you solved.",
              "How do you collaborate with designers and backend developers?",
              "Describe a time when you had to make performance optimizations to a website.",
              "How do you stay current with rapidly changing frontend technologies?",
              "Tell me about a situation where you had to deal with cross-browser compatibility issues."
            ],
            advanced: [
              "Describe your experience leading frontend architecture decisions.",
              "How have you mentored junior frontend developers?",
              "Tell me about a time you introduced a new technology to your team.",
              "How do you balance user experience with technical constraints?",
              "Describe a situation where you had to advocate for frontend best practices."
            ],
            expert: [
              "How have you influenced frontend strategy across multiple teams?",
              "Describe your approach to building a frontend community of practice.",
              "Tell me about a time you had to make trade-offs between developer experience and user experience.",
              "How do you evaluate and select new frontend technologies for your organization?",
              "Describe your philosophy on frontend architecture and how it scales."
            ]
          }
        },
        "Backend Developer": {
          technical: {
            beginner: [
              "Explain RESTful API design principles.",
              "What is the difference between SQL and NoSQL databases?",
              "Describe how you would design a simple user authentication system.",
              "What are HTTP methods and how are they used in API design?",
              "Explain the concept of middleware in web frameworks."
            ],
            intermediate: [
              "How do you handle database transactions and ensure data consistency?",
              "Explain caching strategies and when you would use them.",
              "Describe your experience with message queues and event-driven architecture.",
              "How do you implement rate limiting and throttling in APIs?",
              "Explain database indexing and query optimization techniques."
            ],
            advanced: [
              "Design a microservices architecture with service discovery and load balancing.",
              "How do you handle distributed transactions across multiple services?",
              "Explain consensus algorithms like Paxos or Raft and their use cases.",
              "Describe your approach to implementing CQRS and event sourcing.",
              "How do you ensure data consistency in a distributed system?"
            ],
            expert: [
              "Design a globally distributed database with multi-region replication.",
              "How would you implement a distributed transaction coordinator?",
              "Explain the internals of a distributed consensus system like etcd or ZooKeeper.",
              "Design a system for handling real-time data processing at petabyte scale.",
              "How would you architect a system for financial transactions with strict consistency requirements?"
            ]
          },
          behavioral: {
            beginner: [
              "Tell me about your experience with backend technologies.",
              "Why are you interested in backend development?",
              "Describe a backend project you worked on.",
              "How do you approach learning new backend technologies?",
              "What databases have you worked with and what are their strengths?"
            ],
            intermediate: [
              "Tell me about a challenging performance issue you solved.",
              "How do you ensure security in your API designs?",
              "Describe your experience with deployment and CI/CD pipelines.",
              "How do you handle breaking changes in APIs?",
              "Tell me about a time you had to debug a complex production issue."
            ],
            advanced: [
              "Describe your experience designing scalable systems.",
              "How have you handled database migrations in production?",
              "Tell me about a time you had to make significant architectural changes.",
              "How do you approach capacity planning for backend services?",
              "Describe your experience with disaster recovery and high availability."
            ],
            expert: [
              "How have you influenced backend strategy across your organization?",
              "Tell me about a time you designed a system that needed to handle massive scale.",
              "How do you balance technical debt with feature development?",
              "Describe your approach to building resilient, self-healing systems.",
              "How do you mentor other engineers in system design and architecture?"
            ]
          }
        },
        "Full Stack Developer": {
          technical: {
            beginner: [
              "Explain the difference between client-side and server-side rendering.",
              "How do you handle authentication in a full-stack application?",
              "Describe how data flows from database to UI in a typical web application.",
              "What is the MERN stack and how do its components work together?",
              "Explain how you would create a simple CRUD application."
            ],
            intermediate: [
              "How do you manage state across both frontend and backend?",
              "Explain your approach to API design and integration with frontend.",
              "How do you handle real-time updates in a web application?",
              "Describe your experience with server-side rendering frameworks like Next.js.",
              "How do you optimize full-stack applications for performance?"
            ],
            advanced: [
              "Design a full-stack application with real-time collaboration features.",
              "How would you implement offline support and sync in a web application?",
              "Explain your approach to building a progressive web application (PWA).",
              "How do you handle data consistency between client and server?",
              "Describe your experience with GraphQL and how it changes full-stack development."
            ],
            expert: [
              "Design a full-stack platform that can support multiple client applications.",
              "How would you implement real-time synchronization across millions of devices?",
              "Explain your approach to building a universal JavaScript application.",
              "Design a system for seamless deployment and rollback of full-stack applications.",
              "How do you architect full-stack applications for maximum developer productivity?"
            ]
          },
          behavioral: {
            beginner: [
              "Tell me about your journey into full-stack development.",
              "What parts of the stack do you enjoy most and why?",
              "Describe a full-stack project you built from scratch.",
              "How do you approach learning both frontend and backend technologies?",
              "What development tools and workflows do you prefer?"
            ],
            intermediate: [
              "Tell me about a challenging feature you implemented across the stack.",
              "How do you handle the context switching between frontend and backend?",
              "Describe your experience with different parts of the development lifecycle.",
              "How do you ensure consistency between frontend and backend logic?",
              "Tell me about a time you had to debug an issue that spanned the entire stack."
            ],
            advanced: [
              "Describe your experience leading full-stack development projects.",
              "How have you helped bridge gaps between frontend and backend teams?",
              "Tell me about a time you made architectural decisions that affected both ends of the stack.",
              "How do you stay current with both frontend and backend technologies?",
              "Describe your approach to mentoring developers on full-stack development."
            ],
            expert: [
              "How have you shaped full-stack development practices in your organization?",
              "Tell me about a time you designed a full-stack platform used by multiple teams.",
              "How do you balance concerns between frontend user experience and backend scalability?",
              "Describe your philosophy on full-stack development in large organizations.",
              "How do you evaluate and introduce new technologies across the entire stack?"
            ]
          }
        },
        "Data Scientist": {
          technical: {
            beginner: [
              "Explain the difference between supervised and unsupervised learning.",
              "What is the purpose of train/test split in machine learning?",
              "Describe common data preprocessing techniques.",
              "What is overfitting and how do you prevent it?",
              "Explain basic statistics concepts like mean, median, and standard deviation."
            ],
            intermediate: [
              "How do you handle missing or inconsistent data in a dataset?",
              "Explain different feature selection techniques and when to use them.",
              "Describe your experience with various machine learning algorithms.",
              "How do you evaluate model performance and choose the right metrics?",
              "Explain the bias-variance tradeoff and its implications."
            ],
            advanced: [
              "Describe your experience with deep learning architectures like CNNs and RNNs.",
              "How do you handle imbalanced datasets in classification problems?",
              "Explain ensemble methods and when they are most effective.",
              "How do you approach hyperparameter tuning and model optimization?",
              "Describe your experience with natural language processing techniques."
            ],
            expert: [
              "Design a recommendation system for a streaming service with millions of users.",
              "How would you implement real-time anomaly detection in high-velocity data streams?",
              "Explain the mathematics behind transformer architectures in deep learning.",
              "Design a system for training and deploying models at scale.",
              "How do you ensure fairness and reduce bias in machine learning models?"
            ]
          },
          behavioral: {
            beginner: [
              "Tell me about your background in data science.",
              "What drew you to the field of data science?",
              "Describe a data analysis project you worked on.",
              "What tools and libraries do you use for data science?",
              "How do you approach learning new data science techniques?"
            ],
            intermediate: [
              "Tell me about a time your model didn't perform as expected and how you debugged it.",
              "How do you communicate complex findings to non-technical stakeholders?",
              "Describe a project where you had to work with messy, real-world data.",
              "How do you validate that your model will perform well in production?",
              "Tell me about a time you had to choose between different modeling approaches."
            ],
            advanced: [
              "Describe your experience deploying machine learning models to production.",
              "How have you influenced product decisions based on data analysis?",
              "Tell me about a time you had to balance model complexity with interpretability.",
              "How do you stay current with rapidly evolving ML research?",
              "Describe your experience with A/B testing and experiment design."
            ],
            expert: [
              "How have you shaped data science strategy in your organization?",
              "Tell me about a time you designed a novel approach to a challenging problem.",
              "How do you mentor other data scientists and promote best practices?",
              "Describe your philosophy on the role of data science in business decision-making.",
              "How do you evaluate and incorporate new research into production systems?"
            ]
          }
        },
        "DevOps Engineer": {
          technical: {
            beginner: [
              "Explain the concept of CI/CD and its benefits.",
              "What is infrastructure as code and why is it important?",
              "Describe the difference between virtualization and containerization.",
              "What are the basic Docker commands and how do you create a Dockerfile?",
              "Explain the purpose of version control in DevOps practices."
            ],
            intermediate: [
              "How do you design a CI/CD pipeline for a microservices architecture?",
              "Explain Kubernetes architecture and its core components.",
              "Describe your experience with configuration management tools like Ansible or Terraform.",
              "How do you implement monitoring and alerting for production systems?",
              "Explain blue-green deployments and canary releases."
            ],
            advanced: [
              "Design a highly available, multi-region Kubernetes deployment.",
              "How do you implement GitOps practices in a large organization?",
              "Explain service mesh architecture and when you would use it.",
              "How do you handle secrets management in a distributed system?",
              "Describe your approach to disaster recovery and business continuity."
            ],
            expert: [
              "Design a platform that enables self-service infrastructure for multiple teams.",
              "How would you implement security controls across a complex cloud environment?",
              "Explain how you would build a multi-cloud strategy with failover capabilities.",
              "Design a system for automatically remediating common infrastructure issues.",
              "How do you optimize cloud costs while maintaining performance and reliability?"
            ]
          },
          behavioral: {
            beginner: [
              "Tell me about your journey into DevOps.",
              "What interests you about infrastructure and operations?",
              "Describe a project where you improved deployment processes.",
              "How do you approach learning new DevOps tools and practices?",
              "What cloud platforms have you worked with?"
            ],
            intermediate: [
              "Tell me about a time you resolved a critical production incident.",
              "How do you balance speed of deployment with system stability?",
              "Describe your experience collaborating with development teams.",
              "How do you handle on-call responsibilities and incidents?",
              "Tell me about a time you automated a manual process."
            ],
            advanced: [
              "Describe your experience leading infrastructure migrations.",
              "How have you improved system reliability and performance metrics?",
              "Tell me about a time you had to make difficult trade-offs in infrastructure design.",
              "How do you promote DevOps culture across an organization?",
              "Describe your approach to capacity planning and scaling."
            ],
            expert: [
              "How have you shaped infrastructure strategy in your organization?",
              "Tell me about a time you designed a system for extreme scale or reliability.",
              "How do you mentor other engineers in DevOps practices?",
              "Describe your philosophy on infrastructure as code and automation.",
              "How do you evaluate and adopt new cloud technologies?"
            ]
          }
        }
      };

      // Map difficulty names to keys
      const difficultyMap = {
        "Beginner": "beginner",
        "Intermediate": "intermediate",
        "Advanced": "advanced",
        "Expert": "expert"
      };

      // Map interview type names to keys
      const typeMap = {
        "Technical": "technical",
        "System Design": "systemDesign",
        "Behavioral": "behavioral",
        "Mixed": "mixed"
      };

      const difficultyKey = difficultyMap[difficulty?.name] || "intermediate";
      const typeKey = typeMap[type?.name] || "mixed";

      // Get the role-specific questions or use default
      const roleQuestions = questionDatabase[role] || questionDatabase["Software Engineer"];
      
      let selectedQuestions = [];

      if (typeKey === "mixed") {
        // Mix technical, behavioral, and system design questions
        const technicalQuestions = roleQuestions.technical?.[difficultyKey] || [];
        const behavioralQuestions = roleQuestions.behavioral?.[difficultyKey] || [];
        const systemQuestions = roleQuestions.systemDesign?.[difficultyKey] || [];
        
        // Combine in a structured way (not shuffled)
        selectedQuestions = [
          ...technicalQuestions.slice(0, 3),
          ...behavioralQuestions.slice(0, 2),
          ...systemQuestions.slice(0, 2)
        ];
      } else if (typeKey === "technical") {
        selectedQuestions = roleQuestions.technical?.[difficultyKey] || [];
      } else if (typeKey === "behavioral") {
        selectedQuestions = roleQuestions.behavioral?.[difficultyKey] || [];
      } else if (typeKey === "systemDesign") {
        selectedQuestions = roleQuestions.systemDesign?.[difficultyKey] || [];
      }

      // If no questions found, use fallback
      if (selectedQuestions.length === 0) {
        selectedQuestions = [
          `Tell me about your experience as a ${role}.`,
          `What are your greatest strengths that make you suitable for this ${difficulty?.name} level ${role} position?`,
          `Describe a challenging project you worked on as a ${role}.`,
          `How do you stay updated with the latest trends in ${selectedDomain?.name || 'your field'}?`,
          `Where do you see your career as a ${role} in the next few years?`
        ];
      }

      // Limit to 5-7 questions for better flow
      selectedQuestions = selectedQuestions.slice(0, 7);
      
      setQuestions(selectedQuestions);
      setCurrentQuestionIndex(0);
      
    } catch (error) {
      console.error("Error loading questions:", error);
      // Ultimate fallback questions
      setQuestions([
        `Tell me about your experience as a ${jobRole}.`,
        `What are your greatest professional strengths?`,
        `Describe a challenging situation at work and how you handled it.`,
        `Where do you see yourself in five years?`,
        `Why are you interested in this ${jobRole} position?`
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start the interview with welcome message
  const startInterview = () => {
    if (welcomeSpoken) return;
    
    const welcomeMessage = `Hello! I'm ${avatar?.name || 'your AI interviewer'}. I'll be conducting a ${selectedDifficulty?.name || 'intermediate'} level ${selectedType?.name || 'mixed'} interview for the ${jobRole} position. The interview will consist of ${questions.length} questions. Let's begin with the first question.`;
    
    setWelcomeSpoken(true);
    
    speak(welcomeMessage, () => {
      // After welcome, ask first question
      setTimeout(() => {
        askCurrentQuestion();
      }, 500);
    });
  };

  // UPDATED: Ask the current question using refs to prevent duplicates
  const askCurrentQuestion = () => {
    if (questionsRef.current.length === 0) return;
    
    const currentIdx = currentQuestionIndexRef.current;
    
    if (currentIdx >= questionsRef.current.length) {
      generateFeedback();
      return;
    }
    
    const currentQuestion = questionsRef.current[currentIdx];
    
    // Prevent asking the same question multiple times
    if (currentQuestionRef.current === currentQuestion) return;
    
    currentQuestionRef.current = currentQuestion;
    console.log(`Asking question ${currentIdx + 1}:`, currentQuestion);
    setShowQuestion(true);
    setTranscript("");
    speak(currentQuestion);
  };

  // Text to Speech
  const speak = useCallback((text, callback) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      if (callback) callback();
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.9; // Slightly slower for better clarity
    speech.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes("Google UK") || voice.name.includes("Samantha") || voice.name.includes("Alex")
    );
    if (preferredVoice) {
      speech.voice = preferredVoice;
    }
    
    speech.onstart = () => {
      console.log("Started speaking:", text.substring(0, 30) + "...");
    };
    
    speech.onend = () => {
      console.log("Finished speaking");
      setIsSpeaking(false);
      if (callback) callback();
    };
    
    speech.onerror = (event) => {
      console.error("Speech error:", event);
      setIsSpeaking(false);
      if (callback) callback();
    };
    
    window.speechSynthesis.speak(speech);
  }, []);

  // Speech recognition
  const startListening = async () => {
    if (isSpeaking) {
      setError("Please wait for the avatar to finish speaking.");
      return;
    }
    
    if (isProcessingAnswer) return; // Prevent multiple submissions
    
    if (micPermission !== "granted") {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;
    
    let finalTranscript = "";
    setIsListening(true);
    setTranscript("");
    setError(null);

    recognition.onstart = () => {
      console.log("Started listening");
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          setTranscript(finalTranscript);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setMicPermission("denied");
        setError("Microphone access denied. Please enable microphone access.");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      setIsListening(false);
      
      if (finalTranscript && finalTranscript.trim().length > 0) {
        handleAnswerSubmission(finalTranscript.trim());
      } else {
        setError("No speech detected. Please try again.");
      }
    };

    recognition.start();
  };

  // UPDATED: Handle answer submission with proper index tracking
  const handleAnswerSubmission = (answerText) => {
    if (isProcessingAnswer) return; // Prevent multiple submissions
    
    setIsProcessingAnswer(true);
    
    // Use ref to get current values (more reliable than state inside callbacks)
    const currentIdx = currentQuestionIndexRef.current;
    const currentQuestions = questionsRef.current;
    
    const answerData = {
      question: currentQuestions[currentIdx],
      answer: answerText,
      timestamp: new Date().toISOString(),
      questionIndex: currentIdx,
      domain: selectedDomain?.name,
      role: jobRole,
      difficulty: selectedDifficulty?.name,
      type: selectedType?.name
    };
    
    setAnswers(prev => [...prev, answerData]);
    
    if (onQuestionAnswer) {
      onQuestionAnswer(answerData);
    }
    
    // Clear current question ref for next question
    currentQuestionRef.current = null;
    
    const isLastQuestion = currentIdx === currentQuestions.length - 1;
    
    const acknowledgement = isLastQuestion 
      ? "Thank you for completing all questions. I'm now generating your feedback."
      : "Thank you for your response. ";
    
    speak(acknowledgement, () => {
      setTimeout(() => {
        if (!isLastQuestion) {
          // Calculate next index based on the answered question
          const nextIndex = currentIdx + 1;
          
          // Store in ref for reliability
          nextQuestionIndexRef.current = nextIndex;
          
          // Update state
          setCurrentQuestionIndex(nextIndex);
          
          // Small delay to ensure state update completes
          setTimeout(() => {
            setIsProcessingAnswer(false);
            setShowQuestion(true);
            setTranscript("");
            
            // Get the question using the ref
            const nextQuestion = questionsRef.current[nextQuestionIndexRef.current];
            console.log(`Asking question ${nextIndex + 1}:`, nextQuestion);
            speak(nextQuestion);
            
            // Clear the ref
            nextQuestionIndexRef.current = null;
          }, 300);
        } else {
          setIsProcessingAnswer(false);
          generateFeedback();
        }
      }, 500);
    });
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Navigate to results page
  const goToResults = () => {
    navigate('/results', { 
      state: { 
        feedback: feedback,
        answers: answers,
        selections: planningSelections,
        jobRole: jobRole
      } 
    });
  };

  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getVideoTracks();
      tracks.forEach(t => (t.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  // Progress percentage
  const progressPercentage = questions.length > 0 
    ? ((currentQuestionIndex) / questions.length) * 100 
    : 0;

  return (
    <div className="interview-page">
      {/* Background */}
      <div className="interview-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Avatar Display */}
        <div className="avatar-wrapper">
          <div 
            className={`avatar-circle ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}
            style={{ borderColor: selectedDomain?.color || '#3b82f6' }}
          >
            {avatarImageUrl && (
              <img 
                src={avatarImageUrl} 
                alt={avatar?.name}
                className="avatar-image"
              />
            )}
          </div>

          {/* Status Indicators */}
          <div className="avatar-status">
            <h2 className="avatar-name">{avatar?.name || 'AI Interviewer'}</h2>
            <p className="avatar-role">{avatar?.role || 'Professional Interviewer'}</p>
            <div className="status-badge">
              {isSpeaking && <span className="speaking-badge">🔊 Speaking Now</span>}
              {isListening && <span className="listening-badge">🎤 Listening</span>}
              {!isSpeaking && !isListening && micPermission === "granted" && !feedback && (
                <span className="ready-badge">✓ Ready for Your Answer</span>
              )}
              {micPermission === "denied" && (
                <span className="error-badge">❌ Microphone Blocked</span>
              )}
            </div>
          </div>
        </div>

        {showAvatarSelect ? (
          /* ===== AVATAR SELECTION ===== */
          <div className="avatar-selection">
            <h2>Choose Your Interviewer</h2>
            <p>
              {userProfile?.industry
                ? `Personalized for ${userProfile.industry}.`
                : "Select an AI interviewer and start your 1:1 mock interview"}
            </p>

            <div className="interview-config-panel">
              <div className="config-item">
                <label htmlFor="configMode">Interview Focus</label>
                <select
                  id="configMode"
                  value={interviewConfig.mode}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, mode: e.target.value }))}
                >
                  <option value="balanced">Balanced</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="communication">Communication</option>
                </select>
              </div>

              <div className="config-item">
                <label htmlFor="configDifficulty">Difficulty</label>
                <select
                  id="configDifficulty"
                  value={interviewConfig.difficulty}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, difficulty: e.target.value }))}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="config-item">
                <label htmlFor="configCount">Question Count</label>
                <input
                  id="configCount"
                  type="number"
                  min="3"
                  max="10"
                  value={interviewConfig.questionCount}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, questionCount: Number(e.target.value) || 5 }))}
                />
              </div>
            </div>

            <div className="avatars-grid">
              {avatars.map(avatar => (
                <div
                  key={avatar.id}
                  className={`avatar-card ${hoveredAvatarId === avatar.id ? "avatar-card-hovered" : ""}`}
                  onClick={() => startInterview(avatar)}
                  onMouseEnter={() => setHoveredAvatarId(avatar.id)}
                  onMouseLeave={() => setHoveredAvatarId(null)}
                  style={{ background: avatar.bgColor }}
                >
                  {/* Animated SVG avatar preview */}
                  <div className="avatar-preview">
                    <AvatarFigure
                      avatar={avatar}
                      isSpeaking={hoveredAvatarId === avatar.id}
                      posture={hoveredAvatarId === avatar.id ? "speaking" : "idle"}
                    />
                  </div>

                  <h3>{avatar.name}</h3>
                  <p className="avatar-role">{avatar.role}</p>
                  <button className="select-avatar-btn">
                    Start Interview →
                  </button>
                </div>
              ))}
            </div>
          </div>

        ) : showResults ? (
          /* ===== RESULTS ===== */
          <div className="results-screen">
            <div className="results-card">
              <div className="results-icon">🏆</div>
              <h2>Interview Completed!</h2>
              <p>Great job! Your interview has been analyzed.</p>

              <div className="results-stats">
                <div className="result-stat">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{formatTime(timeElapsed)}</span>
                </div>
                <div className="result-stat">
                  <span className="stat-label">Questions</span>
                  <span className="stat-value">{currentQuestion}</span>
                </div>
                <div className="result-stat">
                  <span className="stat-label">Mode</span>
                  <span className="stat-value">{useChat ? "Chat" : "Video"}</span>
                </div>
              </div>

              <div className="results-actions">
                <Link to="/results" className="view-results-btn">View Detailed Results →</Link>
                <button
                  className="new-interview-btn"
                  onClick={() => {
                    setShowAvatarSelect(true);
                    setSelectedAvatar(null);
                    setMessages([]);
                    setCurrentQuestion(0);
                    setTimeElapsed(0);
                    setAvatarPosture("idle");
                  }}
                >
                  New Interview
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ===== ACTIVE INTERVIEW SESSION ===== */
          <div className="interview-session">
            <div className="interview-main">
              {/* Left: AI avatar panel + user video */}
              <div className="interview-area">
                {/* AI Avatar Panel (always visible) */}
                <div className="ai-avatar-panel">
                  <div className="panel-bg-lines"></div>

                  {/* Animated human avatar */}
                  <AvatarFigure
                    avatar={selectedAvatar}
                    isSpeaking={isSpeaking}
                    posture={avatarPosture}
                  />

                  <div className="ai-panel-name">{selectedAvatar?.name}</div>
                  <div className="ai-panel-role">{selectedAvatar?.role}</div>
                  <div className="ai-panel-status">
                    <span className="status-dot"></span>
                    <span>{isAiTyping ? "Thinking…" : isSpeaking ? "Speaking…" : "Listening"}</span>
                  </div>

                  <div className="panel-desk"></div>
                </div>

                {/* User video / chat toggle */}
                {!useChat ? (
                  <div className="video-container video-container-user">
                    <video ref={videoRef} autoPlay playsInline muted={isMuted} className={isVideoOff ? "video-off" : ""} />
                    {isVideoOff && (
                      <div className="video-off-placeholder">
                        <span className="video-off-icon">📹</span>
                        <p>Camera is off</p>
                      </div>
                    )}
                    <div className="video-controls">
                      <button className={`control-btn ${isMuted ? "active" : ""}`} onClick={toggleMute}>
                        {isMuted ? "🔇" : "🎤"}
                      </button>
                      <button className={`control-btn ${isVideoOff ? "active" : ""}`} onClick={toggleVideo}>
                        {isVideoOff ? "📷" : "🎥"}
                      </button>
                      <button className="control-btn settings" onClick={() => setUseChat(true)}>
                        💬 Chat Mode
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Chat mode */
                  <div className="chat-container">
                    <div className="chat-header">
                      <div className="chat-avatar">
                        <span className="chat-avatar-icon">{selectedAvatar?.avatar}</span>
                        <div>
                          <h3>{selectedAvatar?.name}</h3>
                          <p>{selectedAvatar?.role}</p>
                        </div>
                      </div>
                      <button className="switch-video-btn" onClick={() => setUseChat(false)}>
                        📹 Video Mode
                      </button>
                    </div>

                    <div className="chat-messages" ref={chatContainerRef}>
                      {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender === "user" ? "user-message" : "ai-message"}`}>
                          <div className="message-avatar">
                            {msg.sender === "user" ? "👤" : selectedAvatar?.avatar}
                          </div>
                          <div className="message-content">
                            <div className="message-header">
                              <span className="message-sender">
                                {msg.sender === "user" ? "You" : selectedAvatar?.name}
                              </span>
                              <span className="message-time">{msg.timestamp}</span>
                            </div>
                            <p className="message-text">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                      {isAiTyping && (
                        <div className="message ai-message">
                          <div className="message-avatar">{selectedAvatar?.avatar}</div>
                          <div className="message-content">
                            <div className="typing-indicator">
                              <span></span><span></span><span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={sendMessage} className="chat-input-form">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        placeholder="Type your response…"
                        className="chat-input"
                        disabled={isAiTyping}
                      />
                      <button type="submit" className="send-btn" disabled={isAiTyping || !inputMessage.trim()}>
                        Send →
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Feedback Sidebar (grammar, improvements, topics) */}
              <FeedbackSidebar
                lastUserMessage={lastUserMessage}
                isOpen={feedbackOpen}
                onToggle={() => setFeedbackOpen(o => !o)}
              />

              {/* Right Interview Detail Sidebar */}
              <div className="interview-sidebar">
                <div className="current-question">
                  <h3>Interview Progress</h3>
                  <div className="question-box">
                    <p>{messages.filter(m => m.sender === "ai").slice(-1)[0]?.message || "Waiting for interview to start…"}</p>
                  </div>
                  <div className="question-progress">
                    <span>Question {currentQuestion} / 5</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min((currentQuestion / 5) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="interview-info">
                  <h3>Interview Details</h3>
                  <div className="info-item">
                    <span className="info-label">Interviewer:</span>
                    <span className="info-value">{selectedAvatar?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{selectedAvatar?.role}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mode:</span>
                    <span className="info-value">{useChat ? "Chat" : "Video"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration:</span>
                    <span className="info-value">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value" style={{ color: isSpeaking ? "#10b981" : isAiTyping ? "#f59e0b" : "#99aacc" }}>
                      {isAiTyping ? "🤔 Thinking" : isSpeaking ? "🗣️ Speaking" : "👂 Listening"}
                    </span>
                  </div>
                </div>

                <div className="interview-tips">
                  <h3>Quick Tips</h3>
                  <ul>
                    <li>✓ Speak clearly and confidently</li>
                    <li>✓ Use the STAR method for answers</li>
                    <li>✓ Take your time before answering</li>
                    <li>✓ Maintain eye contact</li>
                  </ul>
                </div>

                <button className="end-interview-btn" onClick={endInterview}>
                  End Interview
                </button>
              </div>
            </div>

            <div className="feedback-summary">
              <p>{feedback.summary}</p>
            </div>

            {/* Results and Restart Buttons */}
            <div className="feedback-actions">
              <button 
                className="results-button"
                onClick={goToResults}
              >
                📊 View Detailed Results
              </button>
              <button 
                className="restart-button"
                onClick={() => window.location.reload()}
              >
                🔄 Start New Interview
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={requestMicrophonePermission}>Retry Microphone Access</button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Preparing your {selectedDifficulty?.name} level {selectedType?.name} interview questions...</p>
          </div>
        )}

        {/* Control Buttons */}
        {!feedback && !isLoading && questions.length > 0 && showQuestion && !isListening && (
          <div className="control-buttons">
            <button 
              onClick={startListening}
              disabled={isSpeaking || micPermission !== "granted"}
              className="button start-button"
            >
              {isSpeaking ? (
                <span className="button-content">
                  <span className="spinner-small"></span>
                  AI Speaking...
                </span>
              ) : (
                <span className="button-content">
                  🎤 Answer Question {currentQuestionIndex + 1}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Stop button when listening */}
        {isListening && (
          <div className="control-buttons">
            <button 
              onClick={stopListening}
              className="button stop-button"
            >
              ⏹️ Stop Recording
            </button>
          </div>
        )}

        {/* Microphone permission prompt */}
        {micPermission === "prompt" && !error && !feedback && (
          <div className="permission-prompt">
            <div className="prompt-icon">🎙️</div>
            <div className="prompt-text">
              <p className="prompt-title">Microphone Access Needed</p>
              <p className="prompt-subtitle">Please allow microphone access to begin the interview</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .interview-header {
          background: rgba(10, 25, 41, 0.95);
          backdrop-filter: blur(10px);
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2d4b6e;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .interview-title {
          font-size: 24px;
          font-weight: 600;
          color: #90caf9;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .interview-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .role-badge, .difficulty-badge, .type-badge, .domain-indicator {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .role-badge {
          background: #1e3a5f;
          color: #bbdefb;
          border: 1px solid #3b82f6;
        }

        .difficulty-badge {
          color: #0a1929;
          font-weight: 600;
        }

        .type-badge {
          background: #2d4b6e;
          color: #e5e9f0;
        }

        .domain-indicator {
          background: #132f4c;
          color: #90caf9;
          border: 1px solid #2d4b6e;
        }

        .interview-summary-badges {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 25px;
        }

        .summary-role, .summary-difficulty, .summary-type {
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
        }

        .summary-role {
          background: #1e3a5f;
          color: #bbdefb;
        }

        .summary-difficulty {
          background: #4caf50;
          color: #0a1929;
        }

        .summary-type {
          background: #60a5fa;
          color: #0a1929;
        }

        .avatar-container {
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1929 0%, #1a2f3f 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          color: #e5e9f0;
          position: relative;
          overflow-x: hidden;
        }

        .main-content {
          padding: 40px 30px;
        }

        .avatar-wrapper {
          text-align: center;
          margin-bottom: 30px;
          position: relative;
        }

        .avatar-circle {
          width: 200px;
          height: 200px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: #132f4c;
          border: 4px solid;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 100, 255, 0.3);
          transition: all 0.3s ease;
          position: relative;
        }

        .avatar-circle.speaking {
          animation: professional-pulse 1.5s infinite;
          box-shadow: 0 0 40px #3b82f6;
        }

        .avatar-circle.listening {
          box-shadow: 0 0 40px #60a5fa;
          border-color: #60a5fa;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-name {
          font-size: 32px;
          margin: 0 0 5px;
          color: #e5e9f0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          font-weight: 600;
        }

        .avatar-role {
          font-size: 18px;
          margin: 0 0 15px;
          color: #90caf9;
          opacity: 0.9;
        }

        .status-badge {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .speaking-badge, .listening-badge, .ready-badge, .error-badge {
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .speaking-badge {
          background: #ffb74d;
          color: #312107;
          box-shadow: 0 2px 10px rgba(255, 183, 77, 0.3);
        }

        .listening-badge {
          background: #60a5fa;
          color: #0a1929;
          box-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
        }

        .ready-badge {
          background: #4caf50;
          color: #0a1929;
          box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
        }

        .error-badge {
          background: #f44336;
          color: #0a1929;
          box-shadow: 0 2px 10px rgba(244, 67, 54, 0.3);
        }

        .progress-container {
          max-width: 700px;
          margin: 30px auto;
          text-align: center;
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          background: #1e3a5f;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 10px;
          border: 1px solid #2d4b6e;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          transition: width 0.5s ease;
          box-shadow: 0 0 10px #3b82f6;
        }

        .progress-text {
          font-size: 15px;
          color: #90caf9;
          font-weight: 500;
        }

        .question-card {
          max-width: 850px;
          margin: 0 auto 30px;
          animation: slideIn 0.5s ease;
        }

        .ai-thinking {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .ai-label {
          color: #90caf9;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .question-bubble {
          background: #132f4c;
          border-radius: 20px;
          padding: 30px;
          border: 2px solid #2d4b6e;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .question-bubble::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 30px;
          width: 20px;
          height: 20px;
          background: #132f4c;
          border-top: 2px solid #2d4b6e;
          border-left: 2px solid #2d4b6e;
          transform: rotate(45deg);
        }

        .question-text {
          font-size: 20px;
          color: #e5e9f0;
          line-height: 1.7;
          margin: 0;
          font-weight: 400;
          text-align: left;
        }

        .listening-indicator {
          max-width: 600px;
          margin: 0 auto 30px;
          padding: 25px 30px;
          background: #0d2a40;
          border-radius: 60px;
          display: flex;
          align-items: center;
          gap: 20px;
          border: 2px solid #60a5fa;
          box-shadow: 0 5px 25px rgba(96, 165, 250, 0.3);
        }

        .mic-icon {
          font-size: 32px;
          animation: mic-pulse 1s infinite;
        }

        .listening-text {
          flex: 1;
        }

        .listening-title {
          font-size: 18px;
          font-weight: 600;
          color: #e5e9f0;
          margin: 0 0 5px;
        }

        .listening-subtitle {
          font-size: 14px;
          color: #90caf9;
          margin: 0;
        }

        .sound-waves {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .wave-bar {
          width: 5px;
          height: 25px;
          background: #60a5fa;
          border-radius: 3px;
          animation: sound-wave 1s ease-in-out infinite;
        }

        .transcript-card {
          max-width: 700px;
          margin: 0 auto 30px;
          padding: 25px;
          background: #0f3a4f;
          border-radius: 16px;
          border-left: 5px solid #4caf50;
          box-shadow: 0 5px 20px rgba(0,0,0,0.5);
        }

        .transcript-label {
          font-size: 13px;
          color: #4caf50;
          font-weight: 600;
          margin: 0 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .transcript-text {
          font-size: 17px;
          color: #e5e9f0;
          font-style: italic;
          line-height: 1.6;
          margin: 0;
        }

        .feedback-container {
          max-width: 850px;
          margin: 0 auto;
          padding: 45px;
          background: #0d2a40;
          border-radius: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
          border: 1px solid #2d4b6e;
        }

        .feedback-title {
          font-size: 28px;
          color: #e5e9f0;
          text-align: center;
          margin-bottom: 35px;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .score-card {
          display: flex;
          justify-content: center;
          margin-bottom: 45px;
        }

        .overall-score {
          width: 180px;
          height: 180px;
          background: linear-gradient(135deg, #1e3a5f, #2d4b6e);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 4px solid #3b82f6;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }

        .score-value {
          font-size: 52px;
          font-weight: bold;
          color: #90caf9;
          line-height: 1;
        }

        .score-label {
          font-size: 14px;
          color: #bbdefb;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .feedback-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 35px;
        }

        .strengths-section h4,
        .improvements-section h4 {
          font-size: 18px;
          color: #90caf9;
          margin-bottom: 20px;
          border-bottom: 2px solid #2d4b6e;
          padding-bottom: 10px;
        }

        .strengths-section ul,
        .improvements-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .strengths-section li,
        .improvements-section li {
          padding: 12px 18px;
          background: #1a3349;
          border-radius: 10px;
          margin-bottom: 12px;
          font-size: 15px;
          color: #e5e9f0;
          border: 1px solid #2d4b6e;
          transition: transform 0.2s;
        }

        .strengths-section li:hover,
        .improvements-section li:hover {
          transform: translateX(5px);
          border-color: #3b82f6;
        }

        .feedback-summary {
          padding: 25px;
          background: #1a3349;
          border-radius: 16px;
          margin-bottom: 35px;
          font-size: 16px;
          color: #bbdefb;
          line-height: 1.8;
          border: 1px solid #2d4b6e;
        }

        .feedback-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 30px;
        }

        .results-button, .restart-button {
          padding: 16px 30px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex: 1;
          max-width: 250px;
        }

        .results-button {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: 2px solid #60a5fa;
        }

        .results-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .restart-button {
          background: linear-gradient(135deg, #1e3a5f, #2d4b6e);
          color: #e5e9f0;
          border: 2px solid #3b82f6;
        }

        .restart-button:hover {
          background: linear-gradient(135deg, #2d4b6e, #1e3a5f);
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .error-message {
          max-width: 550px;
          margin: 30px auto;
          padding: 25px;
          background: #2d1a1a;
          border-radius: 16px;
          text-align: center;
          border: 2px solid #f44336;
        }

        .error-message p {
          color: #ffb4b4;
          margin-bottom: 20px;
          font-size: 16px;
        }

        .error-message button {
          padding: 12px 30px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .error-message button:hover {
          background: #d32f2f;
          transform: translateY(-2px);
        }

        .loading-indicator {
          text-align: center;
          padding: 50px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #1e3a5f;
          border-top-color: #3b82f6;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }

        .spinner-small {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid transparent;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }

        .control-buttons {
          text-align: center;
          margin-top: 40px;
        }

        .button {
          padding: 16px 50px;
          font-size: 18px;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
          min-width: 350px;
        }

        .button:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.6);
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .start-button {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .stop-button {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .permission-prompt {
          max-width: 550px;
          margin: 30px auto;
          padding: 30px;
          background: linear-gradient(135deg, #1e3a5f, #2d4b6e);
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 25px;
          border: 2px solid #3b82f6;
        }

        .prompt-icon {
          font-size: 48px;
          animation: bounce 2s infinite;
        }

        .prompt-text {
          flex: 1;
        }

        .prompt-title {
          font-size: 20px;
          font-weight: 600;
          color: #e5e9f0;
          margin: 0 0 8px;
        }

        .prompt-subtitle {
          font-size: 15px;
          color: #90caf9;
          margin: 0;
        }

        @keyframes professional-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px #3b82f6; }
          50% { transform: scale(1.02); box-shadow: 0 0 60px #3b82f6; }
        }

        @keyframes mic-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes sound-wave {
          0%, 100% { height: 20px; }
          50% { height: 40px; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @media (max-width: 768px) {
          .avatar-container {
            padding: 15px;
          }
          
          .interview-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
          
          .interview-badges {
            justify-content: center;
          }
          
          .feedback-sections {
            grid-template-columns: 1fr;
          }
          
          .feedback-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .results-button, .restart-button {
            max-width: 100%;
          }
          
          .question-text {
            font-size: 18px;
          }
          
          .listening-indicator {
            flex-direction: column;
            text-align: center;
            border-radius: 20px;
          }
          
          .button {
            min-width: 280px;
            padding: 14px 30px;
            font-size: 16px;
          }
          
          .permission-prompt {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Avatar;