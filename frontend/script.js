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
    
    // Show user type in UI if needed
    const badge = document.querySelector('.adviser-badge');
    if (userType === 'adviser') {
        badge.innerText = 'Role: Course Adviser';
    }
}

function logout() {
    const token = localStorage.getItem('token');
    
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(() => {
        localStorage.clear();
        window.location.href = '/login.html';
    }).catch(error => {
        console.error('Logout error:', error);
        localStorage.clear();
        window.location.href = '/login.html';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthentication()) {
        displayUserInfo();
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
    }
};

function openProcedure(key) {
    const data = procedures[key];
    if(!data) return;

    document.getElementById('modal-title').innerText = data.title;
    const list = document.getElementById('step-list');
    list.innerHTML = ""; // Clear old steps

    data.steps.forEach(step => {
        let li = document.createElement('li');
        li.innerText = step;
        list.appendChild(li);
    });

    document.getElementById('procedure-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('procedure-modal').classList.add('hidden');
}