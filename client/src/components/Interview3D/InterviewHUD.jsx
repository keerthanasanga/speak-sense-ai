import { useState, useEffect, useRef } from 'react';
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
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDisplayMetrics(prev => ({
        confidence: Math.min(prev.confidence + (confidenceScore - prev.confidence) * 0.1, 100),
        eyeContact: Math.min(prev.eyeContact + (eyeContactPercentage - prev.eyeContact) * 0.1, 100),
        fillers: Math.max(prev.fillers + (fillerWordCount - prev.fillers) * 0.1, 0),
        clarity: Math.min(prev.confidence * 0.9 + 10, 100)
      }));
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [confidenceScore, eyeContactPercentage, fillerWordCount]);

  const confidenceColor = getGaugeColor(displayMetrics.confidence);
  const eyeContactColor = getGaugeColor(displayMetrics.eyeContact);
  const fillerSeverity = displayMetrics.fillers > 5 ? '#ef4444' : displayMetrics.fillers > 2 ? '#f59e0b' : '#10b981';

  return (
    <div className={`interview-hud ${expanded ? 'hud-expanded' : ''}`}>
      {/* Compact bottom metrics bar - always visible */}
      <div className="hud-bar">
        <div className="hud-bar-left">
          <div className={`hud-live-dot ${isLive ? 'live' : 'paused'}`} />
          <span className="hud-live-label">{isLive ? 'LIVE' : 'PAUSED'}</span>
        </div>

        <div className="hud-pills">
          <div className="hud-pill" title="Confidence score">
            <span className="pill-icon">💪</span>
            <span className="pill-val" style={{ color: confidenceColor }}>
              {Math.round(displayMetrics.confidence)}%
            </span>
            <span className="pill-lbl">Conf</span>
          </div>

          <div className="hud-pill" title="Eye contact">
            <span className="pill-icon">👁</span>
            <span className="pill-val" style={{ color: eyeContactColor }}>
              {Math.round(displayMetrics.eyeContact)}%
            </span>
            <span className="pill-lbl">Eye</span>
          </div>

          <div className="hud-pill" title="Filler word count">
            <span className="pill-icon">🔇</span>
            <span className="pill-val" style={{ color: fillerSeverity }}>
              {Math.round(displayMetrics.fillers)}
            </span>
            <span className="pill-lbl">Fill</span>
          </div>

          <div className="hud-pill" title="Speech clarity">
            <span className="pill-icon">🎙</span>
            <span className="pill-val" style={{ color: getGaugeColor(displayMetrics.clarity) }}>
              {Math.round(displayMetrics.clarity)}
            </span>
            <span className="pill-lbl">Clarity</span>
          </div>
        </div>

        <button
          className="hud-expand-btn"
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? 'Collapse metrics' : 'Expand metrics'}
          title={expanded ? 'Hide details' : 'Show details'}
        >
          {expanded ? '▼' : '▲'}
        </button>
      </div>

      {/* Expanded detail panel - shows above the bar when toggled */}
      {expanded && (
        <div className="hud-detail-panel">
          {/* Confidence radial gauge */}
          <div className="hud-detail-widget">
            <div className="detail-title">Confidence</div>
            <svg viewBox="0 0 80 80" className="mini-gauge-svg">
              <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="30" fill="none"
                stroke={confidenceColor}
                strokeWidth="5"
                strokeDasharray={`${displayMetrics.confidence * 1.885} 188.5`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="700" fill="#e2e8f0">
                {Math.round(displayMetrics.confidence)}%
              </text>
            </svg>
          </div>

          {/* Eye contact */}
          <div className="hud-detail-widget">
            <div className="detail-title">Eye Contact</div>
            <div className="detail-bar-container">
              <div className="detail-big-val" style={{ color: eyeContactColor }}>
                {Math.round(displayMetrics.eyeContact)}%
              </div>
              <div className="detail-track">
                <div
                  className="detail-fill"
                  style={{ width: `${displayMetrics.eyeContact}%`, background: eyeContactColor }}
                />
              </div>
            </div>
          </div>

          {/* Waveform / Clarity */}
          <div className="hud-detail-widget">
            <div className="detail-title">Clarity: {Math.round(displayMetrics.clarity)}/100</div>
            <div className="mini-waveform">
              {(speechWaveform.length ? speechWaveform : Array(20).fill(0.1)).slice(0, 20).map((amp, i) => (
                <div
                  key={i}
                  className="mini-wave-bar"
                  style={{ height: `${Math.max(Math.abs(amp) * 100, 8)}%` }}
                />
              ))}
            </div>
          </div>

          {/* Filler words */}
          <div className="hud-detail-widget">
            <div className="detail-title">Filler Words</div>
            <div className="detail-big-val" style={{ color: fillerSeverity }}>
              {Math.round(displayMetrics.fillers)}
              <span className="detail-unit"> detected</span>
            </div>
            <div className="detail-track">
              <div
                className="detail-fill"
                style={{
                  width: `${Math.min(displayMetrics.fillers * 20, 100)}%`,
                  background: fillerSeverity
                }}
              />
            </div>
          </div>

          {/* Posture */}
          {postureData && (
            <div className="hud-detail-widget">
              <div className="detail-title">Posture</div>
              <div className="detail-big-val" style={{ color: getGaugeColor(postureData.confidence) }}>
                {Math.round(postureData.confidence || 0)}/100
              </div>
              <div className="detail-posture-msg">{postureData.message || 'Checking…'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getGaugeColor(percentage) {
  if (percentage >= 80) return '#10b981';
  if (percentage >= 60) return '#f59e0b';
  if (percentage >= 40) return '#ef8354';
  return '#ef4444';
}
