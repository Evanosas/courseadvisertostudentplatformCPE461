const express = require('express');
const router = express.Router();
const IDCardRequest = require('../models/idCardRequest');

// Get student's ID card requests
router.get('/student/:studentId', async (req, res) => {
    try {
        const requests = await IDCardRequest.find({ student: req.params.studentId })
            .populate('approvedBy', 'fullName email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
});

// Submit ID card request
router.post('/', async (req, res) => {
    try {
        const { studentId, requestType } = req.body;

        if (!studentId || !requestType) {
            return res.status(400).json({ message: 'Student ID and request type required' });
        }

        const trackingNumber = 'IDC-' + Date.now();

        const request = await IDCardRequest.create({
            student: studentId,
            requestType,
            trackingNumber
        });

        res.status(201).json({ message: 'ID card request submitted', request });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting request', error: error.message });
    }
});

// Get pending requests (Adviser only)
router.get('/pending/:adviserId', async (req, res) => {
    try {
        const requests = await IDCardRequest.find({ status: 'submitted' })
            .populate('student', 'fullName email matricNo');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
});

// Approve request (Adviser only)
router.put('/:requestId/approve', async (req, res) => {
    try {
        const { adviserId } = req.body;

        const request = await IDCardRequest.findByIdAndUpdate(
            req.params.requestId,
            {
                status: 'processing',
                approvedBy: adviserId,
                approvalDate: Date.now()
            },
            { new: true }
        );

        res.json({ message: 'Request approved', request });
    } catch (error) {
        res.status(500).json({ message: 'Error approving request', error: error.message });
    }
});

// Complete request
router.put('/:requestId/complete', async (req, res) => {
    try {
        const request = await IDCardRequest.findByIdAndUpdate(
            req.params.requestId,
            { status: 'completed' },
            { new: true }
        );

        res.json({ message: 'Request completed', request });
    } catch (error) {
        res.status(500).json({ message: 'Error completing request', error: error.message });
    }
});

module.exports = router;
