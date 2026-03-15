// Authentication Functions
function getToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || localStorage.getItem('token');
    
    if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userType', params.get('userType') || localStorage.getItem('userType'));
        localStorage.setItem('userId', params.get('userId') || localStorage.getItem('userId'));
        localStorage.setItem('userName', params.get('userName') || localStorage.getItem('userName'));
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    return token;
}

function checkAuthentication() {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function displayUserInfo() {
    const userName = localStorage.getItem('userName') || 'Student';
    const userType = localStorage.getItem('userType') || 'student';
    
    document.getElementById('user-name').innerText = userName;
    
    // Show user type / adviser info
    const badge = document.querySelector('.adviser-badge');
    if (userType === 'adviser') {
        badge.innerText = `Role: Course Adviser`;
    } else {
        badge.innerText = '';
    }

    // Load respective dashboard
    if (userType === 'student') {
        loadStudentDashboard();
        displayStudentProfile();
    } else {
        loadAdviserDashboard();
    }
}

// Display student profile card
async function displayStudentProfile() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    try {
        const res = await fetch(`/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const student = await res.json();
        
        const profileDiv = document.getElementById('student-profile');
        if (profileDiv) {
            profileDiv.innerHTML = `
                <h3>👤 Your Profile</h3>
                <div class="profile-info">
                    <div><span class="label">Name:</span><br><span class="value">${student.fullName || userName}</span></div>
                    <div><span class="label">Matric No:</span><br><span class="value">${student.matricNo || 'N/A'}</span></div>
                </div>
            `;
        }
    } catch (err) {
        console.error('Profile fetch error', err);
    }
}
// STUDENT DASHBOARD FUNCTIONS
async function loadStudentDashboard() {
    document.getElementById('student-dashboard').classList.remove('hidden');
    document.getElementById('adviser-dashboard').classList.add('hidden');

    const studentId = localStorage.getItem('userId');
    if (!studentId) return;

    // fetch courses
    try {
        const res = await fetch('/api/courses');
        const courses = await res.json();
        const extra = document.getElementById('student-extra');
        extra.innerHTML = `<h3>Available Courses</h3>`;
        const list = document.createElement('div');
        list.className = 'course-list';
        courses.forEach(c => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `<div class="icon">📚</div><h4>${c.courseCode} - ${c.courseName}</h4><p>Credits: ${c.creditUnits}</p><button onclick="showCourseDetails('${c._id}', '${c.courseCode}', '${c.courseName}', ${c.creditUnits})">View Details</button>`;
            list.appendChild(card);
        });
        extra.appendChild(list);

        // also show your registrations
        const rres = await fetch(`/api/registrations/student/${studentId}`);
        const regs = await rres.json();
        if (regs.length) {
            const regDiv = document.createElement('div');
            regDiv.innerHTML = '<h3>Your Registrations</h3>';
            const ul = document.createElement('ul');
            regs.forEach(r => {
                const li = document.createElement('li');
                li.textContent = `${r.course.courseCode} ${r.course.courseName} - ${r.status}`;
                ul.appendChild(li);
            });
            regDiv.appendChild(ul);
            extra.appendChild(regDiv);
        }

        // academic records
        const arec = await fetch(`/api/academic-records/student/${studentId}`);
        const records = await arec.json();
        if (records.length) {
            const recDiv = document.createElement('div');
            recDiv.innerHTML = '<h3>Your Academic Records</h3>';
            const ul2 = document.createElement('ul');
            records.forEach(r => {
                const li = document.createElement('li');
                li.textContent = `${r.course.courseCode} ${r.course.courseName}: ${r.grade} (${r.score})`;
                ul2.appendChild(li);
            });
            recDiv.appendChild(ul2);
            extra.appendChild(recDiv);
        }

        // ID card requests
        const idres = await fetch(`/api/id-card-requests/student/${studentId}`);
        const ids = await idres.json();
        if (ids.length) {
            const idDiv = document.createElement('div');
            idDiv.innerHTML = '<h3>Your ID Card Requests</h3>';
            const ul3 = document.createElement('ul');
            ids.forEach(r => {
                const li = document.createElement('li');
                li.textContent = `${r.requestType} - ${r.status}`;
                ul3.appendChild(li);
            });
            idDiv.appendChild(ul3);
            extra.appendChild(idDiv);
        }

        // CGPA summary
        const cgpaRes = await fetch(`/api/academic-records/cgpa/${studentId}`);
        if (cgpaRes.ok) {
            const cgpaData = await cgpaRes.json();
            const cgpaDiv = document.createElement('div');
            cgpaDiv.innerHTML = `<h3>Your CGPA</h3><p>CGPA: ${cgpaData.cgpa} (Total credits: ${cgpaData.totalCredits})</p>`;
            extra.insertBefore(cgpaDiv, extra.firstChild);
        }
    } catch (err) {
        console.error('Student dashboard load error', err);
    }
}

async function registerCourse(courseId) {
    const studentId = localStorage.getItem('userId');
    try {
        const res = await fetch('/api/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, courseId })
        });
        const data = await res.json();
        alert(data.message || 'Registration request sent');
        loadStudentDashboard();
    } catch (err) {
        console.error('registerCourse error', err);
        alert('Error registering');
    }
}

// Show course details in modal
let currentCourseId;
function showCourseDetails(courseId, courseCode, courseName, credits) {
    currentCourseId = courseId;
    document.getElementById('course-modal-title').textContent = `${courseCode} - ${courseName}`;
    document.getElementById('course-modal-content').innerHTML = `
        <p><strong>Course Code:</strong> ${courseCode}</p>
        <p><strong>Course Name:</strong> ${courseName}</p>
        <p><strong>Credit Units:</strong> ${credits}</p>
        <p>Review the course details above and click "Register for this Course" to proceed.</p>
    `;
    document.getElementById('course-details-modal').classList.remove('hidden');
}

function closeCourseModal() {
    document.getElementById('course-details-modal').classList.add('hidden');
}

function registerFromModal() {
    registerCourse(currentCourseId);
    closeCourseModal();
}

// Request ID Card function
function requestId() {
    const studentId = localStorage.getItem('userId');
    if (!studentId) {
        alert('You must be logged in as a student to request an ID card.');
        return;
    }
    fetch('/api/id-card-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, requestType: 'renewal' })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || 'ID card request submitted');
        // Optionally reload dashboard
        if (typeof loadStudentDashboard === 'function') loadStudentDashboard();
    })
    .catch(err => {
        console.error('requestId error', err);
        alert('Error submitting request');
    });
}

// ADVISER DASHBOARD FUNCTIONS
async function loadAdviserDashboard() {
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('adviser-dashboard').classList.remove('hidden');

    const adviserId = localStorage.getItem('userId');
    if (!adviserId) return;

    const statsEl = document.getElementById('adviser-stats');

    try {
        // list students
        const sres = await fetch(`/api/advisers/${adviserId}/students`);
        const students = await sres.json();
        const listDiv = document.getElementById('student-list');
        listDiv.innerHTML = '';
        if (students.length) {
            const ul = document.createElement('ul');
            students.forEach(s => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                li.style.padding = '10px';
                li.style.borderBottom = '1px solid #999';
                li.innerHTML = `
                    <span>${s.fullName} (${s.matricNo || ''})</span>
                    <button onclick="openGradeForm('${s._id}', '${s.fullName}', '', '')" style="padding: 5px 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Record Grade</button>
                `;
                ul.appendChild(li);
            });
            listDiv.appendChild(ul);
        } else {
            listDiv.textContent = 'No students assigned yet.';
        }
        // update a simple stats header if exists
        const statsEl = document.getElementById('adviser-stats');
        if (statsEl) {
            statsEl.textContent = `Assigned students: ${students.length}`;
        }
        // pending registrations
        const pres = await fetch(`/api/registrations/pending/${adviserId}`);
        const pending = await pres.json();
        const pendingDiv = document.getElementById('pending-list');
        pendingDiv.innerHTML = '';
        if (pending.length) {
            pending.forEach(r => {
                const card = document.createElement('div');
                card.className = 'service-card';
                card.innerHTML = `<h4>${r.student.fullName}</h4><p>${r.course.courseCode} ${r.course.courseName}</p><button onclick="approve('${r._id}')">Approve</button> <button onclick="reject('${r._id}')">Reject</button>`;
                pendingDiv.appendChild(card);
            });
        } else {
            pendingDiv.textContent = 'No pending registrations.';
        }

        // pending ID card requests
        const ires = await fetch(`/api/id-card-requests/pending/${adviserId}`);
        const idpending = await ires.json();
        const idDiv = document.getElementById('id-request-list');
        if (idDiv) {
            idDiv.innerHTML = '';
            if (idpending.length) {
                idpending.forEach(r => {
                    const card = document.createElement('div');
                    card.className = 'service-card';
                    card.innerHTML = `<h4>${r.student.fullName}</h4><p>${r.requestType} - ${r.status}</p><button onclick="approveId('${r._id}')">Approve</button>`;
                    idDiv.appendChild(card);
                });
            } else {
                idDiv.textContent = 'No pending ID card requests.';
            }
            // append counts to stats
            if (statsEl) {
                statsEl.textContent += ` | Pending registrations: ${pending.length} | Pending ID requests: ${idpending.length}`;
            }
        }
    } catch (err) {
        console.error('Adviser dashboard error', err);
    }
}

async function approve(regId) {
    showConfirmation(
        'Approve Registration?',
        'Are you sure you want to approve this course registration?',
        () => submitApproval(regId)
    );
}

async function submitApproval(regId) {
    const adviserId = localStorage.getItem('userId');
    const res = await fetch(`/api/registrations/${regId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adviserId })
    });
    const data = await res.json();
    alert(data.message);
    loadAdviserDashboard();
}

async function reject(regId) {
    showConfirmation(
        'Reject Registration?',
        'Are you sure you want to reject this course registration?',
        () => submitRejection(regId)
    );
}

async function submitRejection(regId) {
    const notes = prompt('Reason for rejection?');
    if (notes === null) return;
    const res = await fetch(`/api/registrations/${regId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
    });
    const data = await res.json();
    alert(data.message);
    loadAdviserDashboard();
}

async function approveId(requestId) {
    showConfirmation(
        'Approve ID Card Request?',
        'Approve this student\'s ID card request?',
        () => submitIdApproval(requestId)
    );
}

async function submitIdApproval(requestId) {
    const adviserId = localStorage.getItem('userId');
    const res = await fetch(`/api/id-card-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adviserId })
    });
    const data = await res.json();
    alert(data.message);
    loadAdviserDashboard();
}

// Confirmation Modal System
let pendingConfirmAction = null;

function showConfirmation(title, message, onConfirm) {
    pendingConfirmAction = onConfirm;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function confirmAction() {
    if (pendingConfirmAction) {
        pendingConfirmAction();
    }
    cancelAction();
}

function cancelAction() {
    pendingConfirmAction = null;
    document.getElementById('confirmation-modal').classList.add('hidden');
}

// Grade Entry System
let gradeContextStudentId, gradeContextCourseId;

function openGradeForm(studentId, studentName, courseId, courseName) {
    gradeContextStudentId = studentId;
    gradeContextCourseId = courseId;
    document.getElementById('grade-student-name').textContent = studentName;
    document.getElementById('grade-course-name').textContent = courseName;
    document.getElementById('grade-score').value = '';
    document.getElementById('grade-session').value = '';
    document.getElementById('grade-semester').value = '1';
    document.getElementById('grade-entry-modal').classList.remove('hidden');
}

function closeGradeModal() {
    document.getElementById('grade-entry-modal').classList.add('hidden');
}

async function submitGrade() {
    const score = parseFloat(document.getElementById('grade-score').value);
    const session = document.getElementById('grade-session').value.trim();
    const semester = document.getElementById('grade-semester').value;
    const adviserId = localStorage.getItem('userId');

    if (!score || !session) {
        alert('Please fill in all fields');
        return;
    }

    if (score < 0 || score > 100) {
        alert('Score must be between 0 and 100');
        return;
    }

    try {
        const res = await fetch('/api/academic-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: gradeContextStudentId,
                courseId: gradeContextCourseId,
                academicSession: session,
                semester,
                score,
                recordedBy: adviserId
            })
        });
        const data = await res.json();
        alert(data.message || 'Grade submitted');
        closeGradeModal();
        loadAdviserDashboard();
    } catch (err) {
        console.error('Grade submission error', err);
        alert('Error submitting grade');
    }
}

// Student Search/Filter
function filterStudents() {
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    const studentItems = document.querySelectorAll('#student-list li, #student-list div');
    studentItems.forEach(item => {
        if (searchTerm === '' || item.textContent.toLowerCase().includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthentication()) {
        displayUserInfo();
        // attach search listener for adviser dashboard
        const searchBox = document.getElementById('student-search');
        if (searchBox) {
            searchBox.addEventListener('input', filterStudents);
        }
    }
});

const procedures = {
    reg: {
        title: "Course Registration Procedure",
        steps: [
            "Log in to the student portal.",
            "Navigate to 'Course Registration' menu.",
            "Select your level and semester.",
            "Choose the required courses from the list.",
            "Click 'Save' and submit for Adviser approval."
        ]
    },
    results: {
        title: "How to Check Results",
        steps: [
            "Select 'Academic Records' from dashboard.",
            "Pick the session (e.g., 2023/2024).",
            "Click on 'View Result'.",
            "If prompted, enter your portal PIN."
        ]
    },
    id: {
        title: "How to Request an ID Card",
        steps: [
            "From the dashboard click the 'ID Card Renewal' service.",
            "Confirm your details and submit the request.",
            "Await confirmation from your adviser or admin."
        ]
    }
};

// Simple modal for procedures
function openProcedure(type) {
    const modal = document.getElementById('procedure-modal');
    const title = document.getElementById('modal-title');
    const stepList = document.getElementById('step-list');
    let steps = [];
    if (type === 'reg') {
        title.textContent = 'Course Registration';
        steps = [
            '1. Go to uniben student portal and log in.https://unibenportal.com/#dashboard',
            '2. Navigate to "Course Registration" section.',
            '3. choose the required courses for each semester.',
            '4. Click "Save" and submit for Adviser approval.',
            '5 .pay dean,departmnetal and aces dues to microfinance bank',
            '6 Ensure you pay school fees',
            '7. Await approval from your adviser.',
            '8. Once approved, your courses will be registered and appear in your dashboard.'
        ];
    } else if (type === 'results') {
        title.textContent = 'Check Results';
        steps = [
            '1. go to uniben student portal and log in.https://unibenportal.com/#dashboard',
            '2. go to grades section.'
        
        ];
    } else if (type === 'id') {
        title.textContent = 'ID Card Renewal';
        steps = [
            '1. Click "ID Card Renewal".',
            '2. Submit your request.'
        ];
    } else {
        title.textContent = 'Procedure';
        steps = ['No steps available.'];
    }
    stepList.innerHTML = steps.map(s => `<li>${s}</li>`).join('');
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('procedure-modal').classList.add('hidden');
}

window.openProcedure = openProcedure;
window.closeModal = closeModal;

// Adviser Profile Modal
function openAdviserProfile() {
    const modal = document.getElementById('procedure-modal');
    const title = document.getElementById('modal-title');
    const stepList = document.getElementById('step-list');
    title.textContent = 'My Adviser Profile';
    stepList.innerHTML = '<li>Your adviser details will appear here.</li>';
    modal.classList.remove('hidden');
}

// Profile Modal
function openProfile() {
    const modal = document.getElementById('procedure-modal');
    const title = document.getElementById('modal-title');
    const stepList = document.getElementById('step-list');
    title.textContent = 'Your Profile';
    stepList.innerHTML = '<li>Your profile details will appear here.</li>';
    modal.classList.remove('hidden');
}

window.openAdviserProfile = openAdviserProfile;
window.openProfile = openProfile;