// Minimal subset of the configuration used by the standalone avatar-system
// so that the React component can load the same characters when necessary.

export const ROLE_TO_MODEL = {
  hr: "/avatar-system/models/hr.glb",
  technical: "/avatar-system/models/tech.glb",
  "system-design": "/avatar-system/models/architect.glb",
  behavioral: "/avatar-system/models/behavioral.glb",
};

// framing information is not currently used in the React scene but the loader
// class expects it so we export a barebones object.  Only height/scale/offset
// values are included to keep the code simple.
export const ROLE_FRAMING = {
  hr: { targetHeight: 1.8, modelScaleMultiplier: 1, offset: { x: 0, y: 0, z: 0 } },
  technical: { targetHeight: 1.82, modelScaleMultiplier: 1, offset: { x: 0, y: 0, z: -0.02 } },
  "system-design": { targetHeight: 1.86, modelScaleMultiplier: 0.98, offset: { x: 0, y: 0, z: 0.03 } },
  behavioral: { targetHeight: 1.78, modelScaleMultiplier: 1.03, offset: { x: 0, y: 0, z: -0.01 } }
};

export const SCENE_CONFIG = {
  switchFadeDurationMs: 360
};
