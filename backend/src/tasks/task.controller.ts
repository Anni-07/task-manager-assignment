import { Request, Response } from 'express';
import * as svc from './task.service';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const schema = z.object({ title: z.string().min(1), description: z.string().optional(), status: z.enum(['PENDING','IN_PROGRESS','DONE']).optional() });
    const data = schema.parse(req.body);
    const userId = req.userId!;
    const task = svc.createTaskDB(userId, data.title, data.description, data.status);
    res.status(201).json(task);
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ message: 'Validation error', details: err.issues });
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
}

export async function listTasks(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 10));
    const status = (req.query.status as string) || undefined;
    const q = (req.query.q as string) || undefined;
    const result = svc.listTasksDB(userId, page, limit, status, q);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

export async function getTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);
    const task = svc.getTaskDB(id);
    if (!task || task.user_id !== userId) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);
    const schema = z.object({ title: z.string().optional(), description: z.string().optional(), status: z.enum(['PENDING','IN_PROGRESS','DONE']).optional() });
    const updates = schema.parse(req.body);
    const updated = svc.updateTaskDB(id, userId, updates);
    if (!updated) return res.status(404).json({ message: 'Not found or not owner' });
    res.json(updated);
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ message: 'Validation error', details: err.issues });
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);
    const ok = svc.deleteTaskDB(id, userId);
    if (!ok) return res.status(404).json({ message: 'Not found or not owner' });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

export async function toggleTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);
    const updated = svc.toggleTaskDB(id, userId);
    if (!updated) return res.status(404).json({ message: 'Not found or not owner' });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}
