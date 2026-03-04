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

// Import Routes
const courseRoutes = require('./routes/courses');
const registrationRoutes = require('./routes/registrations');
const academicRecordRoutes = require('./routes/academicRecords');
const idCardRequestRoutes = require('./routes/idCardRequests');

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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/courseq')
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('Connection Error:', err));

mongoose.connection.on('error', err => {
    console.error('Mongoose runtime error:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Passport Google OAuth Configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const fullName = profile.displayName;
        const googleId = profile.id;

        // Check if user already exists
        let user = await Student.findOne({ googleId });
        if (!user) {
            user = await Adviser.findOne({ googleId });
        }

        if (!user) {
            // User doesn't exist, they'll be created after we determine their type
            return done(null, { email, fullName, googleId, newUser: true });
        }

        return done(null, user);
    } catch (error) {
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

// Authentication Middleware
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

// Helper function to generate JWT
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
        const { fullName, email, password, userType, matricNo, staffId, department, registeredWith } = req.body;

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

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        let user;
        if (userType === 'student') {
            user = await Student.create({
                fullName,
                email,
                password: hashedPassword,
                matricNo,
                registeredWith: registeredWith || 'email'
            });
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

        // Compare passwords
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
        // allow frontend to pass userType and register flag
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
                // Create new user
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

            // Redirect to main page with token
            res.redirect(`/?token=${token}&userType=${userType}&userId=${user._id}&userName=${user.fullName}`);
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

// Check Auth Status
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

// ==================== MAIN ROUTES ====================

// Serve login page
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// Use API routes
app.use('/api/courses', courseRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/academic-records', academicRecordRoutes);
app.use('/api/id-card-requests', idCardRequestRoutes);

// Main protected route - check if user is authenticated
app.get('/', (req, res) => {
    const token = req.query.token;
    if (token) {
        // Token passed via query, let frontend handle verification
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    } else {
        // Check if token in request headers
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
        } else {
            // No token found, redirect to login
            res.redirect('/login.html');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});