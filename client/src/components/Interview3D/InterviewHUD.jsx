import React, { useState, useEffect } from 'react';
import './InterviewHUD.css';

export default function InterviewHUD({
  confidenceScore = 0,
  eyeContactPercentage = 0,
  fillerWordCount = 0,
  speechWaveform = [],
  postureData = { confidence: 0, message: '' },
  isLive = true
}) {
  const [displayMetrics, setDisplayMetrics] = useState({
    confidence: 0,
    eyeContact: 0,
    fillers: 0,
    clarity: 0
  });

  useEffect(() => {
    // Animate metric updates
    const timer = setInterval(() => {
      setDisplayMetrics(prev => ({
        confidence: Math.min(prev.confidence + (confidenceScore - prev.confidence) * 0.1, 100),
        eyeContact: Math.min(prev.eyeContact + (eyeContactPercentage - prev.eyeContact) * 0.1, 100),
        fillers: Math.max(prev.fillers + (fillerWordCount - prev.fillers) * 0.1, 0),
        clarity: Math.min(prev.confidence * 0.9 + 10, 100)
      }));
    }, 100);

    return () => clearInterval(timer);
  }, [confidenceScore, eyeContactPercentage, fillerWordCount]);

  return (
    <div className="interview-hud">
      {/* Top-left: Confidence Score Gauge */}
      <div className="hud-widget confidence-gauge">
        <div className="widget-title">Confidence</div>
        <div className="radial-gauge">
          <svg viewBox="0 0 100 100" className="gauge-svg">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={getGaugeColor(displayMetrics.confidence)}
              strokeWidth="6"
              strokeDasharray={`${displayMetrics.confidence * 2.51} 251`}
              className="gauge-fill"
            />
            <text
              x="50"
              y="55"
              textAnchor="middle"
              className="gauge-text"
            >
              {Math.round(displayMetrics.confidence)}%
            </text>
          </svg>
        </div>
        <div className="gauge-label">Real-time Confidence</div>
      </div>

      {/* Top-right: Eye Contact Tracker */}
      <div className="hud-widget eye-contact-tracker">
        <div className="widget-title">Eye Contact</div>
        <div className="eye-tracker">
          <div className="eye-indicator">
            <div className="eye-ball"></div>
          </div>
          <div className="contact-percentage">{Math.round(displayMetrics.eyeContact)}%</div>
        </div>
        <div className="tracker-bar">
          <div 
            className="tracker-fill"
            style={{ width: `${displayMetrics.eyeContact}%` }}
          ></div>
        </div>
        <div className="gauge-label">Contact with Interviewer</div>
      </div>

      {/* Bottom-left: Filler Word Detection */}
      <div className="hud-widget filler-counter">
        <div className="widget-title">Filler Words</div>
        <div className="counter-display">
          <div className="counter-number">
            {Math.round(displayMetrics.fillers)}
          </div>
          <div className="counter-unit">detected</div>
        </div>
        <div className="filler-bar">
          <div 
            className={`filler-indicator ${displayMetrics.fillers > 5 ? 'warning' : ''}`}
            style={{ width: `${Math.min(displayMetrics.fillers * 20, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Bottom-right: Speech Clarity */}
      <div className="hud-widget speech-clarity">
        <div className="widget-title">Clarity</div>
        <div className="clarity-waveform">
          {speechWaveform.slice(0, 40).map((amplitude, i) => (
            <div
              key={i}
              className="waveform-bar"
              style={{
                height: `${Math.abs(amplitude) * 100}%`,
                opacity: 0.3 + (i / 40) * 0.7
              }}
            ></div>
          ))}
        </div>
        <div className="clarity-score">
          {Math.round(displayMetrics.clarity)}/100
        </div>
      </div>

      {/* Center-bottom: Performance Dashboard */}
      <div className="hud-widget performance-dashboard">
        <div className="dashboard-title">Performance Metrics</div>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">Pace</span>
            <span className={`metric-value ${displayMetrics.clarity > 70 ? 'good' : 'needs-improvement'}`}>
              {displayMetrics.clarity > 70 ? 'Good' : 'Adjust'}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Pauses</span>
            <span className="metric-value">
              {speechWaveform.filter(a => a === 0).length}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Duration</span>
            <span className="metric-value">
              {Math.round(speechWaveform.length / 10)}s
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Engagement</span>
            <span className={`metric-value ${displayMetrics.eyeContact > 50 ? 'high' : 'low'}`}>
              {displayMetrics.eyeContact > 50 ? 'High' : 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* Posture Status Indicator */}
      {postureData && (
        <div className={`hud-widget posture-status ${postureData.confidence >= 80 ? 'good' : 'warning'}`}>
          <div className="widget-title">Posture</div>
          <div className="posture-score">{Math.round(postureData.confidence || 0)}/100</div>
          <div className="posture-message">{postureData.message || 'Checking...'}</div>
          <div className="posture-indicator">
            <div className="indicator-dot"></div>
            <span>
              {postureData.confidence >= 80 ? 'Excellent' : 
               postureData.confidence >= 60 ? 'Good' : 
               postureData.confidence >= 40 ? 'Fair' : 'Needs Adjustment'}
            </span>
          </div>
        </div>
      )}

      {/* Live Status Indicator */}
      <div className="hud-status-bar">
        <div className={`status-indicator ${isLive ? 'live' : 'paused'}`}>
          <span className="status-dot"></span>
          {isLive ? 'LIVE' : 'PAUSED'}
        </div>
        <div className="status-timer">
          Session Active
        </div>
      </div>
    </div>
  );
}

function getGaugeColor(percentage) {
  if (percentage >= 80) return '#10b981'; // Green
  if (percentage >= 60) return '#f59e0b'; // Amber
  if (percentage >= 40) return '#ef8354'; // Orange
  return '#ef4444'; // Red
}
