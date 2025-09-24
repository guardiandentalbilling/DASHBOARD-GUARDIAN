const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const router = express.Router();

// --- Secure one-off bootstrap password reset endpoint ---
// Allows resetting/creating an admin user when credentials are lost.
// MUST set env ADMIN_BOOTSTRAP_TOKEN to a strong secret; otherwise endpoint is disabled.
// Invoke with POST /api/bootstrap/force-reset { token, username, password, email, role }
router.post('/force-reset', async (req, res) => {
    if (!process.env.ADMIN_BOOTSTRAP_TOKEN) {
        return res.status(404).json({ success: false, message: 'Endpoint not enabled. ADMIN_BOOTSTRAP_TOKEN is not set.' });
    }

    const { token, username = 'admin', password, email, role = 'admin' } = req.body || {};

    if (token !== process.env.ADMIN_BOOTSTRAP_TOKEN) {
        return res.status(401).json({ success: false, message: 'Invalid bootstrap token.' });
    }

    if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password is required and must be at least 8 characters long.' });
    }
    
    const finalEmail = email || `${username}@bootstrap.local`;

    try {
        let user = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email: finalEmail.toLowerCase() }] });
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!user) {
            // Create new user
            user = await User.create({
                username: username.toLowerCase(),
                email: finalEmail.toLowerCase(),
                name: username,
                password: hashedPassword,
                role: role,
            });
            console.log(`[BOOTSTRAP] Successfully created user: ${user.username}`);
        } else {
            // Update existing user
            user.password = hashedPassword;
            user.role = role;
            user.email = finalEmail.toLowerCase();
            await user.save();
            console.log(`[BOOTSTRAP] Successfully updated password for user: ${user.username}`);
        }

        if (process.env.AUTH_DEBUG === 'true') {
            const verificationUser = await User.findById(user._id).lean();
            console.log('[BOOTSTRAP_DEBUG] User state in DB after save:', {
                id: verificationUser._id,
                username: verificationUser.username,
                email: verificationUser.email,
                role: verificationUser.role,
                passwordHashLength: verificationUser.password ? verificationUser.password.length : 0,
                passwordHashStart: verificationUser.password ? verificationUser.password.substring(0, 7) : null
            });
        }

        return res.status(200).json({
            success: true,
            message: `User '${user.username}' was created/updated successfully.`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (e) {
        console.error('[BOOTSTRAP_FORCE_RESET] An unexpected error occurred:', e);
        return res.status(500).json({ success: false, message: 'An internal server error occurred during the bootstrap operation.' });
    }
});

module.exports = router;
