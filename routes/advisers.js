const express = require('express');
const router = express.Router();
const Adviser = require('../models/adviser');
const Student = require('../models/student');
const CourseRegistration = require('../models/courseRegistration');
const AcademicRecord = require('../models/academicRecord');
const IDCardRequest = require('../models/idCardRequest');

// Get students assigned to an adviser
router.get('/:adviserId/students', async (req, res) => {
    try {
        const adviserId = req.params.adviserId;
        const students = await Student.find({ courseAdviser: adviserId }).select('fullName email matricNo createdAt');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// Get adviser stats
router.get('/:adviserId/stats', async (req, res) => {
    try {
        const adviserId = req.params.adviserId;
        const students = await Student.find({ courseAdviser: adviserId });
        const pendingRegs = await CourseRegistration.find({ status: 'pending' });
        const pendingIds = await IDCardRequest.find({ status: 'submitted' });

        // Calculate average GPA across all students
        let totalGPA = 0;
        let studentCount = 0;
        for (const student of students) {
            const records = await AcademicRecord.find({ student: student._id }).populate('course');
            if (records.length > 0) {
                let totalPoints = 0;
                let totalCredits = 0;
                for (const record of records) {
                    if (record.course) {
                        totalPoints += record.gradePoint * record.course.creditUnits;
                        totalCredits += record.course.creditUnits;
                    }
                }
                if (totalCredits > 0) {
                    totalGPA += totalPoints / totalCredits;
                    studentCount++;
                }
            }
        }

        res.json({
            totalStudents: students.length,
            pendingRegistrations: pendingRegs.length,
            pendingIdRequests: pendingIds.length,
            averageGPA: studentCount > 0 ? (totalGPA / studentCount).toFixed(2) : '0.00'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

// Get adviser profile
router.get('/:adviserId/profile', async (req, res) => {
    try {
        const adviser = await Adviser.findById(req.params.adviserId).select('-password');
        if (!adviser) {
            return res.status(404).json({ message: 'Adviser not found' });
        }
        res.json(adviser);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

module.exports = router;