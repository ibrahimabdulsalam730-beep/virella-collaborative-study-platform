import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.SOCKET_PORT || 4001;

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "Virella Realtime Socket Server" }));
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory room cache (replicated to Redis in production)
const roomCache = new Map();

io.on("connection", (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // JOIN ROOM
  socket.on("join-room", ({ roomId, user }) => {
    // Gate room access: unverified or suspended users cannot join or receive room sync
    if (!user || user.emailVerified === false) {
      console.warn(`[Socket Denied] Unverified user ${user?.name || socket.id} tried to join room ${roomId}`);
      socket.emit("room-error", {
        code: "EMAIL_VERIFICATION_REQUIRED",
        message: "Email confirmation is required before entering study rooms.",
      });
      return;
    }

    if (user.status === "SUSPENDED") {
      console.warn(`[Socket Denied] Suspended user ${user?.name || socket.id} tried to join room ${roomId}`);
      socket.emit("room-error", {
        code: "ACCOUNT_SUSPENDED",
        message: "Your account is suspended.",
      });
      return;
    }

    socket.join(roomId);

    if (!roomCache.has(roomId)) {
      roomCache.set(roomId, {
        members: new Map(),
        whiteboardStrokes: [],
        timer: {
          phase: "focus",
          durationSeconds: 25 * 60,
          startTimeMs: null,
          isPaused: true,
          remainingSecondsWhenPaused: 25 * 60,
          round: 1,
          totalRounds: 4,
        },
      });
    }

    const room = roomCache.get(roomId);
    room.members.set(socket.id, {
      ...user,
      socketId: socket.id,
      joinedAt: Date.now(),
    });

    // Send initial snapshot to joining client
    socket.emit("room-snapshot", {
      members: Array.from(room.members.values()),
      whiteboardStrokes: room.whiteboardStrokes,
      timer: room.timer,
    });

    // Notify room of new member
    socket.to(roomId).emit("member-joined", user);
    console.log(`User ${user.name} joined room ${roomId}`);
  });

  // WHITEBOARD STROKE
  socket.on("whiteboard-stroke", ({ roomId, stroke }) => {
    const room = roomCache.get(roomId);
    if (room) {
      room.whiteboardStrokes.push(stroke);
      // Keep stroke buffer reasonable
      if (room.whiteboardStrokes.length > 5000) {
        room.whiteboardStrokes = room.whiteboardStrokes.slice(-4000);
      }
    }
    socket.to(roomId).emit("whiteboard-stroke", stroke);
  });

  // WHITEBOARD CLEAR
  socket.on("whiteboard-clear", ({ roomId }) => {
    const room = roomCache.get(roomId);
    if (room) {
      room.whiteboardStrokes = [];
    }
    socket.to(roomId).emit("whiteboard-clear");
  });

  // AUTHORITATIVE TIMER STATE UPDATE (HOST)
  socket.on("timer-update", ({ roomId, timerState }) => {
    const room = roomCache.get(roomId);
    if (room) {
      room.timer = timerState;
    }
    socket.to(roomId).emit("timer-update", timerState);
  });

  // CHAT MESSAGE
  socket.on("chat-message", ({ roomId, message }) => {
    socket.to(roomId).emit("chat-message", message);
  });

  // PRESENCE & STATUS CHANGE
  socket.on("status-change", ({ roomId, status }) => {
    const room = roomCache.get(roomId);
    if (room && room.members.has(socket.id)) {
      const member = room.members.get(socket.id);
      member.status = status;
      socket.to(roomId).emit("member-updated", member);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    for (const [roomId, room] of roomCache.entries()) {
      if (room.members.has(socket.id)) {
        const leavingUser = room.members.get(socket.id);
        room.members.delete(socket.id);
        socket.to(roomId).emit("member-left", { socketId: socket.id, userId: leavingUser.id });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`> Virella Real-time Socket.IO Server running on port ${PORT}`);
});
