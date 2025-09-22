const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ChatMessage = require('../models/chatMessageModel');
const User = require('../models/userModel');

const router = express.Router();

// --- Simple auth placeholder (replace with real auth middleware later) ---
function extractUser(req) {
    // In existing app, user data seems stored client-side; for now accept ?userId= for demo
    const userId = req.header('x-user-id') || req.query.userId || null;
    return userId;
}

router.use((req,res,next)=>{
    req.currentUserId = extractUser(req);
    next();
});

// --- Public user list (limited fields) ---
router.get('/users', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const find = q ? { name: { $regex: q, $options: 'i' } } : {};
        const users = await User.find(find).select('name role email');
        // Derive avatar placeholder (First letter) client can handle; keep extensible
        res.json({ success: true, users });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- Get messages between current user and peer ---
router.get('/messages', async (req, res) => {
    try {
        const { peerId, after } = req.query;
        const currentUserId = req.currentUserId;
        if (!currentUserId || !peerId) {
            return res.status(400).json({ success: false, error: 'peerId and user context required' });
        }
        const criteria = {
            $or: [
                { senderId: currentUserId, recipientId: peerId },
                { senderId: peerId, recipientId: currentUserId }
            ]
        };
        if (after) {
            criteria.createdAt = { $gt: new Date(after) };
        }
        const messages = await ChatMessage.find(criteria).sort({ createdAt: 1 }).limit(200);
        res.json({ success: true, messages });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- Send message ---
router.post('/message', async (req, res) => {
    try {
        const currentUserId = req.currentUserId;
        const { peerId, content, type, attachments } = req.body;
        if (!currentUserId || !peerId) {
            return res.status(400).json({ success: false, error: 'peerId and user context required' });
        }
        if (!content && (!attachments || !attachments.length)) {
            return res.status(400).json({ success: false, error: 'Message content or attachment required' });
        }
        const msg = await ChatMessage.create({
            senderId: currentUserId,
            recipientId: peerId,
            content: content || '',
            type: type || 'text',
            attachments: attachments || []
        });
        res.json({ success: true, message: msg });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- Image upload ---
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'chat');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

function fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image uploads allowed'));
    }
    cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const relativePath = '/uploads/chat/' + req.file.filename;
    res.json({ success: true, url: relativePath, mimeType: req.file.mimetype, originalName: req.file.originalname });
});

module.exports = router;
