const Employee = require('../../models/Employee');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// In-memory store for demo mode
let demoEmployees = [
    {
        _id: 'demo1',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '123-456-7890',
        role: 'Billing Specialist',
        salaryPKR: 120000,
        overtime: 500,
        username: 'john.doe',
        userRole: 'employee',
        status: 'Active',
        joiningDate: '2024-01-15',
        profileImage: '/images/default-avatar.png',
        createdAt: new Date().toISOString()
    },
    {
        _id: 'demo2',
        employeeId: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '123-456-7891',
        role: 'Team Lead',
        salaryPKR: 180000,
        overtime: 600,
        username: 'jane.smith',
        userRole: 'employee',
        status: 'Active',
        joiningDate: '2023-06-10',
        profileImage: '/images/default-avatar.png',
        createdAt: new Date().toISOString()
    },
    {
        _id: 'demo3',
        employeeId: 'EMP003',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        phone: '123-456-7892',
        role: 'Administrator',
        salaryPKR: 200000,
        overtime: 0,
        username: 'admin',
        userRole: 'admin',
        status: 'Active',
        joiningDate: '2023-01-01',
        profileImage: '/images/default-avatar.png',
        createdAt: new Date().toISOString()
    }
];

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public (should be protected in production)
const getAllEmployees = async (req, res) => {
    try {
        // Demo mode when MongoDB is not connected
        if (!global.mongoConnected) {
            console.log('Demo mode - returning stored employees, count:', demoEmployees.length);
            return res.json(demoEmployees);
        }

        const employees = await Employee.find().sort({ createdAt: -1 });
        res.json(employees);
    } catch (error) {
        console.error('Error getting employees:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Public (should be protected in production)
const createEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            role,
            joiningDate,
            salaryPKR,
            overtime,
            username,
            userRole,
            status,
            profileImage,
            employeeDocs,
            client,
            task
        } = req.body;

        // Demo mode fallback
        if (!global.mongoConnected) {
            console.log('Creating employee in demo mode');
            
            // Check if email already exists in demo data
            const existingEmployee = demoEmployees.find(emp => emp.email === email);
            if (existingEmployee) {
                return res.status(400).json({ msg: 'Employee with this email already exists' });
            }
            
            // Generate a unique ID for demo mode
            const newEmployee = {
                _id: 'demo_' + Date.now(),
                employeeId: 'EMP' + String(Date.now()).slice(-6),
                firstName,
                lastName,
                email,
                phone: phone || '',
                role: role || 'Employee',
                joiningDate: joiningDate || new Date().toISOString().split('T')[0],
                salaryPKR: parseInt(salaryPKR) || 0,
                overtime: parseInt(overtime) || 0,
                username: username || `${firstName}.${lastName}`.toLowerCase(),
                userRole: userRole || 'employee',
                status: status || 'Active',
                profileImage: profileImage || '/images/default-avatar.png',
                employeeDocs: employeeDocs || [],
                client: client || null,
                task: task || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Add to demo employees array
            demoEmployees.push(newEmployee);
            
            return res.status(201).json({ 
                msg: 'Employee created successfully (Demo Mode)', 
                employee: newEmployee 
            });
        }

        // MongoDB mode - check if employee with email already exists
        let existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ msg: 'Employee with this email already exists' });
        }

        // Create new employee
        const employee = new Employee({
            firstName,
            lastName,
            email,
            phone,
            role,
            joiningDate: joiningDate || Date.now(),
            salaryPKR,
            overtime: overtime || 0,
            username,
            userRole,
            status,
            profileImage,
            employeeDocs: employeeDocs || [],
            client,
            task
        });

        // If client supplied an existing userId (frontend created the user already), link it
        let createdUser = null;
        try {
            if (req.body.userId) {
                const existingUser = await User.findById(req.body.userId);
                if (existingUser) {
                    employee.user = existingUser._id;
                    employee.username = existingUser.username || employee.username;
                    employee.userRole = existingUser.role || employee.userRole;
                    createdUser = existingUser; // treat as linked
                }
            } else {
                // If password or explicit user creation requested, create a linked User
                // If client provided a password (from admin UI) use it; otherwise generate a random temp password
                let plainPassword = req.body.password;
                if (!plainPassword) {
                    // Generate a 10-char temporary password
                    plainPassword = Math.random().toString(36).slice(-8) + (Math.floor(Math.random() * 900) + 100).toString();
                }

                // Determine username for the user: use provided username, else derive from name or email
                let finalUsername = username || `${firstName}.${lastName}`.toLowerCase();
                finalUsername = finalUsername.replace(/\s+/g, '.');
                // Ensure uniqueness by appending number when collision occurs (simple loop)
                let collision = 0;
                let candidate = finalUsername;
                while (await User.findOne({ username: candidate })) {
                    collision += 1;
                    candidate = `${finalUsername}${collision}`;
                    if (collision > 50) break;
                }
                finalUsername = candidate;

                const salt = await bcrypt.genSalt(10);
                const hashed = await bcrypt.hash(plainPassword, salt);

                createdUser = await User.create({
                    name: `${firstName} ${lastName}`,
                    email: email.toLowerCase(),
                    username: finalUsername,
                    password: hashed,
                    role: userRole || 'employee'
                });

                // Link created user to employee
                employee.user = createdUser._id;
                // Also store username on employee for quick reference
                employee.username = finalUsername;
                employee.userRole = createdUser.role;
            }
        } catch (userErr) {
            console.error('Failed to create/link user for employee:', userErr.message);
            // Continue and create employee record, but inform caller about partial failure
        }

        const savedEmployee = await employee.save();

        const resp = { msg: 'Employee created successfully', employee: savedEmployee };
        if (createdUser) {
            resp.login = { username: createdUser.username, password: req.body.password || 'TEMP_GENERATED' };
            // If we generated a password, hide the plain text but indicate that admin should reset or note it
            if (!req.body.password) resp.login.password = 'TEMP_GENERATED - admin must view logs or reset';
        }

        res.status(201).json(resp);

    } catch (error) {
        console.error('Error creating employee:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Public (should be protected in production)
const getEmployeeById = async (req, res) => {
    try {
        // Demo mode fallback
        if (!global.mongoConnected) {
            const employee = demoEmployees.find(emp => emp._id === req.params.id);
            if (!employee) {
                return res.status(404).json({ msg: 'Employee not found' });
            }
            return res.json(employee);
        }

        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        
        res.json(employee);
    } catch (error) {
        console.error('Error getting employee:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Public (should be protected in production)
const updateEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            role,
            joiningDate,
            salaryPKR,
            overtime,
            username,
            userRole,
            status,
            profileImage,
            employeeDocs,
            client,
            task
        } = req.body;

        // Demo mode fallback
        if (!global.mongoConnected) {
            console.log('Updating employee in demo mode');
            
            const employeeIndex = demoEmployees.findIndex(emp => emp._id === req.params.id);
            if (employeeIndex === -1) {
                return res.status(404).json({ msg: 'Employee not found' });
            }
            
            // Update the employee in demo array
            const updatedEmployee = {
                ...demoEmployees[employeeIndex],
                firstName: firstName || demoEmployees[employeeIndex].firstName,
                lastName: lastName || demoEmployees[employeeIndex].lastName,
                email: email || demoEmployees[employeeIndex].email,
                phone: phone !== undefined ? phone : demoEmployees[employeeIndex].phone,
                role: role || demoEmployees[employeeIndex].role,
                joiningDate: joiningDate || demoEmployees[employeeIndex].joiningDate,
                salaryPKR: salaryPKR || demoEmployees[employeeIndex].salaryPKR,
                overtime: overtime !== undefined ? overtime : demoEmployees[employeeIndex].overtime,
                username: username || demoEmployees[employeeIndex].username,
                userRole: userRole || demoEmployees[employeeIndex].userRole,
                status: status || demoEmployees[employeeIndex].status,
                profileImage: profileImage || demoEmployees[employeeIndex].profileImage,
                employeeDocs: employeeDocs || demoEmployees[employeeIndex].employeeDocs,
                client: client !== undefined ? client : demoEmployees[employeeIndex].client,
                task: task !== undefined ? task : demoEmployees[employeeIndex].task,
                updatedAt: new Date().toISOString()
            };
            
            demoEmployees[employeeIndex] = updatedEmployee;
            
            return res.json({ 
                msg: 'Employee updated successfully (Demo Mode)', 
                employee: updatedEmployee 
            });
        }

        // Check if employee exists
        let employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // Check if email is being changed and if new email already exists
        if (email && email !== employee.email) {
            const existingEmployee = await Employee.findOne({ email });
            if (existingEmployee) {
                return res.status(400).json({ msg: 'Employee with this email already exists' });
            }
        }

        // Update fields
        const updateFields = {};
        if (firstName) updateFields.firstName = firstName;
        if (lastName) updateFields.lastName = lastName;
        if (email) updateFields.email = email;
        if (phone !== undefined) updateFields.phone = phone;
        if (role) updateFields.role = role;
        if (joiningDate) updateFields.joiningDate = joiningDate;
        if (salaryPKR) updateFields.salaryPKR = salaryPKR;
        if (overtime !== undefined) updateFields.overtime = overtime;
        if (username) updateFields.username = username;
        if (userRole) updateFields.userRole = userRole;
        if (status) updateFields.status = status;
        if (profileImage) updateFields.profileImage = profileImage;
        if (employeeDocs) updateFields.employeeDocs = employeeDocs;
        if (client !== undefined) updateFields.client = client;
        if (task !== undefined) updateFields.task = task;

        employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        // If this employee is linked to a User, propagate certain changes
        try {
            if (employee.user) {
                const userUpdates = {};
                if (updateFields.email) userUpdates.email = updateFields.email.toLowerCase();
                if (updateFields.username) userUpdates.username = updateFields.username.toLowerCase();
                if (updateFields.userRole) userUpdates.role = updateFields.userRole;
                if (Object.keys(userUpdates).length > 0) {
                    await User.findByIdAndUpdate(employee.user, { $set: userUpdates }, { new: true, runValidators: true });
                }
            }
        } catch (userUpdateErr) {
            console.error('Failed to sync updates to linked User:', userUpdateErr.message);
            // Do not block the employee update; let caller handle partial sync issues
        }

        res.json({ 
            msg: 'Employee updated successfully', 
            employee 
        });

    } catch (error) {
        console.error('Error updating employee:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Public (should be protected in production)
const deleteEmployee = async (req, res) => {
    try {
        // Demo mode fallback
        if (!global.mongoConnected) {
            console.log('Deleting employee in demo mode');
            const employeeIndex = demoEmployees.findIndex(emp => emp._id === req.params.id);
            if (employeeIndex === -1) {
                return res.status(404).json({ msg: 'Employee not found' });
            }
            
            demoEmployees.splice(employeeIndex, 1);
            return res.json({ msg: 'Employee removed successfully (Demo Mode)' });
        }

        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        await Employee.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'Employee removed successfully' });

    } catch (error) {
        console.error('Error deleting employee:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get employees by status
// @route   GET /api/employees/status/:status
// @access  Public (should be protected in production)
const getEmployeesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['Active', 'On Leave', 'Resigned'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status. Must be Active, On Leave, or Resigned' });
        }

        // Demo mode fallback
        if (!global.mongoConnected) {
            const filteredEmployees = demoEmployees.filter(emp => emp.status === status);
            return res.json(filteredEmployees);
        }

        const employees = await Employee.find({ status }).sort({ createdAt: -1 });
        res.json(employees);

    } catch (error) {
        console.error('Error getting employees by status:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Search employees
// @route   GET /api/employees/search?q=searchterm
// @access  Public (should be protected in production)
const searchEmployees = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ msg: 'Search query is required' });
        }

        // Demo mode fallback
        if (!global.mongoConnected) {
            const searchResults = demoEmployees.filter(emp => 
                emp.firstName.toLowerCase().includes(q.toLowerCase()) ||
                emp.lastName.toLowerCase().includes(q.toLowerCase()) ||
                emp.email.toLowerCase().includes(q.toLowerCase()) ||
                emp.role.toLowerCase().includes(q.toLowerCase()) ||
                (emp.client && emp.client.toLowerCase().includes(q.toLowerCase()))
            );
            return res.json(searchResults);
        }

        const employees = await Employee.find({
            $or: [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { role: { $regex: q, $options: 'i' } },
                { client: { $regex: q, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.json(employees);

    } catch (error) {
        console.error('Error searching employees:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesByStatus,
    searchEmployees
};