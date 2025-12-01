import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './auth/auth.routes';
import taskRoutes from './tasks/task.routes';
import { requireAuth } from './middleware/auth.middleware';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);

// protect tasks endpoints
app.use('/tasks', requireAuth, taskRoutes);

// simple error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal error' });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
