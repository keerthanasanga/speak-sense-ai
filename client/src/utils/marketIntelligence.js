const MARKET_TRACKS = {
  engineering: {
    trendingSkills: ["AI-assisted coding", "Cloud cost optimization", "System design", "Observability", "TypeScript"],
    demandLevel: "Very High",
    marketVelocity: 92,
    salaryBand: "$110k - $220k",
    interviewThemes: ["Architecture tradeoffs", "Scaling under load", "Debugging in production"]
  },
  data: {
    trendingSkills: ["LLM evaluation", "Feature stores", "MLOps", "PySpark", "Experiment design"],
    demandLevel: "High",
    marketVelocity: 88,
    salaryBand: "105k - 210k",
    interviewThemes: ["Model validation", "Bias mitigation", "Business impact framing"]
  },
  product: {
    trendingSkills: ["AI product strategy", "North-star metrics", "Growth loops", "Roadmap prioritization", "Experimentation"],
    demandLevel: "High",
    marketVelocity: 84,
    salaryBand: "$100k - $205k",
    interviewThemes: ["Product sense", "Execution", "Stakeholder alignment"]
  },
  design: {
    trendingSkills: ["Design systems", "UX for AI", "Accessibility", "Journey mapping", "Prototyping"],
    demandLevel: "Rising",
    marketVelocity: 79,
    salaryBand: "$85k - $180k",
    interviewThemes: ["Case studies", "Research synthesis", "Design rationale"]
  },
  general: {
    trendingSkills: ["Communication", "Problem solving", "Adaptability", "Data literacy", "AI fluency"],
    demandLevel: "Stable",
    marketVelocity: 73,
    salaryBand: "$70k - $160k",
    interviewThemes: ["Behavioral depth", "Ownership", "Impact stories"]
  }
};

const dedupe = (items) => [...new Set(items.filter(Boolean).map((item) => String(item).trim()))];

export const extractUserSkills = (user = {}) => {
  const skillFields = [
    user.skills,
    user.techStack,
    user.strengths,
    user.primarySkills,
    user.topSkills,
  ];

  const flat = skillFields.flatMap((field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === "string") return field.split(/[,|/]/g);
    return [];
  });

  return dedupe(flat).slice(0, 10);
};

const detectTrack = (targetRole = "", domain = "", industry = "") => {
  const haystack = `${targetRole} ${domain} ${industry}`.toLowerCase();

  if (/(data|ml|ai|scientist|analytics|machine)/.test(haystack)) return "data";
  if (/(product|pm|manager|growth|strategy)/.test(haystack)) return "product";
  if (/(design|ux|ui|visual|research)/.test(haystack)) return "design";
  if (/(engineer|developer|frontend|backend|full stack|devops|cloud|security)/.test(haystack)) return "engineering";
  return "general";
};

const computeReadiness = (pastSkills, trendingSkills, difficulty = "Intermediate") => {
  const normalizedPast = pastSkills.map((skill) => skill.toLowerCase());
  const matches = trendingSkills.filter((skill) => normalizedPast.some((known) => known.includes(skill.toLowerCase()) || skill.toLowerCase().includes(known))).length;

  const difficultyPenalty = /advanced|expert/i.test(difficulty) ? 8 : /intermediate/i.test(difficulty) ? 4 : 0;
  const baseline = 58 + (matches * 8) + Math.min(pastSkills.length * 2, 12) - difficultyPenalty;

  return Math.max(35, Math.min(Math.round(baseline), 96));
};

export const buildMarketPrepBrief = ({ user, targetRole, domain, difficulty }) => {
  const safeUser = user || {};
  const trackKey = detectTrack(targetRole, domain, safeUser.industry || "");
  const track = MARKET_TRACKS[trackKey] || MARKET_TRACKS.general;
  const pastSkills = extractUserSkills(safeUser);

  const matchedSkills = track.trendingSkills.filter((skill) =>
    pastSkills.some((known) => skill.toLowerCase().includes(known.toLowerCase()) || known.toLowerCase().includes(skill.toLowerCase()))
  );

  const skillGaps = track.trendingSkills.filter((skill) => !matchedSkills.includes(skill));
  const readinessScore = computeReadiness(pastSkills, track.trendingSkills, difficulty);

  const nextActions = [
    `Practice one ${track.interviewThemes[0]} story with metrics`,
    `Add ${skillGaps[0] || "AI fluency"} evidence to resume bullets`,
    `Run a timed mock focused on ${track.interviewThemes[1]}`,
  ];

  return {
    track: trackKey,
    demandLevel: track.demandLevel,
    marketVelocity: track.marketVelocity,
    salaryBand: track.salaryBand,
    interviewThemes: track.interviewThemes,
    trendingSkills: track.trendingSkills,
    pastSkills,
    matchedSkills,
    skillGaps,
    readinessScore,
    nextActions,
  };
};

export const PLATFORM_FEATURES = [
  "3D motion interviewer avatars",
  "Skill-to-market gap analysis",
  "Adaptive question difficulty",
  "Live speech and filler-word coach",
  "Posture and eye-contact monitor",
  "Role-specific interview playbooks",
  "Future demand trend radar",
  "Compensation range intelligence",
  "Weekly preparation sprints",
  "Job readiness scoring dashboard",
];
