import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType, useNavigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Planning from "./pages/Planning";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Practice from "./pages/Practice";
import Courses from "./pages/Courses";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import QuestionBank from "./pages/QuestionBank";
import AdvancedNavbar from "./components/AdvancedNavbar";
import { getAuthToken } from "./utils/authStorage";
import RouteErrorBoundary from "./RouteErrorBoundary";

const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/planning",
  "/interview",
  "/results",
  "/history",
  "/settings",
  "/practice",
  "/courses",
  "/resume-analyzer",
  "/question-bank",
];

const isPrivatePath = (pathname = "") => PRIVATE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

function PrivateRoute({ children }) {
  const token = getAuthToken();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicAuthRoute({ children }) {
  const token = getAuthToken();
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function RedirectTraceLogger() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const enabledRef = useRef(false);
  const previousPathRef = useRef("");
  const transitionTimestampsRef = useRef([]);
  const [traceLines, setTraceLines] = useState([]);

  const appendTrace = (line) => {
    console.info(line);
    setTraceLines((prev) => {
      const next = [...prev, line].slice(-10);
      try {
        sessionStorage.setItem("redirectTraceLines", JSON.stringify(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const shouldEnable = params.get("debugRedirects") === "1";
    if (!shouldEnable) return;

    enabledRef.current = true;
    params.delete("debugRedirects");
    const query = params.toString();
    const cleanedUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || ""}`;
    window.history.replaceState(window.history.state, "", cleanedUrl);
    try {
      const existing = JSON.parse(sessionStorage.getItem("redirectTraceLines") || "[]");
      if (Array.isArray(existing)) {
        setTraceLines(existing.slice(-10));
      }
    } catch {
      // ignore parse failures
    }

    appendTrace("[redirect-trace] enabled for this app session.");
  }, []);

  useEffect(() => {
    if (!enabledRef.current) return;

    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    const previousPath = previousPathRef.current || "(entry)";
    const now = Date.now();

    transitionTimestampsRef.current = [
      ...transitionTimestampsRef.current.filter((timestamp) => now - timestamp < 2500),
      now,
    ];

    appendTrace(`[redirect-trace] ${previousPath} -> ${nextPath} via ${navigationType}`);

    if (transitionTimestampsRef.current.length >= 6) {
      appendTrace("[redirect-trace] possible redirect loop detected: 6+ route transitions in 2.5s");
    }

    previousPathRef.current = nextPath;
  }, [location, navigationType]);

  if (!enabledRef.current) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        width: "min(92vw, 520px)",
        maxHeight: "45vh",
        overflowY: "auto",
        zIndex: 9999,
        borderRadius: 10,
        border: "1px solid rgba(56, 189, 248, 0.45)",
        background: "rgba(2, 6, 23, 0.92)",
        color: "#dbeafe",
        fontSize: 12,
        lineHeight: 1.45,
        padding: "10px 12px",
        boxShadow: "0 10px 28px rgba(2, 6, 23, 0.55)",
      }}
      aria-live="polite"
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Redirect Trace (debug)</div>
      {traceLines.length === 0 ? (
        <div>[redirect-trace] waiting for route changes…</div>
      ) : (
        traceLines.map((line, index) => (
          <div key={`${line}-${index}`}>{line}</div>
        ))
      )}
    </div>
  );
}

function AuthSessionBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingRef = useRef(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      const currentPath = location.pathname || "";
      if (/^\/(login|signup|register)$/.test(currentPath)) return;

      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      navigate("/login", {
        replace: true,
        state: { sessionExpired: true, from: currentPath },
      });

      window.setTimeout(() => {
        isHandlingRef.current = false;
      }, 600);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [location.pathname, navigate]);

  useEffect(() => {
    const token = getAuthToken();
    if (token) return;
    if (!isPrivatePath(location.pathname)) return;

    navigate("/login", {
      replace: true,
      state: { from: location.pathname },
    });
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthSessionBridge />
      <RedirectTraceLogger />
      <AdvancedNavbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
        <Route path="/signup" element={<PublicAuthRoute><Signup /></PublicAuthRoute>} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/planning" element={<PrivateRoute><Planning /></PrivateRoute>} />
        <Route
          path="/interview"
          element={(
            <PrivateRoute>
              <RouteErrorBoundary>
                <Interview />
              </RouteErrorBoundary>
            </PrivateRoute>
          )}
        />
        <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/practice" element={<PrivateRoute><Practice /></PrivateRoute>} />
        <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
        <Route path="/resume-analyzer" element={<PrivateRoute><ResumeAnalyzer /></PrivateRoute>} />
        <Route path="/question-bank" element={<PrivateRoute><QuestionBank /></PrivateRoute>} />

        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        <Route path="/profile" element={<Navigate to="/settings" replace />} />
        <Route path="/feedback" element={<Navigate to="/results" replace />} />
        <Route path="/my-learning" element={<Navigate to="/courses" replace />} />

        <Route path="/features" element={<Landing />} />
        <Route path="/pricing" element={<Landing />} />
        <Route path="/demo" element={<Navigate to="/signup" replace />} />
        <Route path="/reviews" element={<Landing />} />
        <Route path="/blog" element={<Landing />} />
        <Route path="/guides" element={<Landing />} />
        <Route path="/webinars" element={<Landing />} />
        <Route path="/faq" element={<Landing />} />
        <Route path="/about" element={<Landing />} />
        <Route path="/careers" element={<Landing />} />
        <Route path="/contact" element={<Landing />} />
        <Route path="/press" element={<Landing />} />
        <Route path="/privacy" element={<Landing />} />
        <Route path="/terms" element={<Landing />} />
        <Route path="/security" element={<Landing />} />
        <Route path="/cookies" element={<Landing />} />

        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;