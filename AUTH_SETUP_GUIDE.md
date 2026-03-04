# CourseQ - Authentication Setup Guide

## 🚀 Quick Start

Your authentication system is now ready! Here's how to set it up:

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/courseq
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=session-secret-key
```

### 3. Google OAuth Setup (Optional but Recommended)

To enable Google login/registration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add to Authorized origins: `http://localhost:5000`
6. Add to Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
7. Copy your credentials to `.env`:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Start the Server

```bash
npm start
```

Visit: `http://localhost:5000`

## 📝 Features

### Login/Registration Page
- **Two User Types**: Student and Course Adviser
- **Email/Password Registration**: With password hashing via bcryptjs
- **Google OAuth**: One-click login/registration
- **Form Validation**: Real-time error messages

### Authentication Flow
1. Users register with:
   - Full Name
   - Email
   - Password (or Google account)
   - Matric Number (Students) or Staff ID + Department (Advisers)

2. After login/registration:
   - JWT token created
   - Token stored in localStorage
   - Redirected to dashboard
   - User info displayed on sidebar

3. Protected Routes:
   - Main dashboard requires valid token
   - Token checked on page load
   - Unauthorized users redirected to login

### Database Schema

**Student Model**
```
- fullName
- email (unique)
- password (hashed)
- matricNo
- googleId (optional)
- registeredWith ('email' or 'google')
- courseAdviser (reference to Adviser)
- createdAt
```

**Adviser Model**
```
- fullName
- email (unique)
- password (hashed)
- staffId (unique)
- department
- googleId (optional)
- registeredWith ('email' or 'google')
- students (array of Student references)
- createdAt
```

## 🔐 Security Features

✅ Password hashing with bcryptjs (10 salt rounds)
✅ JWT token-based authentication
✅ HTTP-only session handling
✅ Input validation on backend
✅ 7-day token expiration

## 🔌 API Endpoints

### Authentication Routes

**POST /api/auth/register**
- Register new user (student or adviser)
- Body: `{ fullName, email, password, userType, matricNo/staffId, department }`

**POST /api/auth/login**
- Login with email/password
- Body: `{ email, password, userType }`

**GET /api/auth/google**
- Initiate Google OAuth flow

**GET /api/auth/google/callback**
- Google OAuth callback URL

**POST /api/auth/logout**
- Logout current user

**GET /api/auth/me**
- Get current user info (protected route)

## 📱 Frontend Files

- **login.html** - New login/registration page
  - Tab-based UI (Login/Register)
  - User type selector
  - Google OAuth button
  - Form validation & error messages

- **index.html** - Updated dashboard
  - Logout button in sidebar
  - User name display
  - Protected by token check

- **script.js** - Updated with auth logic
  - Token management
  - User info display
  - Authentication check
  - Logout handler

## 🛠️ Next Steps

1. Install dependencies: `npm install`
2. Set up MongoDB (local or Atlas)
3. Configure `.env` with your credentials
4. Set up Google OAuth (optional)
5. Run: `npm start`

## 📚 Technologies Used

- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: 
  - JWT (jsonwebtoken)
  - Passport.js with Google OAuth 2.0
  - bcryptjs for password hashing
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Session Management**: express-session

## ⚠️ Important Notes

- Change `JWT_SECRET` and `SESSION_SECRET` in production
- Never commit `.env` file to version control
- Use HTTPS in production
- Set secure cookie flags for production
- Implement rate limiting for authentication endpoints in production

## 🐛 Troubleshooting

**"Google login not working"**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Check that redirect URI matches in Google Console

**"Token is invalid"**
- Ensure JWT_SECRET matches between requests
- Check token hasn't expired (7 days)

**"MongoDB connection failed"**
- Verify MongoDB is running locally or MONGO_URI is correct
- Check network connectivity to MongoDB Atlas (if using cloud)

---

**Happy coding! 🎉**
