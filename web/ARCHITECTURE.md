# TeamFlow Real-Time Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Components                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  ChatPage Component                                │  │  │
│  │  │  - Displays messages                               │  │  │
│  │  │  - Shows typing indicators                         │  │  │
│  │  │  - Handles user input                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Zustand Store (useStore)                          │  │  │
│  │  │  - User data                                       │  │  │
│  │  │  - Theme settings                                  │  │  │
│  │  │  - Global state                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Socket.io Client (socket.io-client)             │  │
│  │                                                          │  │
│  │  Events Emitted:                                         │  │
│  │  - join-team(teamId, userId)                            │  │
│  │  - send-message({teamId, content, sender})              │  │
│  │  - typing({teamId, userId, userName})                   │  │
│  │  - stop-typing({teamId, userId})                        │  │
│  │                                                          │  │
│  │  Events Received:                                        │  │
│  │  - new-message(message)                                 │  │
│  │  - user-typing({userId, userName})                      │  │
│  │  - user-stop-typing({userId})                           │  │
│  │  - user-online({userId})                                │  │
│  │  - user-offline({userId})                               │  │
│  │  - payment-success(paymentData)                          │  │
│  │                                                          │  │
│  │  Connection: WebSocket to /api/socket                   │  │
│  │  Auth: JWT token from localStorage                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ WebSocket
                    (Real-time bidirectional)
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js)                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         server.js (Custom HTTP Server)                  │  │
│  │                                                          │  │
│  │  - HTTP Server (port 3000)                              │  │
│  │  - Next.js Request Handler                              │  │
│  │  - Socket.io Server Integration                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Socket.io Server (socket.io)                    │  │
│  │                                                          │  │
│  │  Connection Handler:                                     │  │
│  │  - Authenticate with JWT                                │  │
│  │  - Track online users                                   │  │
│  │  - Manage team rooms                                    │  │
│  │                                                          │  │
│  │  Event Handlers:                                         │  │
│  │  - join-team → Add to room, emit user-online            │  │
│  │  - send-message → Broadcast to team room                │  │
│  │  - typing → Broadcast to team room                      │  │
│  │  - disconnect → Emit user-offline                       │  │
│  │                                                          │  │
│  │  Rooms Structure:                                        │  │
│  │  - team:general                                          │  │
│  │  - team:design                                           │  │
│  │  - team:engineering                                      │  │
│  │  - etc.                                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Next.js API Routes                              │  │
│  │                                                          │  │
│  │  POST /api/chat/messages                                │  │
│  │  - Save message to MongoDB                              │  │
│  │  - Return saved message                                 │  │
│  │  - Emit via Socket.io                                   │  │
│  │                                                          │  │
│  │  GET /api/chat/messages                                 │  │
│  │  - Fetch message history                                │  │
│  │  - Pagination support                                   │  │
│  │  - Filter by teamId                                     │  │
│  │                                                          │  │
│  │  POST /api/auth/login                                   │  │
│  │  - Authenticate user                                    │  │
│  │  - Return JWT token                                     │  │
│  │                                                          │  │
│  │  POST /api/payment/initialize                           │  │
│  │  - Initialize Paystack payment                          │  │
│  │                                                          │  │
│  │  POST /api/payment/verify                               │  │
│  │  - Verify payment                                       │  │
│  │  - Emit payment-success via Socket.io                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
                    (Persistent data operations)
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                         │
│                                                                 │
│  Collections:                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  users                                                   │  │
│  │  - _id, email, fullname, password, avatar, createdAt    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  teams                                                   │  │
│  │  - _id, name, description, members, createdAt           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  messages                                                │  │
│  │  - _id, teamId, content, sender, createdAt              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  tasks                                                   │  │
│  │  - _id, teamId, title, description, assignee, status    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  payments                                                │  │
│  │  - _id, userId, amount, reference, status, createdAt    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Message Flow Diagram

### Sending a Message

```
User Types Message
        ↓
User Presses Enter
        ↓
ChatPage.handleSend()
        ↓
    ┌───┴───┐
    ↓       ↓
API Call  Socket.io Emit
    ↓       ↓
    └───┬───┘
        ↓
    Server Receives
        ↓
    ┌───┴───┐
    ↓       ↓
Save to DB  Broadcast to Team
    ↓       ↓
    └───┬───┘
        ↓
All Clients Receive
        ↓
Message Appears in Chat
```

### Real-Time Updates

```
Client A                    Server                    Client B
   │                          │                          │
   │─── send-message ────────→│                          │
   │                          │                          │
   │                          │─── new-message ────────→│
   │                          │                          │
   │←─── new-message ─────────│                          │
   │                          │                          │
   │                          │←─── send-message ───────│
   │                          │                          │
   │←─── new-message ─────────│                          │
   │                          │                          │
   │                          │─── new-message ────────→│
```

## Data Flow

### Authentication Flow

```
1. User enters credentials
   ↓
2. POST /api/auth/login
   ↓
3. Server verifies password (bcrypt)
   ↓
4. Server generates JWT token
   ↓
5. Token stored in localStorage
   ↓
6. Token sent with Socket.io connection
   ↓
7. Socket.io verifies JWT
   ↓
8. Connection established
```

### Message Persistence

```
1. User sends message
   ↓
2. POST /api/chat/messages
   ↓
3. Server saves to MongoDB
   ↓
4. Server broadcasts via Socket.io
   ↓
5. All clients receive in real-time
   ↓
6. Message displayed in UI
   ↓
7. GET /api/chat/messages (on page load)
   ↓
8. Fetch message history from MongoDB
   ↓
9. Display in chat
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Next.js 16** - React framework with API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** (via Next.js) - HTTP server
- **Socket.io** - WebSocket server
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Paystack** - Payment processing

### Infrastructure
- **MongoDB Atlas** - Cloud database
- **Vercel** (recommended) - Deployment
- **Environment Variables** - Configuration

## Real-Time Event Types

### Chat Events
- `send-message` - User sends a message
- `new-message` - New message broadcast
- `typing` - User is typing
- `user-typing` - Typing indicator broadcast
- `stop-typing` - User stopped typing
- `user-stop-typing` - Stop typing broadcast

### Presence Events
- `join-team` - User joins a team
- `user-online` - User came online
- `user-offline` - User went offline

### Payment Events
- `payment-success` - Payment confirmed
- `payment-failed` - Payment failed

## Performance Considerations

### Optimization Strategies
1. **Message Pagination** - Load 50 messages at a time
2. **Typing Debounce** - Debounce typing events to 2 seconds
3. **Room-Based Broadcasting** - Only broadcast to team members
4. **Connection Pooling** - Socket.io handles automatically
5. **Message Caching** - Cache recent messages in memory

### Scalability
- **Horizontal Scaling** - Use Redis adapter for multiple servers
- **Load Balancing** - Distribute connections across servers
- **Database Indexing** - Index teamId and createdAt for queries
- **Connection Limits** - Monitor concurrent connections

## Security Architecture

### Authentication
- JWT tokens for API and Socket.io
- Tokens stored in localStorage
- Tokens validated on every request
- Tokens expire after 24 hours

### Authorization
- Users can only access their teams
- Messages only visible to team members
- Admin-only operations protected

### Data Protection
- Passwords hashed with bcrypt
- HTTPS/WSS for production
- CORS configured to app URL
- Rate limiting recommended

### Validation
- Input validation on all endpoints
- Message content sanitized
- User data validated before saving

## Deployment Architecture

### Development
```
npm run dev
  ↓
server.js (Custom HTTP + Socket.io)
  ↓
localhost:3000
```

### Production
```
npm run build
npm start
  ↓
server.js (Custom HTTP + Socket.io)
  ↓
Production Server (Vercel, AWS, etc.)
  ↓
MongoDB Atlas
```

### With Load Balancer
```
Load Balancer
  ↓
  ├─ Server 1 (Socket.io + Redis Adapter)
  ├─ Server 2 (Socket.io + Redis Adapter)
  └─ Server 3 (Socket.io + Redis Adapter)
  ↓
Redis (Session Store)
  ↓
MongoDB Atlas
```

## File Structure

```
web/
├── server.js                          # Custom HTTP + Socket.io server
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home page
│   │   ├── chat/
│   │   │   └── page.tsx               # Chat page with Socket.io
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── register/route.ts
│   │   │   ├── chat/
│   │   │   │   └── messages/route.ts
│   │   │   └── payment/
│   │   │       ├── initialize/route.ts
│   │   │       └── verify/route.ts
│   │   └── ...
│   ├── components/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── auth.ts                    # JWT utilities
│   │   ├── mongodb.ts                 # MongoDB connection
│   │   ├── socket.ts                  # Socket.io utilities
│   │   └── paystack.ts                # Paystack integration
│   ├── models/
│   │   ├── User.ts
│   │   ├── Team.ts
│   │   ├── Message.ts
│   │   ├── Task.ts
│   │   └── Payment.ts
│   └── store/
│       └── useStore.ts                # Zustand store
├── .env.local                         # Environment variables
├── package.json
└── tsconfig.json
```

## Key Concepts

### Rooms
- Each team has a room: `team:teamId`
- Users join rooms when they select a team
- Messages broadcast to all users in the room

### Events
- Client emits events to server
- Server broadcasts to room
- All clients in room receive event

### State Management
- Zustand for global state (user, theme)
- React hooks for component state
- Socket.io for real-time updates

### Authentication
- JWT tokens for stateless auth
- Tokens validated on every request
- Tokens sent with Socket.io connection

## Monitoring & Debugging

### Logs
- Browser console (F12)
- Server terminal output
- MongoDB logs

### Metrics
- Connection count
- Message latency
- Error rate
- Database query time

### Tools
- DevTools Network tab
- Socket.io debug mode
- MongoDB Compass
- Postman for API testing
