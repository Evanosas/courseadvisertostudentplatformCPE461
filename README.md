# Course Adviser to Student Platform

> **CPE 461 — Software Engineering II | University of Benin | 2025/2026 Academic Session**

A full-stack web application that bridges the communication and administrative gap between course advisers and students. The platform provides secure, role-based access to academic records, advisory notes, session management, and course guidance tools; streamlining the entire advising workflow for both parties.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Contributors](#contributors)
- [License](#license)

---

## Overview

The **Course Adviser to Student Platform** is developed by Group 7 for CPE 461 at the University of Benin. It is designed to solve the practical problem of fragmented, informal communication between students and their academic advisers by providing a centralised digital platform where:

- **Students** can register via Google OAuth, request advising sessions, and receive personalised course recommendations.
- **Course Advisers** can log in with their credentials, manage student session requests, send course recommendations, and track student profiles.

Both user roles operate within a single system with clearly separated dashboards, permissions, and data flows; enforced by role-based access control (RBAC) via JSON Web Tokens (JWT).

---

## Features

### For Students
- Register and log in securely via **Google OAuth 2.0**
- View a personalised student dashboard
- Submit advising session requests with preferred date, subject, and notes
- Receive and view course recommendations from assigned advisers
- Track session status (pending, confirmed, completed)

### For Course Advisers
- Log in using email and password (bcrypt-hashed, JWT-authenticated)
- View and manage all pending and confirmed student session requests
- Send course recommendations (course code, name, semester, rationale) to specific students
- View student profiles and academic details

### System-wide
- Secure JWT-based authentication with role enforcement on every API route
- Persistent data storage via MongoDB
- RESTful API architecture with clean separation of routes, models, and business logic
- API endpoint testing via included test script

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js (v18+) |
| Web Framework | Express.js |
| Database | MongoDB with Mongoose ODM |
| Authentication | Google OAuth 2.0 (students) · JWT + bcrypt (advisers) |
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Version Control | Git + GitHub |
| Environment Config | dotenv |
| API Testing | Custom test script (`test_api.js`) |

---

## Repository Structure

```
courseadvisertostudentplatformCPE461/
│
├── frontend/                 # Client-side HTML, CSS, and JavaScript files
│   ├── student-dashboard.html
│   ├── adviser-dashboard.html
│   └── login.html
│
├── models/                   # Mongoose schema definitions
│   ├── Student.js            # Student user model (googleId, name, email, role)
│   ├── Adviser.js            # Adviser user model (email, hashedPassword, role)
│   ├── Session.js            # Advising session model (studentId, adviserId, status)
│   └── Recommendation.js    # Course recommendation model
│
├── routes/                   # Express route handlers
│   ├── auth.js               # Authentication routes (/auth/google, /auth/login)
│   ├── students.js           # Student-specific routes
│   ├── advisers.js           # Adviser-specific routes
│   ├── sessions.js           # Advising session CRUD routes
│   └── recommendations.js   # Course recommendation routes
│
├── node_modules/             # npm dependencies (auto-generated)
├── .env.example              # Template for required environment variables
├── .gitignore                # Files excluded from version control
├── AUTH_SETUP_GUIDE.md       # Authentication configuration guide
├── COMPLETE_SETUP_GUIDE.md   # Full project installation walkthrough
├── package.json              # Project metadata and dependency list
├── package-lock.json         # Locked dependency version tree
├── server.js                 # Application entry point — initialises Express and routes
└── test_api.js               # Script for automated API endpoint testing
```

> **Note:** The `frontend/`, `models/`, and `routes/` folder contents above reflect the expected structure based on the project design. Refer to the actual repository for the definitive file listing.

---

## Getting Started

### Prerequisites

Ensure the following are installed on your machine before proceeding:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- A running [MongoDB](https://www.mongodb.com/) instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Google Cloud project with OAuth 2.0 credentials configured (for student login); see [AUTH_SETUP_GUIDE.md](./AUTH_SETUP_GUIDE.md)

### Installation

**1. Clone the repository:**

```bash
git clone https://github.com/Evanosas/courseadvisertostudentplatformCPE461.git
cd courseadvisertostudentplatformCPE461
```

**2. Install dependencies:**

```bash
npm install
```

### Environment Variables

**3. Create your `.env` file from the provided template:**

```bash
cp .env.example .env
```

**4. Open `.env` and fill in the required values:**

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

> For detailed authentication setup (Google OAuth credentials, JWT configuration), refer to [AUTH_SETUP_GUIDE.md](./AUTH_SETUP_GUIDE.md).  
> For the complete environment and deployment walkthrough, refer to [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md).

### Running the Application

**5. Start the server:**

```bash
# Production
npm start

# Development (with auto-reload via nodemon)
npm run dev
```

The server will start on the port specified in your `.env` file (default: `http://localhost:3000`).

---

## API Overview

The backend exposes a RESTful API. All protected routes require a valid JWT passed in the `Authorization` header as `Bearer <token>`.

| Method | Endpoint | Auth Required | Role | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/auth/google` | No | Student | Initiates Google OAuth flow |
| `GET` | `/auth/google/callback` | No | Student | Google OAuth callback handler |
| `POST` | `/auth/login` | No | Adviser | Adviser login with email + password |
| `GET` | `/api/sessions` | Yes | Adviser | Fetch all sessions for the adviser |
| `POST` | `/api/sessions` | Yes | Student | Submit a new advising session request |
| `PATCH` | `/api/sessions/:id` | Yes | Adviser | Update session status (confirm/decline) |
| `GET` | `/api/recommendations` | Yes | Student | Fetch recommendations for the student |
| `POST` | `/api/recommendations` | Yes | Adviser | Send a course recommendation to a student |
| `GET` | `/api/students/:id` | Yes | Adviser | View a student's profile |

> This table reflects the intended API design based on the project specification. Run `node test_api.js` to verify live endpoint behaviour.

---

## Testing

A test script is included to verify that all backend API endpoints are reachable and returning the expected responses.

```bash
node test_api.js
```

Ensure the server is running before executing the test script. The script will log the result of each endpoint call to the console, including HTTP status codes and response payloads.

---

## Contributors

This project was developed by **Group 7** for the CPE 461 Software Engineering course, 2025/2026 academic session, at the University of Benin.

| S/N | Name | Role | GitHub |
| :---: | :--- | :--- | :--- |
| 1 | Osamudiamen Obeira | Backend Engineer | [@Evanosas](https://github.com/Evanosas) |
| 2 | Amos Agbaje | Frontend Engineer | [@amosagbaje](https://github.com/amosagbaje) |
| 3 | Fawaz Sanu | Frontend & Backend Engineer | [@fawazsanu](https://github.com/fawazsanu) |
| 4 | Chidalu Okereke | Project Manager · UI/UX Designer | [@annabanana05](https://github.com/annabanana05) |
| 5 | Obianuju Okeke | Database Admin · Quality Assurance | [@KvngDiva](https://github.com/KvngDiva) |
| 6 | Chinonye Ogbonna | API Integration · Documentation | [@nonyecyber](https://github.com/nonyecyber) |
| 7 | Success Oaikhena | Documentation · Quality Assurance | [@Oaikhenasuccess-dev](https://github.com/Oaikhenasuccess-dev) |
| 8 | Esther Momodu | Frontend Engineer · Project Manager | [@BarbieDollx](https://github.com/BarbieDollx) |
| 9 | Armstrong Ogboanor | UI/UX Designer | [@ogboanorarmstrong-debug](https://github.com/ogboanorarmstrong-debug) |

---

## License

This project was created for academic purposes under CPE 461 at the University of Benin. Please consult the repository owner ([@Evanosas](https://github.com/Evanosas)) regarding any distribution or commercial use.
