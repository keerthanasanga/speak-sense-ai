import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { getFeatureFlags } from "../config/featureFlags";
import { formatTime, deriveSpeechTip } from "../utils/interviewUtils";
import { avatarCatalog, getFilteredAvatars } from "../data/avatars";
import AvatarFigure from "./AvatarFigure";
import FeedbackSidebar from "./FeedbackSidebar";
import PostureChecker from "./PostureChecker";
import "./interview.css";
import "./AvatarFigure.css";

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

export default function Interview() {
  const navigate = useNavigate();
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
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem("aiVoiceEnabled") !== "false";
    } catch {
      return true;
    }
  });
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [startError, setStartError] = useState("");
  const [chatError, setChatError] = useState("");
  const [isListeningUser, setIsListeningUser] = useState(false);
  const [speechMetrics, setSpeechMetrics] = useState(null);
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
  const [skipReason, setSkipReason] = useState("too hard");

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
    questionCount: 5,
    responseStyle: "coaching",
    targetRole: "Software Engineer",
    answerLength: "medium"
  });

  const videoRef = useRef(null);
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

  const totalQuestions = Math.min(Math.max(Number(interviewConfig.questionCount) || 5, 3), 10);

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

  const featureFlags = useMemo(() => getFeatureFlags(), []);

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
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
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

  const triggerNod = useCallback(() => {
    setAvatarPosture("nodding");
    setTimeout(() => setAvatarPosture("listening"), 2000);
  }, []);

  // Request camera/mic
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 }
        },
        audio: true
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setUseChat(false);
    } catch {
      setUseChat(true);
    }
  };

  // Start interview
  const startInterview = async (avatar) => {
    if (isStartingInterview) return;

    setStartError("");
    setChatError("");
    setIsStartingInterview(true);
    setSelectedAvatar(avatar);
    setShowAvatarSelect(false);
    await requestPermissions();
    setInterviewActive(true);
    triggerThinking();

    try {
      const response = await API.post("/interview/start", {
        avatar: { name: avatar.name },
        role: avatar.role,
        config: interviewConfig,
        industry: userProfile?.industry || "",
        promptMode: featureFlags.experimentalPrompts ? "experimental" : "standard"
      });
      const greeting = response.data.message || `Hello! I'm ${avatar.name}, your ${avatar.role}. Let's begin. Please introduce yourself.`;
      setMessages([createMessage("ai", greeting)]);
      speakAiMessage(greeting, avatar);
      triggerSpeak(greeting.length * 60);
    } catch {
      setStartError("Connected in fallback mode. Some AI features may be limited right now.");
      const greeting = `Hello! I'm ${avatar.name}, your ${avatar.role}. Let's begin. Please introduce yourself.`;
      setMessages([createMessage("ai", greeting)]);
      speakAiMessage(greeting, avatar);
      triggerSpeak(greeting.length * 60);
    } finally {
      setIsStartingInterview(false);
    }
  };

  const submitMessage = async (messageText) => {
    const trimmedMessage = (messageText || "").trim();
    if (!trimmedMessage || !selectedAvatar) return;

    setChatError("");

    const userMsg = createMessage("user", trimmedMessage);
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLastUserMessage(trimmedMessage); // feed to feedback sidebar
    setAnalysisTrigger((prev) => prev + 1);

    // Avatar starts thinking while waiting
    triggerThinking();
    setIsAiTyping(true);

    try {
      const response = await API.post("/interview/chat", {
        message: trimmedMessage,
        avatar: { name: selectedAvatar.name },
        role: selectedAvatar.role,
        questionCount: currentQuestion + 1,
        config: interviewConfig,
        industry: userProfile?.industry || "",
        promptMode: featureFlags.experimentalPrompts ? "experimental" : "standard"
      });

      const aiMsg = createMessage("ai", response.data.response, 1);
      setMessages(prev => [...prev, aiMsg]);
      setCurrentQuestion(prev => prev + 1);
      speakAiMessage(response.data.response, selectedAvatar);

      // Nod briefly, then speak for the estimated time
      triggerNod();
      setTimeout(() => triggerSpeak(response.data.response.length * 65), 800);

      if (response.data.isComplete) {
        setTimeout(() => endInterview(), 3500);
      }
    } catch {
      setChatError("Network issue detected. Responses may be delayed.");
      const fallback = createMessage("ai", "I'm having a little trouble. Please continue.", 1);
      setMessages(prev => [...prev, fallback]);
      speakAiMessage(fallback.message, selectedAvatar);
      triggerSpeak(2000);
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
        questionCount: currentQuestion + 1,
        config: interviewConfig,
        industry: userProfile?.industry || "",
        promptMode: featureFlags.experimentalPrompts ? "experimental" : "standard"
      });

      const aiMsg = createMessage("ai", response.data.response, 1);
      setMessages((prev) => [...prev, aiMsg]);
      setCurrentQuestion((prev) => prev + 1);
      speakAiMessage(response.data.response, selectedAvatar);
      triggerNod();
      setTimeout(() => triggerSpeak(response.data.response.length * 65), 700);

      if (response.data.isComplete) {
        setTimeout(() => endInterview(), 3200);
      }
    } catch {
      setChatError("Could not fetch the next question. Please try again.");
    } finally {
      setIsAiTyping(false);
      setIsFetchingNextQuestion(false);
    }
  };

  const endInterview = () => {
    setInterviewActive(false);
    clearInterval(timerRef.current);
    clearTimeout(speakTimerRef.current);
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

    try {
      localStorage.setItem(
        "latestInterviewSummary",
        JSON.stringify({
          completedAt: new Date().toISOString(),
          interviewer: selectedAvatar?.name,
          role: selectedAvatar?.role,
          mode: useChat ? "Chat" : "Video",
          durationSeconds: timeElapsed,
          questionsAnswered: currentQuestion,
          config: interviewConfig,
          industry: userProfile?.industry || ""
        })
      );
    } catch {
      // ignore localStorage failures
    }

    setShowResults(true);
  };

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

  const analyzeSpeechDelivery = useCallback((text, elapsedSeconds) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.max(elapsedSeconds / 60, 0.15);
    const wordsPerMinute = Math.round(wordCount / minutes);
    const fillerMatches = text.match(/\b(um|uh|like|you know|actually|basically)\b/gi) || [];
    const pauseCount = (text.match(/[,;:]/g) || []).length;

    setSpeechMetrics({
      wordsPerMinute,
      fillerCount: fillerMatches.length,
      pauseCount,
      tip: deriveSpeechTip(wordsPerMinute, fillerMatches.length, pauseCount)
    });
  }, []);

  const toggleVoiceInput = () => {
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
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    speechStartTimeRef.current = Date.now();
    recognitionFinalTranscriptRef.current = "";
    recognitionLatestTranscriptRef.current = "";
    setChatError("");

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    recognition.onstart = () => {
      setIsListeningUser(true);
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
      setInputMessage(mergedTranscript);
    };

    recognition.onerror = () => {
      setIsListeningUser(false);
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

      if (!finalTranscript) return;

      setInputMessage(finalTranscript);
      analyzeSpeechDelivery(finalTranscript, elapsedSeconds);

      if (interviewActive && !isAiTyping && !isVoiceSubmittingRef.current) {
        isVoiceSubmittingRef.current = true;
        submitMessage(finalTranscript).finally(() => {
          isVoiceSubmittingRef.current = false;
        });
      }
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

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

      const personLikely =
        confidenceScore >= postureTuning.confidenceMin
        && metrics.hasDetail
        && metrics.avgBrightness > postureTuning.brightnessMin
        && metrics.avgBrightness < postureTuning.brightnessMax
        && metrics.centerEdgeRatio >= postureTuning.centerMin
        && metrics.horizontalBalance <= postureTuning.balanceMax;

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
        await postureVideoRef.current.play();
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
                  <button className="select-avatar-btn" type="button" onClick={() => startInterview(avatar)} disabled={isStartingInterview}>
                    {isStartingInterview ? "Starting…" : "Start Interview →"}
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
            {isStartingInterview && (
              <p className="state-banner" role="status" aria-live="polite">
                Starting your session…
              </p>
            )}
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
                      <button className="control-btn settings" onClick={() => setUseChat(true)} aria-label="Switch to chat mode">
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
                  </div>
                )}
              </div>

              {/* Feedback Sidebar (grammar, improvements, topics) */}
              <FeedbackSidebar
                lastUserMessage={lastUserMessage}
                isOpen={feedbackOpen}
                onToggle={() => setFeedbackOpen(o => !o)}
                speechMetrics={speechMetrics}
                analysisTrigger={analysisTrigger}
              />

              {/* Right Interview Detail Sidebar */}
              <div className="interview-sidebar">
                <div className="current-question">
                  <h3>Interview Progress</h3>
                  <div className="question-box">
                    <p>{messages.filter(m => m.sender === "ai").slice(-1)[0]?.message || "Waiting for interview to start…"}</p>
                  </div>
                  <div className="question-progress">
                    <span>Question {currentQuestion} / {totalQuestions}</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min((currentQuestion / totalQuestions) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="next-question-btn"
                    onClick={requestNextQuestion}
                    disabled={isAiTyping || isFetchingNextQuestion}
                  >
                    {isFetchingNextQuestion ? "Loading…" : "Next Question →"}
                  </button>
                  <div className="skip-reason-wrap">
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