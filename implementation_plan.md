# Goal Description

Build the **TeamFlow** full-stack teamwork subscription platform from scratch within the existing `TeamFlow` monorepo. This will involve creating a new Next.js 15 application alongside the existing Android app, integrating MongoDB, configuring JWT authentication, implementing a Mobile Money payment flow, and building real-time features using Socket.IO.

## User Review Required

> [!WARNING]
> **Monorepo Structure**: The new Next.js application will be placed in a `web/` subdirectory at the root of the `TeamFlow` folder to separate it cleanly from the Android `app/` folder.
> **Database Choice**: We will be using MongoDB with Mongoose, which requires a MongoDB URI.

## Open Questions

> [!IMPORTANT]
> 1. **Payment Provider**: Do you prefer to use Paystack or Hubtel for the Mobile Money implementation? We will need test API keys for whichever you choose.
> 2. **File Storage**: You requested Cloudinary or UploadThing for file uploads. Do you have a preference between the two?
> 3. **State Management**: Would you prefer Zustand or Redux Toolkit for managing frontend state? (Zustand is lighter and recommended for Next.js, but Redux is more robust for massive applications).

## Proposed Changes

### Phase 1: Foundation & Setup

- Create `web/` directory using Next.js 15 (App Router), TypeScript, and TailwindCSS.
- Setup scalable folder architecture (`app`, `components`, `hooks`, `services`, `lib`, `models`, `api`, etc.).
- Install and configure Mongoose to connect to MongoDB Atlas.

### Phase 2: Database Schemas

- Create Mongoose models for the required entities:
  - `User` (with subscription status, roles, etc.)
  - `Team`
  - `Message`
  - `Task`
  - `Payment`

### Phase 3: Authentication & Security

- Implement custom JWT-based authentication flow (avoiding heavy external libraries if custom strict flow is preferred, or leveraging NextAuth/Auth.js tailored for JWT).
- Setup bcrypt for password hashing.
- Build middleware for protecting routes and handling role-based access.
- Implement Zod validation, Helmet.js (if using custom Express backend, or Next.js headers config), and rate limiting.

### Phase 4: Payment & Subscription Integration

- Build the payment initialization and verification endpoints.
- Construct the webhook handler to listen for mobile money success events.
- Build the subscription management logic (Active, Pending, Expired, Cancelled states) and grace period handling.

### Phase 5: UI & Core Features

- Build modern, responsive dashboards using Framer Motion, Tailwind CSS, and a clean UI system.
- Implement sidebar navigation and theming (Light/Dark mode).
- Build the Team Management and Task Management (Kanban-style) interfaces.

### Phase 6: Real-time Communication (Socket.IO)

- Setup a custom server to handle Socket.IO alongside Next.js (or configure a separate WebSocket microservice if preferred for scalability).
- Implement room-based chat, presence tracking, and typing indicators.

## Verification Plan

### Automated Tests
- Build out core unit tests for critical utility functions (e.g., webhook signature verification).

### Manual Verification
- We will manually test the registration and Mobile Money payment flow using test cards/numbers provided by Paystack/Hubtel.
- Verify real-time messaging by opening two browser windows side-by-side.
- Ensure the app runs properly using `npm run dev` and communicates with the remote MongoDB instance.
