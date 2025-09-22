const Task = require('../../models/Task');
const Employee = require('../../models/Employee');

// Demo mode data - In-memory task storage when MongoDB is not available
let demoTasks = [
    {
        _id: '673d9e8b2c4d5e6f789012ab',
        title: 'Follow up on Claim #12345',
        description: 'Contact insurance company regarding pending claim status',
        type: 'AR',
        status: 'in-progress',
        priority: 'high',
        assignedTo: {
            employee: '64a7c8b2c3d4e5f6789012ab',
            employeeName: 'John Doe'
        },
        client: {
            clientName: 'Dental Care Inc.'
        },
        taskNumber: 'GDB-T001',
        revenue: 250,
        dueDate: new Date('2025-01-25'),
        startDate: new Date('2025-01-20'),
        estimatedHours: 2,
        actualHours: 1.5,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-21')
    },
    {
        _id: '673d9e8b2c4d5e6f789012ac',
        title: 'Verify new patient insurance',
        description: 'Verify insurance benefits for new patient John Smith',
        type: 'Insurance Verification',
        status: 'pending',
        priority: 'medium',
        assignedTo: {
            employee: '64a7c8b2c3d4e5f6789012ac',
            employeeName: 'Maria Garcia'
        },
        client: {
            clientName: 'Bright Smiles LLC'
        },
        taskNumber: 'GDB-T002',
        revenue: 0,
        dueDate: new Date('2025-01-28'),
        startDate: new Date('2025-01-22'),
        estimatedHours: 1,
        createdAt: new Date('2025-01-22'),
        updatedAt: new Date('2025-01-22')
    },
    {
        _id: '673d9e8b2c4d5e6f789012ad',
        title: 'Submit weekly payment posting report',
        description: 'Compile and submit weekly payment posting summary',
        type: 'Data Entry',
        status: 'completed',
        priority: 'medium',
        assignedTo: {
            employee: '64a7c8b2c3d4e5f6789012ad',
            employeeName: 'Jane Smith'
        },
        client: {
            clientName: 'Dental Care Inc.'
        },
        taskNumber: 'GDB-T003',
        revenue: 400,
        dueDate: new Date('2025-01-24'),
        startDate: new Date('2025-01-23'),
        completedDate: new Date('2025-01-24'),
        estimatedHours: 3,
        actualHours: 2.5,
        createdAt: new Date('2025-01-23'),
        updatedAt: new Date('2025-01-24')
    },
    {
        _id: '673d9e8b2c4d5e6f789012ae',
        title: 'Appeal denied claim #54321',
        description: 'Prepare and submit appeal for denied claim',
        type: 'Claims Processing',
        status: 'pending',
        priority: 'urgent',
        assignedTo: {
            employee: '64a7c8b2c3d4e5f6789012ae',
            employeeName: 'Alex Kim'
        },
        client: {
            clientName: 'Smile Dental Group'
        },
        taskNumber: 'GDB-T004',
        revenue: 150,
        dueDate: new Date('2025-01-26'),
        startDate: new Date('2025-01-21'),
        estimatedHours: 4,
        createdAt: new Date('2025-01-21'),
        updatedAt: new Date('2025-01-21')
    },
    {
        _id: '673d9e8b2c4d5e6f789012af',
        title: 'Update patient records',
        description: 'Update patient demographic and insurance information',
        type: 'Data Entry',
        status: 'overdue',
        priority: 'low',
        assignedTo: {
            employee: '64a7c8b2c3d4e5f6789012af',
            employeeName: 'Priya Patel'
        },
        client: {
            clientName: 'Healthy Smiles'
        },
        taskNumber: 'GDB-T005',
        revenue: 0,
        dueDate: new Date('2025-01-20'),
        startDate: new Date('2025-01-19'),
        estimatedHours: 1,
        createdAt: new Date('2025-01-19'),
        updatedAt: new Date('2025-01-19')
    }
];

// Check if we're in demo mode (MongoDB not connected)
const isDemoMode = () => {
    return !require('mongoose').connection.readyState || 
           require('mongoose').connection.readyState !== 1;
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public (should be protected in production)
const getAllTasks = async (req, res) => {
    try {
        const { status, employee, client, priority, page = 1, limit = 50 } = req.query;
        
        // Check if we're in demo mode
        if (isDemoMode()) {
            // Demo mode - use in-memory data
            let filteredTasks = [...demoTasks];
            
            // Apply filters
            if (status) {
                filteredTasks = filteredTasks.filter(task => task.status === status);
            }
            if (employee) {
                filteredTasks = filteredTasks.filter(task => 
                    task.assignedTo.employeeName.toLowerCase().includes(employee.toLowerCase())
                );
            }
            if (client) {
                filteredTasks = filteredTasks.filter(task => 
                    task.client.clientName.toLowerCase().includes(client.toLowerCase())
                );
            }
            if (priority) {
                filteredTasks = filteredTasks.filter(task => task.priority === priority);
            }
            
            // Sort by creation date (newest first) and due date
            filteredTasks.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                if (dateB - dateA !== 0) return dateB - dateA;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
            
            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
            
            return res.json({
                tasks: paginatedTasks,
                totalPages: Math.ceil(filteredTasks.length / limit),
                currentPage: parseInt(page),
                total: filteredTasks.length
            });
        }
        
        // Production mode - use MongoDB
        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (employee) filter['assignedTo.employeeName'] = { $regex: employee, $options: 'i' };
        if (client) filter['client.clientName'] = { $regex: client, $options: 'i' };
        if (priority) filter.priority = priority;

        const tasks = await Task.find(filter)
            .populate('assignedTo.employee', 'firstName lastName email')
            .sort({ createdAt: -1, dueDate: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Task.countDocuments(filter);

        res.json({
            tasks,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting tasks:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Public (should be protected in production)
const getTaskById = async (req, res) => {
    try {
        // Check if we're in demo mode
        if (isDemoMode()) {
            const task = demoTasks.find(t => t._id === req.params.id);
            if (!task) {
                return res.status(404).json({ msg: 'Task not found' });
            }
            return res.json(task);
        }
        
        // Production mode
        const task = await Task.findById(req.params.id)
            .populate('assignedTo.employee', 'firstName lastName email');
        
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        
        res.json(task);
    } catch (error) {
        console.error('Error getting task:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Public (should be protected in production)
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            priority,
            assignedToEmployee,
            clientName,
            dueDate,
            revenue,
            estimatedHours
        } = req.body;

        // Validate required fields
        if (!title || !assignedToEmployee || !clientName || !dueDate) {
            return res.status(400).json({ 
                msg: 'Please provide title, assigned employee, client, and due date' 
            });
        }

        // Check if we're in demo mode
        if (isDemoMode()) {
            // Demo mode - create task in memory
            const newTaskId = 'demo_' + Date.now();
            const taskNumber = `GDB-T${String(demoTasks.length + 1).padStart(3, '0')}`;
            
            const newTask = {
                _id: newTaskId,
                title,
                description: description || '',
                type: type || 'Other',
                priority: priority || 'medium',
                status: 'pending',
                assignedTo: {
                    employee: assignedToEmployee,
                    employeeName: assignedToEmployee // In demo mode, we assume this is the name
                },
                client: {
                    clientName
                },
                taskNumber,
                revenue: revenue || 0,
                dueDate: new Date(dueDate),
                startDate: new Date(),
                estimatedHours: estimatedHours || 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            demoTasks.push(newTask);
            
            return res.status(201).json({ 
                msg: 'Task created successfully', 
                task: newTask 
            });
        }

        // Production mode - get employee details and create in MongoDB
        const employee = await Employee.findById(assignedToEmployee);
        if (!employee) {
            return res.status(400).json({ msg: 'Assigned employee not found' });
        }

        // Create new task
        const task = new Task({
            title,
            description,
            type: type || 'Other',
            priority: priority || 'medium',
            assignedTo: {
                employee: employee._id,
                employeeName: `${employee.firstName} ${employee.lastName}`
            },
            client: {
                clientName
            },
            dueDate: new Date(dueDate),
            revenue: revenue || 0,
            estimatedHours: estimatedHours || 0
        });

        const savedTask = await task.save();
        await savedTask.populate('assignedTo.employee', 'firstName lastName email');
        
        res.status(201).json({ 
            msg: 'Task created successfully', 
            task: savedTask 
        });

    } catch (error) {
        console.error('Error creating task:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Public (should be protected in production)
const updateTask = async (req, res) => {
    try {
        // Check if we're in demo mode
        if (isDemoMode()) {
            const taskIndex = demoTasks.findIndex(t => t._id === req.params.id);
            if (taskIndex === -1) {
                return res.status(404).json({ msg: 'Task not found' });
            }

            const {
                title,
                description,
                type,
                status,
                priority,
                assignedToEmployee,
                clientName,
                dueDate,
                revenue,
                estimatedHours,
                actualHours,
                notes
            } = req.body;

            // Update the task in demo array
            const task = demoTasks[taskIndex];
            
            if (title) task.title = title;
            if (description !== undefined) task.description = description;
            if (type) task.type = type;
            if (status) {
                task.status = status;
                if (status === 'completed' && !task.completedDate) {
                    task.completedDate = new Date();
                }
            }
            if (priority) task.priority = priority;
            if (clientName) task.client.clientName = clientName;
            if (dueDate) task.dueDate = new Date(dueDate);
            if (revenue !== undefined) task.revenue = revenue;
            if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
            if (actualHours !== undefined) task.actualHours = actualHours;
            if (assignedToEmployee) {
                task.assignedTo.employee = assignedToEmployee;
                task.assignedTo.employeeName = assignedToEmployee; // In demo mode, assume this is the name
            }
            
            task.updatedAt = new Date();
            
            return res.json({ 
                msg: 'Task updated successfully', 
                task 
            });
        }

        // Production mode
        let task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const {
            title,
            description,
            type,
            status,
            priority,
            assignedToEmployee,
            clientName,
            dueDate,
            revenue,
            estimatedHours,
            actualHours,
            notes
        } = req.body;

        // Update fields
        const updateFields = {};
        if (title) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (type) updateFields.type = type;
        if (status) {
            updateFields.status = status;
            if (status === 'completed' && !task.completedDate) {
                updateFields.completedDate = new Date();
            }
        }
        if (priority) updateFields.priority = priority;
        if (clientName) updateFields['client.clientName'] = clientName;
        if (dueDate) updateFields.dueDate = new Date(dueDate);
        if (revenue !== undefined) updateFields.revenue = revenue;
        if (estimatedHours !== undefined) updateFields.estimatedHours = estimatedHours;
        if (actualHours !== undefined) updateFields.actualHours = actualHours;

        // Update assigned employee if provided
        if (assignedToEmployee) {
            const employee = await Employee.findById(assignedToEmployee);
            if (!employee) {
                return res.status(400).json({ msg: 'Assigned employee not found' });
            }
            updateFields['assignedTo.employee'] = employee._id;
            updateFields['assignedTo.employeeName'] = `${employee.firstName} ${employee.lastName}`;
        }

        // Add notes if provided
        if (notes) {
            const newNote = {
                note: notes,
                addedBy: 'System', // In production, this would be the logged-in user
                addedAt: new Date()
            };
            updateFields.$push = { notes: newNote };
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('assignedTo.employee', 'firstName lastName email');

        res.json({ 
            msg: 'Task updated successfully', 
            task 
        });

    } catch (error) {
        console.error('Error updating task:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Public (should be protected in production)
const deleteTask = async (req, res) => {
    try {
        // Check if we're in demo mode
        if (isDemoMode()) {
            const taskIndex = demoTasks.findIndex(t => t._id === req.params.id);
            if (taskIndex === -1) {
                return res.status(404).json({ msg: 'Task not found' });
            }
            
            demoTasks.splice(taskIndex, 1);
            return res.json({ msg: 'Task removed successfully' });
        }

        // Production mode
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        await Task.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'Task removed successfully' });

    } catch (error) {
        console.error('Error deleting task:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get tasks by status
// @route   GET /api/tasks/status/:status
// @access  Public (should be protected in production)
const getTasksByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['pending', 'in-progress', 'completed', 'due', 'overdue', 'previous', 'newly'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        // Check if we're in demo mode
        if (isDemoMode()) {
            const filteredTasks = demoTasks.filter(task => task.status === status);
            return res.json(filteredTasks);
        }

        // Production mode
        const tasks = await Task.find({ status })
            .populate('assignedTo.employee', 'firstName lastName email')
            .sort({ dueDate: 1 });

        res.json(tasks);

    } catch (error) {
        console.error('Error getting tasks by status:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Search tasks
// @route   GET /api/tasks/search?q=searchterm
// @access  Public (should be protected in production)
const searchTasks = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ msg: 'Search query is required' });
        }

        // Check if we're in demo mode
        if (isDemoMode()) {
            const filteredTasks = demoTasks.filter(task => {
                const searchTerm = q.toLowerCase();
                return task.title.toLowerCase().includes(searchTerm) ||
                       task.description.toLowerCase().includes(searchTerm) ||
                       task.type.toLowerCase().includes(searchTerm) ||
                       task.taskNumber.toLowerCase().includes(searchTerm) ||
                       task.assignedTo.employeeName.toLowerCase().includes(searchTerm) ||
                       task.client.clientName.toLowerCase().includes(searchTerm);
            });
            
            return res.json(filteredTasks);
        }

        // Production mode
        const tasks = await Task.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { type: { $regex: q, $options: 'i' } },
                { taskNumber: { $regex: q, $options: 'i' } },
                { 'assignedTo.employeeName': { $regex: q, $options: 'i' } },
                { 'client.clientName': { $regex: q, $options: 'i' } }
            ]
        }).populate('assignedTo.employee', 'firstName lastName email')
          .sort({ createdAt: -1 });

        res.json(tasks);

    } catch (error) {
        console.error('Error searching tasks:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Public (should be protected in production)
const getTaskStats = async (req, res) => {
    try {
        // Check if we're in demo mode
        if (isDemoMode()) {
            const statusCounts = {};
            let totalRevenue = 0;
            
            demoTasks.forEach(task => {
                statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
                totalRevenue += task.revenue || 0;
            });
            
            const stats = Object.keys(statusCounts).map(status => ({
                _id: status,
                count: statusCounts[status],
                totalRevenue: demoTasks
                    .filter(task => task.status === status)
                    .reduce((sum, task) => sum + (task.revenue || 0), 0)
            }));
            
            const totalTasks = demoTasks.length;
            const completedTasks = demoTasks.filter(task => task.status === 'completed').length;
            const overdueTasks = demoTasks.filter(task => task.status === 'overdue').length;
            const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
            
            return res.json({
                statusStats: stats,
                totalTasks,
                completedTasks,
                overdueTasks,
                completionRate: parseFloat(completionRate)
            });
        }

        // Production mode
        const stats = await Task.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$revenue' }
                }
            }
        ]);

        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const overdueTasks = await Task.countDocuments({ status: 'overdue' });
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

        res.json({
            statusStats: stats,
            totalTasks,
            completedTasks,
            overdueTasks,
            completionRate: parseFloat(completionRate)
        });

    } catch (error) {
        console.error('Error getting task stats:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    searchTasks,
    getTaskStats
};