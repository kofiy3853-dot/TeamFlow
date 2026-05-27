import jwt from 'jsonwebtoken';

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('JWT_SECRET not set – using insecure fallback for development');
    JWT_SECRET = 'insecure_development_fallback_secret_key_12345';
  } else {
    throw new Error('JWT_SECRET environment variable is required');
  }
}

// Server-only functions are in auth.server.ts
// This file only exports client-safe functions

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
