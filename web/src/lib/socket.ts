import { verifyToken } from './auth';

import { Server as SocketIOServer } from 'socket.io';
import type { NextApiResponse } from 'next';

// Socket.IO events:
// Client emits: join-team, send-message, typing, stop-typing
// Server emits: new-message, user-typing, user-stop-typing, user-online, user-offline

let io: SocketIOServer | null = null;

export function getSocketIO() {
  return io;
}

export function initSocketIO(server: any) {
  if (!io) {
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    const onlineUsers = new Map<string, string>(); // socketId -> userId

    io.on('connection', (socket) => {
  // Authenticate socket using JWT passed in query token
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  const user = token ? verifyToken(String(token)) : null;
  if (!user) {
    console.warn('Socket connection rejected: invalid or missing JWT');
    socket.disconnect(true);
    return;
  }
      console.log(`Socket connected: ${socket.id}`);

      // User joins their team room
      socket.on('join-team', (teamId: string, userId: string) => {
        socket.join(`team:${teamId}`);
        onlineUsers.set(socket.id, userId);
        // Notify others in the team that this user is online
        socket.to(`team:${teamId}`).emit('user-online', { userId });
      });

      // Handle new messages
      socket.on('send-message', (data: { teamId: string; content: string; sender: any }) => {
        const { teamId, content, sender } = data;
        const message = {
          id: Date.now().toString(),
          content,
          sender,
          teamId,
          createdAt: new Date().toISOString(),
        };
        // Broadcast to all users in the team room
        io!.to(`team:${teamId}`).emit('new-message', message);
      });

      // Handle typing indicators
      socket.on('typing', (data: { teamId: string; userId: string; userName: string }) => {
        socket.to(`team:${data.teamId}`).emit('user-typing', {
          userId: data.userId,
          userName: data.userName,
        });
      });

      socket.on('stop-typing', (data: { teamId: string; userId: string }) => {
        socket.to(`team:${data.teamId}`).emit('user-stop-typing', { userId: data.userId });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const userId = onlineUsers.get(socket.id);
        if (userId) {
          // Broadcast to all rooms this socket was part of
          socket.rooms.forEach((room) => {
            if (room.startsWith('team:')) {
              socket.to(room).emit('user-offline', { userId });
            }
          });
          onlineUsers.delete(socket.id);
        }
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }
  return io;
}
