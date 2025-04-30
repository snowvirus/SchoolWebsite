document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!localStorage.getItem('adminToken')) {
        window.location.href = 'admin-login.html';
    }

    // Add logout button to navbar
    document.querySelector('.navbar').innerHTML += `
        <div class="ms-auto">
            <button class="btn btn-outline-light" onclick="logout()">Logout</button>
        </div>
    `;

    // Fetch and display statistics
    fetchStatistics();

    // Add click handlers for admin cards
    setupAdminCards();
});

async function fetchStatistics() {
    try {
        const response = await fetch('http://localhost:3001/api/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        updateStatistics(data);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        alert('Error loading statistics. Please try again.');
    }
}

function updateStatistics(data) {
    document.getElementById('totalStudents').textContent = data.totalStudents || 0;
    document.getElementById('activeTeachers').textContent = data.activeTeachers || 0;
    document.getElementById('totalClasses').textContent = data.totalClasses || 0;
    document.getElementById('pendingTasks').textContent = data.pendingTasks || 0;
}

function setupAdminCards() {
    // Student Management
    document.querySelector('.card:nth-child(1) .btn').addEventListener('click', () => {
        window.location.href = 'admin/students.html';
    });

    // Attendance Management
    document.querySelector('.card:nth-child(2) .btn').addEventListener('click', () => {
        window.location.href = 'admin/attendance.html';
    });

    // Academic Records
    document.querySelector('.card:nth-child(3) .btn').addEventListener('click', () => {
        window.location.href = 'admin/academic.html';
    });

    // Staff Management
    document.querySelector('.card:nth-child(4) .btn').addEventListener('click', () => {
        window.location.href = 'admin/staff.html';
    });

    // School Calendar
    document.querySelector('.card:nth-child(5) .btn').addEventListener('click', () => {
        window.location.href = 'admin/calendar.html';
    });

    // Circulars & Announcements
    document.querySelector('.card:nth-child(6) .btn').addEventListener('click', () => {
        window.location.href = 'admin/circulars.html';
    });
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin-login.html';
} 