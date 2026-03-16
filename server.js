
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Import Models
const Student = require('./models/student');
const Adviser = require('./models/adviser');
const Course = require('./models/course');
const CourseRegistration = require('./models/courseRegistration');
const AcademicRecord = require('./models/academicRecord');
const IDCardRequest = require('./models/idCardRequest');
const Message = require('./models/message');

// Import Routes
const courseRoutes = require('./routes/courses');
const registrationRoutes = require('./routes/registrations');
const academicRecordRoutes = require('./routes/academicRecords');
const idCardRequestRoutes = require('./routes/idCardRequests');
const adviserRoutes = require('./routes/advisers');
const messageRoutes = require('./routes/messages');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'session-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// ==================== DATABASE & SERVER STARTUP ====================
const startApp = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/courseq', {
            bufferCommands: true,
            serverSelectionTimeoutMS: 10000,
        });

        console.log('✅ MongoDB Connected Successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('❌ Critical Startup Error:', err.message);
        process.exit(1);
    }
};

startApp();

// ==================== PASSPORT GOOGLE OAUTH ====================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.warn("Database not ready yet.");
        }

        const email = profile.emails[0].value;
        const fullName = profile.displayName;
        const googleId = profile.id;

        let user = await Student.findOne({ googleId });
        if (!user) {
            user = await Adviser.findOne({ googleId });
        }

        if (!user) {
            return done(null, { email, fullName, googleId, newUser: true });
        }

        return done(null, user);
    } catch (error) {
        console.error("Error in Google Strategy:", error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, {
        id: user._id || user.id,
        userType: user.matricNo ? 'student' : 'adviser'
    });
});

passport.deserializeUser(async (data, done) => {
    try {
        let user;
        if (data.userType === 'student') {
            user = await Student.findById(data.id);
        } else {
            user = await Adviser.findById(data.id);
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

function generateToken(user, userType) {
    return jwt.sign({
        userId: user._id,
        email: user.email,
        userType: userType
    }, JWT_SECRET, { expiresIn: '7d' });
}

// ==================== AUTH ROUTES ====================

// Register Route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, userType, matricNo, staffId, department, adviserEmail, registeredWith } = req.body;

        if (!fullName || !email || !password || !userType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (userType === 'student' && !matricNo) {
            return res.status(400).json({ message: 'Matric number required for students' });
        }

        if (userType === 'adviser' && (!staffId || !department)) {
            return res.status(400).json({ message: 'Staff ID and Department required for advisers' });
        }

        // Check if email already exists
        let existingUser = await Student.findOne({ email });
        if (!existingUser) {
            existingUser = await Adviser.findOne({ email });
        }

        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        let user;
        if (userType === 'student') {
            const studentData = {
                fullName,
                email,
                password: hashedPassword,
                matricNo,
                registeredWith: registeredWith || 'email'
            };
            if (adviserEmail) {
                const adv = await Adviser.findOne({ email: adviserEmail });
                if (adv) {
                    studentData.courseAdviser = adv._id;
                }
            }
            user = await Student.create(studentData);
        } else {
            user = await Adviser.create({
                fullName,
                email,
                password: hashedPassword,
                staffId,
                department,
                registeredWith: registeredWith || 'email'
            });
        }

        const token = generateToken(user, userType);

        res.json({
            message: 'Registration successful',
            token,
            userType,
            userId: user._id,
            userName: user.fullName
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        if (!email || !password || !userType) {
            return res.status(400).json({ message: 'Email, password, and user type required' });
        }

        let user;
        if (userType === 'student') {
            user = await Student.findOne({ email });
        } else {
            user = await Adviser.findOne({ email });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const validPassword = await bcryptjs.compare(password, user.password || '');
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user, userType);

        res.json({
            message: 'Login successful',
            token,
            userType,
            userId: user._id,
            userName: user.fullName
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Google OAuth Routes
app.get('/api/auth/google',
    (req, res, next) => {
        if (req.query.register === 'true') {
            req.session.registerMode = true;
        }
        if (req.query.userType) {
            req.session.userType = req.query.userType;
        }
        next();
    },
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    async (req, res) => {
        try {
            const profile = req.user;
            const userType = req.session.userType || 'student';
            const isRegisterMode = req.session.registerMode;

            let user = profile._id ? profile : null;

            if (!user && profile.newUser) {
                const email = profile.email;
                const fullName = profile.fullName;
                const googleId = profile.googleId;

                if (userType === 'student') {
                    user = await Student.create({
                        fullName,
                        email,
                        googleId,
                        registeredWith: 'google'
                    });
                } else {
                    user = await Adviser.create({
                        fullName,
                        email,
                        googleId,
                        registeredWith: 'google'
                    });
                }
            }

            if (!user) {
                return res.redirect('/login.html?error=google-auth-failed');
            }

            const token = generateToken(user, userType);

            res.redirect(`/?token=${token}&userType=${userType}&userId=${user._id}&userName=${encodeURIComponent(user.fullName)}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect('/login.html?error=auth-failed');
        }
    }
);

// Logout Route
app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user profile (enhanced)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const { userId, userType } = req.user;
        let user;

        if (userType === 'student') {
            user = await Student.findById(userId)
                .populate('courseAdviser', 'fullName email department staffId');
            if (!user) return res.status(404).json({ message: 'Student not found' });

            // Get additional stats
            const registrations = await CourseRegistration.find({ student: userId });
            const records = await AcademicRecord.find({ student: userId });
            const pendingCount = registrations.filter(r => r.status === 'pending').length;
            const totalCredits = records.reduce((sum, r) => sum + (r.gradePoint || 0), 0);

            res.json({
                ...user.toObject(),
                userType: 'student',
                stats: {
                    coursesRegistered: registrations.length,
                    pendingApprovals: pendingCount,
                    totalRecords: records.length
                }
            });
        } else {
            user = await Adviser.findById(userId);
            if (!user) return res.status(404).json({ message: 'Adviser not found' });

            // Get adviser stats
            const students = await Student.find({ courseAdviser: userId });
            const pendingRegs = await CourseRegistration.find({ status: 'pending' });
            const pendingIds = await IDCardRequest.find({ status: 'submitted' });

            res.json({
                ...user.toObject(),
                userType: 'adviser',
                stats: {
                    totalStudents: students.length,
                    pendingRegistrations: pendingRegs.length,
                    pendingIdRequests: pendingIds.length
                }
            });
        }
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const updates = req.body;

        // Only allow safe fields to be updated
        const allowedStudentFields = ['fullName', 'phone', 'level', 'department'];
        const allowedAdviserFields = ['fullName', 'phone', 'department', 'officeHours', 'officeLocation'];

        const allowedFields = userType === 'student' ? allowedStudentFields : allowedAdviserFields;
        const safeUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                safeUpdates[key] = updates[key];
            }
        }

        let user;
        if (userType === 'student') {
            user = await Student.findByIdAndUpdate(userId, safeUpdates, { new: true });
        } else {
            user = await Adviser.findByIdAndUpdate(userId, safeUpdates, { new: true });
        }

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// ==================== API ROUTES (ALL PROTECTED) ====================
app.use('/api/courses', authenticateToken, courseRoutes);
app.use('/api/registrations', authenticateToken, registrationRoutes);
app.use('/api/academic-records', authenticateToken, academicRecordRoutes);
app.use('/api/id-card-requests', authenticateToken, idCardRequestRoutes);
app.use('/api/advisers', authenticateToken, adviserRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);

// List all advisers (for student selection)
app.get('/api/advisers-list', authenticateToken, async (req, res) => {
    try {
        const advisers = await Adviser.find({}).select('fullName email department staffId');
        res.json(advisers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching advisers', error: error.message });
    }
});

// Student chooses an adviser
app.put('/api/auth/choose-adviser', authenticateToken, async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { adviserId } = req.body;

        if (userType !== 'student') {
            return res.status(403).json({ message: 'Only students can choose an adviser' });
        }

        if (!adviserId) {
            return res.status(400).json({ message: 'Adviser ID is required' });
        }

        const adviser = await Adviser.findById(adviserId);
        if (!adviser) {
            return res.status(404).json({ message: 'Adviser not found' });
        }

        // Update student's adviser
        await Student.findByIdAndUpdate(userId, { courseAdviser: adviserId });

        // Add student to adviser's list if not already there
        if (!adviser.assignedStudents || !adviser.assignedStudents.includes(userId)) {
            await Adviser.findByIdAndUpdate(adviserId, { $addToSet: { assignedStudents: userId } });
        }

        res.json({ message: `Successfully assigned to ${adviser.fullName}`, adviser: { fullName: adviser.fullName, email: adviser.email, department: adviser.department, staffId: adviser.staffId } });
    } catch (error) {
        console.error('Choose adviser error:', error);
        res.status(500).json({ message: 'Error choosing adviser', error: error.message });
    }
});

// ==================== PAGE ROUTES ====================

// Serve login page
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// Serve student dashboard
app.get('/student-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'student-dashboard.html'));
});

// Serve adviser dashboard
app.get('/adviser-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'adviser-dashboard.html'));
});

// Main route - router page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ==================== SEED DATA ====================
app.get('/api/seed', async (req, res) => {
    try {
        // Clear existing courses and re-seed with correct CPE courses
        await Course.deleteMany({});
        await Course.insertMany([
            // 400-Level First Semester
            { courseCode: 'CPE451', courseName: 'Computer Architecture & Organization', creditUnits: 3, level: '400', semester: 'First', department: 'Computer Engineering', capacity: 120 },
            { courseCode: 'CPE453', courseName: 'Embedded Systems Design', creditUnits: 3, level: '400', semester: 'First', department: 'Computer Engineering', capacity: 120 },
            { courseCode: 'CPE457', courseName: 'Operating Systems', creditUnits: 3, level: '400', semester: 'First', department: 'Computer Engineering', capacity: 120 },
            { courseCode: 'CPE461', courseName: 'Engineering Design & Project I', creditUnits: 4, level: '400', semester: 'First', department: 'Computer Engineering', capacity: 120 },
            { courseCode: 'CPE475', courseName: 'Artificial Intelligence', creditUnits: 3, level: '400', semester: 'First', department: 'Computer Engineering', capacity: 120 },
            { courseCode: 'CPE433', courseName: 'Data Communication & Networks', creditUnits: 3, level: '400', semester: 'First', department: 'Computer Engineering', capacity: 120 },
            // 400-Level Second Semester
            { courseCode: 'CPE401', courseName: 'Industrial Training (SIWES)', creditUnits: 6, level: '400', semester: 'Second', department: 'Computer Engineering', capacity: 120 },
            { courseCode: 'CPE499', courseName: 'Engineering Design & Project II', creditUnits: 4, level: '400', semester: 'Second', department: 'Computer Engineering', capacity: 120 },
            // 300-Level
            { courseCode: 'CED300', courseName: 'Engineering Communication', creditUnits: 2, level: '300', semester: 'First', department: 'General Engineering', capacity: 200 },
            { courseCode: 'CPE301', courseName: 'Data Structures & Algorithms', creditUnits: 3, level: '300', semester: 'First', department: 'Computer Engineering', capacity: 150 },
            { courseCode: 'CPE303', courseName: 'Database Management Systems', creditUnits: 3, level: '300', semester: 'First', department: 'Computer Engineering', capacity: 150 },
            { courseCode: 'CPE305', courseName: 'Digital Logic Design', creditUnits: 3, level: '300', semester: 'First', department: 'Computer Engineering', capacity: 150 },
            { courseCode: 'CPE307', courseName: 'Signals & Systems', creditUnits: 3, level: '300', semester: 'Second', department: 'Computer Engineering', capacity: 150 },
            { courseCode: 'CPE309', courseName: 'Computer Networks I', creditUnits: 3, level: '300', semester: 'Second', department: 'Computer Engineering', capacity: 150 },
        ]);
        res.json({ message: 'Seeding complete — 13 CPE courses added' });
    } catch (err) {
        console.error('Seed error', err);
        res.status(500).json({ message: 'Error during seeding' });
    }
});
