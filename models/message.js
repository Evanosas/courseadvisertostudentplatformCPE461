const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderType' },
    senderType: { type: String, required: true, enum: ['Student', 'Adviser'] },
    receiver: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'receiverType' },
    receiverType: { type: String, required: true, enum: ['Student', 'Adviser'] },
    content: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
