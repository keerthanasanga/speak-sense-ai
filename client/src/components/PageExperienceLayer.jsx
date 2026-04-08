import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getStoredUser } from "../utils/authStorage";
import { buildMarketPrepBrief, PLATFORM_FEATURES } from "../utils/marketIntelligence";
import "./PageExperienceLayer.css";

const getSurfaceClass = (pathname) => {
  if (pathname === "/") return "public";
  if (/^\/(login|signup|register)/.test(pathname)) return "auth";
  return "app";
};

export default function PageExperienceLayer() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return getStoredUser();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const currentSurface = getSurfaceClass(location.pathname || "");
    document.body.dataset.pageSurface = currentSurface;

    const candidates = document.querySelectorAll(
      ".dashboard-main, .planning-container, .practice-container, .results-container, .history-container, .settings-container, .courses-container, .interview-container, .landing-container, .auth-wrapper"
    );

    candidates.forEach((node, index) => {
      node.classList.remove("route-reveal");
      window.setTimeout(() => node.classList.add("route-reveal"), 20 + (index * 40));
    });
  }, [location.pathname]);

  useEffect(() => {
    try {
      setUser(getStoredUser());
    } catch {
      setUser(null);
    }
  }, [location.pathname]);

  const brief = useMemo(() => {
    return buildMarketPrepBrief({
      user,
      targetRole: user?.targetRole || user?.role || "Software Engineer",
      domain: user?.industry || "Technology",
      difficulty: user?.experience || "Intermediate",
    });
  }, [user]);

  return (
    <>
      <button
        type="button"
        className={`ai-dock-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close AI copilot" : "Open AI copilot"}
      >
        <span className="dock-icon">AI</span>
        <span className="dock-text">Interview Copilot</span>
      </button>

      <aside className={`ai-experience-dock ${isOpen ? "visible" : ""}`} aria-live="polite">
        <div className="dock-header">
          <h3>Real-world AI Interview Prep</h3>
          <p>Built from your past skills and future market demand.</p>
        </div>

        <div className="dock-market-pill">
          <span>Demand: {brief.demandLevel}</span>
          <span>Velocity: {brief.marketVelocity}%</span>
          <span>{brief.salaryBand}</span>
        </div>

        <div className="dock-content-grid">
          <section className="dock-card">
            <h4>Skill Match</h4>
            <p className="dock-score">Readiness {brief.readinessScore}%</p>
            <p>{brief.matchedSkills.length > 0 ? `Strong overlap in ${brief.matchedSkills.slice(0, 2).join(", ")}` : "No overlap yet. Start with top market skills."}</p>
          </section>

          <section className="dock-card">
            <h4>Next Actions</h4>
            <ul>
              {brief.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="dock-features">
          <h4>10 New Platform Features</h4>
          <ul>
            {PLATFORM_FEATURES.map((feature, index) => (
              <li key={feature}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{feature}</strong>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  );
}
