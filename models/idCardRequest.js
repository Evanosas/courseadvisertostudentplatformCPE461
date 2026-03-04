const mongoose = require('mongoose');

const IDCardRequestSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    requestType: { type: String, enum: ['new', 'renewal', 'replacement'], default: 'new' },
    requestDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'processing', 'completed', 'rejected'], default: 'submitted' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Adviser' },
    approvalDate: Date,
    notes: String,
    trackingNumber: String
});

module.exports = mongoose.model('IDCardRequest', IDCardRequestSchema);
