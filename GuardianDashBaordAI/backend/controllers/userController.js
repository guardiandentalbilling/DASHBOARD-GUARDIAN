const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, username } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill all required fields (name, email, password)' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Determine username: provided or derived
        let finalUsername = (username || name.split(/\s+/).join('.')).toLowerCase();
        // Ensure uniqueness; append number if exists
        let collisionCounter = 0;
        while (await User.findOne({ username: finalUsername })) {
            collisionCounter += 1;
            finalUsername = `${finalUsername.split('.')[0]}${collisionCounter}`;
            if (collisionCounter > 20) break; // avoid infinite loop
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            username: finalUsername,
            password: hashedPassword,
            role: role || 'employee'
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'YOUR_SECRET_KEY_123', { expiresIn: '30d' });

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            token
        });
    } catch (err) {
        console.error('Register error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Duplicate value (email or username already exists)' });
        }
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Login user
// @route   POST /api/users/login
const loginUser = async (req, res) => {
    // Backward compatibility: some clients send { username, password }
    // Newer clients may send { identifier, password } OR { email, password }
    const { email, password, identifier, username } = req.body;

    // Normalize the login identifier preference order
    const rawId = (identifier || email || username || '').toString().trim();
    const loginId = rawId.toLowerCase();

    if (!loginId || !password) {
        return res.status(400).json({ message: 'Please provide username/email and password' });
    }

    // Lightweight debug (avoid leaking password). Can be removed later.
    if (process.env.AUTH_DEBUG === 'true') {
        console.log('[LOGIN_ATTEMPT]', { loginId, hasPassword: !!password, from: 'loginUserController' });
    }

    try {
        if (!global.mongoConnected) {
            console.log('Demo login - MongoDB not connected');
            const demoUsers = [
                { email: 'admin@test.com', username: 'admin', password: 'admin123', name: 'Demo Admin', role: 'admin' },
                { email: 'employee@test.com', username: 'employee', password: 'emp123', name: 'Demo Employee', role: 'employee' },
                { email: 'test@example.com', username: 'test', password: 'test123', name: 'Test User', role: 'employee' }
            ];
            const user = demoUsers.find(u => (u.email === loginId || u.username === loginId) && u.password === password);
            if (!user) return res.status(401).json({ message: 'Invalid credentials (Demo Mode)' });
            const token = jwt.sign({ id: 'demo_' + Date.now(), email: user.email, role: user.role }, process.env.JWT_SECRET || 'YOUR_SECRET_KEY_123', { expiresIn: '30d' });
            return res.json({ _id: 'demo_' + Date.now(), name: user.name, email: user.email, username: user.username, role: user.role, token, message: 'Login successful (Demo Mode)' });
        }

        let user;
        if (loginId.includes('@')) {
            user = await User.findOne({ email: loginId });
        } else {
            // Try username first
            user = await User.findOne({ username: loginId });
            if (!user) {
                // Opportunistic fallback: if loginId looks like something@ without domain removed earlier
                // (Not adding complex heuristics now; can extend later.)
            }
        }
        if (!user) {
            if (process.env.AUTH_DEBUG === 'true') {
                console.log(`[AUTH_DEBUG] Login failed: No user found for identifier '${loginId}'.`);
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (process.env.AUTH_DEBUG === 'true') {
            console.log(`[AUTH_DEBUG] User found for login attempt:`, {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                passwordHashLength: user.password.length,
                passwordHashStart: user.password.substring(0, 7)
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            if (process.env.AUTH_DEBUG === 'true') {
                console.log(`[AUTH_DEBUG] Password comparison FAILED for user '${user.username}'.`);
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (process.env.AUTH_DEBUG === 'true') {
            console.log(`[AUTH_DEBUG] Password comparison SUCCEEDED for user '${user.username}'. Generating token.`);
        }

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'YOUR_SECRET_KEY_123', { expiresIn: '30d' });
        return res.json({ _id: user._id, name: user.name, email: user.email, username: user.username, role: user.role, token, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};