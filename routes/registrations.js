const express = require('express');
const router = express.Router();
const CourseRegistration = require('../models/courseRegistration');

// Get student's registrations
router.get('/student/:studentId', async (req, res) => {
    try {
        const registrations = await CourseRegistration.find({ student: req.params.studentId })
            .populate('course')
            .populate('approvedBy', 'fullName email');
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching registrations', error: error.message });
    }
});

// Register for a course
router.post('/', async (req, res) => {
    try {
        const { studentId, courseId } = req.body;

        if (!studentId || !courseId) {
            return res.status(400).json({ message: 'Student ID and Course ID required' });
        }

        // Check if already registered
        const existing = await CourseRegistration.findOne({ student: studentId, course: courseId });
        if (existing) {
            return res.status(400).json({ message: 'Already registered for this course' });
        }

        const registration = await CourseRegistration.create({
            student: studentId,
            course: courseId,
            status: 'pending'
        });

        res.status(201).json({ message: 'Course registration submitted', registration });
    } catch (error) {
        res.status(500).json({ message: 'Error registering for course', error: error.message });
    }
});

// Approve registration (Adviser only)
router.put('/:registrationId/approve', async (req, res) => {
    try {
        const { adviserId } = req.body;

        const registration = await CourseRegistration.findByIdAndUpdate(
            req.params.registrationId,
            {
                status: 'approved',
                approvedBy: adviserId,
                approvalDate: Date.now()
            },
            { new: true }
        );

        res.json({ message: 'Registration approved', registration });
    } catch (error) {
        res.status(500).json({ message: 'Error approving registration', error: error.message });
    }
});

// Reject registration (Adviser only)
router.put('/:registrationId/reject', async (req, res) => {
    try {
        const { notes } = req.body;

        const registration = await CourseRegistration.findByIdAndUpdate(
            req.params.registrationId,
            {
                status: 'rejected',
                notes
            },
            { new: true }
        );

        res.json({ message: 'Registration rejected', registration });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting registration', error: error.message });
    }
});

// Get pending registrations for adviser
router.get('/pending/:adviserId', async (req, res) => {
    try {
        const registrations = await CourseRegistration.find({ status: 'pending' })
            .populate('student', 'fullName email matricNo')
            .populate('course', 'courseCode courseName');
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending registrations', error: error.message });
    }
});

module.exports = router;
