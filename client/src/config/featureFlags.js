const parseFlagValue = (value) => {
  if (typeof value !== "string") return false;

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const getLocalStorageFlag = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const getFeatureFlags = () => {
  const envExperimentalPrompts = parseFlagValue(process.env.REACT_APP_EXPERIMENTAL_PROMPTS || "");
  const localExperimentalPrompts = getLocalStorageFlag("ff.experimentalPrompts");

  const experimentalPrompts =
    localExperimentalPrompts === null
      ? envExperimentalPrompts
      : parseFlagValue(localExperimentalPrompts);

  return {
    experimentalPrompts
  };
};
