import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/todos', async (req: Request, res: Response) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.get('/api/todos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const todo = await prisma.todo.findUnique({
      where: { id: parseInt(id) },
    });

    if (!todo) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// POST create new todo
app.post('/api/todos', async (req: Request, res: Response) => {
  try {
    const { task } = req.body;

    if (!task || typeof task !== 'string' || task.trim() === '') {
      res.status(400).json({ error: 'Task is required and must be a non-empty string' });
      return;
    }

    const newTodo = await prisma.todo.create({
      data: {
        task: task.trim(),
        isCompleted: false,
      },
    });

    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { task, isCompleted } = req.body;

    const updateData: any = {};
    if (task !== undefined) updateData.task = task.trim();
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'At least one field (task or isCompleted) is required' });
      return;
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedTodo = await prisma.todo.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
