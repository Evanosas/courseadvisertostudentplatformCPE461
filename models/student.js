const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    fullName: String,
    matricNo: String,
    email: String,
    password: String,
    googleId: String,
    registeredWith: { type: String, enum: ['email', 'google'], default: 'email' },
    courseAdviser: { type: mongoose.Schema.Types.ObjectId, ref: 'Adviser' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);
