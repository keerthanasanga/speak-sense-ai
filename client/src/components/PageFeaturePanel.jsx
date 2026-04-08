import "./PageFeaturePanel.css";

const PAGE_FEATURE_SETS = {
  dashboard: {
    title: "Dashboard Experience Stack",
    subtitle: "Ten focused upgrades that drive daily interview momentum.",
    accent: "#4f9eff",
    items: [
      "Daily AI interview brief",
      "Progress velocity tracker",
      "Smart streak protector",
      "Role-readiness heat score",
      "Mentor nudges by weakness",
      "Target-company prep queue",
      "Weekly challenge generator",
      "Micro-goal checklist",
      "Confidence trend pulse",
      "Next-best-action planner",
    ],
  },
  planning: {
    title: "Planning Command Center",
    subtitle: "Configuration features designed to simulate real hiring loops.",
    accent: "#34d399",
    items: [
      "Domain-to-role fit advisor",
      "Difficulty auto-calibration",
      "Interview mix optimizer",
      "Skill-gap simulation mode",
      "Panel interview presets",
      "Time-pressure scenario toggle",
      "Market trend role alerts",
      "Competency coverage meter",
      "Question depth estimator",
      "Outcome probability forecast",
    ],
  },
  practice: {
    title: "Practice Lab Enhancements",
    subtitle: "Hands-on coding and communication boosters for job prep.",
    accent: "#60a5fa",
    items: [
      "Adaptive coding challenge difficulty",
      "Live reasoning quality hints",
      "Solution structure scoring",
      "Code clarity advisor",
      "Performance optimization prompts",
      "Edge-case discovery assistant",
      "Mock interviewer interruptions",
      "Timed delivery coaching",
      "Retry strategy trainer",
      "Interview-ready scorecard",
    ],
  },
  results: {
    title: "Results Intelligence Layer",
    subtitle: "Actionable insights mapped to role and market demand.",
    accent: "#f59e0b",
    items: [
      "Answer quality decomposition",
      "Speech clarity diagnostics",
      "Filler-word impact audit",
      "Grammar risk heatmap",
      "Behavioral depth benchmark",
      "Technical rigor benchmark",
      "Compensation readiness index",
      "Hiring-likelihood projection",
      "Weakness-to-course matching",
      "30-day improvement roadmap",
    ],
  },
  history: {
    title: "History Analytics Toolkit",
    subtitle: "Long-term progression features across every interview session.",
    accent: "#a78bfa",
    items: [
      "Session-to-session delta analysis",
      "Trend break anomaly detector",
      "Role-switch impact insights",
      "Company pattern recognition",
      "Difficulty tolerance curve",
      "Recovery speed tracking",
      "Consistency confidence score",
      "Monthly growth snapshots",
      "Regression early-warning alerts",
      "Experience compounding index",
    ],
  },
  settings: {
    title: "Settings Personalization Suite",
    subtitle: "Control interview realism, coaching style, and AI behavior.",
    accent: "#22d3ee",
    items: [
      "Avatar pack personality tuning",
      "Voice response style controls",
      "Coaching strictness slider",
      "Auto-follow-up question depth",
      "Posture threshold customization",
      "Speech feedback sensitivity",
      "Privacy-safe session memory",
      "Notification intelligence rules",
      "Theme and motion governance",
      "Career-target personalization",
    ],
  },
  courses: {
    title: "Course Acceleration Features",
    subtitle: "Learning pathways synchronized with upcoming job demand.",
    accent: "#fb7185",
    items: [
      "Skill-gap to course mapper",
      "Market-priority learning order",
      "Interview outcome-linked tracks",
      "Role transition learning paths",
      "Project-first curriculum nudges",
      "Concept mastery checkpoints",
      "Speedrun revision playlists",
      "Peer benchmark comparison",
      "Retention risk alerts",
      "Certification impact score",
    ],
  },
  resume: {
    title: "Resume Optimization Engine",
    subtitle: "Feature set for ATS strength and recruiter clarity.",
    accent: "#10b981",
    items: [
      "ATS keyword density checker",
      "Impact verb enrichment",
      "Bullet score normalization",
      "Skill-market relevance ranking",
      "Project credibility evaluator",
      "Achievement quantification hints",
      "Role-specific rewrite suggestions",
      "Resume-to-interview alignment",
      "Gap explanation strategy",
      "Offer-readiness resume score",
    ],
  },
  questionbank: {
    title: "Question Bank Pro Features",
    subtitle: "Curated prompts aligned to real interview patterns.",
    accent: "#38bdf8",
    items: [
      "Question intent classifier",
      "Tag-based difficulty modeling",
      "Follow-up prompt generator",
      "STAR framing templates",
      "System design layering hints",
      "Common trap-answer warnings",
      "Question frequency by role",
      "Scenario expansion packs",
      "Custom practice playlists",
      "Mastery coverage tracker",
    ],
  },
  landing: {
    title: "Platform Feature Highlights",
    subtitle: "The complete AI interview and job-prep capability stack.",
    accent: "#7dd3fc",
    items: [
      "3D motion AI interviewer",
      "Real-time voice simulation",
      "Posture and eye-contact coaching",
      "Role-specific mock interviews",
      "Future market trend guidance",
      "Past-skill based personalization",
      "Adaptive question progression",
      "Comprehensive result analytics",
      "Resume and question intelligence",
      "End-to-end job readiness prep",
    ],
  },
};

export default function PageFeaturePanel({ pageKey }) {
  const config = PAGE_FEATURE_SETS[pageKey] || PAGE_FEATURE_SETS.landing;

  return (
    <section className="page-feature-panel page-enter-scale" aria-label={`${config.title} features`}>
      <div className="page-feature-header" style={{ borderColor: `${config.accent}66` }}>
        <h2>{config.title}</h2>
        <p>{config.subtitle}</p>
      </div>

      <div className="page-feature-grid">
        {config.items.map((item, index) => (
          <article key={item} className="page-feature-card card-lift" style={{ animationDelay: `${index * 0.03}s` }}>
            <span className="page-feature-index" style={{ color: config.accent }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
