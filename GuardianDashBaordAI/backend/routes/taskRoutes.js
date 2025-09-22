const express = require('express');
const router = express.Router();
const {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    searchTasks,
    getTaskStats
} = require('../controllers/taskController');

// @route   GET /api/tasks
// @desc    Get all tasks with optional filtering
// @access  Public
router.get('/', getAllTasks);

// @route   GET /api/tasks/search
// @desc    Search tasks by title, description, type, etc.
// @access  Public
router.get('/search', searchTasks);

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Public
router.get('/stats', getTaskStats);

// @route   GET /api/tasks/status/:status
// @desc    Get tasks by status
// @access  Public
router.get('/status/:status', getTasksByStatus);

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Public
router.get('/:id', getTaskById);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Public
router.post('/', createTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Public
router.put('/:id', updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Public
router.delete('/:id', deleteTask);

module.exports = router;