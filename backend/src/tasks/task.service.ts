import { db } from '../db';

export type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  user_id: number;
  created_at: string;
  updated_at: string;
};

export function createTaskDB(userId: number, title: string, description?: string, status = 'PENDING') {
  const now = new Date().toISOString();
  const res = db.prepare('INSERT INTO tasks (title, description, status, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(title, description ?? null, status, userId, now, now);
  const id = Number(res.lastInsertRowid);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow;
}

export function getTaskDB(id: number) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
}

export function listTasksDB(userId: number, page = 1, limit = 10, status?: string, q?: string) {
  const offset = (page - 1) * limit;
  let where = 'WHERE user_id = ?';
  const params: any[] = [userId];
  if (status) { where += ' AND status = ?'; params.push(status); }
  if (q) { where += ' AND title LIKE ?'; params.push(`%${q}%`); }
  const total = db.prepare(`SELECT COUNT(*) as count FROM tasks ${where}`).get(...params).count as number;
  const rows = db.prepare(`SELECT * FROM tasks ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as TaskRow[];
  return { total, page, limit, pages: Math.ceil(total / limit), tasks: rows };
}

export function updateTaskDB(id: number, userId: number, updates: { title?: string; description?: string; status?: string }) {
  const task = getTaskDB(id);
  if (!task || task.user_id !== userId) return null;
  const title = updates.title ?? task.title;
  const description = updates.description ?? task.description;
  const status = updates.status ?? task.status;
  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = ? WHERE id = ?').run(title, description ?? null, status, now, id);
  return getTaskDB(id);
}

export function deleteTaskDB(id: number, userId: number) {
  const task = getTaskDB(id);
  if (!task || task.user_id !== userId) return false;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return true;
}

export function toggleTaskDB(id: number, userId: number) {
  const task = getTaskDB(id);
  if (!task || task.user_id !== userId) return null;
  const newStatus = task.status === 'DONE' ? 'PENDING' : 'DONE';
  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);
  return getTaskDB(id);
}
