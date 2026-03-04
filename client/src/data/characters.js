// Two professional interviewers (kept clean and focused)
export const avatarCatalog = {
  default: [
    {
      id: 1,
      name: "Alex Chen",
      gender: "male",
      role: "Senior Technical Interviewer",
      avatar: "👨‍💼",
      color: "#60a5fa",
      bgColor: "linear-gradient(135deg, #1e3a8a, #0f172a)",
      hairStyle: "modern",
      hairColor: "dark",
      eyeColor: "blue",
      suiteShade: "#1e3a8a",
      description: "10+ years in software engineering. Specializes in system design, algorithms, and behavioral questions."
    },
    {
      id: 2,
      name: "Sarah Miller",
      gender: "female",
      role: "HR & Behavioral Specialist",
      avatar: "👩‍💼",
      color: "#a78bfa",
      bgColor: "linear-gradient(135deg, #6d28d9, #1e293b)",
      hairStyle: "classic",
      hairColor: "blonde",
      eyeColor: "green",
      suiteShade: "#6d28d9",
      description: "Expert in behavioral interviews, cultural fit, and leadership assessment across all industries."
    }
  ],
  software: [
    {
      id: 1,
      name: "Alex Chen",
      gender: "male",
      role: "Senior Technical Interviewer",
      avatar: "👨‍💼",
      color: "#60a5fa",
      bgColor: "linear-gradient(135deg, #1e3a8a, #0f172a)",
      hairStyle: "modern",
      hairColor: "dark",
      eyeColor: "blue",
      suiteShade: "#1e3a8a",
      description: "10+ years in software engineering. Specializes in system design, algorithms, and behavioral questions."
    },
    {
      id: 2,
      name: "Sarah Miller",
      gender: "female",
      role: "HR & Behavioral Specialist",
      avatar: "👩‍💼",
      color: "#a78bfa",
      bgColor: "linear-gradient(135deg, #6d28d9, #1e293b)",
      hairStyle: "classic",
      hairColor: "blonde",
      eyeColor: "green",
      suiteShade: "#6d28d9",
      description: "Expert in behavioral interviews, cultural fit, and leadership assessment across all industries."
    }
  ],
  data: [
    {
      id: 1,
      name: "Alex Chen",
      gender: "male",
      role: "Senior Technical Interviewer",
      avatar: "👨‍💼",
      color: "#60a5fa",
      bgColor: "linear-gradient(135deg, #1e3a8a, #0f172a)",
      hairStyle: "modern",
      hairColor: "dark",
      eyeColor: "blue",
      suiteShade: "#1e3a8a",
      description: "10+ years in software engineering. Specializes in system design, algorithms, and behavioral questions."
    },
    {
      id: 2,
      name: "Sarah Miller",
      gender: "female",
      role: "HR & Behavioral Specialist",
      avatar: "👩‍💼",
      color: "#a78bfa",
      bgColor: "linear-gradient(135deg, #6d28d9, #1e293b)",
      hairStyle: "classic",
      hairColor: "blonde",
      eyeColor: "green",
      suiteShade: "#6d28d9",
      description: "Expert in behavioral interviews, cultural fit, and leadership assessment across all industries."
    }
  ]
};

export const getFilteredAvatars = (catalog, _industry) => catalog.default;

// Backward compatibility
export const characterCatalog = avatarCatalog;
export const getFilteredCharacters = getFilteredAvatars;
