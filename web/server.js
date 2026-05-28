const { createServer } = require('http');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

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
      origin: (origin, callback) => {
        const allowed = [
          'http://localhost:3000',
          'http://10.0.2.2:3000',
          process.env.NEXT_PUBLIC_APP_URL,
        ].filter(Boolean);
        if (!origin || allowed.includes(origin) || /https:\/\/.+\.ngrok(-free)?\.app/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling'],  // WebSocket not supported on Render free tier
  });

  // ── JWT Auth middleware ───────────────────────────────────────────────────
  const JWT_SECRET = process.env.JWT_SECRET || 'teamflow-dev-secret-key-change-in-production';

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      if (dev) return next();
      return next(new Error('Unauthorized'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch (err) {
      if (dev) return next();
      next(new Error('Invalid token'));
    }
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`);

    socket.on('join-team', (teamId, userId) => {
      socket.join(`team:${teamId}`);
      onlineUsers.set(socket.id, userId);
      socket.to(`team:${teamId}`).emit('user-online', { userId });
    });

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

    socket.on('typing', ({ teamId, userId, userName }) => {
      socket.to(`team:${teamId}`).emit('user-typing', { userId, userName });
    });

    socket.on('stop-typing', ({ teamId, userId }) => {
      socket.to(`team:${teamId}`).emit('user-stop-typing', { userId });
    });

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

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port} [${dev ? 'dev' : 'production'}]`);
  });
});
