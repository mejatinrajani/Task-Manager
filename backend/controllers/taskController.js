const { v4: uuidv4 } = require('uuid');
const { tasks, categories } = require('../data/storage');

const getTasks = (req, res) => {
  const userTasks = tasks.filter(task => task.username === req.user.username);
  res.json(userTasks);
};

const getCategories = (req, res) => {
  res.json(categories);
};

const addTask = (req, res) => {
  const { title, category, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (title.length > 100) {
    return res.status(400).json({ message: 'Title cannot exceed 100 characters' });
  }
  if (category && !categories.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }
  if (dueDate) {
    const due = new Date(dueDate);
    if (isNaN(due.getTime()) || due < new Date()) {
      return res.status(400).json({ message: 'Invalid or past due date' });
    }
  }
  const task = {
    id: uuidv4(),
    username: req.user.username,
    title,
    category: category || 'Other',
    dueDate: dueDate || null,
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  res.status(201).json(task);
};

const deleteTask = (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(task => task.id === id && task.username === req.user.username);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  tasks.splice(taskIndex, 1);
  res.json({ message: 'Task deleted' });
};

const updateTask = (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const task = tasks.find(task => task.id === id && task.username === req.user.username);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  task.completed = completed;
  res.json(task);
};

const searchTasks = (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  const userTasks = tasks.filter(task => task.username === req.user.username);
  const filteredTasks = userTasks.filter(task =>
    task.title.toLowerCase().includes(query.toLowerCase()) ||
    (task.category && task.category.toLowerCase().includes(query.toLowerCase()))
  );
  res.json(filteredTasks);
};

module.exports = { getTasks, getCategories, addTask, deleteTask, updateTask, searchTasks };