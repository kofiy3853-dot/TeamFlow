import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for custom server (server.js) + Socket.IO
  serverExternalPackages: ['socket.io', 'jsonwebtoken', 'bcrypt'],
};

export default nextConfig;
