"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";

type Task = {
  id: number;
  title: string;
  status: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");

  const loadTasks = async () => {
    const res = await api.get("/tasks");
    console.log(res.data);
    setTasks(res.data.tasks);
  };

  const create = async (e: any) => {
    e.preventDefault();
    await api.post("/tasks", { title });
    setTitle("");
    loadTasks();
  };

  const remove = async (id: number) => {
    await api.delete(`/tasks/${id}`);
    loadTasks();
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Your Tasks</h1>

      <form onSubmit={create}>
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button>Add</button>
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.title} — {task.status}
            <button onClick={() => remove(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
