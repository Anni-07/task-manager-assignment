import { Request, Response } from 'express';
import { registerUser, loginUser, createAccessToken, createRefreshToken, saveRefreshToken, verifyRefreshJWT, findRefreshToken, deleteRefreshToken } from './auth.service';
import { z } from 'zod';

const REFRESH_COOKIE_NAME = 'jid';

export async function register(req: Request, res: Response) {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() });
    const { email, password, name } = schema.parse(req.body);
    const user = await registerUser(email, password, name);
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    const decoded: any = verifyRefreshJWT(refreshToken);
    saveRefreshToken(user.id, refreshToken, new Date(decoded.exp * 1000).toISOString());
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7'),
    });
    res.json({ accessToken, user });
  } catch (err: any) {
    if (err.message === 'EMAIL_IN_USE') return res.status(400).json({ message: 'Email already in use' });
    if (err?.issues) return res.status(400).json({ message: 'Validation error', details: err.issues });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
    const { email, password } = schema.parse(req.body);
    const user = await loginUser(email, password);
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    const decoded: any = verifyRefreshJWT(refreshToken);
    saveRefreshToken(user.id, refreshToken, new Date(decoded.exp * 1000).toISOString());
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7'),
    });
    res.json({ accessToken, user });
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') return res.status(400).json({ message: 'Invalid credentials' });
    if (err?.issues) return res.status(400).json({ message: 'Validation error', details: err.issues });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    let payload: any;
    try {
      payload = verifyRefreshJWT(token);
    } catch (e) {
      deleteRefreshToken(token);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const record = findRefreshToken(token);
    if (!record) return res.status(401).json({ message: 'Refresh token not found or revoked' });
    if (new Date(record.expires_at) <= new Date()) {
      deleteRefreshToken(token);
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    const accessToken = createAccessToken(payload.userId);
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (token) deleteRefreshToken(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth/refresh' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
