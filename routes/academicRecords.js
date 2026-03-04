const express = require('express');
const router = express.Router();
const AcademicRecord = require('../models/academicRecord');

// Get student's academic records
router.get('/student/:studentId', async (req, res) => {
    try {
        const records = await AcademicRecord.find({ student: req.params.studentId })
            .populate('course', 'courseCode courseName creditUnits')
            .populate('recordedBy', 'fullName email');
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching academic records', error: error.message });
    }
});

// Record grades (Adviser/Lecturer only)
router.post('/', async (req, res) => {
    try {
        const { studentId, courseId, academicSession, semester, score, recordedBy } = req.body;

        if (!studentId || !courseId || !academicSession || !semester || score === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Calculate grade based on score
        let grade, gradePoint, status;
        if (score >= 70) {
            grade = 'A';
            gradePoint = 4.0;
        } else if (score >= 60) {
            grade = 'B';
            gradePoint = 3.0;
        } else if (score >= 50) {
            grade = 'C';
            gradePoint = 2.0;
        } else if (score >= 40) {
            grade = 'D';
            gradePoint = 1.0;
        } else {
            grade = 'F';
            gradePoint = 0.0;
        }

        status = score >= 40 ? 'pass' : 'fail';

        const record = await AcademicRecord.create({
            student: studentId,
            course: courseId,
            academicSession,
            semester,
            score,
            grade,
            gradePoint,
            status,
            recordedBy
        });

        res.status(201).json({ message: 'Grade recorded successfully', record });
    } catch (error) {
        res.status(500).json({ message: 'Error recording grade', error: error.message });
    }
});

// Get student CGPA
router.get('/cgpa/:studentId', async (req, res) => {
    try {
        const records = await AcademicRecord.find({ student: req.params.studentId, status: 'pass' });
        
        if (records.length === 0) {
            return res.json({ cgpa: 0, totalCredits: 0 });
        }

        let totalPoints = 0;
        let totalCredits = 0;

        for (let record of records) {
            const course = await record.populate('course');
            totalPoints += record.gradePoint * course.course.creditUnits;
            totalCredits += course.course.creditUnits;
        }

        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

        res.json({ cgpa, totalCredits, records: records.length });
    } catch (error) {
        res.status(500).json({ message: 'Error calculating CGPA', error: error.message });
    }
});

module.exports = router;
