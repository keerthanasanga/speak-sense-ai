import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Add this import
import './landing.css';

const Landing = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Ensure video plays on load
    if (videoRef.current && !videoError) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
        setVideoError(true);
      });
    }
  }, [videoError]);

  // Fallback video URLs (more reliable sources)
  const videoSources = [
    {
      src: "https://player.vimeo.com/external/370468553.sd.mp4?s=90b9b18c6bd15ae84fa7a8fce2c9e9b7a9a5e7b6&profile_id=139&oauth2_token_id=57447761",
      type: "video/mp4"
    },
    {
      src: "https://player.vimeo.com/external/494443333.sd.mp4?s=fb6d7d9c7a9d5b8f1c4e7a3b6d9f2c8a&profile_id=139&oauth2_token_id=57447761",
      type: "video/mp4"
    }
  ];

  return (
    <section className="hero">
      {/* Background video with fallback */}
      {!videoError ? (
        <video 
          ref={videoRef}
          id="bg-video" 
          autoPlay 
          muted 
          loop 
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={() => setVideoError(true)}
          style={{ opacity: isVideoLoaded ? 1 : 0 }}
        >
          {videoSources.map((source, index) => (
            <source key={index} src={source.src} type={source.type} />
          ))}
          Your browser does not support the video tag.
        </video>
      ) : (
        // Fallback image if video fails
        <div 
          className="video-fallback"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.4)',
            zIndex: -2
          }}
        />
      )}
      
      {/* Animated overlay for video background */}
      <div className="video-overlay"></div>
      
      <div className="container">
        {/* Navigation */}
        <nav className="navbar">
          <div className="logo">
            <i className="fas fa-microphone-alt"></i>
            <span>SpeakSense AI</span>
          </div>
          <div className="nav-buttons">
            <button className="btn-outline">
              <i className="fas fa-user-plus"></i>
              Register
              <Link to="/register" className="btn-outline">click</Link>
            </button>
            
            <button className="btn-primary">
              <i className="fas fa-sign-in-alt"></i>
              Sign up
               <Link to="/signup" className="btn-primary" >click</Link>
            </button>
           
          </div>
        </nav>

        {/* Main Hero Content */}
        <div className="hero-content">
          <span className="badge">
            <i className="fas fa-robot"></i> 
            next‑gen AI interviews
          </span>
          <h1>
            Interview with AI,<br />
            get instant feedback.
          </h1>
          <p>
            SpeakSense listens, analyzes, and guides you through realistic interviews. 
            Real-time AI feedback helps you improve every answer.
          </p>
          <div className="cta-group">
            <button className="btn-primary btn-large">
              <i className="fas fa-play-circle"></i>
              Try demo interview
            </button>
            <button className="btn-outline btn-large">
              <i className="fas fa-info-circle"></i>
              Watch how it works
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="feature-grid">
          <FeatureCard 
            icon="fas fa-wave-square"
            title="Voice & tone analysis"
            description="AI evaluates clarity, confidence, and speaking patterns — just like a human interviewer."
          />
          <FeatureCard 
            icon="fas fa-clipboard-list"
            title="Context‑aware feedback"
            description="Get detailed pointers on what you said and actionable tips to refine your answers."
          />
          <FeatureCard 
            icon="fas fa-chart-line"
            title="Progress tracking"
            description="Your own dashboard shows improvement over time, with strengths and areas to grow."
          />
          <FeatureCard 
            icon="fas fa-video"
            title="Realistic simulations"
            description="Background video & voice AI recreate pressure of real interviews. Practice anywhere."
          />
        </div>

        {/* Advanced Demo Section */}
        <div className="demo-section">
          <div className="demo-header">
            <h2>
              <i className="fas fa-comment-dots" style={{ color: '#4a9eff' }}></i> 
              live AI interview simulation
            </h2>
            <span className="ai-badge">
              <i className="fas fa-sync-alt fa-spin"></i> real‑time feedback active
            </span>
          </div>

          <div className="interview-preview">
            <div className="interview-avatar">
              <div className="avatar-container">
                <i className="fas fa-robot"></i>
              </div>
              <h4>AI interviewer</h4>
              <div className="feedback-chip">
                <i className="fas fa-circle-notch fa-spin"></i> listening ...
              </div>
              <div className="metrics">
                <div className="metric">
                  <i className="fas fa-smile"></i>
                  <span>empathy 92%</span>
                </div>
                <div className="metric">
                  <i className="fas fa-chart-bar"></i>
                  <span>clarity 84%</span>
                </div>
              </div>
            </div>

            <div className="transcript-card">
              <MessageRow 
                type="ai"
                message="Tell me about a time you handled a difficult situation at work."
                timestamp="just now"
              />
              <MessageRow 
                type="user"
                message="Well, in my previous role, there was a project delay because of..."
                timestamp="2 sec ago"
              />
              
              <div className="feedback-badge">
                <i className="fas fa-lightbulb"></i>
                <div className="feedback-text">
                  <strong>AI feedback:</strong> good structure, but add more quantifiable results. (pausing too long)
                </div>
              </div>
              
              <div className="tip">
                <i className="fas fa-arrow-right"></i>
                <span>try to use STAR method</span>
              </div>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="demo-controls">
            <div className="control-buttons">
              <button className="btn-outline">
                <i className="fas fa-microphone"></i> 
                <span>answer with mic</span>
              </button>
              <button className="btn-outline">
                <i className="fas fa-keyboard"></i> 
                <span>type reply</span>
              </button>
            </div>
            <div className="advanced-feature">
              <i className="fas fa-chart-pie"></i>
              <span>advanced sentiment & filler-word detection</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        
        <div className="bottom-cta">
  {/* Register Link - Fixed */}
  <Link to="/register" className="btn-primary btn-large">
    <i className="fas fa-user-plus"></i> 
    Register now — it's free
  </Link>
  
  {/* Sign up Link - Fixed */}
  <Link to="/signup" className="btn-outline btn-large">
    <i className="fab fa-google"></i> 
    Sign up with Google
  </Link>
</div>

        {/* Footer */}
        <div className="footer-note">
          <i className="fas fa-camera"></i> 
          <span>background video shows AI taking an interview</span>
          <span className="separator">·</span>
          <a href="#">
            <i className="fas fa-file-alt"></i> see transcript
          </a>
          <span className="separator">·</span>
          <span className="voice-badge">
            <i className="fas fa-circle-check"></i>
            voice synthesis & analysis
          </span>
        </div>
      </div>

      {/* Video Caption */}
      <div className="video-caption">
        <i className="fas fa-play"></i>
        <span>AI interview simulation · live background</span>
      </div>
    </section>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <i className={icon}></i>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// Message Row Component
const MessageRow = ({ type, message, timestamp }) => (
  <div className={`message-row ${type}`}>
    <div className="avatar-small">
      <i className={`fas fa-${type === 'ai' ? 'robot' : 'user'}`}></i>
    </div>
    <div className="message-content">
      <div className="bubble">
        {message}
      </div>
      <div className="timestamp">{timestamp}</div>
    </div>
  </div>
);

export default Landing;