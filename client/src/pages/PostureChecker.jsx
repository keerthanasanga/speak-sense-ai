export default function PostureChecker({
  postureFeedback,
  postureDebug,
  postureTuning,
  isPostureChecking,
  postureVideoRef,
  onRunPostureCheck,
  onSetPostureTuning,
  onResetPostureTuning
}) {
  const { status, score, statusMessage, tips } = postureFeedback;

  const scoreLabel = score === null ? "—" : String(score);
  const scoreClass =
    score === null ? ""
      : score >= 85 ? "score-excellent"
        : score >= 70 ? "score-good"
          : "score-needs-work";

  const scoreColor =
    score === null ? "rgba(107,114,128,0.7)"
      : score >= 85 ? "#22c55e"
        : score >= 70 ? "#3b82f6"
          : "#ef4444";

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = score === null ? circumference : circumference * (1 - score / 100);

  const displayedTips = tips.length
    ? tips
    : ["Run posture check to get live guidance before your interview starts."];

  return (
    <div className="posture-check-card" role="status" aria-live="polite">
      <div className="posture-check-header">
        <h3>🧍 Pre-Interview Posture Coach</h3>
        <button
          type="button"
          className="posture-check-btn"
          onClick={onRunPostureCheck}
          disabled={isPostureChecking}
        >
          {isPostureChecking ? (
            <span className="posture-btn-inner">
              <span className="fb-spinner" aria-hidden="true" />
              Checking…
            </span>
          ) : "Check My Posture"}
        </button>
      </div>

      <p className="posture-check-caption">
        Before starting, we analyze your camera framing and recommend the ideal interview posture.
      </p>

      <div className="posture-body">
        {/* Video preview side */}
        <div className="posture-video-side">
          <div className="posture-preview-wrap">
            <video
              ref={postureVideoRef}
              className="posture-preview-video"
              autoPlay
              playsInline
              muted
            />
            <div className="posture-preview-guide" aria-hidden="true" />
          </div>
        </div>

        {/* Score + tips side */}
        <div className="posture-result-side">
          {status === "checking" ? (
            <div className="posture-status-row" style={{ justifyContent: "center", paddingTop: "0.5rem" }}>
              <div className="fb-spinner-lg" aria-hidden="true" />
              <span className="posture-status-text">Analyzing your posture…</span>
            </div>
          ) : (
            <>
              {/* Score ring */}
              {score !== null && (
                <div className="posture-score-ring-wrap">
                  <svg
                    className="posture-score-ring"
                    viewBox="0 0 100 100"
                    aria-label={`Posture score: ${score} out of 100`}
                  >
                    {/* Background track */}
                    <circle
                      cx="50" cy="50" r={radius}
                      fill="none"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="9"
                    />
                    {/* Score arc */}
                    <circle
                      cx="50" cy="50" r={radius}
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 50 50)"
                      style={{
                        transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1), stroke 0.5s ease",
                        filter: `drop-shadow(0 0 6px ${scoreColor})`
                      }}
                    />
                    {/* Score number */}
                    <text
                      x="50" y="47"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={scoreColor}
                      fontSize="22"
                      fontWeight="800"
                      fontFamily="system-ui, sans-serif"
                    >
                      {scoreLabel}
                    </text>
                    <text
                      x="50" y="63"
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.45)"
                      fontSize="9"
                      fontFamily="system-ui, sans-serif"
                    >
                      / 100
                    </text>
                  </svg>

                  <span className={`posture-score-chip ${scoreClass}`}>
                    {score >= 85 ? "Excellent ✓" : score >= 70 ? "Good ✓" : "Needs Work"}
                  </span>
                </div>
              )}

              {/* Status message */}
              {statusMessage && (
                <p className="posture-status-text" style={{ marginTop: score !== null ? "0.4rem" : 0 }}>
                  {statusMessage}
                </p>
              )}
            </>
          )}

          {/* Tips list */}
          <ul className="posture-tips-list">
            {displayedTips.map((tip, i) => (
              <li key={`${tip}-${i}`}>
                <span className="posture-tip-icon" aria-hidden="true">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
