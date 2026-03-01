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
  return (
    <div className="posture-check-card" role="status" aria-live="polite">
      <div className="posture-check-header">
        <h3>🧍 Pre-Interview Posture Coach</h3>
        <button type="button" className="posture-check-btn" onClick={onRunPostureCheck} disabled={isPostureChecking}>
          {isPostureChecking ? "Checking…" : "Check My Posture"}
        </button>
      </div>
      <p className="posture-check-caption">Before starting, we check your camera framing and suggest ideal interview posture.</p>
      {(postureFeedback.status !== "pending" && postureFeedback.status !== "checking") && (
        <div className="posture-status-row">
          {postureFeedback.score !== null && (
            <span className="posture-score-chip">Posture Score: {postureFeedback.score}/100</span>
          )}
          <span className="posture-status-text">{postureFeedback.statusMessage}</span>
        </div>
      )}
      {postureDebug.source !== "idle" && (
        <div className="posture-debug-readout" aria-live="polite">
          <p>
            <strong>Debug</strong> • Confidence: {postureDebug.confidence ?? "--"}% • Source: {postureDebug.source}
          </p>
          <p>
            Brightness: {postureDebug.avgBrightness ?? "--"} • Center: {postureDebug.centerEdgeRatio ?? "--"} • Balance: {postureDebug.horizontalBalance ?? "--"} • Detail: {postureDebug.hasDetail === null ? "--" : postureDebug.hasDetail ? "high" : "low"}
          </p>
          <div className="posture-tuning-controls">
            <label htmlFor="tuneConfidenceMin">
              Confidence Min: {Math.round(postureTuning.confidenceMin)}
            </label>
            <input
              id="tuneConfidenceMin"
              type="range"
              min="35"
              max="90"
              step="1"
              value={postureTuning.confidenceMin}
              onChange={(event) => onSetPostureTuning((prev) => ({ ...prev, confidenceMin: Number(event.target.value) }))}
            />

            <label htmlFor="tuneCenterMin">
              Center Min: {postureTuning.centerMin.toFixed(2)}
            </label>
            <input
              id="tuneCenterMin"
              type="range"
              min="0.08"
              max="0.32"
              step="0.01"
              value={postureTuning.centerMin}
              onChange={(event) => onSetPostureTuning((prev) => ({ ...prev, centerMin: Number(event.target.value) }))}
            />

            <label htmlFor="tuneBalanceMax">
              Balance Max: {postureTuning.balanceMax.toFixed(2)}
            </label>
            <input
              id="tuneBalanceMax"
              type="range"
              min="0.2"
              max="0.7"
              step="0.01"
              value={postureTuning.balanceMax}
              onChange={(event) => onSetPostureTuning((prev) => ({ ...prev, balanceMax: Number(event.target.value) }))}
            />

            <label htmlFor="tuneBrightnessMin">
              Brightness Min: {Math.round(postureTuning.brightnessMin)}
            </label>
            <input
              id="tuneBrightnessMin"
              type="range"
              min="10"
              max="120"
              step="1"
              value={postureTuning.brightnessMin}
              onChange={(event) => onSetPostureTuning((prev) => ({ ...prev, brightnessMin: Number(event.target.value) }))}
            />

            <label htmlFor="tuneBrightnessMax">
              Brightness Max: {Math.round(postureTuning.brightnessMax)}
            </label>
            <input
              id="tuneBrightnessMax"
              type="range"
              min="150"
              max="255"
              step="1"
              value={postureTuning.brightnessMax}
              onChange={(event) => onSetPostureTuning((prev) => ({ ...prev, brightnessMax: Number(event.target.value) }))}
            />

            <button
              type="button"
              className="posture-tuning-reset"
              onClick={onResetPostureTuning}
            >
              Reset Tuning
            </button>
          </div>
        </div>
      )}
      <div className="posture-preview-wrap">
        <video ref={postureVideoRef} className="posture-preview-video" autoPlay playsInline muted />
        <div className="posture-preview-guide" aria-hidden="true"></div>
      </div>
      <ul>
        {(postureFeedback.tips.length ? postureFeedback.tips : ["Run posture check to get live guidance before interview starts."]).map((tip, index) => (
          <li key={`${tip}-${index}`}>✓ {tip}</li>
        ))}
      </ul>
    </div>
  );
}
