import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ROLE_TO_MODEL, ROLE_FRAMING, SCENE_CONFIG } from "./avatarConfig";

export class AvatarLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.currentRoot = null;
    this.currentGltf = null;
    this.fadeTracks = [];
  }

  async loadAvatar(role, character = null) {
    const modelPath = ROLE_TO_MODEL[role] || ROLE_TO_MODEL.hr;
    const previous = this.currentRoot;

    let nextRoot = null;
    let nextGltf = null;

    try {
      const gltf = await this.loader.loadAsync(modelPath);
      nextRoot = gltf.scene;
      nextGltf = gltf;
      this.#normalizeModel(nextRoot, role);
    } catch {
      nextRoot = this.#buildFallbackAvatar(role, character);
      nextGltf = null;
    }

    this.scene.add(nextRoot);
    this.#setOpacity(nextRoot, 0);
    this.#queueFade(nextRoot, 0, 1, SCENE_CONFIG.switchFadeDurationMs);

    if (previous) {
      this.#queueFade(previous, 1, 0, SCENE_CONFIG.switchFadeDurationMs, () => {
        this.scene.remove(previous);
        this.#disposeModel(previous);
      });
    }

    this.currentRoot = nextRoot;
    this.currentGltf = nextGltf;

    return {
      root: nextRoot,
      gltf: nextGltf,
      animations: nextGltf?.animations || []
    };
  }

  update(deltaSec) {
    this.fadeTracks = this.fadeTracks.filter((track) => {
      track.elapsed += deltaSec * 1000;
      const t = Math.min(track.elapsed / track.durationMs, 1);
      const eased = t * t * (3 - 2 * t);
      const value = track.from + (track.to - track.from) * eased;
      this.#setOpacity(track.root, value);

      if (t >= 1) {
        track.onComplete?.();
        return false;
      }

      return true;
    });
  }

  #queueFade(root, from, to, durationMs, onComplete) {
    this.fadeTracks.push({ root, from, to, durationMs, elapsed: 0, onComplete });
  }

  #normalizeModel(root, role) {
    const framing = ROLE_FRAMING[role] || ROLE_FRAMING.hr;
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const targetHeight = Number(framing?.targetHeight || 1.8);
    const rawScale = size.y > 0 ? targetHeight / size.y : 1;
    const scale = rawScale * Number(framing?.modelScaleMultiplier || 1);

    root.scale.setScalar(scale);
    root.position.x = (-center.x * scale) + Number(framing?.offset?.x || 0);
    root.position.y = (-box.min.y * scale) + Number(framing?.offset?.y || 0);
    root.position.z = (-center.z * scale) + Number(framing?.offset?.z || 0);
  }

  #setOpacity(root, alpha) {
    root.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = alpha;
        mat.depthWrite = alpha > 0.95;
      });
    });
  }

  #disposeModel(root) {
    root.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((mat) => {
          Object.values(mat).forEach((value) => {
            if (value && value.isTexture) value.dispose();
          });
          mat.dispose();
        });
      }
    });
  }

  #buildFallbackAvatar(role, character) {
    const group = new THREE.Group();

    // Determine tint from character or role:
    let hexString = character?.outfitColor || character?.suiteShade || character?.color || null;
    let tint = 0x60a5fa; // default blue

    if (hexString && typeof hexString === "string" && hexString.startsWith("#")) {
      const parsed = parseInt(hexString.replace("#", ""), 16);
      if (!isNaN(parsed)) tint = parsed;
    } else {
      tint = role === "technical" ? 0x38bdf8 : role === "system-design" ? 0xa78bfa : role === "behavioral" ? 0x34d399 : 0x60a5fa;
    }

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.26, 0.9, 6, 14),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.42, metalness: 0.08 })
    );
    body.position.y = 0.85;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 28, 22),
      new THREE.MeshStandardMaterial({ color: 0xf2d3b3, roughness: 0.55, metalness: 0.04 })
    );
    head.name = "Head";
    head.position.y = 1.62;
    group.add(head);

    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.02, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d })
    );
    mouth.name = "__fallbackMouth";
    mouth.position.set(0, 1.55, 0.2);
    group.add(mouth);

    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.24, 0.02),
      new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 0.08 })
    );
    tie.position.set(0, 1.06, 0.27);
    group.add(tie);

    const leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.35, 0.12),
      new THREE.MeshStandardMaterial({ color: tint })
    );
    leftArm.position.set(-0.35, 1.1, 0);
    leftArm.name = "leftArm";
    group.add(leftArm);

    const rightArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.35, 0.12),
      new THREE.MeshStandardMaterial({ color: tint })
    );
    rightArm.position.set(0.35, 1.1, 0);
    rightArm.name = "rightArm";
    group.add(rightArm);

    // Left eye
    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    leftEye.position.set(-0.08, 1.65, 0.18);
    leftEye.name = "leftEye";
    group.add(leftEye);

    // Right eye
    const rightEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    rightEye.position.set(0.08, 1.65, 0.18);
    rightEye.name = "rightEye";
    group.add(rightEye);

    // Provide the necessary structure to `AnimationController` and the interview scene loop
    group.userData = {
      name: character?.name || role,
      role: role,
      animations: {
        idleTime: 0,
        blinkTimer: 0,
        emotions: { confidence: 0.5, engagement: 0.5, analysis: 0.3 }
      },
      meshes: {
        head: head,
        torso: body,
        leftArm: leftArm,
        rightArm: rightArm,
        leftEye: leftEye,
        rightEye: rightEye
      }
    };

    return group;
  }
}
