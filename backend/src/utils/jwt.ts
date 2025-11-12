import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables as early as possible
dotenv.config();

// Ensure JWT_SECRET is a string and throw an error if not defined
const JWT_SECRET: string = process.env.JWT_SECRET ?? throwError('JWT_SECRET is not defined');
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    id: user.user_id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions); // Explicitly cast to SignOptions
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Helper function to throw error for missing environment variables
function throwError(message: string): never {
  throw new Error(message);
}