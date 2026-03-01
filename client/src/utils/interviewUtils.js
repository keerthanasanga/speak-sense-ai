export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const deriveSpeechTip = (wordsPerMinute, fillerCount, pauseCount) => {
  if (fillerCount >= 4) {
    return "Reduce filler words by pausing for a second before key points.";
  }
  if (wordsPerMinute > 170) {
    return "You are speaking fast; slow down slightly for better clarity.";
  }
  if (wordsPerMinute < 90) {
    return "Try to increase pace slightly to sound more confident and fluent.";
  }
  if (pauseCount >= 4) {
    return "Use fewer long pauses; keep ideas connected with short transitions.";
  }
  return "Great pace and delivery. Keep using clear, structured sentences.";
};
