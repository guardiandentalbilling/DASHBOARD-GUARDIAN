const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee'); // Import the Employee model

// @route   POST /api/employees
// @desc    Add a new employee
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, role, salaryPKR } = req.body;

        // Check if employee with that email already exists
        let employee = await Employee.findOne({ email });
        if (employee) {
            return res.status(400).json({ msg: 'Employee with this email already exists' });
        }

        // Create a new employee instance
        employee = new Employee({
            firstName,
            lastName,
            email,
            phone,
            role,
            salaryPKR
        });

        // Save to database
        await employee.save();

        res.status(201).json({ msg: 'Employee added successfully', employee });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/employees
// @desc    Get all employees
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 }); // Get newest first
        res.json(employees);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/employees/:id
// @desc    Delete an employee by their ID
router.delete('/:id', async (req, res) => {
    try {
        let employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        await Employee.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Employee removed successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;