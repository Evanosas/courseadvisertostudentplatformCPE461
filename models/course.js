const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    creditUnits: { type: Number, required: true },
    level: { type: String, required: true }, // 100, 200, 300, 400 etc
    semester: { type: String, enum: ['First', 'Second'] }, // First or Second semester
    department: String,
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Adviser' },
    capacity: Number,
    registered: { type: Number, default: 0 },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);
