# CourseQ - Complete Backend & Database Setup Guide

## ✅ What's Been Set Up

Your authentication and backend system is now complete with:

### **Authentication System**
- ✅ Login/Registration page with email & password
- ✅ Google OAuth 2.0 integration
- ✅ JWT token-based sessions
- ✅ Password hashing (bcryptjs)
- ✅ User verification on protected routes

### **Database Models**
1. **Student** - Students with matriculation numbers
2. **Adviser** - Course advisers with staff IDs
3. **Course** - Course information
4. **CourseRegistration** - Student course registrations with approval workflow
5. **AcademicRecord** - Student grades and GPA calculations
6. **IDCardRequest** - Student ID card requests

### **API Routes**
- `/api/auth/*` - Authentication endpoints
- `/api/courses` - Course management
- `/api/registrations` - Student registrations
- `/api/academic-records` - Academic records & CGPA
- `/api/id-card-requests` - ID card requests

---

## 🚀 Quick Start - MongoDB Setup

Choose ONE option below:

### **Option 1: MongoDB Atlas (Cloud) - RECOMMENDED**

This is the easiest and best for production.

#### Steps:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/)
2. Create a **free account**
3. Create a **new project**
4. Create a **new cluster** (choose free tier)
5. Wait for cluster to be ready
6. Click **CONNECT**
7. Create a **Database User** (remember the username & password)
8. Choose **"Connect your application"**
9. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/courseq?retryWrites=true&w=majority`)
10. Update your `.env` file:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster-name.mongodb.net/courseq?retryWrites=true&w=majority
```

Replace `USERNAME`, `PASSWORD`, and `cluster-name` with your actual values.

---

### **Option 2: MongoDB Community (Local) - For Development**

#### For Windows:

1. Download [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Run the installer (`.msi` file)
3. Choose "Complete" installation
4. Check "Install MongoDB as a Service"
5. MongoDB will start automatically
6. Your `.env` already has: `MONGO_URI=mongodb://localhost:27017/courseq`

#### For macOS:
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

#### For Linux (Ubuntu):
```bash
# Install MongoDB
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
```

---

## 🔧 Environment Configuration

Your `.env` file is already created at the root. Here's what each variable does:

```env
PORT=5001                                    # Server port
NODE_ENV=development                         # Development mode
MONGO_URI=mongodb://localhost:27017/courseq  # MongoDB connection string
JWT_SECRET=your-secret-key                   # JWT signing key (change in production!)
SESSION_SECRET=session-secret-key            # Session encryption key
GOOGLE_CLIENT_ID=                            # Leave empty if not using Google OAuth yet
GOOGLE_CLIENT_SECRET=                        # Leave empty if not using Google OAuth yet
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

---

## 🔐 Google OAuth Setup (Optional)

To enable "Sign in with Google":

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a **new project**
3. Search for **"Google+ API"** and enable it
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose application type: **Web application**
6. Add **Authorized JavaScript origins**: `http://localhost:5001`
7. Add **Authorized redirect URIs**: `http://localhost:5001/api/auth/google/callback`
8. Copy the **Client ID** and **Client Secret**
9. Add to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

---

## ▶️ Running the Server

After setting up MongoDB:

```bash
# Install dependencies (already done)
npm install

# Start development server
npm start

# Server runs on: http://localhost:5001
```

---

## 🌐 Accessing Your Application

- **Login Page**: http://localhost:5001
- **API Base**: http://localhost:5001/api
- **MongoDB Data**: Managed automatically

---

## 📝 Database Structure

### **Student Collection**
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  matricNo: String,
  googleId: String (optional),
  registeredWith: "email" | "google",
  courseAdviser: ObjectId (reference to Adviser),
  createdAt: Date
}
```

### **Adviser Collection**
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  staffId: String (unique),
  department: String,
  googleId: String (optional),
  registeredWith: "email" | "google",
  students: [ObjectId] (references to Students),
  createdAt: Date
}
```

### **Course Collection**
```javascript
{
  _id: ObjectId,
  courseCode: String (unique, e.g., "CS101"),
  courseName: String,
  creditUnits: Number,
  level: String (e.g., "100", "200", "300"),
  semester: "First" | "Second",
  department: String,
  lecturer: ObjectId (reference to Adviser),
  capacity: Number,
  registered: Number,
  description: String,
  createdAt: Date
}
```

### **CourseRegistration Collection**
```javascript
{
  _id: ObjectId,
  student: ObjectId,
  course: ObjectId,
  registrationDate: Date,
  status: "pending" | "approved" | "rejected" | "completed",
  approvedBy: ObjectId (reference to Adviser),
  approvalDate: Date,
  notes: String
}
```

### **AcademicRecord Collection**
```javascript
{
  _id: ObjectId,
  student: ObjectId,
  course: ObjectId,
  academicSession: String (e.g., "2023/2024"),
  semester: "First" | "Second",
  score: Number (0-100),
  grade: String (A, B, C, D, F),
  gradePoint: Number (0-4.0),
  status: "pass" | "fail" | "incomplete",
  recordedBy: ObjectId (reference to Adviser),
  recordedDate: Date
}
```

### **IDCardRequest Collection**
```javascript
{
  _id: ObjectId,
  student: ObjectId,
  requestType: "new" | "renewal" | "replacement",
  requestDate: Date,
  status: "submitted" | "processing" | "completed" | "rejected",
  approvedBy: ObjectId (reference to Adviser),
  approvalDate: Date,
  notes: String,
  trackingNumber: String
}
```

---

## 🔌 API Endpoint Examples

### **Authentication**
```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login with email/password
GET    /api/auth/google             - Start Google OAuth flow
POST   /api/auth/logout             - Logout user
GET    /api/auth/me                 - Get current user info
```

### **Courses**
```
GET    /api/courses                 - Get all courses
GET    /api/courses/level/:level    - Get courses by level
POST   /api/courses                 - Create course (Adviser only)
PUT    /api/courses/:id             - Update course (Adviser only)
DELETE /api/courses/:id             - Delete course (Adviser only)
```

### **Course Registration**
```
GET    /api/registrations/student/:id      - Get student's registrations
POST   /api/registrations                   - Register for course
GET    /api/registrations/pending/:id       - Get pending registrations (Adviser)
PUT    /api/registrations/:id/approve       - Approve registration (Adviser)
PUT    /api/registrations/:id/reject        - Reject registration (Adviser)
```

### **Academic Records**
```
GET    /api/academic-records/student/:id   - Get student's grades
POST   /api/academic-records                - Record grades (Adviser only)
GET    /api/academic-records/cgpa/:id      - Calculate student's CGPA
```

### **ID Card Requests**
```
GET    /api/id-card-requests/student/:id   - Get student's requests
POST   /api/id-card-requests                - Submit request
GET    /api/id-card-requests/pending/:id   - Get pending (Adviser only)
PUT    /api/id-card-requests/:id/approve    - Approve request (Adviser)
PUT    /api/id-card-requests/:id/complete   - Complete request
```

---

## 🧪 Testing the API

Use **Postman** or **Insomnia** to test endpoints:

### Example: Register a Student
```
POST http://localhost:5001/api/auth/register

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "userType": "student",
  "matricNo": "MKU/2023/001",
  "registeredWith": "email"
}
```

### Example: Login
```
POST http://localhost:5001/api/auth/login

{
  "email": "john@example.com",
  "password": "password123",
  "userType": "student"
}
```

Response will include JWT token - use it for authenticated requests:
```
Authorization: Bearer <token>
```

---

## ⚠️ Important Notes

1. **Change JWT_SECRET in production** - Use a strong random string
2. **Never commit `.env`** to version control
3. **Use HTTPS in production** - Not just HTTP
4. **MongoDB Atlas for production** - Don't use local MongoDB in production
5. **Implement rate limiting** - Especially for auth endpoints
6. **Enable CORS properly** - Currently set to all origins in development

---

## 🐛 Troubleshooting

### Server won't start
- Check if MongoDB is running
- Verify `.env` file has correct `MONGO_URI`
- Try changing `PORT` if 5001 is in use

### MongoDB connection fails
- If using Atlas: Check IP address is whitelisted
- If using local: Install MongoDB or start the service
- Check connection string in `.env`

### Google OAuth not working
- Verify Client ID and Secret in `.env`
- Check redirect URI matches in Google Console
- Make sure you're accessing via `http://localhost:5001` (not 127.0.0.1)

### Token errors
- Check JWT_SECRET is consistent
- Verify token hasn't expired (7 days)
- Ensure token is sent as `Bearer <token>` in Authorization header

---

## 📚 Next Steps

1. ✅ Install dependencies: `npm install`
2. ⏭️ Set up MongoDB (Atlas recommended)
3. ⏭️ Update `.env` with MongoDB URI
4. ⏭️ Run: `npm start`
5. ⏭️ Visit: http://localhost:5001
6. ⏭️ Create a test account
7. ⏭️ Test the OAuth flow (optional)

---

**You're all set! Your complete authentication and database system is ready.** 🎉
