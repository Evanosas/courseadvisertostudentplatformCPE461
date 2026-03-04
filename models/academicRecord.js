const mongoose = require('mongoose');

const AcademicRecordSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    academicSession: { type: String, required: true }, // e.g., "2023/2024"
    semester: { type: String, enum: ['First', 'Second'], required: true },
    score: Number,
    grade: String, // A, B, C, D, F
    gradePoint: Number,
    status: { type: String, enum: ['pass', 'fail', 'incomplete'], default: 'incomplete' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Adviser' },
    recordedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AcademicRecord', AcademicRecordSchema);
