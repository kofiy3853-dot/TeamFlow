# Real-Time Features Setup Guide

## Overview

TeamFlow uses **Socket.io** for real-time communication. The application requires a custom Node.js server to handle WebSocket connections alongside Next.js.

## How It Works

1. **Custom Server** (`server.js`): Runs an HTTP server with Socket.io integrated
2. **Socket.io Server**: Listens on `/api/socket` path for WebSocket connections
3. **Socket.io Client**: Connects from the browser to receive real-time updates
4. **Message Broadcasting**: Messages are broadcast to all users in a team room

## Running the Application

### Development Mode

```bash
cd web
npm install
npm run dev
```

This runs `node server.js` which:
- Starts the Next.js app
- Initializes Socket.io on the same HTTP server
- Allows WebSocket connections on `/api/socket`

### Production Mode

```bash
cd web
npm run build
npm start
```

This runs the production build with Socket.io enabled.

## Real-Time Features

### 1. Chat Messages
- **Event**: `send-message` (client → server)
- **Broadcast**: `new-message` (server → all clients in team)
- Messages are saved to MongoDB and broadcast in real-time

### 2. Typing Indicators
- **Event**: `typing` (client → server)
- **Broadcast**: `user-typing` (server → team)
- Shows who is currently typing

### 3. User Presence
- **Event**: `join-team` (client → server)
- **Broadcast**: `user-online` / `user-offline` (server → team)
- Tracks who is online in each team

### 4. Payment Notifications
- **Event**: `payment-success` (server → all clients)
- Real-time payment confirmation notifications

## Architecture

```
Browser (Socket.io Client)
    ↓
    ↓ WebSocket Connection
    ↓
server.js (HTTP + Socket.io Server)
    ↓
    ├─ Next.js App Router
    ├─ Socket.io Event Handlers
    └─ MongoDB (Message Storage)
```

## Troubleshooting

### Socket.io Not Connecting

1. **Check if server is running**:
   ```bash
   npm run dev
   ```
   Should show: `> Ready on http://localhost:3000 [dev]`

2. **Check browser console** for connection errors:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for Socket.io connection messages

3. **Verify environment variables**:
   - Check `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000`

4. **Check network tab**:
   - Open DevTools → Network tab
   - Look for WebSocket connections to `/api/socket`
   - Should see `101 Switching Protocols`

### Messages Not Appearing

1. **Check Socket.io connection**: See above
2. **Check MongoDB connection**: Verify `MONGODB_URI` in `.env.local`
3. **Check browser console** for errors
4. **Check server logs** for Socket.io events

### Typing Indicators Not Working

1. Ensure Socket.io is connected
2. Check that `user.fullname` is available in the store
3. Verify the `typing` event is being emitted

## Environment Variables

Required in `.env.local`:

```env
# MongoDB Connection
MONGODB_URI="mongodb+srv://..."

# JWT Secret
JWT_SECRET="your-secret-key"

# App URL (for Socket.io CORS)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Paystack (for payments)
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
```

## Socket.io Events Reference

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join-team` | `teamId, userId` | Join a team room |
| `send-message` | `{teamId, content, sender}` | Send a message |
| `typing` | `{teamId, userId, userName}` | User is typing |
| `stop-typing` | `{teamId, userId}` | User stopped typing |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `new-message` | `{id, content, sender, teamId, createdAt}` | New message received |
| `user-typing` | `{userId, userName}` | User is typing |
| `user-stop-typing` | `{userId}` | User stopped typing |
| `user-online` | `{userId}` | User came online |
| `user-offline` | `{userId}` | User went offline |
| `payment-success` | `{reference, amount, ...}` | Payment confirmed |

## Performance Tips

1. **Message Pagination**: Fetch messages in batches (50 at a time)
2. **Typing Debounce**: Typing events are debounced to 2 seconds
3. **Room-Based Broadcasting**: Messages only broadcast to team members
4. **Connection Pooling**: Socket.io handles connection pooling automatically

## Security Considerations

1. **JWT Authentication**: Socket.io validates JWT tokens (optional in dev)
2. **CORS**: Configured to only accept connections from `NEXT_PUBLIC_APP_URL`
3. **Message Validation**: Validate message content before broadcasting
4. **Rate Limiting**: Consider adding rate limiting for production

## Deployment

When deploying to production:

1. Update `NEXT_PUBLIC_APP_URL` to your domain
2. Set `NODE_ENV=production`
3. Ensure JWT_SECRET is a strong random string
4. Configure MongoDB for production
5. Enable HTTPS (Socket.io works with WSS)
6. Consider using a load balancer with Socket.io adapter (Redis)

## Common Issues

### "Socket.io not connecting"
- Ensure `npm run dev` is running (not `npm run build && npm start`)
- Check that port 3000 is not in use
- Verify CORS settings in `.env.local`

### "Messages not saving"
- Check MongoDB connection string
- Verify database permissions
- Check server logs for errors

### "Typing indicators not showing"
- Ensure Socket.io is connected
- Check that user data is loaded in Zustand store
- Verify `user.fullname` is available

### "Real-time updates lag"
- Check network latency
- Verify Socket.io is using WebSocket (not polling)
- Check server CPU/memory usage
