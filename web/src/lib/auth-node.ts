// Node.js-only auth utilities (bcrypt, jwt) — never import in client components

import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('JWT_SECRET not set – using insecure fallback for development');
    JWT_SECRET = 'insecure_development_fallback_secret_key_12345';
  } else {
    throw new Error('JWT_SECRET environment variable is required');
  }
}

export const hashPassword = async (password: string) => {
  const rounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  return await bcrypt.hash(password, rounds);
};

export const comparePasswords = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const signToken = (payload: object, expiresIn: SignOptions["expiresIn"] = '1d') => {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET as string);
  } catch (error) {
    return null;
  }
};
