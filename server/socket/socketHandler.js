/**
 * Socket.IO handler — real-time collaboration engine
 * Manages board rooms, cursor tracking, stroke sync, and conflict resolution
 */

const socketHandler = (io) => {

  // Track active users per board: boardId → Map(socketId → userInfo)
  const boardUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`⬡ Socket connected: ${socket.id}`);

    // ── JOIN BOARD ─────────────────────────────────────────────
    socket.on('join-board', ({ boardId, user }) => {
      socket.join(boardId);

      if (!boardUsers.has(boardId)) boardUsers.set(boardId, new Map());
      boardUsers.get(boardId).set(socket.id, {
        id:     socket.id,
        userId: user?._id || socket.id,
        name:   user?.name || 'Anonymous',
        color:  user?.color || randomColor(),
        cursor: { x: 0, y: 0 },
      });

      // Tell everyone in room about new user
      const users = [...boardUsers.get(boardId).values()];
      io.to(boardId).emit('users-updated', { users });

      console.log(`  ↳ ${user?.name || 'Guest'} joined board ${boardId}`);
    });

    // ── CURSOR MOVE ────────────────────────────────────────────
    socket.on('cursor-move', ({ boardId, x, y }) => {
      const roomUsers = boardUsers.get(boardId);
      if (!roomUsers) return;

      const userInfo = roomUsers.get(socket.id);
      if (userInfo) {
        userInfo.cursor = { x, y };
        // Broadcast to everyone else in the room
        socket.to(boardId).emit('cursor-updated', {
          socketId: socket.id,
          name:     userInfo.name,
          color:    userInfo.color,
          x, y,
        });
      }
    });

    // ── DRAW STROKE ────────────────────────────────────────────
    socket.on('draw-stroke', ({ boardId, stroke }) => {
      // Relay stroke to all other users in the room
      socket.to(boardId).emit('stroke-received', { stroke, from: socket.id });
    });

    // ── SHAPE ADDED ────────────────────────────────────────────
    socket.on('shape-added', ({ boardId, shape }) => {
      socket.to(boardId).emit('shape-received', { shape, from: socket.id });
    });

    // ── UNDO ──────────────────────────────────────────────────
    socket.on('undo', ({ boardId }) => {
      socket.to(boardId).emit('undo-received', { from: socket.id });
    });

    // ── BOARD CLEARED ─────────────────────────────────────────
    socket.on('board-clear', ({ boardId }) => {
      socket.to(boardId).emit('board-cleared', { by: socket.id });
    });

    // ── OBJECT LOCK (prevent edit conflicts) ──────────────────
    socket.on('lock-element', ({ boardId, elementId }) => {
      socket.to(boardId).emit('element-locked', { elementId, by: socket.id });
    });

    socket.on('unlock-element', ({ boardId, elementId }) => {
      socket.to(boardId).emit('element-unlocked', { elementId });
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Remove user from all boards they were in
      boardUsers.forEach((users, boardId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          const remaining = [...users.values()];
          io.to(boardId).emit('users-updated', { users: remaining });
          io.to(boardId).emit('user-left', { socketId: socket.id });
        }
      });
      console.log(`⬡ Socket disconnected: ${socket.id}`);
    });
  });
};

function randomColor() {
  const colors = ['#7c6ef5','#34d399','#f472b6','#60a5fa','#fbbf24','#fb923c'];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = socketHandler;
