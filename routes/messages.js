const express = require('express');
const router = express.Router();
const Message = require('../models/message');

// Send a message
router.post('/', async (req, res) => {
    try {
        const { senderId, senderType, receiverId, receiverType, content } = req.body;

        if (!senderId || !senderType || !receiverId || !receiverType || !content) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ message: 'Message too long (max 2000 characters)' });
        }

        const message = await Message.create({
            sender: senderId,
            senderType,
            receiver: receiverId,
            receiverType,
            content: content.trim()
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

// Get conversation between two users
router.get('/conversation/:userId1/:userId2', async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        }).sort({ createdAt: 1 }).limit(200);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

// Mark messages as read
router.put('/read/:senderId/:receiverId', async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;

        await Message.updateMany(
            { sender: senderId, receiver: receiverId, read: false },
            { read: true }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages read', error: error.message });
    }
});

// Get unread count for a user
router.get('/unread/:userId', async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.params.userId,
            read: false
        });
        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: 'Error counting unread', error: error.message });
    }
});

module.exports = router;
