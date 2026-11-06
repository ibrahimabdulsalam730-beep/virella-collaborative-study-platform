"use client";

import dynamic from "next/dynamic";

/**
 * This is a Client Component (required for dynamic ssr:false).
 * HomeClient contains the entire home page tree including the intro
 * state machine. Because ssr:false, the server renders null here and
 * the client bootstraps fresh — no hydration mismatch possible.
 */
const HomeClient = dynamic(() => import("./HomeClient"), {
  ssr: false,
  loading: () => (
    // Minimal dark placeholder so there is no white flash before the client loads
    <div style={{ minHeight: "100vh", background: "#05050a" }} />
  ),
});

export default function Home() {
  return <HomeClient />;
}
