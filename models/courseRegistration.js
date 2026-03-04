const mongoose = require('mongoose');

const CourseRegistrationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    registrationDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Adviser' },
    approvalDate: Date,
    notes: String
});

module.exports = mongoose.model('CourseRegistration', CourseRegistrationSchema);
