const express = require('express');
const router = express.Router();
const Adviser = require('../models/adviser');
const Student = require('../models/student');

// Get students assigned to an adviser
router.get('/:adviserId/students', async (req, res) => {
    try {
        const adviserId = req.params.adviserId;
        // either populate or query students
        const students = await Student.find({ courseAdviser: adviserId }).select('fullName email matricNo');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

module.exports = router;