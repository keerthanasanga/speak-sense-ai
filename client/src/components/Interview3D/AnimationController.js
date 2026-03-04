import * as THREE from 'three';
/**
 * AnimationController.js
 * Manages all character animations including blendshapes, body movements, and transitions
 */

export class AnimationController {
  constructor(characters) {
    this.characters = characters;
    this.blendshapes = {};
    this.animations = {};
    this.transitionDuration = 0.3;
    // Track active gesture RAF ids so we can cancel them on dispose
    this._activeGestureFrames = new Set();

    this.initializeBlendshapes();
    this.initializeAnimations();
  }

  initializeBlendshapes() {
    this.blendshapes = {
      // Mouth animations
      mouthSmile: 0,
      mouthFrown: 0,
      mouthOpen: 0,
      mouthPucker: 0,
      mouthPressed: 0,

      // Eye animations
      eyeWide: 0,
      eyeSquint: 0,
      eyeRelax: 0,

      // Eyebrow animations
      browRaise: 0,
      browLower: 0,
      browInnerRaise: 0,
      browOuterRaise: 0,

      // Head movements
      headNod: 0,
      headShake: 0,
      headTilt: 0,

      // Jaw animations
      jawOpen: 0,
      jawForward: 0,
      jawLeft: 0,
      jawRight: 0,

      // Nose animations
      noseSneer: 0,
      noseWrinkle: 0,

      // Cheek animations
      cheekPuff: 0,
      cheekSuck: 0,

      // Tongue animations
      tongueOut: 0,
      tongueUp: 0,
      tongueDown: 0,
      tongueLeft: 0,
      tongueRight: 0,

      // Lip animations
      lipPucker: 0,
      lipPress: 0,
      lipClosed: 0,
      lipUpperClose: 0,
      lipLowerClose: 0,

      // Emotion blends
      surprising: 0,
      worried: 0,
      angry: 0,
      disgusted: 0,
      fearful: 0,
      analytical: 0,
      engaged: 0,
      confused: 0
    };
  }

  initializeAnimations() {
    this.animations = {
      speaking: this.createSpeakingAnimation(),
      thinking: this.createThinkingAnimation(),
      nodding: this.createNoddingAnimation(),
      listening: this.createListeningAnimation(),
      analyzing: this.createAnalyzingAnimation(),
      impressed: this.createImpressedAnimation(),
      confused: this.createConfusedAnimation()
    };
  }

  // ==================== SPEECH-DRIVEN ANIMATIONS ====================

  applyLipSync(character, phoneme, intensity = 1) {
    const phonemeMap = {
      'a': { mouthOpen: 0.7 * intensity, jawOpen: 0.8 * intensity },
      'e': { mouthOpen: 0.4 * intensity, jawOpen: 0.3 * intensity },
      'i': { mouthOpen: 0.3 * intensity, jawOpen: 0.2 * intensity, lipPress: 0.5 * intensity },
      'o': { mouthOpen: 0.6 * intensity, jawOpen: 0.7 * intensity, mouthPucker: 0.4 * intensity },
      'u': { mouthOpen: 0.5 * intensity, jawOpen: 0.5 * intensity, mouthPucker: 0.8 * intensity },
      'm': { mouthPressed: 0.9 * intensity },
      'b': { mouthOpen: 0.2 * intensity, mouthPressed: 0.8 * intensity },
      'p': { mouthOpen: 0.2 * intensity, mouthPressed: 0.8 * intensity },
      'f': { jawOpen: 0.3 * intensity, lipPress: 0.6 * intensity },
      'v': { jawOpen: 0.3 * intensity, lipPress: 0.6 * intensity },
      't': { jawOpen: 0.4 * intensity, tongueUp: 0.7 * intensity },
      'd': { jawOpen: 0.4 * intensity, tongueUp: 0.7 * intensity },
      's': { jawOpen: 0.3 * intensity, lipPress: 0.4 * intensity, tongueUp: 0.5 * intensity },
      'z': { jawOpen: 0.3 * intensity, lipPress: 0.4 * intensity, tongueUp: 0.5 * intensity },
      'sh': { jawOpen: 0.4 * intensity, mouthPucker: 0.5 * intensity },
      'ch': { jawOpen: 0.4 * intensity, mouthPucker: 0.4 * intensity },
      'ng': { jawOpen: 0.2 * intensity, mouthOpen: 0.3 * intensity },
      'l': { jawOpen: 0.5 * intensity, tongueUp: 0.8 * intensity },
      'r': { jawOpen: 0.4 * intensity, mouthPucker: 0.6 * intensity, tongueUp: 0.5 * intensity }
    };

    const shapes = phonemeMap[phoneme] || {};
    Object.entries(shapes).forEach(([blendshape, value]) => {
      this.blendshapes[blendshape] = value;
    });

    this.applyBlendshapesToCharacter(character);
  }

  applyBlendshapesToCharacter(character) {
    if (!character.userData.meshes) return;

    const { head, leftEye, rightEye } = character.userData.meshes;

    // Eye squinting – applied directly (not accumulated)
    const eyeSquint = this.blendshapes.eyeSquint * 0.3;
    if (leftEye)  leftEye.scale.y  = Math.max(0.2, 1 - eyeSquint);
    if (rightEye) rightEye.scale.y = Math.max(0.2, 1 - eyeSquint);

    if (head) {
      // Use absolute target rotation values instead of accumulating with +=
      const browTilt  = (this.blendshapes.browRaise - this.blendshapes.browLower) * 0.05;
      const headTilt  = (this.blendshapes.headTilt ?? 0) * 0.2;

      // Clamp to prevent extreme values
      head.rotation.x = THREE.MathUtils.clamp(browTilt, -0.3, 0.3);
      head.rotation.z = THREE.MathUtils.clamp(headTilt, -0.4, 0.4);
    }
  }

  // ==================== EXPRESSION ANIMATIONS ====================

  createImpressedAnimation() {
    return {
      duration: 1.2,
      keyframes: [
        { time: 0,   shapes: { eyeWide: 0, browRaise: 0 } },
        { time: 0.2, shapes: { eyeWide: 0.5, browRaise: 0.6, mouthSmile: 0.3 } },
        { time: 0.6, shapes: { eyeWide: 0.3, browRaise: 0.4, mouthSmile: 0.5 } },
        { time: 1.0, shapes: { eyeWide: 0.1, browRaise: 0.2, mouthSmile: 0.3 } },
        { time: 1.2, shapes: { eyeWide: 0, browRaise: 0, mouthSmile: 0.1 } }
      ]
    };
  }

  createAnalyzingAnimation() {
    return {
      duration: 1.8,
      keyframes: [
        { time: 0,   shapes: { browLower: 0, eyeSquint: 0, headTilt: 0 } },
        { time: 0.3, shapes: { browLower: 0.4, eyeSquint: 0.2, headTilt: -0.3 } },
        { time: 0.9, shapes: { browLower: 0.5, eyeSquint: 0.3, headTilt: -0.2 } },
        { time: 1.5, shapes: { browLower: 0.3, eyeSquint: 0.1, headTilt: -0.1 } },
        { time: 1.8, shapes: { browLower: 0, eyeSquint: 0, headTilt: 0 } }
      ]
    };
  }

  createConfusedAnimation() {
    return {
      duration: 1.5,
      keyframes: [
        { time: 0,   shapes: { browInnerRaise: 0, headTilt: 0, eyeWide: 0 } },
        { time: 0.5, shapes: { browInnerRaise: 0.6, headTilt: 0.4, eyeWide: 0.4 } },
        { time: 1.0, shapes: { browInnerRaise: 0.4, headTilt: 0.2, eyeWide: 0.2 } },
        { time: 1.5, shapes: { browInnerRaise: 0, headTilt: 0, eyeWide: 0 } }
      ]
    };
  }

  createNoddingAnimation() {
    return {
      duration: 0.8,
      keyframes: [
        { time: 0,   shapes: { headNod: 0 } },
        { time: 0.2, shapes: { headNod: 0.5 } },
        { time: 0.4, shapes: { headNod: 0 } },
        { time: 0.6, shapes: { headNod: 0.3 } },
        { time: 0.8, shapes: { headNod: 0 } }
      ]
    };
  }

  createSpeakingAnimation() {
    return {
      duration: 2.0,
      keyframes: [
        { time: 0,   shapes: { mouthOpen: 0 } },
        { time: 0.5, shapes: { mouthOpen: 0.6 } },
        { time: 1.0, shapes: { mouthOpen: 0.3 } },
        { time: 1.5, shapes: { mouthOpen: 0.5 } },
        { time: 2.0, shapes: { mouthOpen: 0 } }
      ]
    };
  }

  createThinkingAnimation() {
    return {
      duration: 2.5,
      keyframes: [
        { time: 0,   shapes: { browLower: 0, headTilt: 0, eyeRelax: 0 } },
        { time: 0.5, shapes: { browLower: 0.3, headTilt: 0.2 } },
        { time: 1.2, shapes: { browLower: 0.4, headTilt: 0.3, eyeRelax: 0 } },
        { time: 2.0, shapes: { browLower: 0.2, headTilt: 0.1 } },
        { time: 2.5, shapes: { browLower: 0, headTilt: 0 } }
      ]
    };
  }

  createListeningAnimation() {
    return {
      duration: 2.0,
      keyframes: [
        { time: 0,   shapes: { eyeWide: 0, engaged: 0 } },
        { time: 0.5, shapes: { eyeWide: 0.2, engaged: 0.3 } },
        { time: 1.0, shapes: { eyeWide: 0.3, engaged: 0.5 } },
        { time: 1.5, shapes: { eyeWide: 0.2, engaged: 0.3 } },
        { time: 2.0, shapes: { eyeWide: 0, engaged: 0 } }
      ]
    };
  }

  // ==================== GESTURE ANIMATIONS ====================

  performGesture(character, gestureType) {
    const gestures = {
      noteWriting: this.createNoteWritingGesture(),
      handGesture:  this.createHandGesture(),
      nod:          this.createNodGesture(),
      headTilt:     this.createHeadTiltGesture(),
      eyeContact:   this.createEyeContactGesture()
    };

    const gesture = gestures[gestureType];
    if (gesture && character.userData.meshes) {
      this.applyGestureToCharacter(character, gesture);
    }
  }

  createNoteWritingGesture() {
    return {
      rightArm: { rotation: { x: 0.5, y: 0.3, z: 0 }, position: { x: 0.1, y: -0.3, z: 0.2 } },
      leftArm:  { position: { x: -0.15, y: -0.2, z: 0 } },
      duration: 1.5
    };
  }

  createHandGesture() {
    return {
      rightArm: { rotation: { x: -0.2, y: 0, z: 0.3 }, position: { x: 0.3, y: 0, z: 0 } },
      leftArm:  { rotation: { x: -0.1, y: 0, z: -0.2 }, position: { x: -0.2, y: 0, z: 0 } },
      duration: 0.8
    };
  }

  createNodGesture() {
    return {
      head:     { rotation: { x: 0.2, y: 0, z: 0 } },
      duration: 0.6
    };
  }

  createHeadTiltGesture() {
    return {
      head:     { rotation: { x: 0, y: 0, z: 0.25 } },
      duration: 0.8
    };
  }

  createEyeContactGesture() {
    return {
      eyes:     { lookDirection: 'forward' },
      duration: 2.0
    };
  }

  applyGestureToCharacter(character, gesture) {
    if (this._disposed) return;
    const meshes = character.userData.meshes;

    Object.entries(gesture).forEach(([limb, properties]) => {
      if (limb === 'duration') return;

      const mesh = meshes[limb];
      if (!mesh || !properties.rotation) return;

      const originalRotation = {
        x: mesh.rotation.x,
        y: mesh.rotation.y,
        z: mesh.rotation.z
      };
      const targetRotation = properties.rotation;
      const startTime = Date.now();
      const durationMs = (gesture.duration || 1) * 1000;

      const animateGesture = () => {
        if (this._disposed) return;

        const t = Math.min((Date.now() - startTime) / durationMs, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);

        mesh.rotation.x = originalRotation.x + (targetRotation.x - originalRotation.x) * eased;
        mesh.rotation.y = originalRotation.y + (targetRotation.y - originalRotation.y) * eased;
        mesh.rotation.z = originalRotation.z + (targetRotation.z - originalRotation.z) * eased;

        if (t < 1) {
          const id = requestAnimationFrame(animateGesture);
          this._activeGestureFrames.add(id);
        } else {
          // Return to original rotation
          const returnStart = Date.now();
          const returnDurationMs = durationMs * 0.5;

          const returnGesture = () => {
            if (this._disposed) return;

            const rt = Math.min((Date.now() - returnStart) / returnDurationMs, 1);
            const rEased = 1 - Math.pow(1 - rt, 3);

            mesh.rotation.x = targetRotation.x + (originalRotation.x - targetRotation.x) * rEased;
            mesh.rotation.y = targetRotation.y + (originalRotation.y - targetRotation.y) * rEased;
            mesh.rotation.z = targetRotation.z + (originalRotation.z - targetRotation.z) * rEased;

            if (rt < 1) {
              const rid = requestAnimationFrame(returnGesture);
              this._activeGestureFrames.add(rid);
            }
          };
          const rid = requestAnimationFrame(returnGesture);
          this._activeGestureFrames.add(rid);
        }
      };

      const id = requestAnimationFrame(animateGesture);
      this._activeGestureFrames.add(id);
    });
  }

  // ==================== EMOTION MAPPING ====================

  mapEmotionToExpression(character, emotion, intensity = 1) {
    const emotionMap = {
      confidence: { eyeWide: 0.3, browRaise: 0.4, mouthSmile: 0.5 },
      analytical:  { browLower: 0.5, eyeSquint: 0.2, headTilt: -0.2 },
      engaged:     { eyeWide: 0.4, browRaise: 0.3, engaged: 0.6 },
      impressed:   { eyeWide: 0.5, browRaise: 0.6, mouthSmile: 0.7 },
      concerned:   { browLower: 0.4, eyeSquint: 0.3, worried: 0.5 },
      confused:    { browInnerRaise: 0.6, headTilt: 0.3, confused: 0.7 }
    };

    const emotionShapes = emotionMap[emotion] || {};
    Object.entries(emotionShapes).forEach(([shape, value]) => {
      if (shape in this.blendshapes) {
        this.blendshapes[shape] = value * intensity;
      }
    });

    this.applyBlendshapesToCharacter(character);
  }

  // ==================== PROCEDURAL EYE CONTACT ====================

  updateEyeContact(character, targetPosition = { x: 0, y: 0, z: 0 }) {
    if (!character.userData.meshes?.head) return;

    const head = character.userData.meshes.head;
    const headPos = new THREE.Vector3();
    head.getWorldPosition(headPos);

    // Correctly subtract using THREE.Vector3 method
    const target = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    const direction = target.sub(headPos);
    const angle = Math.atan2(direction.x, direction.z);

    const clampedAngle = THREE.MathUtils.clamp(angle * 0.3, -0.5, 0.5);

    if (character.userData.meshes.leftEye) {
      character.userData.meshes.leftEye.rotation.y = clampedAngle;
    }
    if (character.userData.meshes.rightEye) {
      character.userData.meshes.rightEye.rotation.y = clampedAngle;
    }
  }

  // ==================== CLEANUP ====================

  dispose() {
    this._disposed = true;
    // Cancel all pending gesture animation frames
    this._activeGestureFrames.forEach(id => cancelAnimationFrame(id));
    this._activeGestureFrames.clear();
    this.characters = null;
    this.blendshapes = null;
    this.animations = null;
  }
}
