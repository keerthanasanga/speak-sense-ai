import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PageFeaturePanel from "../components/PageFeaturePanel";
import "./landing.css";

export default function Landing() {
  const getViewport = () => {
    if (typeof window === "undefined") {
      return { width: 1280, height: 720 };
    }
    return {
      width: Math.max(window.innerWidth || 0, 320),
      height: Math.max(window.innerHeight || 0, 480),
    };
  };

  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoStatus, setDemoStatus] = useState("");
  const [viewport, setViewport] = useState(() => getViewport());
  const canvasRef = useRef(null);
  const demoUtteranceRef = useRef(null);
  const demoPlaybackIdRef = useRef(0);

  const getCompanyBadge = (company) => {
    if (!company) return "•";
    const words = company.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return company.slice(0, 2).toUpperCase();
  };

  // AI Avatars data
  const aiAvatars = [
    {
      id: 1,
      name: "Nova",
      role: "Technical Interview Specialist",
      avatar: "🧠",
      color: "#00f2fe",
      gradient: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
      message: "I'll help you crack technical interviews at top tech companies!",
      specialty: ["Algorithms", "System Design", "Coding"]
    },
    {
      id: 2,
      name: "Atlas",
      role: "Behavioral Coach",
      avatar: "🌟",
      color: "#a18cd1",
      gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      message: "Let's perfect your storytelling and soft skills!",
      specialty: ["Leadership", "Communication", "Conflict Resolution"]
    },
    {
      id: 3,
      name: "Echo",
      role: "Industry Expert",
      avatar: "💼",
      color: "#43e97b",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      message: "I specialize in your target industry's interview patterns!",
      specialty: ["Market Trends", "Industry Insights", "Role-specific"]
    },
    {
      id: 4,
      name: "Sage",
      role: "Feedback Analyst",
      avatar: "📊",
      color: "#fa709a",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      message: "I provide deep insights into your performance!",
      specialty: ["Performance Metrics", "Improvement Tips", "Progress Tracking"]
    }
  ];

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !window.speechSynthesis) return undefined;

    const synth = window.speechSynthesis;

    const preloadVoices = () => {
      synth.getVoices();
    };

    preloadVoices();
    synth.addEventListener?.("voiceschanged", preloadVoices);

    return () => {
      synth.removeEventListener?.("voiceschanged", preloadVoices);
      synth.cancel?.();
      demoUtteranceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setViewport(getViewport());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Neural network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const particleCount = 60;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 108, 255, 0.3)';
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(other => {
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(100, 108, 255, ${0.15 * (1 - distance / 120)})`;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const features = [
    {
      icon: "⚡",
      title: "Real-time AI Analysis",
      description: "Get instant feedback on your responses with sentiment and confidence analysis",
      color: "#00f2fe"
    },
    {
      icon: "📊",
      title: "Deep Performance Analytics",
      description: "Track your progress with comprehensive metrics and personalized insights",
      color: "#a18cd1"
    },
    {
      icon: "🤖",
      title: "Intelligent AI Interviewer",
      description: "Practice with advanced AI that adapts to your responses in real-time",
      color: "#43e97b"
    },
    {
      icon: "🎯",
      title: "Personalized Coaching",
      description: "Receive customized recommendations to improve your interview skills",
      color: "#fa709a"
    }
  ];

  const stats = [
    { value: "98%", label: "Success Rate", icon: "🏆" },
    { value: "50K+", label: "Interviews Conducted", icon: "🎙️" },
    { value: "4.9/5", label: "User Rating", icon: "⭐" },
    { value: "24/7", label: "AI Availability", icon: "🔄" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer at Google",
      feedback: "Speak Sense AI's real-time feedback helped me identify and fix my weak points. The AI interviewer felt so real that the actual Google interview seemed easier!",
      rating: 5,
      avatar: "👩‍💻",
      company: "Google"
    },
    {
      name: "Michael Chen",
      role: "Product Manager at Microsoft",
      feedback: "The behavioral coaching from Atlas was game-changing. I learned to structure my answers perfectly and landed my dream PM role at Microsoft.",
      rating: 5,
      avatar: "👨‍💼",
      company: "Microsoft"
    },
    {
      name: "Priya Patel",
      role: "Data Scientist at Amazon",
      feedback: "The industry-specific questions from Echo were incredibly accurate. I felt fully prepared for every technical question Amazon threw at me.",
      rating: 5,
      avatar: "👩‍🔬",
      company: "Amazon"
    }
  ];

  const handleWatchDemo = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setDemoStatus("Voice preview is not supported in this browser.");
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      demoPlaybackIdRef.current += 1;
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setDemoStatus("AI demo paused.");
      return;
    }

    setDemoStatus("");

    const script = `Hi, I am Nova, your AI interview coach. I can run technical and behavioral interview practice, then give instant feedback on clarity, confidence, and relevance. Ready to start your mock interview?`;
    const voices = window.speechSynthesis.getVoices();

    const selectedVoice =
      voices.find((voice) => /en/i.test(voice.lang) && /female|zira|aria|samantha|google uk english female/i.test(voice.name))
      || voices.find((voice) => /en/i.test(voice.lang))
      || voices[0]
      || null;

    const playbackId = demoPlaybackIdRef.current + 1;
    demoPlaybackIdRef.current = playbackId;

    const speakWithFallback = (attempt = 0) => {
      const utterance = new SpeechSynthesisUtterance(script);
      const shouldUsePreferredVoice = attempt === 0 && selectedVoice;

      if (shouldUsePreferredVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || "en-US";
      } else {
        utterance.lang = "en-US";
      }

      utterance.rate = 0.98;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onend = () => {
        if (demoPlaybackIdRef.current !== playbackId) return;
        setIsPlaying(false);
        setDemoStatus("AI demo finished. Tap again to replay.");
        demoUtteranceRef.current = null;
      };

      utterance.onerror = () => {
        if (demoPlaybackIdRef.current !== playbackId) return;
        if (attempt === 0) {
          speakWithFallback(1);
          return;
        }
        setIsPlaying(false);
        setDemoStatus("Couldn't play AI voice preview. Please try Chrome or Edge.");
        demoUtteranceRef.current = null;
      };

      demoUtteranceRef.current = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    };

    speakWithFallback(0);
  };

  return (
    <div className="landing-container" onMouseMove={handleMouseMove}>
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="neural-bg"
        width={viewport.width}
        height={viewport.height}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-particles"></div>
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <div className="ai-badge">
            <span className="pulse-dot"></span>
            Powered by Advanced AI
          </div>

          <h1 className="hero-title">
            Master Your Interviews with
            <span className="gradient-text-animated"> AI-Powered Intelligence</span>
          </h1>

          <p className="hero-description">
            Experience the future of interview preparation with our advanced AI system that
            provides real-time feedback, personalized coaching, and comprehensive analytics
            to help you land your dream job.
          </p>

          {/* AI Avatar Showcase */}
          <div className="hero-avatars">
            {aiAvatars.map((avatar, index) => (
              <div
                key={avatar.id}
                className="hero-avatar"
                style={{
                  animation: `floatAvatar ${3 + index * 0.5}s ease-in-out infinite`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <div
                  className="avatar-ring"
                  style={{ background: avatar.gradient }}
                ></div>
                <div className="avatar-icon">{avatar.avatar}</div>
                <div className="avatar-tooltip">
                  <strong>{avatar.name}</strong>
                  <span>{avatar.role}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Voice Demo Button */}
          <div className="ai-demo-wrap">
            <div className="ai-demo">
              <button
                type="button"
                className={`demo-btn ${isPlaying ? 'playing' : ''}`}
                onClick={handleWatchDemo}
                aria-pressed={isPlaying}
              >
                <span className="demo-icon">{isPlaying ? '⏸️' : '▶️'}</span>
                <span className="demo-text">
                  {isPlaying ? 'Playing AI Demo...' : 'Hear AI in Action'}
                </span>
              </button>
              <div className="waveform">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            {demoStatus && (
              <p className="demo-status" role="status" aria-live="polite">
                {demoStatus}
              </p>
            )}
          </div>

          <div className="cta-buttons">

      <PageFeaturePanel pageKey="landing" />
            <Link to="/signup" className="primary-btn glow-effect">
              Start Free Trial
              <span className="btn-icon">→</span>
            </Link>
            <Link to="/login" className="secondary-btn">
              Sign In
            </Link>
          </div>

          {/* Floating Stats with Icons */}
          <div className="floating-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="animated-bg">
          <div className="gradient-sphere sphere-1"></div>
          <div className="gradient-sphere sphere-2"></div>
          <div className="gradient-sphere sphere-3"></div>
        </div>
      </section>

      {/* AI Features Showcase */}
      <section className="features-showcase">
        <div className="section-header">
          <h2>Meet Your <span className="gradient-text">AI Coaches</span></h2>
          <p>Four specialized AI assistants working together to prepare you for success</p>
        </div>

        <div className="ai-avatars-grid">
          {aiAvatars.map((avatar, index) => (
            <div
              key={avatar.id}
              className="ai-avatar-card"
              style={{
                background: `linear-gradient(135deg, ${avatar.color}15, ${avatar.color}05)`,
                borderColor: `${avatar.color}30`
              }}
            >
              <div className="avatar-header" style={{ background: avatar.gradient }}>
                <span className="avatar-emoji">{avatar.avatar}</span>
              </div>
              <div className="avatar-body">
                <h3>{avatar.name}</h3>
                <p className="avatar-role">{avatar.role}</p>
                <p className="avatar-message">"{avatar.message}"</p>
                <div className="avatar-specialties">
                  {avatar.specialty.map((spec, i) => (
                    <span key={i} className="specialty-tag">{spec}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section with Interactive Cards */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2>Powerful <span className="gradient-text">Features</span></h2>
          <p>Everything you need to ace your interviews</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${activeFeature === index ? 'active' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
              style={{
                '--feature-color': feature.color
              }}
            >
              <div className="feature-icon-wrapper" style={{ background: feature.color }}>
                <span className="feature-icon">{feature.icon}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-stats">
                <div className="stat-bar">
                  <div className="stat-fill" style={{ width: `${85 + index * 3}%` }}></div>
                </div>
                <span className="stat-percentage">{85 + index * 3}% accuracy</span>
              </div>
              <div className="feature-glow"></div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works with Interactive Timeline */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>Your Journey to <span className="gradient-text">Success</span></h2>
          <p>Three simple steps to interview mastery</p>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>

          <div className="timeline-step">
            <div className="step-badge" style={{ background: '#00f2fe' }}>
              <span className="step-number">1</span>
            </div>
            <div className="step-content">
              <h3>Create Your Profile</h3>
              <p>Tell us about your target industry, experience level, and goals</p>
              <div className="step-preview">
                <span>📝 Industry selection</span>
                <span>🎯 Goal setting</span>
                <span>📊 Experience level</span>
              </div>
            </div>
          </div>

          <div className="timeline-step">
            <div className="step-badge" style={{ background: '#a18cd1' }}>
              <span className="step-number">2</span>
            </div>
            <div className="step-content">
              <h3>Practice with AI</h3>
              <p>Engage in realistic interview sessions with our AI coaches</p>
              <div className="step-preview">
                <span>🤖 Real-time responses</span>
                <span>⚡ Instant feedback</span>
                <span>🔄 Adaptive questions</span>
              </div>
            </div>
          </div>

          <div className="timeline-step">
            <div className="step-badge" style={{ background: '#43e97b' }}>
              <span className="step-number">3</span>
            </div>
            <div className="step-content">
              <h3>Analyze & Improve</h3>
              <p>Review detailed feedback and track your progress over time</p>
              <div className="step-preview">
                <span>📈 Performance metrics</span>
                <span>💡 Improvement tips</span>
                <span>🏆 Progress tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section className="demo-preview">
        <div className="demo-content">
          <h2>See It in <span className="gradient-text">Action</span></h2>
          <p>Watch how our AI provides real-time feedback during an interview session</p>

          <div className="demo-window">
            <div className="demo-header">
              <div className="window-controls">
                <span></span><span></span><span></span>
              </div>
              <span className="demo-title">Live Interview Session</span>
            </div>

            <div className="demo-body">
              <div className="ai-interviewer">
                <div className="ai-avatar-large">🤖</div>
                <div className="ai-speaking">
                  <span></span><span></span><span></span>
                </div>
              </div>

              <div className="interview-chat">
                <div className="message ai">
                  <div className="message-content">
                    Tell me about a time you faced a challenging situation at work.
                  </div>
                </div>
                <div className="message user">
                  <div className="message-content">
                    In my previous role, I had to lead a project with a tight deadline...
                  </div>
                </div>
                <div className="feedback-overlay">
                  <div className="feedback-tag">Confidence: 85%</div>
                  <div className="feedback-tag">Clarity: 92%</div>
                  <div className="feedback-tag">Relevance: 88%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section with Carousel */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <h2>Success <span className="gradient-text">Stories</span></h2>
          <p>Join thousands of professionals who landed their dream jobs</p>
        </div>

        <div className="testimonials-carousel">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`testimonial-card ${activeTestimonial === index ? 'active' : ''}`}
              style={{
                transform: `translateX(${(index - activeTestimonial) * 110}%) scale(${index === activeTestimonial ? 1 : 0.8})`,
                opacity: index === activeTestimonial ? 1 : 0.5,
                zIndex: index === activeTestimonial ? 10 : 1
              }}
            >
              <div className="testimonial-header">
                <span className="testimonial-avatar">{testimonial.avatar}</span>
                <div>
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.role}</p>
                </div>
                <span className="company-logo" aria-hidden="true">
                  {getCompanyBadge(testimonial.company)}
                </span>
              </div>
              <div className="rating">
                {'★'.repeat(testimonial.rating)}
              </div>
              <p className="feedback">"{testimonial.feedback}"</p>
            </div>
          ))}

          <div className="carousel-controls">
            <button
              className="carousel-btn"
              onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            >
              ←
            </button>
            <button
              className="carousel-btn"
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section with Enhanced Design */}
      <section className="cta-section" id="cta">
        <div className="cta-background">
          <div className="cta-particles"></div>
        </div>

        <div className="cta-content">
          <h2>Ready to Transform Your Interview Skills?</h2>
          <p>Join 50,000+ professionals who have already improved their interview success rate</p>

          <div className="cta-features">
            <div className="cta-feature">
              <span>✓ 7-day free trial</span>
            </div>
            <div className="cta-feature">
              <span>✓ No credit card required</span>
            </div>
            <div className="cta-feature">
              <span>✓ Cancel anytime</span>
            </div>
          </div>

          <div className="cta-buttons">
            <Link to="/signup">
              <button className="primary-btn large pulse-animation">
                Start Your Free Trial
                <span className="btn-icon">→</span>
              </button>
            </Link>
            <Link to="/login">
              <button className="secondary-btn large">
                Sign In
              </button>
            </Link>
          </div>

          <div className="trust-badges">
            <span>🔒 Secure & Private</span>
            <span>⚡ Instant Access</span>
            <span>💯 Satisfaction Guaranteed</span>
          </div>
        </div>
      </section>

      {/* Footer with AI Theme */}
      <footer className="footer">
        <div className="footer-gradient"></div>

        <div className="footer-content">
          <div className="footer-section brand">
            <h3>✨ Speak Sense AI</h3>
            <p>Your intelligent interview preparation platform powered by advanced artificial intelligence.</p>
            <div className="social-links">
              <button type="button" className="social-link" aria-label="Social link X">𝕏</button>
              <button type="button" className="social-link" aria-label="Social link LinkedIn">💼</button>
              <button type="button" className="social-link" aria-label="Social link Mobile">📱</button>
              <button type="button" className="social-link" aria-label="Social link Chat">💬</button>
            </div>
          </div>

          <div className="footer-section">
            <h4>Platform</h4>
            <Link to="/features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/demo">Live Demo</Link>
            <Link to="/reviews">Success Stories</Link>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <Link to="/blog">Blog</Link>
            <Link to="/guides">Interview Guides</Link>
            <Link to="/webinars">Webinars</Link>
            <Link to="/faq">FAQ</Link>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/press">Press</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Speak Sense AI. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/security">Security</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}