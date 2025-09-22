const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Humara User model

// --- REGISTER A NEW USER ---
// @route   POST /api/users/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // Create a new user instance
        user = new User({
            name,
            email,
            password,
            role
        });

        // Encrypt the password before saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save the user to the database
        await user.save();

        res.status(201).json({ msg: 'User registered successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- LOGIN A USER ---
// @route   POST /api/users/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Compare the provided password with the stored encrypted password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // User is valid, create a JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Yeh token login session ke liye istemal hoga
        jwt.sign(
            payload,
            'MY_SECRET_JWT_KEY', // Isko .env file mein daalna behtar hai
            { expiresIn: '5h' }, // Token 5 ghantay mein expire ho jayega
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;