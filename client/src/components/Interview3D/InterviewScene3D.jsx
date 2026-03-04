import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimationController } from './AnimationController';
import { BehaviorIntelligence } from './BehaviorIntelligence';
import { AvatarLoader } from './AvatarLoader';
import './InterviewScene3D.css';

export default function InterviewScene3D({
  // the character object from Interview.jsx
  selectedCharacter,
  // { speaking:boolean, thinking:boolean, posture:string }
  characterState,
  confidenceScore,
  speechMetrics,
  onCharacterReady
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const charactersRef = useRef([]);
  const animationControllerRef = useRef(null);
  const behaviorIntelligenceRef = useRef(null);

  // Refs for tracking mutable prop values so animation loop doesn't need to rebuild
  const stateRef = useRef(characterState);
  const confidenceRef = useRef(confidenceScore);
  const metricsRef = useRef(speechMetrics);

  const [sceneReady, setSceneReady] = useState(false);

  // Keep refs in sync with incoming props
  useEffect(() => {
    stateRef.current = characterState;
    confidenceRef.current = confidenceScore;
    metricsRef.current = speechMetrics;
  }, [characterState, confidenceScore, speechMetrics]);

  // Main Scene Initialization (Run Once on Mount)
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    // ==================== SCENE INITIALIZATION ====================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 50, 300);
    sceneRef.current = scene;

    // ==================== RENDERER SETUP ====================
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ==================== LIGHTING SETUP ====================
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(10, 15, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x87ceeb, 1.2);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x5f9ea0, 0.8);
    rimLight.position.set(0, 5, -15);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // ==================== ENVIRONMENT SETUP ====================
    const floorGeometry = new THREE.PlaneGeometry(60, 60);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1f3a,
      metalness: 0.1,
      roughness: 0.7,
      envMapIntensity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallGeometry = new THREE.BoxGeometry(60, 15, 0.5);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2749,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85
    });
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = -20;
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);

    const sideWallGeometry = new THREE.BoxGeometry(0.5, 15, 30);
    const sideWall1 = new THREE.Mesh(sideWallGeometry, wallMaterial);
    sideWall1.position.x = -25;
    sideWall1.castShadow = true;
    sideWall1.receiveShadow = true;
    scene.add(sideWall1);

    const sideWall2 = new THREE.Mesh(sideWallGeometry, wallMaterial);
    sideWall2.position.x = 25;
    sideWall2.castShadow = true;
    sideWall2.receiveShadow = true;
    scene.add(sideWall2);

    const tableTopGeometry = new THREE.BoxGeometry(20, 0.15, 4);
    const tableTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3f5f,
      metalness: 0.3,
      roughness: 0.4
    });
    const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
    tableTop.position.y = 1;
    tableTop.position.z = 0;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);

    const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1f3a,
      metalness: 0.2,
      roughness: 0.6
    });

    const legPositions = [
      [-8, 0.5, -1.5],
      [8, 0.5, -1.5],
      [-8, 0.5, 1.5],
      [8, 0.5, 1.5]
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
    });

    // ==================== CAMERA SETUP ====================
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2.5, 8);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    const introStart = Date.now();

    // ==================== RESIZE HANDLER ====================
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // ==================== ANIMATION LOOP ====================
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const deltaTime = clock.getDelta();

      // Intro animation
      const introProgress = Math.min((Date.now() - introStart) / 2000, 1);
      if (introProgress < 1) {
        const easeInOutQuad = introProgress < 0.5
          ? 2 * introProgress * introProgress
          : -1 + (4 - 2 * introProgress) * introProgress;

        cameraRef.current.position.z = 8 + (3 - easeInOutQuad * 3);
        cameraRef.current.position.y = 2.5 - easeInOutQuad * 0.5;
      }

      // Update characters
      const chars = charactersRef.current;
      chars.forEach((character, index) => {
        // Initialize animation state once per character
        if (!character.userData.animations) {
          character.userData.animations = {
            idleTime: 0,
            blinkTimer: 0,
            nextBlinkAt: 2.5 + Math.random() * 3.5, // pre-computed, stable per cycle
            isBlinking: false,
            blinkProgress: 0
          };
        }

        const anim = character.userData.animations;

        // ── Idle breathing ─────────────────────────────────────────
        anim.idleTime += deltaTime;
        const breathAmount = Math.sin(anim.idleTime * 2) * 0.025;
        const breathSway   = Math.cos(anim.idleTime * 1.5) * 0.015;

        if (character.userData.meshes?.torso) {
          character.userData.meshes.torso.scale.y    = 1 + breathAmount;
          character.userData.meshes.torso.scale.x    = 1 + breathAmount * 0.3;
          character.userData.meshes.torso.rotation.z = breathSway;
        }

        // ── Head idle bob ───────────────────────────────────────────
        if (character.userData.meshes?.head) {
          const idleRotX = Math.sin(anim.idleTime * 1.2) * 0.02;
          const idleRotZ = Math.sin(anim.idleTime * 1.5) * 0.03;
          // Gentle lerp so blendshape-driven rotation from AnimationController
          // can smoothly blend back to idle without fighting
          character.userData.meshes.head.rotation.x =
            THREE.MathUtils.lerp(character.userData.meshes.head.rotation.x, idleRotX, 0.04);
          character.userData.meshes.head.rotation.z =
            THREE.MathUtils.lerp(character.userData.meshes.head.rotation.z, idleRotZ, 0.04);
        }

        // ── Blink animation (stable pre-computed interval) ──────────
        anim.blinkTimer += deltaTime;

        if (!anim.isBlinking && anim.blinkTimer >= anim.nextBlinkAt) {
          anim.isBlinking    = true;
          anim.blinkProgress = 0;
        }

        if (anim.isBlinking) {
          const BLINK_DURATION = 0.28; // seconds for full close-open cycle
          anim.blinkProgress += deltaTime / BLINK_DURATION;
          const blinkAmount = Math.sin(Math.min(anim.blinkProgress, 1) * Math.PI) * 0.95;

          if (character.userData.meshes?.leftEye)
            character.userData.meshes.leftEye.scale.y  = Math.max(0.05, 1 - blinkAmount);
          if (character.userData.meshes?.rightEye)
            character.userData.meshes.rightEye.scale.y = Math.max(0.05, 1 - blinkAmount);

          if (anim.blinkProgress >= 1) {
            anim.isBlinking    = false;
            anim.blinkProgress = 0;
            anim.blinkTimer    = 0;
            anim.nextBlinkAt   = 2.0 + Math.random() * 4.0; // new interval after blink
          }
        } else {
          // Restore eye scale to 1 between blinks
          if (character.userData.meshes?.leftEye)
            character.userData.meshes.leftEye.scale.y  = 1;
          if (character.userData.meshes?.rightEye)
            character.userData.meshes.rightEye.scale.y = 1;
        }

        const angle = (index * Math.PI * 2) / (chars.length - 1 || 1);
        if (index < 3) {
          character.rotation.y = -angle + Math.PI / 2;
        }
      });

      // Update behavior intelligence using the REFs instead of capturing state closure
      if (behaviorIntelligenceRef.current) {
        behaviorIntelligenceRef.current.update(deltaTime, {
          confidence: confidenceRef.current || 0.5,
          speaking: stateRef.current?.speaking === true,
          metrics: metricsRef.current
        });
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    setSceneReady(true);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      sceneRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  // Effect to load / update character when `selectedCharacter` changes
  useEffect(() => {
    if (!sceneRef.current || !sceneReady) return;

    // Clear old characters from scene to prevent duplicates on switch
    charactersRef.current.forEach(char => sceneRef.current.remove(char));
    charactersRef.current = [];

    const loader = new AvatarLoader(sceneRef.current);

    const deriveRole = (character) => {
      const mode = String(character?.role || "").toLowerCase();
      if (/(architect|system\s*design)/i.test(mode)) return 'system-design';
      if (/(backend|frontend|engineer|tech|developer)/i.test(mode)) return 'technical';
      if (/(behavior|communication|culture|people)/i.test(mode)) return 'behavioral';
      return 'hr';
    };

    // Helper function to create fallback skin texture 
    const createSkinTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#d4a574';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(200, 150, 100, ${Math.random() * 0.1})`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 2 + 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return texture;
    };

    const createCharacter = (name, position, role) => {
      const group = new THREE.Group();
      group.position.set(...position);

      const headGeometry = new THREE.IcosahedronGeometry(0.35, 5);
      const skinMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.05, 0.3, 0.65),
        metalness: 0.05,
        roughness: 0.6,
        map: createSkinTexture()
      });
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.y = 1.5;
      head.castShadow = true;
      head.receiveShadow = true;
      head.userData.name = 'head';
      group.add(head);

      const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3d2817),
        metalness: 0.3,
        roughness: 0.4
      });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.1, 1.65, 0.3);
      leftEye.castShadow = true;
      leftEye.userData.name = 'leftEye';
      group.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.1, 1.65, 0.3);
      rightEye.castShadow = true;
      rightEye.userData.name = 'rightEye';
      group.add(rightEye);

      const torsoGeometry = new THREE.BoxGeometry(0.4, 0.7, 0.2);
      const clothMaterial = new THREE.MeshStandardMaterial({
        color: role === 'moderator' ? new THREE.Color(0x1a1f3a) : new THREE.Color(0x2a3f5f),
        metalness: 0.1,
        roughness: 0.8
      });
      const torso = new THREE.Mesh(torsoGeometry, clothMaterial);
      torso.position.y = 0.9;
      torso.castShadow = true;
      torso.receiveShadow = true;
      torso.userData.name = 'torso';
      group.add(torso);

      const armGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.08);

      const leftArm = new THREE.Mesh(armGeometry, clothMaterial);
      leftArm.position.set(-0.25, 0.8, 0);
      leftArm.castShadow = true;
      leftArm.userData.name = 'leftArm';
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, clothMaterial);
      rightArm.position.set(0.25, 0.8, 0);
      rightArm.castShadow = true;
      rightArm.userData.name = 'rightArm';
      group.add(rightArm);

      group.userData = {
        name,
        role,
        modelGroup: group,
        meshes: {
          head,
          leftEye,
          rightEye,
          torso,
          leftArm,
          rightArm
        },
        animations: {
          idleTime: 0,
          blinkTimer: 0,
          emotions: { confidence: 0.5, engagement: 0.5, analysis: 0.3 }
        }
      };

      return group;
    };

    const addDefaultCharacter = (role) => {
      const fallback = createCharacter('Fallback ' + role, [0, 0, 0], role);
      sceneRef.current.add(fallback);
      charactersRef.current = [fallback];

      const animationController = new AnimationController(charactersRef.current);
      animationControllerRef.current = animationController;
      const behaviorIntelligence = new BehaviorIntelligence(charactersRef.current, animationController);
      behaviorIntelligenceRef.current = behaviorIntelligence;
    };

    if (selectedCharacter) {
      const roleKey = deriveRole(selectedCharacter);
      loader.loadAvatar(roleKey, selectedCharacter).then(({ root }) => {
        sceneRef.current.add(root);
        charactersRef.current = [root];
        const animationController = new AnimationController(charactersRef.current);
        animationControllerRef.current = animationController;
        const behaviorIntelligence = new BehaviorIntelligence(charactersRef.current, animationController);
        behaviorIntelligenceRef.current = behaviorIntelligence;
        onCharacterReady?.(true);
      }).catch(() => {
        // if glTF load fails, use a generic shape
        addDefaultCharacter('hr');
        onCharacterReady?.(false);
      });
    } else {
      addDefaultCharacter('hr');
      onCharacterReady?.(false);
    }
  }, [selectedCharacter, sceneReady, onCharacterReady]);

  return (
    <div className="interview-scene-3d">
      <div ref={containerRef} className="scene-container" />
      <div className="scene-status">
        {sceneReady && <span className="status-indicator ready">●</span>}
        <span className="status-text">
          {sceneReady ? '3D Environment Ready' : 'Initializing...'}
        </span>
      </div>
    </div>
  );
}

