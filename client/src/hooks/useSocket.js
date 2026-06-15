import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';

export default function useSocket(boardId, user, handlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!boardId) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Join this board's room
    socket.emit('join-board', { boardId, user });

    // Register event handlers
    if (handlers.onStrokeReceived)
      socket.on('stroke-received',   handlers.onStrokeReceived);
    if (handlers.onShapeReceived)
      socket.on('shape-received',    handlers.onShapeReceived);
    if (handlers.onCursorUpdated)
      socket.on('cursor-updated',    handlers.onCursorUpdated);
    if (handlers.onUsersUpdated)
      socket.on('users-updated',     handlers.onUsersUpdated);
    if (handlers.onBoardCleared)
      socket.on('board-cleared',     handlers.onBoardCleared);
    if (handlers.onUndoReceived)
      socket.on('undo-received',         handlers.onUndoReceived);
    if (handlers.onChatReceived)
      socket.on('chat-message-received', handlers.onChatReceived);

    return () => {
      socket.off('stroke-received');
      socket.off('shape-received');
      socket.off('cursor-updated');
      socket.off('users-updated');
      socket.off('board-cleared');
      socket.off('undo-received');
      socket.off('chat-message-received');
    };
  }, [boardId]);

  const emitStroke = useCallback((stroke) => {
    socketRef.current?.emit('draw-stroke', { boardId, stroke });
  }, [boardId]);

  const emitShape = useCallback((shape) => {
    socketRef.current?.emit('shape-added', { boardId, shape });
  }, [boardId]);

  const emitCursor = useCallback((x, y) => {
    socketRef.current?.emit('cursor-move', { boardId, x, y });
  }, [boardId]);

  const emitClear = useCallback(() => {
    socketRef.current?.emit('board-clear', { boardId });
  }, [boardId]);

  const emitUndo = useCallback(() => {
    socketRef.current?.emit('undo', { boardId });
  }, [boardId]);

  const emitChatMessage = useCallback((message) => {
    socketRef.current?.emit('chat-message', { boardId, message });
  }, [boardId]);

  return { emitStroke, emitShape, emitCursor, emitClear, emitUndo, emitChatMessage };
}
