# Virella Study — Collaborative Cognitive Mastery Platform

A next-generation collaborative study platform designed for university cohorts and peer study groups. Featuring an interactive 3D Bonsai growth hero, server-authoritative synchronized Pomodoro rooms, batched vector whiteboards, 10 evidence-based cognitive session modes (Feynman clarity scoring, active recall battles, mind maps), and a non-punitive proctored test diagnostic.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              Client (Next.js 16)              │
                      │  - Three.js 3D Bonsai Hero Growth (R3F)       │
                      │  - Shared Whiteboard (HTML5 Canvas Batching)  │
                      │  - Synchronized Authoritative Timer           │
                      │  - Client-side MediaPipe Integrity Telemetry  │
                      └──────────────┬─────────────────┬──────────────┘
                                     │                 │
             HTTP / REST / Server Actions             Socket.IO (WebSocket)
                                     │                 │
                      ┌──────────────▼──────┐   ┌──────▼───────────────────────┐
                      │  Next.js App Router │   │   Node.js Realtime Socket    │
                      │  - Room Management  │   │   - Zero-Drift Timer Sync    │
                      │  - Auth & Sessions  │   │   - Whiteboard Stroke Stream │
                      │  - Diagnostics API  │   │   - Live Presence & Chat     │
                      └──────────────┬──────┘   └──────────────┬───────────────┘
                                     │                         │
                         ┌───────────▼───────────┐             │
                         │ PostgreSQL (Prisma)   │             │
                         │ - Users, Rooms, Notes │             │
                         │ - Flashcards, Reports │             │
                         └───────────────────────┘             │
                                     ▲                         ▼
                                     │               ┌───────────────────┐
                                     └───────────────┤ Redis Room Cache  │
                                                     └───────────────────┘
```

---

## Technology Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **3D Hero Scene**: Three.js WebGL procedural Bonsai Tree with Catmull-Rom spline curves, dynamic tube geometry reveals, instanced flower/leaf clusters, weathered rock base, and ambient violet illumination
- **Real-Time Engine**: Node.js + Socket.IO server with room state caching and stroke batching
- **Backend API & Persistence**: Next.js route handlers + PostgreSQL (Prisma ORM) + Redis
- **Proctoring Engine**: Python FastAPI + OpenCV + MediaPipe face mesh & head pose detection
- **Aesthetics**: Obsidian black (`#060509`) background, deep violet radial glow, lime-green (`#b4f000`) accents, monospace bracket tags (`[ FEATURES ]`, `[ TECHNIQUES ]`), thin 1px borders, rounded pill buttons

---

## 3D Bonsai Tree Hero Growth Animation

Recreated faithfully from the reference video design:
1. **Artistic Moyogi S-Curved Trunk**: Procedurally generated with `CatmullRomCurve3` splines and dynamic `TubeGeometry` that unfolds progressively from the rock base upward rather than scaling the model.
2. **Organic Bonsai Lateral Branches**: 6 asymmetrical boughs tapering outward with natural curves.
3. **Pale Lavender & Violet Blossoms**: Clustered 5-petal flower geometries with pale yellow stamens mixed with delicate emerald leaves, blossoming progressively as branches mature.
4. **Stratified Weathered Rock Plinth**: Faceted dodecahedron geometry with organic displacement and root buttress anchors.
5. **Interactive Controls**: Replay Growth button, study-time link toggle (simulating growth reflecting group study hours), and mouse parallax angle inspection.

---

## Hard Problems & Architecture Trade-offs

### 1. Server-Authoritative Timer Synchronization
- **Challenge**: Network latency, background tab throttling, and client clock skew cause standard client-side countdowns to desynchronize between room members.
- **Solution**: The server owns the exact `startTimeMs` and `durationSeconds`. Clients compute remaining seconds deterministically: `remaining = duration - floor((now - startTime) / 1000)`. If paused, `remainingSecondsWhenPaused` is stored. Reconnecting users compute the identical second instantly with zero drift.

### 2. Low-Bandwidth Real-Time Whiteboard
- **Challenge**: Sending mousemove points at 60Hz floods the WebSocket connection and degrades performance for users with weak connections.
- **Solution**: Vector strokes are batched locally during freehand drawing. When a stroke completes (or every 60ms during long strokes), the smoothed point array is transmitted as a single payload. Full canvas state is serialized to `localStorage` and server memory to enable instant recovery on page reload.

### 3. Ethical Non-Punitive Proctoring Policy
- **Rule**: **NEVER auto-fail a student based on AI flags**. Gaze detection produces false positives when students look away while thinking, adjust their posture, or wear reflective glasses.
- **Implementation**: Flags are labeled `"Needs review"` with confidence scores for human instructors, never `"Cheated"`. Video frames are throttled to 2-5 FPS and processed client-side. No continuous video recordings are retained by default. Students have a one-click &ldquo;Delete My Integrity Data&rdquo; button.

### 4. Low-End Hardware & Bandwidth Optimization
- Canvas pixel ratios are capped at `min(window.devicePixelRatio, 2)`.
- Fallbacks allow test completion even if webcam access is denied or unavailable.

---

## Setup & Running Locally

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Docker & Docker Compose (optional for full container stack)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Start the Real-Time Socket.IO Server (Optional for multi-client testing)
```bash
node server.mjs
```

### 4. Run with Docker Compose
```bash
docker compose up --build
```
This spins up PostgreSQL, Redis, Next.js, Socket.IO, and the FastAPI proctoring service simultaneously.

---

## Pages Included

- `/`: Landing page featuring the 3D Bonsai Tree Hero, floating telemetry cards, features grid, timeline journey, and footer
- `/rooms`: Active cohorts directory, search/filtering, and study room creation modal
- `/rooms/[roomId]`: Interactive live room featuring the shared whiteboard, server-synced Pomodoro timer, live presence list, and in-room chat
- `/techniques`: The 10 Cognitive Study Techniques with interactive Feynman clarity scorer and Active Recall battle simulator
- `/proctored-test`: Proctored test flow (Consent → Hardware Check → Test Answering → Diagnostic & Integrity Report)
- `/dashboard`: Student command center with SM-2 spaced repetition queue, study telemetry, and active rooms
