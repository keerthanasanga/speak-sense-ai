export const avatarCatalog = {
  default: [
    { id: 1, name: "Alex", gender: "male", role: "Technical Interviewer", avatar: "👨‍💼", color: "#4f9eff", bgColor: "linear-gradient(135deg, #0066cc, #004080)" },
    { id: 2, name: "Sarah", gender: "female", role: "HR Specialist", avatar: "👩‍💼", color: "#f687b3", bgColor: "linear-gradient(135deg, #d53f8c, #97266d)" },
    { id: 3, name: "Michael", gender: "male", role: "Senior Developer", avatar: "👨‍💻", color: "#48bb78", bgColor: "linear-gradient(135deg, #2f855a, #1e4b3c)" },
    { id: 4, name: "Luna", species: "animal", role: "Confidence Coach (Owl)", avatar: "🦉", color: "#9f7aea", bgColor: "linear-gradient(135deg, #5b21b6, #312e81)" },
    { id: 5, name: "Rex", species: "animal", role: "Behavior Mentor (Fox)", avatar: "🦊", color: "#ed8936", bgColor: "linear-gradient(135deg, #dd6b20, #9c4221)" },
    { id: 6, name: "Coco", species: "animal", role: "Communication Coach (Panda)", avatar: "🐼", color: "#38b2ac", bgColor: "linear-gradient(135deg, #0f766e, #234e52)" }
  ],
  software: [
    { id: 11, name: "Nova", gender: "female", role: "Frontend Architect", avatar: "👩‍💻", color: "#60a5fa", bgColor: "linear-gradient(135deg, #2563eb, #0f172a)" },
    { id: 12, name: "Kai", gender: "male", role: "System Design Lead", avatar: "👨‍💻", color: "#22d3ee", bgColor: "linear-gradient(135deg, #0e7490, #0f172a)" },
    { id: 13, name: "Byte", species: "animal", role: "Coding Pace Coach (Otter)", avatar: "🦦", color: "#34d399", bgColor: "linear-gradient(135deg, #047857, #052e16)" }
  ],
  data: [
    { id: 21, name: "Iris", gender: "female", role: "ML Interviewer", avatar: "👩‍🔬", color: "#818cf8", bgColor: "linear-gradient(135deg, #4338ca, #1f2937)" },
    { id: 22, name: "Atlas", gender: "male", role: "Analytics Lead", avatar: "👨‍🔬", color: "#2dd4bf", bgColor: "linear-gradient(135deg, #0f766e, #1f2937)" },
    { id: 23, name: "Pixel", species: "animal", role: "Insight Coach (Koala)", avatar: "🐨", color: "#f472b6", bgColor: "linear-gradient(135deg, #9d174d, #3f3f46)" }
  ]
};

export const getFilteredAvatars = (catalog, industry) => {
  const normalizedIndustry = (industry || "").toLowerCase();

  if (normalizedIndustry.includes("software") || normalizedIndustry.includes("technology") || normalizedIndustry.includes("it")) {
    return [...catalog.software, ...catalog.default.slice(3)];
  }
  if (normalizedIndustry.includes("data") || normalizedIndustry.includes("ml") || normalizedIndustry.includes("machine")) {
    return [...catalog.data, ...catalog.default.slice(0, 3)];
  }
  return catalog.default;
};
