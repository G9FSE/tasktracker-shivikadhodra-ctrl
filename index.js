const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const PORT = 5000;
const FILE = "tasks.json";
const validStatus = ["pending", "in progress", "done"];

const readTasks = () => {
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]");
  return JSON.parse(fs.readFileSync(FILE));
};

const saveTasks = (tasks) => fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));

// Add task
app.post("/tasks", (req, res) => {
  const tasks = readTasks();
  const { title, status } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "Title is required and must be a string" });
  }
  if (status && !validStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const id = tasks.length ? tasks[tasks.length - 1].id + 1 : 1;
  const now = new Date().toISOString();
  const newTask = { 
    id, 
    title, 
    status: status || "pending", 
    createdAt: now, 
    updatedAt: now 
  };
  tasks.push(newTask);
  saveTasks(tasks);
  res.json({ message: "Task added", task: newTask });
});

// Update task
app.put("/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(t => t.id == req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const { title, status } = req.body;
  if (title) task.title = title;
  if (status) {
    if (!validStatus.includes(status)) return res.status(400).json({ message: "Invalid status" });
    task.status = status;
  }
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  res.json({ message: "Task updated", task });
});

// Delete task
app.delete("/tasks/:id", (req, res) => {
  let tasks = readTasks();
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id != req.params.id);
  if (tasks.length === initialLength) return res.status(404).json({ message: "Task not found" });
  saveTasks(tasks);
  res.json({ message: "Task deleted" });
});

// Get tasks (with optional query)
app.get("/tasks", (req, res) => {
  const tasks = readTasks();
  const { status } = req.query;

  if (status) {
    if (!validStatus.includes(status)) return res.status(400).json({ message: "Invalid status" });
    return res.json(tasks.filter(t => t.status === status));
  }

  res.json(tasks);
});

// Get single task
app.get("/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(t => t.id == req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

// Explicit status endpoints
app.get("/tasks/pending", (req, res) => {
  const tasks = readTasks();
  res.json(tasks.filter(t => t.status === "pending"));
});

app.get("/tasks/in-progress", (req, res) => {
  const tasks = readTasks();
  res.json(tasks.filter(t => t.status === "in progress"));
});

app.get("/tasks/done", (req, res) => {
  const tasks = readTasks();
  res.json(tasks.filter(t => t.status === "done"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 