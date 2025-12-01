import { db } from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');

export function createAccessToken(userId: number) {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function createRefreshToken(userId: number) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });
}

export function verifyRefreshJWT(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as any;
}

export async function registerUser(email: string, password: string, name?: string) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('EMAIL_IN_USE');
  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)').run(email, hash, name ?? null, now);
  const id = Number(result.lastInsertRowid);
  return { id, email, name };
}

export async function loginUser(email: string, password: string) {
  const row = db.prepare('SELECT id, password_hash, email, name FROM users WHERE email = ?').get(email);
  if (!row) throw new Error('INVALID_CREDENTIALS');
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');
  return { id: row.id, email: row.email, name: row.name };
}

export function saveRefreshToken(userId: number, token: string, expiresAtIso: string) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO refresh_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(token, userId, expiresAtIso, now);
}

export function deleteRefreshToken(token: string) {
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
}

export function findRefreshToken(token: string) {
  return db.prepare('SELECT id, token, user_id, expires_at FROM refresh_tokens WHERE token = ?').get(token);
}
