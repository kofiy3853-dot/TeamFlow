# Debugging Real-Time Features

## Step-by-Step Debugging Guide

### Step 1: Verify Server is Running

```bash
npm run dev
```

Expected output:
```
> Ready on http://localhost:3000 [dev]
```

If you see `next dev` instead, you're using the wrong command. Use `npm run dev`.

### Step 2: Check Browser Console

Open DevTools (F12) and go to Console tab.

**Expected messages when page loads:**
```
Socket connected: socket_id_abc123
```

**If you see errors:**
- `Failed to connect to real-time service` → Socket.io server not running
- `Invalid token` → JWT token issue (should be allowed in dev)
- `CORS error` → Check `NEXT_PUBLIC_APP_URL` in `.env.local`

### Step 3: Enable Debug Logging

In browser console, run:
```javascript
localStorage.debug = 'socket.io-client:*'
```

Then refresh the page. You'll see detailed Socket.io logs.

### Step 4: Test Socket.io Connection

In browser console:
```javascript
// Check if socket is connected
console.log('Connected:', socket?.connected)

// Check socket ID
console.log('Socket ID:', socket?.id)

// Check joined rooms
console.log('Rooms:', socket?.rooms)

// Manually emit an event
socket?.emit('send-message', {
  teamId: 'general',
  content: 'Test message',
  sender: { id: 'user1', fullname: 'Test User' }
})
```

### Step 5: Check Server Logs

Look at the terminal where you ran `npm run dev`.

**Expected logs:**
```
[Socket.IO] Connected: socket_id_abc123
[Socket.IO] Disconnected: socket_id_abc123
```

**If you see errors:**
- Check MongoDB connection
- Check JWT_SECRET in `.env.local`
- Check for port conflicts

### Step 6: Test Message Flow

1. Open `/chat` page
2. Type a message: "Hello"
3. Press Enter
4. Check browser console for:
   ```
   New message received: {id: "...", content: "Hello", ...}
   ```

### Step 7: Test Typing Indicators

1. Click in the message input
2. Start typing
3. Check browser console for:
   ```
   User typing: Your Name
   ```
4. Stop typing
5. After 2 seconds, check for:
   ```
   User stopped typing: your_user_id
   ```

## Common Issues & Solutions

### Issue: "Socket not connecting"

**Symptom**: No "Socket connected" message in console

**Solutions**:
1. Check if `npm run dev` is running (not `next dev`)
2. Check if port 3000 is in use:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Mac/Linux
   lsof -i :3000
   ```
3. Check `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000`
4. Check server logs for Socket.io errors

### Issue: "Messages not appearing"

**Symptom**: Message sent but doesn't appear in chat

**Solutions**:
1. Check Socket.io is connected (see Step 4)
2. Check MongoDB connection:
   ```bash
   # Test MongoDB URI in .env.local
   # Try connecting with MongoDB Compass
   ```
3. Check API endpoint is working:
   ```bash
   curl -X POST http://localhost:3000/api/chat/messages \
     -H "Content-Type: application/json" \
     -d '{"teamId":"general","content":"test"}'
   ```
4. Check server logs for errors

### Issue: "Typing indicators not working"

**Symptom**: "User is typing..." doesn't appear

**Solutions**:
1. Check Socket.io is connected
2. Check `user.fullname` is available:
   ```javascript
   // In browser console
   console.log(useStore.getState().user)
   ```
3. Check typing event is being emitted:
   ```javascript
   // In browser console, enable debug logging
   localStorage.debug = 'socket.io-client:*'
   // Then type in the message input
   ```

### Issue: "CORS error"

**Symptom**: 
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions**:
1. Check `NEXT_PUBLIC_APP_URL` in `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
2. Restart the server after changing `.env.local`
3. Clear browser cache (Ctrl+Shift+Delete)

### Issue: "Port 3000 already in use"

**Symptom**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux - Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Issue: "MongoDB connection failed"

**Symptom**:
```
MongooseError: Cannot connect to MongoDB
```

**Solutions**:
1. Check `MONGODB_URI` in `.env.local`
2. Verify MongoDB Atlas cluster is running
3. Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for dev)
4. Test connection:
   ```bash
   # Use MongoDB Compass to test the URI
   ```

## Network Debugging

### Check WebSocket Connection

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Look for connection to `/api/socket`
5. Should show `101 Switching Protocols`

### Monitor Real-Time Messages

1. Open DevTools (F12)
2. Go to Network tab
3. Click on the WebSocket connection
4. Go to Messages tab
5. Send a message and see it in real-time

### Check Request/Response

1. Open DevTools (F12)
2. Go to Network tab
3. Send a message
4. Look for POST request to `/api/chat/messages`
5. Check Response tab for the saved message

## Performance Debugging

### Check Message Latency

In browser console:
```javascript
const start = Date.now()
socket?.emit('send-message', {
  teamId: 'general',
  content: 'Test',
  sender: { id: 'user1', fullname: 'Test' }
})
socket?.on('new-message', (msg) => {
  console.log('Latency:', Date.now() - start, 'ms')
})
```

### Check Memory Usage

1. Open DevTools (F12)
2. Go to Memory tab
3. Take a heap snapshot
4. Send many messages
5. Take another snapshot
6. Compare to check for memory leaks

### Check CPU Usage

1. Open DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Send messages
5. Stop recording
6. Analyze the timeline

## Database Debugging

### Check Saved Messages

```bash
# Connect to MongoDB
mongosh "mongodb+srv://flow:NHARNAH12@cluster0.kckospz.mongodb.net/teamflow"

# List messages
db.messages.find().pretty()

# Count messages
db.messages.countDocuments()

# Find messages in a team
db.messages.find({ teamId: 'general' }).pretty()
```

### Check User Data

```bash
# Find users
db.users.find().pretty()

# Find a specific user
db.users.findOne({ email: 'user@example.com' })
```

## Socket.io Debugging

### Check Socket.io Status

In browser console:
```javascript
// Check connection status
console.log('Connected:', socket?.connected)
console.log('Socket ID:', socket?.id)
console.log('Rooms:', Array.from(socket?.rooms || []))

// Check event listeners
console.log('Listeners:', socket?.eventNames())

// Manually test event
socket?.emit('join-team', 'general', 'user123')
```

### Enable Server-Side Debug Logs

In `server.js`, add:
```javascript
const io = new SocketIOServer(httpServer, {
  // ... other options
  debug: true,  // Enable debug logging
});
```

### Monitor Socket.io Events

In browser console:
```javascript
// Log all incoming events
socket?.onAny((event, ...args) => {
  console.log('Event:', event, 'Data:', args)
})

// Log all outgoing events
socket?.emitAny = function(event, ...args) {
  console.log('Emit:', event, 'Data:', args)
  return Socket.prototype.emit.apply(this, arguments)
}
```

## Checklist for Troubleshooting

- [ ] `npm run dev` is running (not `next dev`)
- [ ] Port 3000 is available
- [ ] `.env.local` has correct values
- [ ] MongoDB connection is working
- [ ] Browser console shows "Socket connected"
- [ ] Network tab shows WebSocket connection
- [ ] Server logs show Socket.io events
- [ ] Message appears in chat after sending
- [ ] Typing indicator appears while typing
- [ ] User presence updates when joining/leaving

## Getting Help

If you're still stuck:

1. **Check the logs**:
   - Browser console (F12)
   - Server terminal output
   - MongoDB logs

2. **Enable debug mode**:
   ```javascript
   localStorage.debug = 'socket.io-client:*'
   ```

3. **Check the code**:
   - `server.js` - Socket.io server setup
   - `src/app/chat/page.tsx` - Socket.io client
   - `src/app/api/chat/messages/route.ts` - Message API

4. **Verify environment**:
   - Node.js version: `node --version` (should be 18+)
   - npm version: `npm --version` (should be 9+)
   - MongoDB connection: Test with MongoDB Compass

5. **Try a fresh start**:
   ```bash
   # Kill the server
   # Clear node_modules
   rm -rf node_modules
   # Reinstall
   npm install
   # Start again
   npm run dev
   ```
