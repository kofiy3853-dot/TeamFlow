import { createServer } from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';


const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const baseUrl = `http://${req.headers.host || 'localhost'}`;
    const urlObj = new URL(req.url, baseUrl);
    const parsedUrl = {
      pathname: urlObj.pathname,
      query: Object.fromEntries(urlObj.searchParams),
      path: req.url,
      href: urlObj.href,
    };
    handle(req, res, parsedUrl);
  });

  // ─── Socket.IO ────────────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      // Accept localhost (web dev), Android emulator (10.0.2.2), and any ngrok tunnel
      origin: (origin, callback) => {
        const allowed = [
          'http://localhost:3000',
          'http://10.0.2.2:3000',
          process.env.NEXT_PUBLIC_APP_URL,
        ].filter(Boolean);
        // Also allow ngrok tunnels (https://*.ngrok-free.app, https://*.ngrok.io)
        if (!origin || allowed.includes(origin) || /https:\/\/.+\.ngrok(-free)?\.app/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── JWT Auth middleware ───────────────────────────────────────────────────
  const JWT_SECRET = process.env.JWT_SECRET || 'teamflow-dev-secret-key-change-in-production';

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    // In development, allow unauthenticated connections
    if (!token) {
      if (dev) {
        console.log('[Socket.IO] Allowing unauthenticated connection in dev mode');
        return next();
      }
      return next(new Error('Unauthorized'));
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch (err) {
      console.error('[Socket.IO] Token verification failed:', err.message);
      // In dev, still allow the connection
      if (dev) {
        console.log('[Socket.IO] Allowing connection despite token error in dev mode');
        return next();
      }
      next(new Error('Invalid token'));
    }
  });

  // ── Online users tracking ─────────────────────────────────────────────────
  const onlineUsers = new Map(); // socketId -> userId

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`);

    // User joins their team room
    socket.on('join-team', (teamId, userId) => {
      socket.join(`team:${teamId}`);
      onlineUsers.set(socket.id, userId);
      socket.to(`team:${teamId}`).emit('user-online', { userId });
    });

    // Handle new chat messages
    socket.on('send-message', ({ teamId, content, sender }) => {
      const message = {
        id: Date.now().toString(),
        content,
        sender,
        teamId,
        createdAt: new Date().toISOString(),
      };
      io.to(`team:${teamId}`).emit('new-message', message);
    });

    // Typing indicators
    socket.on('typing', ({ teamId, userId, userName }) => {
      socket.to(`team:${teamId}`).emit('user-typing', { userId, userName });
    });

    socket.on('stop-typing', ({ teamId, userId, userName }) => {
      socket.to(`team:${teamId}`).emit('user-stop-typing', { userId, userName });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        socket.rooms.forEach((room) => {
          if (room.startsWith('team:')) {
            socket.to(room).emit('user-offline', { userId });
          }
        });
        onlineUsers.delete(socket.id);
      }
      console.log(`[Socket.IO] Disconnected: ${socket.id}`);
    });
  });

  // ── Payment notifications ───────────────────────────────────────────────────
  // Emit real-time payment success events to connected clients
  // This would be triggered from the Paystack webhook handler
  // For now, we'll add a function that can be called from elsewhere
  io.paymentSuccess = (paymentData) => {
    console.log(`Emitting payment success event for reference: ${paymentData.reference}`);
    io.emit('payment-success', paymentData);
  };
  // ─────────────────────────────────────────────────────────────────────────

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [${dev ? 'dev' : 'production'}]`);
  });
});
