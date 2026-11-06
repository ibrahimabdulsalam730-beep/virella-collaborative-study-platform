"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import IntroPreloader from "./IntroPreloader";

/**
 * 5-Phase Cinematic Intro State Machine
 * ──────────────────────────────────────
 * 1. "preload"    → Big logo preloader centered on #05050a (~2s)
 * 2. "logoShrink" → Shared-element animation: logo shrinks into center navbar (~1s)
 * 3. "treeGrow"   → Dark stage with purple glow, bonsai tree grows bottom-up (6-8s, or ~2s on repeat)
 * 4. "siteReveal" → Tree reaches ~85%, navbar links & hero content stagger-reveal
 * 5. "done"       → Full page idle with gentle tree sway; scroll unlocked
 */
export type IntroPhase =
  | "preload"
  | "logoShrink"
  | "treeGrow"
  | "siteReveal"
  | "done";

interface IntroCtx {
  phase: IntroPhase;
  treeProgress: number;
  isFastTree: boolean;
  navbarLogoRef: React.RefObject<HTMLDivElement | null>;
  notifyTreeProgress: (progress: number) => void;
  startLogoShrink: () => void;
  onLogoLanded: () => void;
  replayIntro: () => void;
}

const IntroContext = createContext<IntroCtx>({
  phase: "preload",
  treeProgress: 0,
  isFastTree: false,
  navbarLogoRef: { current: null },
  notifyTreeProgress: () => {},
  startLogoShrink: () => {},
  onLogoLanded: () => {},
  replayIntro: () => {},
});

export const useIntroPhase = () => useContext(IntroContext);

const SESSION_KEY = "virella_cinematic_intro_seen";

export default function IntroController({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<IntroPhase>("preload");
  const [treeProgress, setTreeProgress] = useState(0);
  const [isFastTree, setIsFastTree] = useState(false);
  const revealedRef = useRef(false);
  const navbarLogoRef = useRef<HTMLDivElement | null>(null);

  // Initialize on client mount
  useEffect(() => {
    // 0. Force reset if query param ?reset=1 or ?intro=1 is present
    const searchParams = new URLSearchParams(window.location.search);
    const forceReset =
      searchParams.get("reset") === "1" || searchParams.get("intro") === "1";
    if (forceReset) {
      sessionStorage.removeItem(SESSION_KEY);
    }

    // 1. Reduced motion: skip straight to final state
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion && !forceReset) {
      setPhase("done");
      setTreeProgress(1);
      return;
    }

    // 2. Repeat visit: skip preloader, play short 2s tree growth
    const alreadySeen =
      !forceReset && sessionStorage.getItem(SESSION_KEY) === "1";
    if (alreadySeen) {
      setIsFastTree(true);
      setPhase("treeGrow");
    } else {
      setIsFastTree(false);
      setPhase("preload");
    }
  }, []);

  // Lock body scroll during preload, logoShrink, and treeGrow
  useEffect(() => {
    if (phase === "preload" || phase === "logoShrink" || phase === "treeGrow") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  // Step 1 -> Step 2: Assets ready & preloader timer elapsed
  const startLogoShrink = useCallback(() => {
    setPhase((prev) => (prev === "preload" ? "logoShrink" : prev));
  }, []);

  // Step 2 -> Step 3: Logo landed in navbar, preloader unmounts, tree starts
  const onLogoLanded = useCallback(() => {
    setPhase("treeGrow");
  }, []);

  // Step 3 -> Step 4 -> Step 5: Tree growth progress telemetry
  const notifyTreeProgress = useCallback((progress: number) => {
    setTreeProgress(progress);
    if (!revealedRef.current && progress >= 0.85) {
      revealedRef.current = true;
      setPhase("siteReveal");
      // Once progress completes and stagger settles, mark as done
      setTimeout(() => {
        setPhase("done");
        sessionStorage.setItem(SESSION_KEY, "1");
      }, 1400);
    }
  }, []);

  // Replay intro action
  const replayIntro = useCallback(() => {
    revealedRef.current = false;
    setIsFastTree(false);
    setTreeProgress(0);
    sessionStorage.removeItem(SESSION_KEY);
    setPhase("preload");
  }, []);

  return (
    <IntroContext.Provider
      value={{
        phase,
        treeProgress,
        isFastTree,
        navbarLogoRef,
        notifyTreeProgress,
        startLogoShrink,
        onLogoLanded,
        replayIntro,
      }}
    >
      {/* Preloader Overlay (only mounted during 'preload' and 'logoShrink') */}
      {(phase === "preload" || phase === "logoShrink") && (
        <IntroPreloader
          phase={phase}
          targetLogoRef={navbarLogoRef}
          onReadyToShrink={startLogoShrink}
          onLanded={onLogoLanded}
        />
      )}

      {/* Main Page Layout - space is always reserved to prevent layout shifts */}
      <div className="relative w-full min-h-screen">
        {children}
      </div>
    </IntroContext.Provider>
  );
}
