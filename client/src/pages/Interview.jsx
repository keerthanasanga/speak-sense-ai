import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../services/api";
import { getFeatureFlags } from "../config/featureFlags";
import { formatTime, deriveSpeechTip } from "../utils/interviewUtils";
import { getAuthToken, getStoredUser, saveStoredUser } from "../utils/authStorage";
import { avatarCatalog, getFilteredAvatars } from "../data/avatars";
import AvatarFigure from "./AvatarFigure";
import FeedbackSidebar from "./FeedbackSidebar";
import PostureChecker from "./PostureChecker";
import SilentErrorBoundary from "../SilentErrorBoundary";
import "./interview.css";
import "./AvatarFigure.css";

const AVATAR_PACK_STORAGE_KEY = "avatarPackStyle";

const normalizeAvatarPackStyle = (rawStyle) => {
  if (rawStyle === "illustrated" || rawStyle === "emoji") {
    return rawStyle;
  }
  return "illustrated";
};

const defaultPostureTuning = {
  confidenceMin: 62,
  centerMin: 0.16,
  balanceMax: 0.46,
  brightnessMin: 35,
  brightnessMax: 235
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizePostureTuning = (candidate = {}) => {
  const normalized = {
    confidenceMin: clamp(Number(candidate.confidenceMin ?? defaultPostureTuning.confidenceMin), 35, 90),
    centerMin: clamp(Number(candidate.centerMin ?? defaultPostureTuning.centerMin), 0.08, 0.32),
    balanceMax: clamp(Number(candidate.balanceMax ?? defaultPostureTuning.balanceMax), 0.2, 0.7),
    brightnessMin: clamp(Number(candidate.brightnessMin ?? defaultPostureTuning.brightnessMin), 10, 120),
    brightnessMax: clamp(Number(candidate.brightnessMax ?? defaultPostureTuning.brightnessMax), 150, 255)
  };

  if (normalized.brightnessMin >= normalized.brightnessMax) {
    normalized.brightnessMin = defaultPostureTuning.brightnessMin;
    normalized.brightnessMax = defaultPostureTuning.brightnessMax;
  }

  return normalized;
};

const clampScore = (value, min = 0, max = 100) => Math.min(Math.max(Math.round(value), min), max);

const summarizeGrade = (score) => {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
};

const buildSpeechCorrection = (rawText) => {
  const source = String(rawText || "").replace(/\s+/g, " ").trim();
  if (!source) return "";

  let corrected = source
    .replace(/\bi\b/g, "I")
    .replace(/\bgonna\b/gi, "going to")
    .replace(/\bwanna\b/gi, "want to")
    .replace(/\bgotta\b/gi, "got to")
    .replace(/\balot\b/gi, "a lot")
    .replace(/\b(uh|um|er|ah)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();

  if (corrected) {
    corrected = `${corrected.charAt(0).toUpperCase()}${corrected.slice(1)}`;
    if (!/[.!?]$/.test(corrected)) corrected = `${corrected}.`;
  }

  return corrected;
};

const tokenizeWords = (text) => String(text || "").trim().split(/\s+/).filter(Boolean);

const normalizeWord = (word) => String(word || "").toLowerCase().replace(/[^a-z0-9']/g, "");

const MAX_DIFF_WORDS = 180;
const MAX_DIFF_CELLS = 25000;

const buildCorrectedWordDiff = (originalText, correctedText) => {
  const originalWords = tokenizeWords(originalText).slice(0, MAX_DIFF_WORDS).map(normalizeWord).filter(Boolean);
  const correctedWords = tokenizeWords(correctedText).slice(0, MAX_DIFF_WORDS);
  const correctedComparable = correctedWords.map(normalizeWord);

  if (!correctedWords.length) return [];
  if (!originalWords.length) {
    return correctedWords.map((word) => ({ word, changed: false }));
  }

  if ((originalWords.length * correctedComparable.length) > MAX_DIFF_CELLS) {
    return correctedWords.map((word, index) => ({
      word,
      changed: normalizeWord(word) !== (originalWords[index] || ""),
    }));
  }

  const rows = originalWords.length;
  const cols = correctedComparable.length;
  const lcs = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      if (originalWords[row - 1] === correctedComparable[col - 1] && correctedComparable[col - 1]) {
        lcs[row][col] = lcs[row - 1][col - 1] + 1;
      } else {
        lcs[row][col] = Math.max(lcs[row - 1][col], lcs[row][col - 1]);
      }
    }
  }

  const unchangedCorrectedIndexes = new Set();
  let row = rows;
  let col = cols;
  while (row > 0 && col > 0) {
    if (originalWords[row - 1] === correctedComparable[col - 1] && correctedComparable[col - 1]) {
      unchangedCorrectedIndexes.add(col - 1);
      row -= 1;
      col -= 1;
    } else if (lcs[row - 1][col] >= lcs[row][col - 1]) {
      row -= 1;
    } else {
      col -= 1;
    }
  }

  return correctedWords.map((word, index) => ({
    word,
    changed: Boolean(correctedComparable[index]) && !unchangedCorrectedIndexes.has(index),
  }));
};

const buildInterviewReport = (entries, totalDurationSeconds, totalQuestionsAsked) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const answered = safeEntries.length;

  if (!answered) {
    return {
      generatedAt: new Date().toISOString(),
      overview: {
        score: 0,
        grade: "D",
        questionsAttempted: 0,
        totalQuestions: totalQuestionsAsked || 0,
        timeSpentSeconds: totalDurationSeconds || 0,
      },
      speaking: {
        wordsPerMinute: 0,
        pauses: 0,
        fillerWords: 0,
        clarity: 0,
      },
      grammar: {
        score: 0,
        mistakes: 0,
      },
      categories: {
        technical: 0,
        behavioral: 0,
        communication: 0,
        problemSolving: 0,
        clarity: 0,
      },
      confidenceTimeline: [],
      questionAnalysis: [],
      feedback: {
        positive: ["Complete at least one answer to generate personalized strengths."],
        improvements: ["Answer with 3–4 clear sentences and include one measurable outcome."],
      },
    };
  }

  const overallScores = safeEntries.map((entry) => entry.verification?.overallScore ?? entry.stats?.score ?? 65);
  const relevanceScores = safeEntries.map((entry) => entry.verification?.relevanceScore ?? 65);
  const grammarScores = safeEntries.map((entry) => entry.verification?.grammarScore ?? 68);
  const grammarMistakes = safeEntries.reduce((count, entry) => count + (entry.grammarIssues?.length || 0), 0);

  const speechEntries = safeEntries.filter((entry) => entry.speechMetrics);
  const totalWpm = speechEntries.reduce((sum, entry) => sum + (entry.speechMetrics?.wordsPerMinute || 0), 0);
  const totalPauses = speechEntries.reduce((sum, entry) => sum + (entry.speechMetrics?.pauseCount || 0), 0);
  const totalFillers = speechEntries.reduce((sum, entry) => sum + (entry.speechMetrics?.fillerCount || 0), 0);

  const averageOverall = clampScore(overallScores.reduce((sum, value) => sum + value, 0) / answered);
  const averageGrammar = clampScore(grammarScores.reduce((sum, value) => sum + value, 0) / answered);
  const averageRelevance = clampScore(relevanceScores.reduce((sum, value) => sum + value, 0) / answered);
  const averageWpm = speechEntries.length ? clampScore(totalWpm / speechEntries.length) : 0;

  const questionAnalysis = safeEntries.map((entry, index) => {
    const score = clampScore(entry.verification?.overallScore ?? entry.stats?.score ?? 65);
    const improvements = [...(entry.improvements || [])].slice(0, 3);
    const strengths = [];

    if ((entry.verification?.relevanceScore ?? 0) >= 75) strengths.push("Stayed relevant to the asked question");
    if ((entry.verification?.grammarScore ?? 0) >= 75) strengths.push("Maintained solid grammar quality");
    if ((entry.stats?.wordCount ?? 0) >= 35) strengths.push("Provided enough detail in the response");
    if (strengths.length === 0) strengths.push("Attempted the question with clear intent");

    return {
      id: index + 1,
      question: entry.question || `Interview question ${index + 1}`,
      answer: entry.answer || "",
      score,
      feedback: entry.verification?.verdict || "Answer reviewed successfully.",
      strengths: strengths.slice(0, 3),
      improvements,
      correctnessLabel: entry.verification?.correctnessLabel || "needs-improvement",
    };
  });

  const confidenceTimeline = questionAnalysis.map((question, index) => ({
    minute: index + 1,
    level: question.score,
  }));

  const positive = [];
  const improvementSet = new Set();

  if (averageRelevance >= 75) positive.push("Answers were mostly aligned with each question.");
  if (averageGrammar >= 75) positive.push("Grammar quality stayed strong across responses.");
  if (averageOverall >= 75) positive.push("Overall interview communication was consistent.");
  if (speechEntries.length && totalFillers <= speechEntries.length * 2) positive.push("Filler words stayed controlled during speech responses.");
  if (positive.length === 0) positive.push("You stayed engaged and completed the interview flow.");

  safeEntries.forEach((entry) => {
    (entry.improvements || []).forEach((item) => {
      if (item) improvementSet.add(item);
    });
  });

  if (totalFillers > speechEntries.length * 2 && speechEntries.length) {
    improvementSet.add("Reduce filler words by pausing briefly before key points.");
  }
  if (averageRelevance < 70) {
    improvementSet.add("Stay closer to the interviewer question and include role-specific details.");
  }
  if (averageGrammar < 70) {
    improvementSet.add("Focus on shorter, complete sentences to improve grammar accuracy.");
  }

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      score: averageOverall,
      grade: summarizeGrade(averageOverall),
      questionsAttempted: answered,
      totalQuestions: totalQuestionsAsked,
      timeSpentSeconds: totalDurationSeconds,
    },
    speaking: {
      wordsPerMinute: averageWpm,
      pauses: totalPauses,
      fillerWords: totalFillers,
      clarity: clampScore((averageOverall * 0.6) + (averageGrammar * 0.4)),
    },
    grammar: {
      score: averageGrammar,
      mistakes: grammarMistakes,
    },
    categories: {
      technical: averageRelevance,
      behavioral: clampScore((averageOverall * 0.7) + 12),
      communication: averageOverall,
      problemSolving: clampScore((averageRelevance * 0.8) + 10),
      clarity: clampScore((averageGrammar * 0.7) + (averageOverall * 0.3)),
    },
    confidenceTimeline,
    questionAnalysis,
    feedback: {
      positive: positive.slice(0, 4),
      improvements: [...improvementSet].slice(0, 5),
    },
  };
};

export default function Interview() {
  const navigate = useNavigate();
  const location = useLocation();
  const planningSelections = useMemo(() => {
    const state = location.state;
    if (!state || typeof state !== "object") return {};
    return state;
  }, [location.state]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarSelect, setShowAvatarSelect] = useState(true);
  const [useChat, setUseChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewActive, setInterviewActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [autoVoiceInputEnabled, setAutoVoiceInputEnabled] = useState(() => {
    try {
      return localStorage.getItem("autoVoiceInputEnabled") !== "false";
    } catch {
      return true;
    }
  });
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem("aiVoiceEnabled") !== "false";
    } catch {
      return true;
    }
  });
  const [avatarPackStyle, setAvatarPackStyle] = useState(() => {
    try {
      return normalizeAvatarPackStyle(localStorage.getItem(AVATAR_PACK_STORAGE_KEY));
    } catch {
      return "illustrated";
    }
  });

  const currentAvatarPackLabel =
    avatarPackStyle === "illustrated"
      ? "Game Avatar"
      : avatarPackStyle === "emoji"
        ? "Emoji"
        : "Game Avatar";
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [startError, setStartError] = useState("");
  const [chatError, setChatError] = useState("");
  const [isListeningUser, setIsListeningUser] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechMetrics, setSpeechMetrics] = useState(null);
  const [sessionAnalyses, setSessionAnalyses] = useState([]);
  const [latestVerification, setLatestVerification] = useState(null);
  const [analysisTrigger, setAnalysisTrigger] = useState(0);
  const [isFetchingNextQuestion, setIsFetchingNextQuestion] = useState(false);
  const [postureFeedback, setPostureFeedback] = useState({ status: "pending", tips: [], score: null, statusMessage: "Run posture check for guidance." });
  const [postureDebug, setPostureDebug] = useState({
    confidence: null,
    source: "idle",
    avgBrightness: null,
    centerEdgeRatio: null,
    horizontalBalance: null,
    hasDetail: null
  });
  const [postureTuning, setPostureTuning] = useState(() => {
    try {
      const raw = localStorage.getItem("postureTuning");
      if (!raw) return defaultPostureTuning;
      const parsed = JSON.parse(raw);
      return normalizePostureTuning(parsed);
    } catch {
      return defaultPostureTuning;
    }
  });
  const [isPostureChecking, setIsPostureChecking] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [skipReason, setSkipReason] = useState("too hard");
  const [livePostureStatus, setLivePostureStatus] = useState({
    level: "idle",
    message: "Waiting for interview to start posture monitoring."
  });
  const [livePostureScore, setLivePostureScore] = useState(null);
  const [pendingAutoVoiceStart, setPendingAutoVoiceStart] = useState(false);
  const [isCorrectionCopied, setIsCorrectionCopied] = useState(false);

  // Auto-play 2 questions state
  const [autoPlayQuestionsCount] = useState(2);
  const [questionsAutoPlayed, setQuestionsAutoPlayed] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(() => {
    try {
      return localStorage.getItem("autoPlayEnabled") !== "false";
    } catch {
      return true;
    }
  });

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
      return getStoredUser();
    } catch {
      return null;
    }
  });
  const [interviewConfig, setInterviewConfig] = useState(() => {
    const selectedRole = planningSelections.role;
    const selectedDifficulty = planningSelections.difficulty?.name;
    const selectedType = planningSelections.type?.name;

    const difficultyMap = {
      Beginner: "beginner",
      Intermediate: "intermediate",
      Advanced: "advanced",
      Expert: "advanced",
    };

    const modeMap = {
      Technical: "technical",
      "System Design": "technical",
      Behavioral: "behavioral",
      Mixed: "balanced",
    };

    return {
      mode: modeMap[selectedType] || "balanced",
      difficulty: difficultyMap[selectedDifficulty] || "intermediate",
      questionCount: selectedType === "Mixed" ? 7 : 5,
      responseStyle: "coaching",
      targetRole: selectedRole || "Software Engineer",
      answerLength: "medium"
    };
  });

  const videoRef = useRef(null);
  const avatarModuleFrameRef = useRef(null);
  const postureVideoRef = useRef(null);
  const postureStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const timerRef = useRef(null);
  const speakTimerRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechStartTimeRef = useRef(0);
  const recognitionFinalTranscriptRef = useRef("");
  const recognitionLatestTranscriptRef = useRef("");
  const isVoiceSubmittingRef = useRef(false);
  const sessionAnalysesRef = useRef([]);
  const postureMonitorTimerRef = useRef(null);
  const livePostureSamplesRef = useRef([]);
  const endInterviewLockRef = useRef(false);
  const endInterviewTimerRef = useRef(null);
  const startInterviewLockRef = useRef(false);

  const totalQuestions = Math.min(Math.max(Number(interviewConfig.questionCount) || 5, 3), 10);
  const hasAiQuestion = messages.some((message) => message.sender === "ai");
  const displayedQuestionNumber = hasAiQuestion
    ? Math.min(Math.max(currentQuestion + 1, 1), totalQuestions)
    : 0;
  const progressPercent = totalQuestions > 0
    ? Math.min((displayedQuestionNumber / totalQuestions) * 100, 100)
    : 0;
  const roundedProgressPercent = Math.round(progressPercent);

  const latestAnalyzedEntry = useMemo(() => {
    for (let index = sessionAnalyses.length - 1; index >= 0; index -= 1) {
      if (sessionAnalyses[index]?.answer) return sessionAnalyses[index];
    }
    return null;
  }, [sessionAnalyses]);

  const speakingBoardText = useMemo(() => {
    return (liveTranscript || lastUserMessage || latestAnalyzedEntry?.answer || "").trim();
  }, [lastUserMessage, latestAnalyzedEntry, liveTranscript]);

  const correctedSpeakingText = useMemo(() => {
    return buildSpeechCorrection(speakingBoardText);
  }, [speakingBoardText]);

  const correctedWordDiff = useMemo(() => {
    if (!speakingBoardText || !correctedSpeakingText) return [];
    return buildCorrectedWordDiff(speakingBoardText, correctedSpeakingText);
  }, [correctedSpeakingText, speakingBoardText]);

  const latestGrammarHints = useMemo(() => {
    const issues = latestAnalyzedEntry?.grammarIssues || [];
    return issues
      .slice(0, 3)
      .map((issue) => issue?.rule)
      .filter(Boolean);
  }, [latestAnalyzedEntry]);

  const copyCorrectedText = useCallback(async () => {
    if (!correctedSpeakingText) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(correctedSpeakingText);
      } else {
        const tempArea = document.createElement("textarea");
        tempArea.value = correctedSpeakingText;
        tempArea.style.position = "fixed";
        tempArea.style.left = "-9999px";
        document.body.appendChild(tempArea);
        tempArea.focus();
        tempArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempArea);
      }
      setIsCorrectionCopied(true);
      window.setTimeout(() => setIsCorrectionCopied(false), 1400);
    } catch {
      setIsCorrectionCopied(false);
    }
  }, [correctedSpeakingText]);

  const selectedDomainName = planningSelections.domain?.name || "";
  const selectedDifficultyName = planningSelections.difficulty?.name || "";
  const selectedInterviewTypeName = planningSelections.type?.name || "";
  const embeddedAvatarRole = useMemo(() => {
    const mode = String(interviewConfig.mode || "").toLowerCase();
    const roleText = String(selectedAvatar?.role || "").toLowerCase();

    if (mode.includes("behavioral")) return "behavioral";
    if (mode.includes("system")) return "system-design";
    if (mode.includes("technical")) return "technical";
    if (/(architect|system\s*design)/i.test(roleText)) return "system-design";
    if (/(backend|frontend|engineer|tech|developer)/i.test(roleText)) return "technical";
    if (/(behavior|communication|culture|people)/i.test(roleText)) return "behavioral";

    return "hr";
  }, [interviewConfig.mode, selectedAvatar?.role]);

  const stopPostureStream = useCallback(() => {
    if (postureStreamRef.current) {
      postureStreamRef.current.getTracks().forEach((track) => track.stop());
      postureStreamRef.current = null;
    }
    if (postureVideoRef.current) {
      postureVideoRef.current.srcObject = null;
    }
  }, []);

  const getFrameMetrics = useCallback((videoEl) => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;

    let brightnessSum = 0;
    let edgeSum = 0;
    let leftEdge = 0;
    let centerEdge = 0;
    let rightEdge = 0;
    let topEdge = 0;
    let midEdge = 0;
    let bottomEdge = 0;

    for (let y = 1; y < canvas.height; y += 1) {
      for (let x = 1; x < canvas.width; x += 1) {
        const currentIndex = (y * canvas.width + x) * 4;
        const leftIndex = (y * canvas.width + (x - 1)) * 4;
        const topIndex = ((y - 1) * canvas.width + x) * 4;

        const luminance = 0.2126 * imageData[currentIndex] + 0.7152 * imageData[currentIndex + 1] + 0.0722 * imageData[currentIndex + 2];
        const luminanceLeft = 0.2126 * imageData[leftIndex] + 0.7152 * imageData[leftIndex + 1] + 0.0722 * imageData[leftIndex + 2];
        const luminanceTop = 0.2126 * imageData[topIndex] + 0.7152 * imageData[topIndex + 1] + 0.0722 * imageData[topIndex + 2];

        brightnessSum += luminance;
        const edgeValue = Math.abs(luminance - luminanceLeft) + Math.abs(luminance - luminanceTop);
        edgeSum += edgeValue;

        if (x < canvas.width / 3) leftEdge += edgeValue;
        else if (x < (2 * canvas.width) / 3) centerEdge += edgeValue;
        else rightEdge += edgeValue;

        if (y < canvas.height / 3) topEdge += edgeValue;
        else if (y < (2 * canvas.height) / 3) midEdge += edgeValue;
        else bottomEdge += edgeValue;
      }
    }

    const pixelCount = (canvas.width - 1) * (canvas.height - 1);
    const avgBrightness = brightnessSum / pixelCount;
    const centerEdgeRatio = centerEdge / Math.max(edgeSum, 1);
    const horizontalBalance = Math.abs(leftEdge - rightEdge) / Math.max(leftEdge + rightEdge, 1);
    const topRatio = topEdge / Math.max(edgeSum, 1);
    const bottomRatio = bottomEdge / Math.max(edgeSum, 1);

    return {
      avgBrightness,
      centerEdgeRatio,
      horizontalBalance,
      topRatio,
      bottomRatio,
      hasDetail: edgeSum / pixelCount > 12,
    };
  }, []);

  const getVoiceProfile = useCallback((avatar) => {
    const isAnimalAvatar = avatar?.species === "animal";

    if (isAnimalAvatar) {
      return { rate: 1.04, pitch: 1.2 };
    }

    if (avatar?.gender === "female") {
      return { rate: 1.0, pitch: 1.12 };
    }

    return { rate: 0.97, pitch: 0.95 };
  }, []);

  const selectBestVoice = useCallback((avatar) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const lowerName = (avatar?.name || "").toLowerCase();
    const preferredFemale = avatar?.gender === "female";

    const byName = voices.find((voice) => voice.name.toLowerCase().includes(lowerName));
    if (byName) return byName;

    if (preferredFemale) {
      return (
        voices.find((voice) => /female|samantha|aria|zira|serena|victoria/i.test(voice.name))
        || voices.find((voice) => /en/i.test(voice.lang))
        || voices[0]
      );
    }

    return voices.find((voice) => /en/i.test(voice.lang)) || voices[0];
  }, []);

  const speakAiMessage = useCallback((text, avatar) => {
    if (!aiVoiceEnabled || !text?.trim()) return;
    if (isListeningUser) return;
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = selectBestVoice(avatar);
    const profile = getVoiceProfile(avatar);

    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice?.lang || "en-US";
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [aiVoiceEnabled, getVoiceProfile, isListeningUser, selectBestVoice]);

  const avatars = useMemo(
    () => getFilteredAvatars(avatarCatalog, userProfile?.industry),
    [userProfile]
  );

  const renderAvatarChip = useCallback((avatar, className, sizeClass = "") => {
    if (avatarPackStyle === "photo" && avatar?.image) {
      return (
        <img
          src={avatar.image}
          alt={`${avatar.name} profile`}
          className={`${className} ${sizeClass}`.trim()}
          loading="lazy"
        />
      );
    }

    if (avatarPackStyle === "illustrated") {
      return (
        <span className={`${className} avatar-illustrated-chip ${sizeClass}`.trim()} aria-hidden="true">
          🎨
        </span>
      );
    }

    return (
      <span className={className} aria-hidden="true">
        {avatar?.avatar || "🧑‍💼"}
      </span>
    );
  }, [avatarPackStyle]);

  const renderAvatarPreview = useCallback((avatar) => {
    if (avatarPackStyle === "photo" && avatar?.image) {
      return (
        <img
          src={avatar.image}
          alt={`${avatar.name} avatar`}
          className="avatar-photo"
          loading="lazy"
        />
      );
    }

    if (avatarPackStyle === "emoji") {
      return (
        <span className="avatar-emoji-preview" aria-hidden="true">
          {avatar?.avatar || "🧑‍💼"}
        </span>
      );
    }

    return (
      <AvatarFigure
        avatar={avatar}
        isSpeaking={hoveredAvatarId === avatar?.id}
        posture={hoveredAvatarId === avatar?.id ? "speaking" : "idle"}
      />
    );
  }, [avatarPackStyle, hoveredAvatarId]);

  const renderInterviewerPanelAvatar = useCallback(() => {
    if (!selectedAvatar) return null;

    const canUseEmbeddedIframe = avatarPackStyle === "illustrated"
      && !(typeof process !== "undefined" && process.env?.NODE_ENV === "test");

    if (canUseEmbeddedIframe) {
      return (
        <iframe
          ref={avatarModuleFrameRef}
          key={`${selectedAvatar?.id}-${embeddedAvatarRole}`}
          title={`${selectedAvatar.name} 3D interviewer`}
          src={`/avatar-system/index.html?embed=1&role=${encodeURIComponent(embeddedAvatarRole)}`}
          className="ai-panel-3d-frame"
        />
      );
    }

    if (avatarPackStyle === "photo" && selectedAvatar.image) {
      return (
        <img
          src={selectedAvatar.image}
          alt={`${selectedAvatar.name} avatar`}
          className="ai-panel-photo"
          loading="lazy"
        />
      );
    }

    if (avatarPackStyle === "emoji") {
      return (
        <div className="ai-panel-emoji" aria-hidden="true">
          {selectedAvatar.avatar || "🧑‍💼"}
        </div>
      );
    }

    // Default: Use animated AvatarFigure for all other cases
    return <AvatarFigure avatar={selectedAvatar} isSpeaking={isSpeaking} posture={avatarPosture} />;
  }, [avatarPackStyle, avatarPosture, embeddedAvatarRole, isSpeaking, selectedAvatar]);

  const latestAiMessage = useMemo(
    () => messages.filter((m) => m.sender === "ai").slice(-1)[0]?.message || "",
    [messages]
  );

  const featureFlags = useMemo(() => getFeatureFlags(), []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    API.get("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          saveStoredUser(res.data.user);
          setUserProfile(res.data.user);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncAvatarPackFromStorage = () => {
      try {
        setAvatarPackStyle(normalizeAvatarPackStyle(localStorage.getItem(AVATAR_PACK_STORAGE_KEY)));
      } catch {
        setAvatarPackStyle("illustrated");
      }
    };

    syncAvatarPackFromStorage();
    window.addEventListener("storage", syncAvatarPackFromStorage);

    return () => {
      window.removeEventListener("storage", syncAvatarPackFromStorage);
    };
  }, []);

  useEffect(() => {
    if (avatarPackStyle !== "illustrated") return;
    const frameWindow = avatarModuleFrameRef.current?.contentWindow;
    if (!frameWindow) return;

    frameWindow.postMessage({ type: "SET_ROLE", role: embeddedAvatarRole }, "*");
  }, [avatarPackStyle, embeddedAvatarRole]);

  useEffect(() => {
    if (avatarPackStyle !== "illustrated") return;
    const frameWindow = avatarModuleFrameRef.current?.contentWindow;
    if (!frameWindow) return;

    const emotion = isAiTyping || avatarPosture === "thinking"
      ? "strict"
      : avatarPosture === "nodding"
        ? "impressed"
        : isSpeaking
          ? "friendly"
          : "neutral";

    frameWindow.postMessage({ type: "SET_EMOTION", emotion }, "*");
  }, [avatarPackStyle, avatarPosture, isAiTyping, isSpeaking]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("aiVoiceEnabled", String(aiVoiceEnabled));
    } catch {
      // ignore localStorage failures in private mode
    }

    if (!aiVoiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [aiVoiceEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("autoVoiceInputEnabled", String(autoVoiceInputEnabled));
    } catch {
      // ignore localStorage failures
    }
  }, [autoVoiceInputEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("autoPlayEnabled", String(autoPlayEnabled));
    } catch {
      // ignore localStorage failures
    }
  }, [autoPlayEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("postureTuning", JSON.stringify(normalizePostureTuning(postureTuning)));
    } catch {
      // ignore localStorage failures
    }
  }, [postureTuning]);

  const createMessage = useCallback((sender, message, idOffset = 0) => ({
    id: Date.now() + idOffset,
    sender,
    message,
    timestamp: new Date().toLocaleTimeString()
  }), []);

  useEffect(() => {
    if (!showAvatarSelect) return;
    if (!planningSelections || Object.keys(planningSelections).length === 0) return;

    const selectedRole = planningSelections.role;
    const selectedDifficulty = planningSelections.difficulty?.name;
    const selectedType = planningSelections.type?.name;

    const difficultyMap = {
      Beginner: "beginner",
      Intermediate: "intermediate",
      Advanced: "advanced",
      Expert: "advanced",
    };

    const modeMap = {
      Technical: "technical",
      "System Design": "technical",
      Behavioral: "behavioral",
      Mixed: "balanced",
    };

    setInterviewConfig((prev) => ({
      ...prev,
      mode: modeMap[selectedType] || prev.mode,
      difficulty: difficultyMap[selectedDifficulty] || prev.difficulty,
      questionCount: selectedType === "Mixed" ? 7 : prev.questionCount,
      targetRole: selectedRole || prev.targetRole,
    }));
  }, [planningSelections, showAvatarSelect]);

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (postureMonitorTimerRef.current) {
        clearInterval(postureMonitorTimerRef.current);
        postureMonitorTimerRef.current = null;
      }
      if (endInterviewTimerRef.current) {
        clearTimeout(endInterviewTimerRef.current);
        endInterviewTimerRef.current = null;
      }
      stopPostureStream();
    };
  }, [stopPostureStream]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer
  useEffect(() => {
    if (interviewActive) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [interviewActive]);

  // ---- Posture helpers ----
  // Trigger "AI is speaking" animation for given duration (ms)
  const triggerSpeak = useCallback((durationMs = 3000) => {
    setAvatarPosture("speaking");
    setIsSpeaking(true);
    clearTimeout(speakTimerRef.current);
    speakTimerRef.current = setTimeout(() => {
      setIsSpeaking(false);
      setAvatarPosture("listening");
    }, durationMs);
  }, []);

  const triggerThinking = useCallback(() => {
    setAvatarPosture("thinking");
    setIsSpeaking(false);
  }, []);

  const appendSessionAnalysis = useCallback((entry) => {
    setSessionAnalyses((prev) => {
      const next = [...prev, entry];
      sessionAnalysesRef.current = next;
      return next;
    });
  }, []);

  const updateSessionAnalysis = useCallback((entryId, patch) => {
    setSessionAnalyses((prev) => {
      const next = prev.map((entry) => (
        entry.id === entryId
          ? { ...entry, ...patch }
          : entry
      ));
      sessionAnalysesRef.current = next;
      return next;
    });
  }, []);

  const triggerNod = useCallback(() => {
    setAvatarPosture("nodding");
    setTimeout(() => setAvatarPosture("listening"), 2000);
  }, []);

  // Request camera/mic
  const requestPermissions = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setUseChat(true);
      return false;
    }

    const permissionTimeoutMs = 4500;

    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 16 / 9 }
          },
          audio: true
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("permission-timeout")), permissionTimeoutMs))
      ]);

      if (videoRef.current) videoRef.current.srcObject = stream;
      setUseChat(false);
      return true;
    } catch {
      setUseChat(true);
      return false;
    }
  };

  // Start interview
  const startInterview = async (avatar) => {
    if (isStartingInterview || startInterviewLockRef.current) return;

    const safeAvatar = avatar || avatars[0] || null;
    if (!safeAvatar) {
      setStartError("No interviewers are available right now. Please refresh and try again.");
      return;
    }

    startInterviewLockRef.current = true;
    const interviewerName = String(safeAvatar?.name || "Interviewer").trim() || "Interviewer";
    const interviewerRole = String(safeAvatar?.role || "AI Interview Coach").trim() || "AI Interview Coach";

    setStartError("");
    setChatError("");
    setCurrentQuestion(0);
    setSessionAnalyses([]);
    sessionAnalysesRef.current = [];
    setLatestVerification(null);
    setSpeechMetrics(null);
    setLivePostureStatus({
      level: "pending",
      message: "Posture monitor starting…"
    });
    endInterviewLockRef.current = false;
    if (endInterviewTimerRef.current) {
      clearTimeout(endInterviewTimerRef.current);
      endInterviewTimerRef.current = null;
    }
    setLivePostureScore(null);
    setIsStartingInterview(true);

    try {
      setSelectedAvatar(safeAvatar);
      setShowAvatarSelect(false);

      const hasMediaAccess = await requestPermissions();
      if (!hasMediaAccess) {
        setStartError("Started in chat mode because camera/microphone access is unavailable.");
      }
      setInterviewActive(true);
      triggerThinking();

      try {
        const response = await API.post("/interview/start", {
          avatar: { name: interviewerName },
          role: interviewerRole,
          config: interviewConfig,
          selections: planningSelections,
          industry: userProfile?.industry || "",
          promptMode: featureFlags.experimentalPrompts ? "experimental" : "standard"
        });
        const greeting = response.data.message || `Hello! I'm ${interviewerName}, your ${interviewerRole}. Let's begin. Please introduce yourself.`;
        setMessages([createMessage("ai", greeting)]);
        speakAiMessage(greeting, safeAvatar);
        const greetingDuration = Math.max(3000, Math.min(greeting.length * 70, 8000));
        triggerSpeak(greetingDuration);
        setTimeout(() => setPendingAutoVoiceStart(true), greetingDuration + 500);
      } catch {
        setStartError("Connected in fallback mode. Some AI features may be limited right now.");
        const greeting = `Hello! I'm ${interviewerName}, your ${interviewerRole}. Let's begin. Please introduce yourself.`;
        setMessages([createMessage("ai", greeting)]);
        speakAiMessage(greeting, safeAvatar);
        const greetingDuration = Math.max(3000, Math.min(greeting.length * 70, 8000));
        triggerSpeak(greetingDuration);
        setTimeout(() => setPendingAutoVoiceStart(true), greetingDuration + 500);
      }
    } catch {
      setStartError("Could not start interview right now. Please try again.");
      setShowAvatarSelect(true);
      setInterviewActive(false);
    } finally {
      setIsStartingInterview(false);
      startInterviewLockRef.current = false;
    }
  };

  const scheduleInterviewEnd = (delayMs = 3200) => {
    if (endInterviewLockRef.current) return;
    if (endInterviewTimerRef.current) {
      clearTimeout(endInterviewTimerRef.current);
    }

    endInterviewTimerRef.current = setTimeout(() => {
      endInterviewTimerRef.current = null;
      endInterview();
    }, delayMs);
  };


  const submitMessage = async (messageText, metadata = {}) => {
    const trimmedMessage = (messageText || "").trim();
    if (!trimmedMessage || !selectedAvatar) return;
    if (currentQuestion >= totalQuestions) {
      setChatError("Interview question limit reached. Finishing session…");
      scheduleInterviewEnd(1200);
      return;
    }
    const latestQuestion = latestAiMessage;
    const analysisId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setChatError("");

    const userMsg = createMessage("user", trimmedMessage);
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLastUserMessage(trimmedMessage); // feed to feedback sidebar
    setAnalysisTrigger((prev) => prev + 1);

    appendSessionAnalysis({
      id: analysisId,
      question: latestQuestion,
      answer: trimmedMessage,
      verification: null,
      grammarIssues: [],
      improvements: [],
      topics: [],
      stats: null,
      speechMetrics: metadata.speechMetrics || null,
      inputSource: metadata.source || "text",
      createdAt: new Date().toISOString(),
      pendingAnalysis: true,
    });

    API.post("/interview/analyze", {
      message: trimmedMessage,
      question: latestQuestion
    })
      .then((analysisRes) => {
        const payload = analysisRes.data || {};
        if (payload.verification) {
          setLatestVerification(payload.verification);
        }

        updateSessionAnalysis(analysisId, {
          verification: payload.verification || null,
          grammarIssues: payload.grammarIssues || [],
          improvements: payload.improvements || [],
          topics: payload.topics || [],
          stats: payload.stats || null,
          pendingAnalysis: false,
        });
      })
      .catch(() => {
        updateSessionAnalysis(analysisId, {
          verification: null,
          grammarIssues: [],
          improvements: [],
          topics: [],
          stats: null,
          pendingAnalysis: false,
        });
      });

    // Avatar starts thinking while waiting
    triggerThinking();
    setIsAiTyping(true);

    try {
      const response = await API.post("/interview/chat", {
        message: trimmedMessage,
        avatar: { name: selectedAvatar.name },
        role: selectedAvatar.role,
        questionCount: Math.min(currentQuestion + 1, totalQuestions),
        config: interviewConfig,
        selections: planningSelections,
        industry: userProfile?.industry || "",
        promptMode: featureFlags.experimentalPrompts ? "experimental" : "standard"
      });

      const aiMsg = createMessage("ai", response.data.response, 1);
      setMessages(prev => [...prev, aiMsg]);
      setCurrentQuestion((prev) => Math.min(prev + 1, totalQuestions));
      speakAiMessage(response.data.response, selectedAvatar);

      // Nod briefly, then speak for the estimated time (improved calculation)
      triggerNod();
      const speakDuration = Math.max(2000, Math.min(response.data.response.length * 70, 8000));
      setTimeout(() => triggerSpeak(speakDuration), 800);
      
      // Delay auto-voice start slightly longer to allow animation to complete
      setTimeout(() => setPendingAutoVoiceStart(true), speakDuration + 500);

      if (response.data.isComplete) {
        scheduleInterviewEnd(3500);
      }

      // Auto-play next question if enabled and within limit
      if (autoPlayEnabled && questionsAutoPlayed < autoPlayQuestionsCount && currentQuestion + 1 < totalQuestions) {
        const autoPlayDelayMs = 3500 + speakDuration;
        setTimeout(async () => {
          setQuestionsAutoPlayed((prev) => prev + 1);
          // Small delay to ensure state updates propagate
          await new Promise(resolve => setTimeout(resolve, 300));
          await requestNextQuestion();
        }, autoPlayDelayMs);
      }
    } catch {
      setChatError("Network issue detected. Responses may be delayed.");
      const fallback = createMessage("ai", "I'm having a little trouble. Please continue.", 1);
      setMessages(prev => [...prev, fallback]);
      speakAiMessage(fallback.message, selectedAvatar);
      triggerSpeak(2500);
      setTimeout(() => setPendingAutoVoiceStart(true), 3000);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    await submitMessage(inputMessage);
  };

  const requestNextQuestion = async () => {
    if (isAiTyping || isFetchingNextQuestion || !selectedAvatar) return;
    if (currentQuestion >= totalQuestions) {
      setChatError("You have reached the configured number of questions.");
      scheduleInterviewEnd(1200);
      return;
    }

    setChatError("");
    setIsFetchingNextQuestion(true);
    setIsAiTyping(true);
    triggerThinking();

    const skipLabel = {
      "too hard": "Too hard",
      clarification: "Need clarification",
      repeated: "Already answered",
      timing: "Time management"
    }[skipReason] || "Need to skip";

    const userPrompt = createMessage("user", `Skip current question (${skipLabel}). Next question, please.`);
    setMessages((prev) => [...prev, userPrompt]);

    try {
      const response = await API.post("/interview/chat", {
        message: `next question please. reason: ${skipReason}`,
        avatar: { name: selectedAvatar.name },
        role: selectedAvatar.role,
        questionCount: Math.min(currentQuestion + 1, totalQuestions),
        config: interviewConfig,
        selections: planningSelections,
        industry: userProfile?.industry || "",
        promptMode: featureFlags.experimentalPrompts ? "experimental" : "standard"
      });

      const aiMsg = createMessage("ai", response.data.response, 1);
      setMessages((prev) => [...prev, aiMsg]);
      setCurrentQuestion((prev) => Math.min(prev + 1, totalQuestions));
      speakAiMessage(response.data.response, selectedAvatar);
      triggerNod();
      const speakDuration = Math.max(2000, Math.min(response.data.response.length * 70, 8000));
      setTimeout(() => triggerSpeak(speakDuration), 700);
      setTimeout(() => setPendingAutoVoiceStart(true), speakDuration + 500);

      if (response.data.isComplete) {
        scheduleInterviewEnd(3200);
      }
    } catch {
      setChatError("Could not fetch the next question. Please try again.");
    } finally {
      setIsAiTyping(false);
      setIsFetchingNextQuestion(false);
    }
  };

  const endInterview = useCallback(() => {
    if (endInterviewLockRef.current) return;
    endInterviewLockRef.current = true;

    setInterviewActive(false);
    clearInterval(timerRef.current);
    clearTimeout(speakTimerRef.current);
    if (endInterviewTimerRef.current) {
      clearTimeout(endInterviewTimerRef.current);
      endInterviewTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningUser(false);
    }
    setIsSpeaking(false);
    setAvatarPosture("idle");
    if (postureMonitorTimerRef.current) {
      clearInterval(postureMonitorTimerRef.current);
      postureMonitorTimerRef.current = null;
    }

    let summaryPayload = null;
    let reportPayload = null;

    try {
      const finalAnalyses = sessionAnalysesRef.current.length ? sessionAnalysesRef.current : sessionAnalyses;
      const report = buildInterviewReport(finalAnalyses, timeElapsed, totalQuestions);
      const summary = {
        sessionId: `${Date.now()}`,
        completedAt: new Date().toISOString(),
        interviewer: selectedAvatar?.name,
        role: selectedAvatar?.role,
        mode: useChat ? "Chat" : "Video",
        durationSeconds: timeElapsed,
        questionsAnswered: finalAnalyses.length,
        config: interviewConfig,
        industry: userProfile?.industry || ""
      };

      localStorage.setItem("latestInterviewSummary", JSON.stringify(summary));
      localStorage.setItem("latestInterviewReport", JSON.stringify(report));

      summaryPayload = summary;
      reportPayload = report;
    } catch {
      // ignore localStorage failures
    }

    const persistPromise = summaryPayload && reportPayload
      ? API.post("/interview/session", {
          summary: summaryPayload,
          report: reportPayload,
          selections: planningSelections,
        })
          .then(() => "saved")
          .catch(() => "failed")
      : Promise.resolve("failed");

    persistPromise.then((dbSaveStatus) => {
      try {
        localStorage.setItem("latestInterviewDbSaveStatus", dbSaveStatus);
      } catch {
        // ignore localStorage failures
      }

      navigate("/results", {
        state: {
          dbSaveStatus,
        },
      });
    });
  }, [
    planningSelections,
    interviewConfig,
    navigate,
    selectedAvatar?.name,
    selectedAvatar?.role,
    sessionAnalyses,
    timeElapsed,
    totalQuestions,
    useChat,
    userProfile?.industry,
  ]);

  const toggleMute = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getAudioTracks();
      tracks.forEach(t => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getVideoTracks();
      tracks.forEach(t => (t.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleAiVoice = () => {
    setAiVoiceEnabled((prev) => !prev);
  };

  const toggleAutoVoiceInput = () => {
    setAutoVoiceInputEnabled((prev) => !prev);
  };

  const analyzeSpeechDelivery = useCallback((text, elapsedSeconds) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.max(elapsedSeconds / 60, 0.15);
    const wordsPerMinute = Math.round(wordCount / minutes);
    const fillerMatches = text.match(/\b(um|uh|like|you know|actually|basically)\b/gi) || [];
    const pauseCount = (text.match(/[,;:]/g) || []).length;

    const nextMetrics = {
      wordsPerMinute,
      fillerCount: fillerMatches.length,
      pauseCount,
      tip: deriveSpeechTip(wordsPerMinute, fillerMatches.length, pauseCount)
    };

    setSpeechMetrics(nextMetrics);
    return nextMetrics;
  }, []);

  const toggleVoiceInput = (options = {}) => {
    const { switchToChat = false } = options;

    if (switchToChat && !useChat) {
      setUseChat(true);
    }

    if (typeof window === "undefined") {
      setChatError("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setChatError("Speech recognition is unavailable. Try Chrome or Edge.");
      return;
    }

    if (isListeningUser) {
      speechRecognitionRef.current?.stop();
      setIsListeningUser(false);
      setLiveTranscript("");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    speechStartTimeRef.current = Date.now();
    recognitionFinalTranscriptRef.current = "";
    recognitionLatestTranscriptRef.current = "";
    setChatError("");

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    recognition.onstart = () => {
      setIsListeningUser(true);
      setLiveTranscript("");
      setAvatarPosture("listening");
      setIsSpeaking(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) {
          recognitionFinalTranscriptRef.current = `${recognitionFinalTranscriptRef.current} ${text}`.trim();
        } else {
          interimTranscript += text;
        }
      }

      const mergedTranscript = `${recognitionFinalTranscriptRef.current} ${interimTranscript}`.trim();
      recognitionLatestTranscriptRef.current = mergedTranscript;
      setLiveTranscript(mergedTranscript);
      setInputMessage(mergedTranscript);
    };

    recognition.onerror = (event) => {
      setIsListeningUser(false);
      setLiveTranscript("");
      const errorCode = event?.error;
      if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
        setChatError("Microphone access is blocked. Allow mic permission and try again.");
        return;
      }
      if (errorCode === "no-speech") {
        setChatError("No speech detected. Speak clearly and try again.");
        return;
      }
      setChatError("Voice capture failed. Please try speaking again.");
    };

    recognition.onend = () => {
      setIsListeningUser(false);
      const elapsedSeconds = Math.max((Date.now() - speechStartTimeRef.current) / 1000, 1);
      const finalTranscript = (
        recognitionFinalTranscriptRef.current.trim()
        || recognitionLatestTranscriptRef.current.trim()
        || inputMessage.trim()
      );

      if (!finalTranscript) {
        setLiveTranscript("");
        setChatError("No speech captured. Tap Speak and try again in a quieter environment.");
        return;
      }

      setInputMessage(finalTranscript);
      setLiveTranscript(finalTranscript);
      const liveSpeechMetrics = analyzeSpeechDelivery(finalTranscript, elapsedSeconds);

      if (interviewActive && !isAiTyping && !isVoiceSubmittingRef.current) {
        isVoiceSubmittingRef.current = true;
        submitMessage(finalTranscript, { source: "speech", speechMetrics: liveSpeechMetrics }).finally(() => {
          isVoiceSubmittingRef.current = false;
          setLiveTranscript("");
        });
      }
    };

    speechRecognitionRef.current = recognition;
    recognition.start();

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "microphone" })
        .then((status) => {
          if (status?.state === "denied") {
            setChatError("Microphone access is blocked. Allow mic permission and try again.");
            recognition.stop();
          }
        })
        .catch(() => {
          // ignore permissions API read failures
        });
    }
  };

  useEffect(() => {
    if (!autoVoiceInputEnabled || !pendingAutoVoiceStart) return;
    if (!interviewActive || isAiTyping || isSpeaking || isListeningUser || isStartingInterview) return;

    // Add a small delay to ensure AI animation completes and state settles
    const autoVoiceTimer = setTimeout(() => {
      setPendingAutoVoiceStart(false);
      toggleVoiceInput({ switchToChat: false });
    }, 800);

    return () => clearTimeout(autoVoiceTimer);
  }, [
    autoVoiceInputEnabled,
    pendingAutoVoiceStart,
    interviewActive,
    isAiTyping,
    isSpeaking,
    isListeningUser,
    isStartingInterview,
  ]);

  const runPostureCheck = async () => {
    setIsPostureChecking(true);
    setPostureFeedback({ status: "checking", tips: ["Checking camera framing and posture..."], score: null, statusMessage: "Analyzing posture..." });
    setPostureDebug({
      confidence: null,
      source: "analyzing",
      avgBrightness: null,
      centerEdgeRatio: null,
      horizontalBalance: null,
      hasDetail: null
    });

    const updateDebugSnapshot = (source, metrics, confidence) => {
      setPostureDebug({
        confidence: Number.isFinite(confidence) ? Math.round(confidence) : null,
        source,
        avgBrightness: Number.isFinite(metrics?.avgBrightness) ? Math.round(metrics.avgBrightness) : null,
        centerEdgeRatio: Number.isFinite(metrics?.centerEdgeRatio) ? Number(metrics.centerEdgeRatio.toFixed(2)) : null,
        horizontalBalance: Number.isFinite(metrics?.horizontalBalance) ? Number(metrics.horizontalBalance.toFixed(2)) : null,
        hasDetail: typeof metrics?.hasDetail === "boolean" ? metrics.hasDetail : null
      });
    };

    const evaluateFramePresence = () => {
      const videoEl = postureVideoRef.current;
      const videoWidth = videoEl?.videoWidth || 0;
      const videoHeight = videoEl?.videoHeight || 0;
      if (!videoEl || videoWidth < 40 || videoHeight < 40) {
        return { metrics: null, personLikely: false, confidenceScore: 0 };
      }

      let metrics = null;
      try {
        metrics = getFrameMetrics(videoEl);
      } catch {
        metrics = null;
      }

      if (!metrics) {
        return { metrics: null, personLikely: false, confidenceScore: 0 };
      }

      const brightnessConfidence = 1 - Math.min(Math.abs(metrics.avgBrightness - 130) / 130, 1);
      const centerConfidence = Math.min(metrics.centerEdgeRatio / 0.28, 1);
      const balanceConfidence = 1 - Math.min(metrics.horizontalBalance / 0.6, 1);
      const detailConfidence = metrics.hasDetail ? 1 : 0;

      const confidenceScore = (
        detailConfidence * 0.35
        + brightnessConfidence * 0.2
        + centerConfidence * 0.25
        + balanceConfidence * 0.2
      ) * 100;

      const confidenceBuffer = Math.max(6, Math.min(10, Math.round((100 - postureTuning.confidenceMin) * 0.2)));
      const brightnessWithinRange =
        metrics.avgBrightness > (postureTuning.brightnessMin - 10)
        && metrics.avgBrightness < (postureTuning.brightnessMax + 10);
      const centeredEnough = metrics.centerEdgeRatio >= (postureTuning.centerMin - 0.02);
      const balancedEnough = metrics.horizontalBalance <= (postureTuning.balanceMax + 0.08);

      const personLikely =
        confidenceScore >= (postureTuning.confidenceMin - confidenceBuffer)
        && metrics.hasDetail
        && brightnessWithinRange
        && centeredEnough
        && balancedEnough;

      return { metrics, personLikely, confidenceScore };
    };

    try {
      stopPostureStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 }
        },
        audio: false
      });
      postureStreamRef.current = stream;
      if (postureVideoRef.current) {
        postureVideoRef.current.srcObject = stream;
        try {
          await postureVideoRef.current.play();
        } catch {
          // Video autoplay may fail in some browsers, but srcObject is still set
          // The stream should display once browser permissions are fully granted
          console.debug("Posture video autoplay encountered permission delay");
        }
        const warmupDelayMs = process.env.NODE_ENV === "test" ? 0 : 1000;
        if (warmupDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, warmupDelayMs));
        }
      }

      const tips = [];
      let posturePenalty = 0;
      let personDetected = false;
      if (typeof window !== "undefined" && "FaceDetector" in window && postureVideoRef.current) {
        let faces = [];
        try {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          faces = await detector.detect(postureVideoRef.current);
        } catch {
          faces = [];
        }

        if (!faces.length) {
          const { metrics, personLikely, confidenceScore } = evaluateFramePresence();
          updateDebugSnapshot(personLikely ? "frame-fallback" : "face-miss", metrics, confidenceScore);
          if (personLikely) {
            personDetected = true;
            tips.push("Face detector was uncertain, but your framing appears valid.");
            posturePenalty += 4;

            if (metrics.avgBrightness < 62) {
              tips.push("Lighting appears low. Add front light for clearer facial visibility.");
              posturePenalty += 10;
            }
            if (metrics.centerEdgeRatio < 0.22 || metrics.horizontalBalance > 0.38) {
              tips.push("Center your face in the frame to maintain confident eye contact.");
              posturePenalty += 9;
            }
            if (metrics.bottomRatio > 0.46) {
              tips.push("Camera may be too low. Raise it to eye level.");
              posturePenalty += 7;
            }
            if (metrics.topRatio > 0.48) {
              tips.push("Camera may be too high. Lower it slightly to keep natural posture.");
              posturePenalty += 7;
            }
          } else {
            tips.push("Face not detected clearly. Move to better lighting and face the camera directly.");
            posturePenalty += 18;
          }
        } else {
          personDetected = true;
          const face = faces[0].boundingBox;
          const vw = postureVideoRef.current.videoWidth || 1;
          const vh = postureVideoRef.current.videoHeight || 1;
          const centerX = face.x + face.width / 2;
          const centerY = face.y + face.height / 2;
          const centerOffset = Math.abs(centerX - vw / 2) / vw;
          const verticalOffset = Math.abs(centerY - vh * 0.42) / vh;
          const sizeRatio = face.height / vh;
          const { metrics } = evaluateFramePresence();

          const faceConfidence = Math.max(
            40,
            Math.min(
              99,
              96
              - Math.round(centerOffset * 55)
              - Math.round(verticalOffset * 45)
              - (sizeRatio < 0.2 || sizeRatio > 0.58 ? 10 : 0)
            )
          );
          updateDebugSnapshot("face-detector", metrics, faceConfidence);

          if (centerOffset > 0.12) {
            tips.push("Center your face in the frame to maintain confident eye contact.");
            posturePenalty += 14;
          }
          if (verticalOffset > 0.15) {
            tips.push("Raise or lower your camera so your eyes are near the top-third guideline.");
            posturePenalty += 12;
          }
          if (sizeRatio < 0.22) {
            tips.push("Move slightly closer so your upper shoulders and head are visible.");
            posturePenalty += 10;
          }
          if (sizeRatio > 0.55) {
            tips.push("Move slightly back for a balanced professional framing.");
            posturePenalty += 9;
          }
        }
      } else {
        const { metrics, personLikely, confidenceScore } = evaluateFramePresence();
        updateDebugSnapshot(personLikely ? "frame-only" : "frame-only-low", metrics, confidenceScore);
        if (!metrics) {
          tips.push("Camera check was partial. Ensure webcam is active and stable.");
          posturePenalty += 12;
        } else {
          personDetected = personLikely;

          if (metrics.avgBrightness < 62) {
            tips.push("Lighting appears low. Add front light for clearer facial visibility.");
            posturePenalty += 10;
          }
          if (!metrics.hasDetail) {
            tips.push("Camera detail is low. Clean lens or increase light for sharper framing.");
            posturePenalty += 9;
          }
          if (metrics.centerEdgeRatio < 0.2 || metrics.horizontalBalance > 0.38) {
            tips.push("Position yourself in the center of the frame for stronger eye contact.");
            posturePenalty += 10;
          }
          if (metrics.bottomRatio > 0.46) {
            tips.push("Camera may be too low. Raise it to eye level.");
            posturePenalty += 8;
          }
          if (metrics.topRatio > 0.48) {
            tips.push("Camera may be too high. Lower it slightly to keep natural posture.");
            posturePenalty += 8;
          }
          if (personLikely) {
            tips.push("Smart posture check completed with camera-frame analysis.");
          }
        }
      }

      if (!personDetected) {
        setPostureFeedback({
          status: "no-person",
          score: null,
          statusMessage: "No person detected. Sit in front of the camera and run posture check again.",
          tips: [
            "Sit so your head and upper shoulders are visible in the preview.",
            "Turn on front lighting and avoid bright backlight.",
            "Center your face inside the guide and keep a neutral upright posture.",
            "Click Check My Posture again once you are fully in frame."
          ]
        });
        return;
      }

      tips.push("Keep shoulders relaxed and level; avoid leaning too far forward.");
      tips.push("Place camera at eye level and keep your chin parallel to the floor.");

      const postureScore = Math.max(55, 100 - posturePenalty);
      const statusMessage = postureScore >= 85
        ? "Excellent posture. You are interview-ready."
        : postureScore >= 70
          ? "Good posture. Apply the quick fixes below for best impact."
          : "Posture needs improvement. Re-check after adjusting your setup.";

      if (tips.length <= 2) {
        tips.unshift("Great posture detected. Keep this setup for your interview.");
      }

      setPostureFeedback({ status: "ready", tips: tips.slice(0, 4), score: postureScore, statusMessage });
    } catch {
      setPostureDebug({
        confidence: 0,
        source: "error",
        avgBrightness: null,
        centerEdgeRatio: null,
        horizontalBalance: null,
        hasDetail: null
      });
      setPostureFeedback({
        status: "error",
        score: 0,
        statusMessage: "Could not assess posture automatically.",
        tips: [
          "Unable to access camera. Allow permission to run posture checks.",
          "Sit upright, shoulders open, and align your face at eye level."
        ]
      });
    } finally {
      setIsPostureChecking(false);
      stopPostureStream();
    }
  };

  useEffect(() => {
    if (!interviewActive) {
      setLivePostureStatus({
        level: "idle",
        message: "Waiting for interview to start posture monitoring."
      });
      setLivePostureScore(null);
      livePostureSamplesRef.current = [];
      return;
    }

    if (useChat) {
      setLivePostureStatus({
        level: "paused",
        message: "Posture monitoring is paused in chat mode."
      });
      setLivePostureScore(null);
      return;
    }

    if (isVideoOff) {
      setLivePostureStatus({
        level: "paused",
        message: "Turn camera on to continue posture monitoring."
      });
      setLivePostureScore(null);
      return;
    }

    const evaluateLivePosture = () => {
      const videoEl = videoRef.current;
      if (!videoEl || !videoEl.srcObject || videoEl.videoWidth < 40 || videoEl.videoHeight < 40) {
        setLivePostureStatus({
          level: "pending",
          message: "Waiting for camera feed to stabilize."
        });
        setLivePostureScore(null);
        return;
      }

      const metrics = getFrameMetrics(videoEl);
      if (!metrics) {
        setLivePostureStatus({
          level: "pending",
          message: "Collecting posture data…"
        });
        setLivePostureScore(null);
        return;
      }

      livePostureSamplesRef.current = [...livePostureSamplesRef.current, metrics].slice(-3);
      const sampleCount = livePostureSamplesRef.current.length;
      const averaged = livePostureSamplesRef.current.reduce((acc, sample) => ({
        avgBrightness: acc.avgBrightness + sample.avgBrightness,
        centerEdgeRatio: acc.centerEdgeRatio + sample.centerEdgeRatio,
        horizontalBalance: acc.horizontalBalance + sample.horizontalBalance,
        topRatio: acc.topRatio + sample.topRatio,
        bottomRatio: acc.bottomRatio + sample.bottomRatio,
        hasDetailVotes: acc.hasDetailVotes + (sample.hasDetail ? 1 : 0),
      }), {
        avgBrightness: 0,
        centerEdgeRatio: 0,
        horizontalBalance: 0,
        topRatio: 0,
        bottomRatio: 0,
        hasDetailVotes: 0,
      });

      const stabilizedMetrics = {
        avgBrightness: averaged.avgBrightness / sampleCount,
        centerEdgeRatio: averaged.centerEdgeRatio / sampleCount,
        horizontalBalance: averaged.horizontalBalance / sampleCount,
        topRatio: averaged.topRatio / sampleCount,
        bottomRatio: averaged.bottomRatio / sampleCount,
        hasDetail: averaged.hasDetailVotes >= Math.ceil(sampleCount / 2),
      };

      const inRangeBrightness = stabilizedMetrics.avgBrightness > postureTuning.brightnessMin && stabilizedMetrics.avgBrightness < postureTuning.brightnessMax;
      const centered = stabilizedMetrics.centerEdgeRatio >= postureTuning.centerMin;
      const balanced = stabilizedMetrics.horizontalBalance <= postureTuning.balanceMax;
      const cameraLow = stabilizedMetrics.bottomRatio > 0.46;
      const cameraHigh = stabilizedMetrics.topRatio > 0.48;

      const centerGap = centered
        ? 0
        : Math.min((postureTuning.centerMin - stabilizedMetrics.centerEdgeRatio) / Math.max(postureTuning.centerMin, 0.01), 1);
      const balanceGap = balanced
        ? 0
        : Math.min((stabilizedMetrics.horizontalBalance - postureTuning.balanceMax) / 0.4, 1);

      const penalties = [
        !stabilizedMetrics.hasDetail ? 16 : 0,
        !inRangeBrightness ? 18 : 0,
        Math.round(centerGap * 18),
        Math.round(balanceGap * 14),
        cameraLow ? 8 : 0,
        cameraHigh ? 8 : 0,
      ];

      const score = clampScore(100 - penalties.reduce((sum, value) => sum + value, 0), 20, 100);
      setLivePostureScore(score);

      const goodPosture = stabilizedMetrics.hasDetail && inRangeBrightness && centered && balanced && !cameraLow && !cameraHigh;

      if (goodPosture) {
        setLivePostureStatus({
          level: "good",
          message: "Great posture and framing. Keep this setup."
        });
        return;
      }

      let message = "Adjust posture for better interview framing.";
      if (!inRangeBrightness) message = "Adjust lighting for clearer visibility.";
      else if (!centered) message = "Center your face in the camera frame.";
      else if (!balanced) message = "Align yourself straight in front of the camera.";
      else if (cameraLow) message = "Raise your camera to eye level for better posture.";
      else if (cameraHigh) message = "Lower your camera slightly to eye level.";
      else if (!stabilizedMetrics.hasDetail) message = "Increase lighting or clean camera lens for sharper detail.";

      setLivePostureStatus({ level: "warning", message });
    };

    evaluateLivePosture();
    postureMonitorTimerRef.current = setInterval(evaluateLivePosture, 3500);

    return () => {
      if (postureMonitorTimerRef.current) {
        clearInterval(postureMonitorTimerRef.current);
        postureMonitorTimerRef.current = null;
      }
    };
  }, [getFrameMetrics, interviewActive, isVideoOff, postureTuning, useChat]);

  return (
    <div className="interview-page">
      {/* Background */}
      <div className="interview-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      <div className="interview-container">
        {/* Header */}
        <div className="interview-header">
          <Link to="/dashboard" className="back-link">
            <span className="back-icon">←</span>
            Back to Dashboard
          </Link>
          <h1>AI Mock Interview</h1>
          {interviewActive && (
            <div className="interview-timer" aria-live="polite" aria-label={`Interview timer ${formatTime(timeElapsed)}`}>
              <span className="timer-icon">⏱️</span>
              <span className="timer-text">{formatTime(timeElapsed)}</span>
            </div>
          )}
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
            <div className="avatar-pack-badge" role="status" aria-live="polite">
              Current pack: {currentAvatarPackLabel}
            </div>

            {featureFlags.experimentalPrompts && (
              <p className="feature-flag-note" role="status">
                Experimental prompt mode is enabled for this session.
              </p>
            )}

            {startError && (
              <p className="state-banner" role="status" aria-live="polite">
                {startError}
              </p>
            )}

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

              <div className="config-item">
                <label htmlFor="configStyle">Response Style</label>
                <select
                  id="configStyle"
                  value={interviewConfig.responseStyle}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, responseStyle: e.target.value }))}
                >
                  <option value="coaching">Coaching</option>
                  <option value="strict">Strict Interviewer</option>
                  <option value="friendly">Friendly Guide</option>
                </select>
              </div>

              <div className="config-item">
                <label htmlFor="configRole">Target Role</label>
                <input
                  id="configRole"
                  type="text"
                  value={interviewConfig.targetRole}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, targetRole: e.target.value || "Software Engineer" }))}
                />
              </div>

              <div className="config-item">
                <label htmlFor="configAnswerLength">Expected Answer Length</label>
                <select
                  id="configAnswerLength"
                  value={interviewConfig.answerLength}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, answerLength: e.target.value }))}
                >
                  <option value="short">Short (30-45 sec)</option>
                  <option value="medium">Medium (60-90 sec)</option>
                  <option value="detailed">Detailed (2 min)</option>
                </select>
              </div>
            </div>

            <SilentErrorBoundary
              fallback={(
                <p className="state-banner" role="status" aria-live="polite">
                  Posture checker is unavailable on this browser right now. You can continue with interview mode.
                </p>
              )}
            >
              <PostureChecker
                postureFeedback={postureFeedback}
                postureDebug={postureDebug}
                postureTuning={postureTuning}
                isPostureChecking={isPostureChecking}
                postureVideoRef={postureVideoRef}
                onRunPostureCheck={runPostureCheck}
                onSetPostureTuning={setPostureTuning}
                onResetPostureTuning={() => setPostureTuning(defaultPostureTuning)}
              />
            </SilentErrorBoundary>

            <div className="avatars-grid">
              {avatars.length === 0 && (
                <div className="state-empty" role="status" aria-live="polite">
                  <h3>No interviewers available</h3>
                  <p>Try refreshing your profile from the dashboard and come back.</p>
                </div>
              )}
              {avatars.map(avatar => (
                <div
                  key={avatar.id}
                  className={`avatar-card ${hoveredAvatarId === avatar.id ? "avatar-card-hovered" : ""}`}
                  onClick={() => startInterview(avatar)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      startInterview(avatar);
                    }
                  }}
                  onMouseEnter={() => setHoveredAvatarId(avatar.id)}
                  onMouseLeave={() => setHoveredAvatarId(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Start interview with ${avatar.name}, ${avatar.role}`}
                  aria-disabled={isStartingInterview}
                  style={{ background: avatar.bgColor }}
                >
                  <div className="avatar-preview">
                    {renderAvatarPreview(avatar)}
                  </div>

                  <h3>{avatar.name}</h3>
                  <p className="avatar-role">{avatar.role}</p>
                  <button
                    className="select-avatar-btn"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      startInterview(avatar);
                    }}
                    disabled={isStartingInterview}
                  >
                    {isStartingInterview ? "Starting…" : "Start Interview →"}
                  </button>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ===== ACTIVE INTERVIEW SESSION ===== */
          <div className="interview-session">
            {isStartingInterview && (
              <p className="state-banner" role="status" aria-live="polite">
                Starting your session…
              </p>
            )}
            
            {/* Interview Header with Details Toggle */}
            <div className="interview-header">
              <h2 className="interview-title">{selectedAvatar?.name} Interview</h2>
              <button
                type="button"
                className="toggle-details-btn-header"
                onClick={() => setDetailsOpen(!detailsOpen)}
                aria-label={detailsOpen ? "Collapse interview details" : "Expand interview details"}
                aria-expanded={detailsOpen}
                title="Toggle interview details"
              >
                <span className="toggle-icon">{detailsOpen ? '▼' : '▶'}</span>
                <span className="toggle-text">Details</span>
              </button>
            </div>
            
            <div className="interview-main">
              {/* Left: AI avatar panel + user video */}
              <div className="interview-area">
                {/* AI Avatar Panel (always visible) */}
                <div className="ai-avatar-panel">
                  <div className="panel-bg-lines"></div>

                  {renderInterviewerPanelAvatar()}

                  <div className="ai-panel-name">{selectedAvatar?.name}</div>
                  <div className="ai-panel-role">{selectedAvatar?.role}</div>
                  <div className="ai-panel-status" aria-live="polite">
                    <span className="status-dot"></span>
                    <span>{isAiTyping ? "Thinking…" : isSpeaking ? "Speaking…" : "Listening"}</span>
                  </div>

                  <button
                    type="button"
                    className="voice-toggle-btn"
                    onClick={toggleAiVoice}
                    aria-pressed={aiVoiceEnabled}
                    aria-label={aiVoiceEnabled ? "Disable AI voice" : "Enable AI voice"}
                  >
                    {aiVoiceEnabled ? "🔊 AI Voice On" : "🔈 AI Voice Off"}
                  </button>

                  <button
                    type="button"
                    className="voice-toggle-btn"
                    onClick={toggleAutoVoiceInput}
                    aria-pressed={autoVoiceInputEnabled}
                    aria-label={autoVoiceInputEnabled ? "Disable auto voice input" : "Enable auto voice input"}
                  >
                    {autoVoiceInputEnabled ? "🎙 Auto Listen On" : "🎙 Auto Listen Off"}
                  </button>

                  <button
                    type="button"
                    className="voice-toggle-btn"
                    onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                    aria-pressed={autoPlayEnabled}
                    aria-label={autoPlayEnabled ? "Disable auto-play questions" : "Enable auto-play questions"}
                    title={autoPlayEnabled ? "Auto-play next questions is ON" : "Auto-play next questions is OFF"}
                  >
                    {autoPlayEnabled ? "⚡ Auto-Play On" : "⚡ Auto-Play Off"}
                  </button>

                  <div className="panel-desk"></div>
                </div>

                {/* User video / chat toggle */}
                {!useChat ? (
                  <div className="video-container video-container-user pip-camera">
                    <video ref={videoRef} autoPlay playsInline muted={isMuted} className={isVideoOff ? "video-off" : ""} />
                    <div className="self-video-badge">You</div>
                    {isVideoOff && (
                      <div className="video-off-placeholder">
                        <span className="video-off-icon">📹</span>
                        <p>Camera is off</p>
                      </div>
                    )}
                    <div className="video-controls">
                      <button className={`control-btn ${isMuted ? "active" : ""}`} onClick={toggleMute} aria-label={isMuted ? "Unmute microphone" : "Mute microphone"} aria-pressed={isMuted}>
                        {isMuted ? "🔇" : "🎤"}
                      </button>
                      <button className={`control-btn ${isVideoOff ? "active" : ""}`} onClick={toggleVideo} aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"} aria-pressed={isVideoOff}>
                        {isVideoOff ? "📷" : "🎥"}
                      </button>
                      <button
                        className={`control-btn ${isListeningUser ? "active" : ""}`}
                        onClick={toggleVoiceInput}
                        aria-label={isListeningUser ? "Stop voice transcription" : "Start voice transcription"}
                        aria-pressed={isListeningUser}
                        title={isListeningUser ? "Stop speech-to-text" : "Speak to transcribe"}
                      >
                        {isListeningUser ? "⏹" : "🎙"}
                      </button>
                      <button className="control-btn settings" onClick={() => setUseChat(true)} aria-label="Switch to chat mode">
                        💬 Chat Mode
                      </button>
                    </div>
                    {(isListeningUser || liveTranscript) && (
                      <div className="live-transcript" aria-live="polite">
                        {liveTranscript || "Listening… speak now"}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Chat mode */
                  <div className="chat-container">
                    <div className="chat-header">
                      <div className="chat-avatar">
                          {renderAvatarChip(selectedAvatar, "chat-avatar-icon")}
                        <div>
                          <h3>{selectedAvatar?.name}</h3>
                          <p>{selectedAvatar?.role}</p>
                        </div>
                      </div>
                      <button className="switch-video-btn" onClick={() => setUseChat(false)} aria-label="Switch to video mode">
                        📹 Video Mode
                      </button>
                    </div>

                    <div className="chat-messages" ref={chatContainerRef} role="log" aria-live="polite" aria-relevant="additions text" aria-busy={isAiTyping || isStartingInterview}>
                      {messages.length === 0 && !isAiTyping && (
                        <div className="state-empty state-empty-chat" role="status">
                          <h3>Preparing your interview</h3>
                          <p>{isStartingInterview ? "Starting your session…" : "Waiting for the first question…"}</p>
                        </div>
                      )}
                      {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender === "user" ? "user-message" : "ai-message"}`}>
                          <div className="message-avatar">
                            {msg.sender === "user" ? "👤" : renderAvatarChip(selectedAvatar, "message-avatar-icon")}
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
                          <div className="message-avatar">{renderAvatarChip(selectedAvatar, "message-avatar-icon")}</div>
                          <div className="message-content">
                            <div className="typing-indicator" aria-label="AI is typing" role="status">
                              <span></span><span></span><span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {chatError && (
                      <p className="state-banner" role="alert">
                        {chatError}
                      </p>
                    )}

                    <form onSubmit={sendMessage} className="chat-input-form">
                      <label htmlFor="chatInput" className="sr-only">Your response</label>
                      <input
                        id="chatInput"
                        type="text"
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        placeholder="Type your response…"
                        className="chat-input"
                        aria-label="Type your response"
                        disabled={isAiTyping}
                      />
                      <button type="submit" className="send-btn" disabled={isAiTyping || !inputMessage.trim()}>
                        Send →
                      </button>
                      <button
                        type="button"
                        className={`send-btn voice-input-btn ${isListeningUser ? "listening" : ""}`}
                        onClick={toggleVoiceInput}
                        aria-pressed={isListeningUser}
                        aria-label={isListeningUser ? "Stop voice input" : "Start voice input"}
                      >
                        {isListeningUser ? "⏹ Listening" : "🎙 Speak"}
                      </button>
                    </form>
                    <p className="voice-input-hint">Voice mode auto-sends your answer when listening stops.</p>
                    {(isListeningUser || liveTranscript) && (
                      <p className="voice-input-hint voice-live-text" aria-live="polite">
                        {liveTranscript || "Listening… speak now"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Feedback Sidebar (grammar, improvements, topics) */}
              <SilentErrorBoundary
                fallback={(
                  <div className="interview-info" role="status" aria-live="polite">
                    <h3>Feedback Sidebar</h3>
                    <p className="voice-input-hint">Feedback panel failed to load. Interview can continue normally.</p>
                  </div>
                )}
              >
                <FeedbackSidebar
                  lastUserMessage={lastUserMessage}
                  currentQuestionText={latestAiMessage}
                  isOpen={feedbackOpen}
                  onToggle={() => setFeedbackOpen(o => !o)}
                  speechMetrics={speechMetrics}
                  analysisTrigger={analysisTrigger}
                />
              </SilentErrorBoundary>

              {/* Right Interview Detail Sidebar */}
              <div className="interview-sidebar">
                <div className="current-question">
                  <h3>Interview Progress</h3>
                  <div className="progress-inline-row">
                    <span className="progress-counter">Q {displayedQuestionNumber}/{totalQuestions}</span>
                    <div className="progress-bar compact-progress inline-progress">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <span className="progress-percent">{roundedProgressPercent}%</span>
                  </div>
                  <div className="question-box">
                    <p className="question-preview-text">{latestAiMessage || "Waiting for interview to start…"}</p>
                  </div>
                  <div className="progress-actions-row">
                    <button
                      type="button"
                      className="next-question-btn compact"
                      onClick={requestNextQuestion}
                      disabled={isAiTyping || isFetchingNextQuestion}
                    >
                      {isFetchingNextQuestion ? "Loading…" : "Next →"}
                    </button>

                    <div className="skip-reason-wrap compact">
                    <label htmlFor="skipReasonSelect">If skipping, reason</label>
                    <select
                      id="skipReasonSelect"
                      value={skipReason}
                      onChange={(event) => setSkipReason(event.target.value)}
                      disabled={isAiTyping || isFetchingNextQuestion}
                    >
                      <option value="too hard">Too hard</option>
                      <option value="clarification">Need clarification</option>
                      <option value="repeated">Already answered</option>
                      <option value="timing">Time management</option>
                    </select>
                    </div>
                  </div>
                </div>

                <div className="speaking-board">
                  <div className="speech-board-head">
                    <h3>Speaking Display Board</h3>
                    <button
                      type="button"
                      className="speech-copy-btn"
                      onClick={copyCorrectedText}
                      disabled={!correctedSpeakingText}
                    >
                      {isCorrectionCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="speech-board-label">Your text</p>
                  <div className="speech-board-text">
                    {speakingBoardText || "Start speaking to see your transcript here."}
                  </div>
                  <p className="speech-board-label">Corrected text</p>
                  <div className="speech-board-text corrected">
                    {speakingBoardText
                      ? correctedWordDiff.map((entry, index) => (
                        <span
                          key={`${entry.word}-${index}`}
                          className={entry.changed ? "speech-word speech-word-changed" : "speech-word"}
                        >
                          {entry.word}{index < correctedWordDiff.length - 1 ? " " : ""}
                        </span>
                      ))
                      : "Corrections appear automatically based on your text."}
                  </div>
                  <p className="speech-board-legend">Highlighted = corrected words</p>
                  {latestGrammarHints.length > 0 && (
                    <ul className="speech-board-hints">
                      {latestGrammarHints.map((hint, index) => (
                        <li key={`${hint}-${index}`}>{hint}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="interview-info">
                  <div className="interview-info-header">
                    <h3>Interview Details</h3>
                    <button
                      type="button"
                      className="toggle-details-btn"
                      onClick={() => setDetailsOpen(!detailsOpen)}
                      aria-label={detailsOpen ? "Collapse interview details" : "Expand interview details"}
                      aria-expanded={detailsOpen}
                    >
                      {detailsOpen ? '▼' : '▶'}
                    </button>
                  </div>
                  {detailsOpen && (
                  <div className="interview-details-grid">
                    <button className="detail-button" type="button" aria-label="Interviewer details">
                      <span className="detail-icon">👤</span>
                      <div className="detail-content">
                        <span className="detail-label">Interviewer</span>
                        <span className="detail-value">{selectedAvatar?.name}</span>
                      </div>
                    </button>
                    
                    <button className="detail-button" type="button" aria-label="Role details">
                      <span className="detail-icon">💼</span>
                      <div className="detail-content">
                        <span className="detail-label">Role</span>
                        <span className="detail-value">{selectedAvatar?.role}</span>
                      </div>
                    </button>
                    
                    <button className="detail-button" type="button" aria-label="Mode details">
                      <span className="detail-icon">{useChat ? '💬' : '📹'}</span>
                      <div className="detail-content">
                        <span className="detail-label">Mode</span>
                        <span className="detail-value">{useChat ? "Chat" : "Video"}</span>
                      </div>
                    </button>
                    
                    {selectedDomainName && (
                      <button className="detail-button" type="button" aria-label="Domain details">
                        <span className="detail-icon">📚</span>
                        <div className="detail-content">
                          <span className="detail-label">Domain</span>
                          <span className="detail-value">{selectedDomainName}</span>
                        </div>
                      </button>
                    )}
                    
                    {selectedDifficultyName && (
                      <button className="detail-button" type="button" aria-label="Difficulty details">
                        <span className="detail-icon">⚡</span>
                        <div className="detail-content">
                          <span className="detail-label">Difficulty</span>
                          <span className="detail-value">{selectedDifficultyName}</span>
                        </div>
                      </button>
                    )}
                    
                    {selectedInterviewTypeName && (
                      <button className="detail-button" type="button" aria-label="Interview type details">
                        <span className="detail-icon">🎯</span>
                        <div className="detail-content">
                          <span className="detail-label">Type</span>
                          <span className="detail-value">{selectedInterviewTypeName}</span>
                        </div>
                      </button>
                    )}
                    
                    <button className="detail-button" type="button" aria-label="Duration details">
                      <span className="detail-icon">⏱️</span>
                      <div className="detail-content">
                        <span className="detail-label">Duration</span>
                        <span className="detail-value">{formatTime(timeElapsed)}</span>
                      </div>
                    </button>
                    
                    <button className="detail-button detail-button-status" type="button" aria-label="AI status">
                      <span className="detail-icon">
                        {isAiTyping ? '🤔' : isSpeaking ? '🗣️' : '👂'}
                      </span>
                      <div className="detail-content">
                        <span className="detail-label">AI Status</span>
                        <span className="detail-value" style={{ color: isSpeaking ? "#10b981" : isAiTyping ? "#f59e0b" : "#3b82f6" }}>
                          {isAiTyping ? "Thinking" : isSpeaking ? "Speaking" : "Listening"}
                        </span>
                      </div>
                    </button>
                    
                    <button className="detail-button" type="button" aria-label="Posture monitor status">
                      <span className="detail-icon">📊</span>
                      <div className="detail-content">
                        <span className="detail-label">Posture</span>
                        <span className={`detail-value posture-monitor ${livePostureStatus.level}`}>
                          {livePostureScore === null ? "--" : `${livePostureScore}/100`}
                        </span>
                      </div>
                    </button>
                  </div>
                  )}
                </div>

                <div className="interview-tips">
                  <h3>Quick Tips</h3>
                  <ul>
                    <li>✓ Speak clearly and confidently</li>
                    <li>✓ Use the STAR method for answers</li>
                    <li>✓ Take your time before answering</li>
                    <li>✓ Maintain eye contact</li>
                  </ul>
                  {latestVerification && (
                    <p className="voice-input-hint" aria-live="polite">
                      Latest answer check: {latestVerification.correctnessLabel === "correct" ? "Correct" : latestVerification.correctnessLabel === "partially-correct" ? "Partially correct" : "Needs improvement"} ({latestVerification.overallScore}/100)
                    </p>
                  )}
                </div>

                <button className="end-interview-btn" onClick={endInterview} aria-label="End interview session">
                  End Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}