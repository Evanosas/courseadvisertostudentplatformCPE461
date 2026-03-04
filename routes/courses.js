const express = require('express');
const router = express.Router();
const Course = require('../models/course');

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().populate('lecturer', 'fullName email');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

// Get courses by level
router.get('/level/:level', async (req, res) => {
    try {
        const courses = await Course.find({ level: req.params.level }).populate('lecturer', 'fullName email');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

// Create a new course (Admin/Adviser only)
router.post('/', async (req, res) => {
    try {
        const { courseCode, courseName, creditUnits, level, semester, department, lecturer, capacity, description } = req.body;

        if (!courseCode || !courseName || !creditUnits || !level) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const course = await Course.create({
            courseCode,
            courseName,
            creditUnits,
            level,
            semester,
            department,
            lecturer,
            capacity,
            description
        });

        res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
});

// Update a course
router.put('/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: 'Course updated successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
});

// Delete a course
router.delete('/:id', async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
});

module.exports = router;
