const mongoose = require('mongoose');

// Basic 1:1 direct message schema (room support can be added later by adding roomId field logic)
const chatMessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // direct chat
    content: { type: String, trim: true },
    type: { type: String, enum: ['text', 'image', 'link'], default: 'text' },
    attachments: [{
        url: String,
        mimeType: String,
        width: Number,
        height: Number,
        originalName: String
    }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    meta: {
        linkPreview: {
            title: String,
            description: String,
            image: String
        }
    }
}, { timestamps: true });

chatMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
chatMessageSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
