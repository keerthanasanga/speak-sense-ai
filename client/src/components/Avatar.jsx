import React, { useState, useEffect } from "react";
import "../pages/interview.css";

const Avatar = ({ avatar, question, isAsking, onReady, onQuestionAnswer }) => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [avatarImageUrl, setAvatarImageUrl] = useState("");

  // Get avatar image URL based on avatar name
  const getAvatarImageUrl = (avatarName) => {
    const avatarMap = {
      Alex: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f5",
      Sarah: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah&backgroundColor=fdbcb4",
      Michael: "https://api.dicebear.com/9.x/avataaars/svg?seed=Michael&backgroundColor=c7b9ff",
      Emma: "https://api.dicebear.com/9.x/avataaars/svg?seed=Emma&backgroundColor=b5ead7"
    };
    return avatarMap[avatarName] || avatarMap.Alex;
  };

  useEffect(() => {
    setAvatarImageUrl(getAvatarImageUrl(avatar?.name));
  }, [avatar]);

  // Text to Speech - Avatar speaks the question
  const speak = (text) => {
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.95;
    speech.pitch = avatar?.name === "Sarah" || avatar?.name === "Emma" ? 1.2 : 1;
    
    speech.onend = () => {
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(speech);
  };

  // Speak question when it changes
  useEffect(() => {
    if (question && isAsking) {
      setShowQuestion(true);
      speak(question);
    }
  }, [question, isAsking]);

  // Speech Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    let interimTranscript = "";
    setIsListening(true);
    setTranscript("");

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Notify parent that answer is complete and ready for next question
      if (transcript && onQuestionAnswer) {
        setTimeout(() => {
          onQuestionAnswer(transcript);
        }, 1000);
      }
    };

    recognition.start();
  };

  // Prepare avatar for interview
  useEffect(() => {
    if (onReady) {
      onReady();
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f6f8",
        minHeight: "100vh",
        padding: "30px",
        backgroundImage:
          "linear-gradient(135deg, rgba(79, 158, 255, 0.1), rgba(246, 135, 179, 0.1))",
      }}
    >
      {/* Avatar Image Display */}
      <div
        style={{
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          border: `5px solid ${avatar?.color || "#4f9eff"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isSpeaking || isAsking
            ? `0 0 40px ${avatar?.color || "#4f9eff"}, 0 20px 40px rgba(0, 0, 0, 0.2)`
            : "0 15px 35px rgba(0, 0, 0, 0.1)",
          marginBottom: "30px",
          transition: "all 0.3s ease",
          animation: isSpeaking ? "pulse-avatar 1.2s infinite" : "none",
          overflow: "hidden",
        }}
      >
        {avatarImageUrl && (
          <img
            src={avatarImageUrl}
            alt={avatar?.name}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        )}
      </div>

      {/* Avatar Name and Status */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", margin: "0 0 5px 0", color: "#213547" }}>
          {avatar?.name}
        </h1>
        <p style={{ fontSize: "16px", margin: "0", color: "#666" }}>
          {avatar?.role}
        </p>
        <div style={{ marginTop: "10px", fontSize: "14px", color: avatar?.color }}>
          {isSpeaking && "🎙️ Speaking..."}
          {isListening && "🎤 Listening..."}
          {!isSpeaking && !isListening && "Ready"}
        </div>
      </div>

      {/* Current Question Display */}
      {showQuestion && (
        <div
          style={{
            maxWidth: "700px",
            padding: "30px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            marginBottom: "30px",
            textAlign: "center",
            animation: "slideInUp 0.5s ease",
            border: `2px solid ${avatar?.color || "#4f9eff"}`,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              margin: "0 0 15px 0",
              color: "#4f9eff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Interview Question
          </h2>
          <p
            style={{
              fontSize: "20px",
              fontWeight: "500",
              margin: "0",
              color: "#213547",
              lineHeight: "1.8",
            }}
          >
            {question}
          </p>
        </div>
      )}

      {/* Microphone Indicator and Listening Animation */}
      {isListening && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "15px",
            marginBottom: "30px",
            padding: "20px 30px",
            backgroundColor: "rgba(79, 158, 255, 0.1)",
            borderRadius: "12px",
            border: "2px solid #4f9eff",
            minWidth: "300px",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              animation: "mic-pulse 1s infinite",
            }}
          >
            🎤
          </div>
          <div>
            <p style={{ margin: "0", fontSize: "16px", fontWeight: "600", color: "#4f9eff" }}>
              Listening...
            </p>
            <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
              Please speak your answer
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "4px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "4px",
                  height: "20px",
                  backgroundColor: "#4f9eff",
                  borderRadius: "2px",
                  animation: `sound-wave 0.6s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && !isListening && (
        <div
          style={{
            maxWidth: "600px",
            padding: "25px",
            backgroundColor: "#f0f8ff",
            borderRadius: "12px",
            marginBottom: "30px",
            textAlign: "center",
            borderLeft: `5px solid ${avatar?.color || "#4f9eff"}`,
            animation: "slideInUp 0.5s ease",
          }}
        >
          <p style={{ fontSize: "13px", margin: "0 0 10px 0", color: "#666", fontWeight: "600" }}>
            ✓ Your Response Recorded
          </p>
          <p
            style={{
              fontSize: "16px",
              margin: "0",
              color: "#213547",
              fontStyle: "italic",
              lineHeight: "1.6",
            }}
          >
            "{transcript}"
          </p>
        </div>
      )}

      {/* Start Answering Button */}
      <button
        onClick={startListening}
        disabled={isListening || isSpeaking}
        style={{
          padding: "15px 40px",
          fontSize: "16px",
          fontWeight: "600",
          border: "none",
          borderRadius: "10px",
          backgroundColor: isListening || isSpeaking ? "#ccc" : (avatar?.color || "#4f9eff"),
          color: "#ffffff",
          cursor: isListening || isSpeaking ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
          marginBottom: "20px",
        }}
        onMouseEnter={(e) => {
          if (!isListening && !isSpeaking) {
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 10px 28px rgba(0, 0, 0, 0.2)";
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
        }}
      >
        {isListening ? "🎤 Listening..." : isSpeaking ? "⏳ Waiting..." : "Start Answering"}
      </button>

      {/* Progress Indicator */}
      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#999" }}>
        Take your time to answer
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-avatar {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mic-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        @keyframes sound-wave {
          0%, 100% {
            height: 20px;
          }
          50% {
            height: 35px;
          }
        }
      `}</style>
    </div>
  );
};

export default Avatar;