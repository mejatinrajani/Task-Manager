const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { getTasks, getCategories, addTask, deleteTask, updateTask, searchTasks } = require('../controllers/taskController');

const router = express.Router();

router.use(authenticate);
router.get('/', getTasks);
router.get('/categories', getCategories);
router.post('/', addTask);
router.delete('/:id', deleteTask);
router.patch('/:id', updateTask);
router.get('/search', searchTasks);

module.exports = router;