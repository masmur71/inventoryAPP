import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js'; 


// payload saved in token
export interface TokenPayload {
  userId: string;
  role: string;
}

export const signAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: '15m' }); 
};

export const signRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '7d' }); 
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};