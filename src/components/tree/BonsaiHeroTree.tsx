"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useIntroPhase } from "@/components/intro/IntroController";
import { RotateCcw, Volume2, VolumeX, AlertCircle } from "lucide-react";

interface BonsaiHeroTreeProps {
  onProgress?: (progress: number) => void;
  onAnimationComplete?: () => void;
  className?: string;
}

export default function BonsaiHeroTree({
  onProgress,
  onAnimationComplete,
  className = "",
}: BonsaiHeroTreeProps) {
  const { phase, isFastTree, replayIntro } = useIntroPhase();
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>("Stage 1: Bedrock Awakening");
  const [growthVal, setGrowthVal] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  // Growth speed: ~7s for normal cinematic intro, ~2s on repeat visits
  const growthSpeed = isFastTree ? 0.48 : 0.145;

  const animStateRef = useRef({
    progress: phase === "done" ? 1 : 0,
    targetProgress: 1,
    isComplete: phase === "done",
    speed: growthSpeed,
    lastTimestamp: 0,
    windTime: 0,
    isVisible: true,
  });

  // Keep speed updated if isFastTree changes
  useEffect(() => {
    animStateRef.current.speed = isFastTree ? 0.48 : 0.145;
  }, [isFastTree]);

  // Audio chime synthesis on flower bloom
  const playChime = useCallback((freq = 560) => {
    if (isAudioMuted) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio blocked or unsupported
    }
  }, [isAudioMuted]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. WebGL Feature Detection & Fallback
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl") ||
      testCanvas.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL is unavailable. Proceeding with cinematic fallback.");
      setWebGLFailed(true);
      onProgress?.(1);
      onAnimationComplete?.();
      return;
    }

    // 2. SCENE SETUP
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();

    // Adjust camera distance according to container width to guarantee zero clipping
    const getCameraZ = (w: number) => {
      if (w < 420) return 8.6; // Small phones (390px)
      if (w < 768) return 8.0; // Tablets (768px)
      if (w < 1024) return 7.6; // Small laptops (1024px)
      return 7.2; // Desktop (1440px)
    };

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.3, getCameraZ(width));
    camera.lookAt(0, 0.25, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    // Cap DPR strictly between [1, 1.75]
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1), 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. TREE ROOT GROUP
    const treeRootGroup = new THREE.Group();
    treeRootGroup.position.set(0, -0.4, 0);
    scene.add(treeRootGroup);

    // 4. LIGHTING SYSTEM
    // Warm top-right key light
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.3);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Lavender/purple signature ambient glow from back-bottom
    const purpleRimLight = new THREE.PointLight(0xa855f7, 4.2, 12, 1.2);
    purpleRimLight.position.set(0, -0.8, -2.5);
    scene.add(purpleRimLight);

    // Soft turquoise fill from left
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.7);
    fillLight.position.set(-5, 2, 3);
    scene.add(fillLight);

    // Subtle dark violet ambient light
    const ambientLight = new THREE.AmbientLight(0x23173d, 1.3);
    scene.add(ambientLight);

    // 5. MATERIALS
    const barkMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a3d28,
      roughness: 0.82,
      metalness: 0.08,
    });

    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6d3cb,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true,
    });

    const rockShadowMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c867c,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
    });

    const flowerLavMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8b8f5,
      emissive: 0x3d175e,
      emissiveIntensity: 0.25,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const flowerDeepPurple = new THREE.MeshStandardMaterial({
      color: 0xba8beb,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.32,
      roughness: 0.4,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    const flowerCoreMaterial = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
    });

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x487e4f,
      roughness: 0.6,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    // 6. ROCK BASE (Emerges first)
    const rockGroup = new THREE.Group();

    const mainRockGeo = new THREE.DodecahedronGeometry(1.22, 1);
    const mainRockPos = mainRockGeo.attributes.position;
    for (let i = 0; i < mainRockPos.count; i++) {
      const vx = mainRockPos.getX(i);
      const vy = mainRockPos.getY(i);
      const vz = mainRockPos.getZ(i);
      const scaleY = vy > 0 ? 0.45 : 0.6;
      mainRockPos.setY(i, vy * scaleY);
      mainRockPos.setX(i, vx * (1 + Math.sin(vy * 8 + vz * 3) * 0.12));
      mainRockPos.setZ(i, vz * (1 + Math.cos(vx * 7 + vy * 4) * 0.1));
    }
    mainRockGeo.computeVertexNormals();
    const mainRockMesh = new THREE.Mesh(mainRockGeo, rockMaterial);
    mainRockMesh.position.set(0, -1.95, 0);
    rockGroup.add(mainRockMesh);

    const subRockGeo = new THREE.DodecahedronGeometry(0.7, 1);
    const subRockMesh = new THREE.Mesh(subRockGeo, rockShadowMaterial);
    subRockMesh.position.set(0.65, -2.1, 0.35);
    subRockMesh.rotation.set(0.4, 0.8, -0.2);
    subRockMesh.scale.set(1.1, 0.5, 0.9);
    rockGroup.add(subRockMesh);

    const shelfGeo = new THREE.BoxGeometry(1.6, 0.22, 1.1);
    const shelfMesh = new THREE.Mesh(shelfGeo, rockMaterial);
    shelfMesh.position.set(-0.1, -2.25, -0.1);
    shelfMesh.rotation.y = 0.25;
    rockGroup.add(shelfMesh);

    treeRootGroup.add(rockGroup);

    // 7. TRUNK (S-curved bonsai trunk)
    const trunkCurvePoints = [
      new THREE.Vector3(0, -1.55, 0),
      new THREE.Vector3(0.08, -1.15, 0.05),
      new THREE.Vector3(0.32, -0.65, 0.18),
      new THREE.Vector3(0.55, -0.1, 0.12),
      new THREE.Vector3(0.48, 0.45, -0.05),
      new THREE.Vector3(0.18, 0.95, -0.18),
      new THREE.Vector3(-0.25, 1.45, -0.1),
      new THREE.Vector3(-0.45, 1.85, 0.08),
      new THREE.Vector3(-0.22, 2.22, 0.15),
      new THREE.Vector3(0.05, 2.45, 0.05),
    ];
    const fullTrunkCurve = new THREE.CatmullRomCurve3(trunkCurvePoints);

    const initialTrunkGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        trunkCurvePoints[0],
        trunkCurvePoints[0].clone().add(new THREE.Vector3(0, 0.02, 0)),
      ]),
      8,
      0.18,
      8,
      false
    );
    const trunkMesh = new THREE.Mesh(initialTrunkGeo, barkMaterial);
    treeRootGroup.add(trunkMesh);

    // 8. LATERAL BRANCHES
    interface BranchDef {
      curve: THREE.Vector3[];
      radius: number;
      startGrowth: number;
      endGrowth: number;
    }
    const branchDefs: BranchDef[] = [
      {
        curve: [
          new THREE.Vector3(0.48, 0.45, -0.05),
          new THREE.Vector3(0.9, 0.52, 0.15),
          new THREE.Vector3(1.35, 0.45, 0.3),
          new THREE.Vector3(1.65, 0.35, 0.25),
        ],
        radius: 0.085,
        startGrowth: 0.38,
        endGrowth: 0.68,
      },
      {
        curve: [
          new THREE.Vector3(0.18, 0.95, -0.18),
          new THREE.Vector3(-0.35, 1.1, -0.4),
          new THREE.Vector3(-0.85, 1.18, -0.5),
          new THREE.Vector3(-1.25, 1.12, -0.45),
        ],
        radius: 0.08,
        startGrowth: 0.44,
        endGrowth: 0.72,
      },
      {
        curve: [
          new THREE.Vector3(-0.45, 1.85, 0.08),
          new THREE.Vector3(-0.9, 1.95, 0.25),
          new THREE.Vector3(-1.3, 1.9, 0.3),
        ],
        radius: 0.065,
        startGrowth: 0.52,
        endGrowth: 0.78,
      },
      {
        curve: [
          new THREE.Vector3(0.05, 2.45, 0.05),
          new THREE.Vector3(0.45, 2.65, 0.15),
          new THREE.Vector3(0.85, 2.7, 0.05),
        ],
        radius: 0.055,
        startGrowth: 0.58,
        endGrowth: 0.82,
      },
    ];

    const branchMeshes = branchDefs.map((b) => {
      const bCurve = new THREE.CatmullRomCurve3(b.curve);
      const tempGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([b.curve[0], b.curve[0].clone().add(new THREE.Vector3(0.01, 0, 0))]),
        4,
        b.radius,
        6,
        false
      );
      const mesh = new THREE.Mesh(tempGeo, barkMaterial);
      mesh.visible = false;
      treeRootGroup.add(mesh);
      return {
        mesh,
        fullCurve: bCurve,
        radius: b.radius,
        startGrowth: b.startGrowth,
        endGrowth: b.endGrowth,
      };
    });

    // 9. BLOSSOM & FOLIAGE CLUSTERS
    interface FoliageDef {
      center: THREE.Vector3;
      scale: number;
      startGrowth: number;
    }
    const foliageClusterDefs: FoliageDef[] = [
      { center: new THREE.Vector3(1.65, 0.35, 0.25), scale: 0.65, startGrowth: 0.65 },
      { center: new THREE.Vector3(1.2, 0.48, 0.2), scale: 0.55, startGrowth: 0.68 },
      { center: new THREE.Vector3(-1.25, 1.12, -0.45), scale: 0.7, startGrowth: 0.7 },
      { center: new THREE.Vector3(-0.75, 1.18, -0.45), scale: 0.55, startGrowth: 0.72 },
      { center: new THREE.Vector3(-1.3, 1.9, 0.3), scale: 0.65, startGrowth: 0.74 },
      { center: new THREE.Vector3(0.85, 2.7, 0.05), scale: 0.75, startGrowth: 0.78 },
      { center: new THREE.Vector3(0.05, 2.55, 0.05), scale: 0.7, startGrowth: 0.8 },
      { center: new THREE.Vector3(-0.15, 2.3, 0.15), scale: 0.6, startGrowth: 0.82 },
    ];

    const foliageClusters = foliageClusterDefs.map((cDef) => {
      const cluster = new THREE.Group();
      cluster.position.copy(cDef.center);

      // Leaves
      const numLeaves = 9;
      for (let i = 0; i < numLeaves; i++) {
        const leafGeo = new THREE.ConeGeometry(0.08, 0.24, 4);
        const leafMesh = new THREE.Mesh(leafGeo, leafMaterial);
        const theta = (i / numLeaves) * Math.PI * 2;
        const radius = 0.16 + (i % 3) * 0.08;
        leafMesh.position.set(Math.cos(theta) * radius, (Math.sin(i * 3) - 0.2) * 0.1, Math.sin(theta) * radius);
        leafMesh.rotation.set(Math.PI / 2 + (i % 2) * 0.3, theta, (i % 3) * 0.4);
        cluster.add(leafMesh);
      }

      // Lavender Blossom Petals
      const numFlowers = 12;
      for (let i = 0; i < numFlowers; i++) {
        const flower = new THREE.Group();
        const mat = i % 2 === 0 ? flowerLavMaterial : flowerDeepPurple;
        for (let p = 0; p < 5; p++) {
          const petalGeo = new THREE.CircleGeometry(0.065, 5);
          const petalMesh = new THREE.Mesh(petalGeo, mat);
          const pAngle = (p / 5) * Math.PI * 2;
          petalMesh.position.set(Math.cos(pAngle) * 0.045, Math.sin(pAngle) * 0.045, 0);
          petalMesh.rotation.z = pAngle;
          flower.add(petalMesh);
        }
        const coreGeo = new THREE.SphereGeometry(0.02, 4, 4);
        const coreMesh = new THREE.Mesh(coreGeo, flowerCoreMaterial);
        coreMesh.position.z = 0.01;
        flower.add(coreMesh);

        const fTheta = (i / numFlowers) * Math.PI * 2;
        const fR = 0.08 + (i % 4) * 0.07;
        flower.position.set(Math.cos(fTheta) * fR, 0.05 + Math.sin(i * 2) * 0.09, Math.sin(fTheta) * fR);
        flower.rotation.set((i % 3) * 0.4, fTheta, (i % 2) * 0.3);
        cluster.add(flower);
      }

      cluster.scale.set(0.0001, 0.0001, 0.0001);
      treeRootGroup.add(cluster);
      return {
        group: cluster,
        targetScale: cDef.scale,
        startGrowth: cDef.startGrowth,
      };
    });

    // 10. PROGRESSIVE GEOMETRY UPDATE FUNCTION
    const updateTreeGeometry = (progress: number) => {
      // Stage text telemetry
      if (progress < 0.16) {
        setCurrentStage("Stage 1: Bedrock Awakening");
      } else if (progress < 0.48) {
        setCurrentStage("Stage 2: Bonsai Trunk Growth");
      } else if (progress < 0.74) {
        setCurrentStage("Stage 3: Branch Formation");
      } else if (progress < 0.92) {
        setCurrentStage("Stage 4: Lavender Blossoms Unfurling");
      } else {
        setCurrentStage("Stage 5: Full Flourishing Bonsai");
      }
      setGrowthVal(Math.round(progress * 100));

      // 1. Rock Base Emerges First (0.0 to 0.16)
      const rockFrac = Math.min(1, Math.max(0, progress / 0.16));
      const rockEase = 1 - Math.pow(1 - rockFrac, 3);
      rockGroup.position.y = -0.35 * (1 - rockEase);
      rockGroup.scale.set(rockEase, rockEase, rockEase);
      rockGroup.visible = rockFrac > 0.02;

      // 2. Trunk Tube Growth (0.12 to 0.54)
      const trunkFrac = Math.min(1, Math.max(0, (progress - 0.1) / 0.44));
      if (trunkFrac > 0.01) {
        trunkMesh.visible = true;
        const numTrunkPts = Math.max(4, Math.floor(trunkFrac * 30));
        const subPoints: THREE.Vector3[] = [];
        for (let i = 0; i <= numTrunkPts; i++) {
          const t = (i / numTrunkPts) * trunkFrac;
          subPoints.push(fullTrunkCurve.getPointAt(t));
        }
        if (subPoints.length >= 2) {
          const subCurve = new THREE.CatmullRomCurve3(subPoints);
          const baseRadius = 0.18;
          const currentTrunkGeo = new THREE.TubeGeometry(
            subCurve,
            Math.max(10, numTrunkPts * 2),
            baseRadius * (1 - trunkFrac * 0.65),
            10,
            false
          );
          trunkMesh.geometry.dispose();
          trunkMesh.geometry = currentTrunkGeo;
        }
      } else {
        trunkMesh.visible = false;
      }

      // 3. Branches Growth
      branchMeshes.forEach((b) => {
        if (progress < b.startGrowth) {
          b.mesh.visible = false;
        } else {
          b.mesh.visible = true;
          const branchFrac = Math.min(1, (progress - b.startGrowth) / (b.endGrowth - b.startGrowth));
          const numPts = Math.max(3, Math.floor(branchFrac * 16));
          const subBranchPoints: THREE.Vector3[] = [];
          for (let i = 0; i <= numPts; i++) {
            const t = (i / numPts) * branchFrac;
            subBranchPoints.push(b.fullCurve.getPointAt(t));
          }
          if (subBranchPoints.length >= 2) {
            const subCurve = new THREE.CatmullRomCurve3(subBranchPoints);
            const bGeo = new THREE.TubeGeometry(
              subCurve,
              Math.max(8, numPts * 2),
              b.radius * Math.max(0.35, 1 - branchFrac * 0.4),
              8,
              false
            );
            b.mesh.geometry.dispose();
            b.mesh.geometry = bGeo;
          }
        }
      });

      // 4. Flowers & Leaves Bloom
      foliageClusters.forEach((fc) => {
        if (progress < fc.startGrowth) {
          fc.group.visible = false;
          fc.group.scale.set(0.0001, 0.0001, 0.0001);
        } else {
          fc.group.visible = true;
          const folFrac = Math.min(1, (progress - fc.startGrowth) / 0.15);
          const eased = Math.sin((folFrac * Math.PI) / 2);
          const currentScale = fc.targetScale * eased;
          fc.group.scale.set(currentScale, currentScale, currentScale);
        }
      });

      // Ambient Purple Rim Light Glow increases with growth
      purpleRimLight.intensity = 2.0 + progress * 3.5;
    };

    // Initialize geometry to starting progress
    updateTreeGeometry(animStateRef.current.progress);

    // 11. ANIMATION LOOP with OFFSCREEN PAUSE
    let reqId: number;
    let playedChime = false;

    const animate = (timestamp: number) => {
      reqId = requestAnimationFrame(animate);

      if (!animStateRef.current.isVisible) return;

      if (!animStateRef.current.lastTimestamp) {
        animStateRef.current.lastTimestamp = timestamp;
      }
      const delta = Math.min(0.08, (timestamp - animStateRef.current.lastTimestamp) / 1000);
      animStateRef.current.lastTimestamp = timestamp;
      animStateRef.current.windTime += delta;

      const state = animStateRef.current;

      // Progressive tree growth
      if (state.progress < state.targetProgress) {
        state.progress = Math.min(state.targetProgress, state.progress + delta * state.speed);
        updateTreeGeometry(state.progress);
        onProgress?.(state.progress);

        if (state.progress > 0.7 && !playedChime) {
          playedChime = true;
          playChime(580);
        }

        if (state.progress >= 1 && !state.isComplete) {
          state.isComplete = true;
          onAnimationComplete?.();
          onProgress?.(1);
        }
      }

      // Gentle organic breeze sway when mature
      const breeze = Math.sin(state.windTime * 1.3) * 0.016;
      const subtleBreath = Math.cos(state.windTime * 0.9) * 0.01;
      treeRootGroup.rotation.y = breeze;
      treeRootGroup.rotation.z = subtleBreath * 0.35;

      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(animate);

    // 12. INTERSECTION OBSERVER (Pause rendering when off-screen)
    const observer = new IntersectionObserver(
      ([entry]) => {
        animStateRef.current.isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 13. RESIZE LISTENER (Zero cropping across 1440, 1024, 768, 390px)
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 560;
      const newH = container.clientHeight || 600;
      camera.aspect = newW / newH;
      camera.position.z = getCameraZ(newW);
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    // 14. CLEANUP
    return () => {
      cancelAnimationFrame(reqId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [growthSpeed, onProgress, onAnimationComplete, playChime, isAudioMuted]);

  // If WebGL fails, render an elegant 2D animated SVG fallback
  if (webGLFailed) {
    return (
      <div className={`relative w-full aspect-square flex flex-col items-center justify-center ${className}`}>
        <div className="w-48 h-48 rounded-full bg-purple-950/40 border border-purple-500/20 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#b4f000] mb-3" />
          <div className="text-sm font-semibold text-white">Interactive Bonsai</div>
          <p className="text-xs text-slate-400 mt-1">WebGL unavailable on this display</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-square max-h-[580px] flex items-center justify-center ${className}`}
    >
      {/* Soft Ambient Radial Violet Glow Behind Tree */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, rgba(168, 85, 247, 0.22) 0%, rgba(126, 34, 206, 0.08) 42%, transparent 72%)",
        }}
      />

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Interactive 3D Bonsai: 60fps bottom-up procedural growth"
      />

      {/* Stage Telemetry Badge & Audio Toggle (only visible during growth and idle) */}
      <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="glass-panel px-3 py-1 rounded-full flex items-center gap-2 border border-white/10 shadow-lg text-[11px] font-mono text-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b4f000] animate-pulse" />
          <span>{currentStage}</span>
          <span className="text-[#b4f000] font-bold">{growthVal}%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="glass-panel text-slate-400 hover:text-white p-1.5 rounded-full transition-colors border border-white/10 text-xs"
            title={isAudioMuted ? "Unmute nature chime on bloom" : "Mute bloom chime"}
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#b4f000]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
