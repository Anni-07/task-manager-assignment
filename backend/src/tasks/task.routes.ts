import { Router } from 'express';
import { createTask, listTasks, getTask, updateTask, deleteTask, toggleTask } from './task.controller';

const router = Router();

router.post('/', createTask);
router.get('/', listTasks);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/toggle', toggleTask);

export default router;
