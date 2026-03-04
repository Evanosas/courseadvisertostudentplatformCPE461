const mongoose = require('mongoose');

const AdviserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    staffId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: String,
    googleId: String,
    registeredWith: { type: String, enum: ['email', 'google'], default: 'email' },
    department: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Adviser', AdviserSchema);