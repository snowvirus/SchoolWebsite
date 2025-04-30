document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
        window.location.href = '/login.html';
        return;
    }

    // Set current date
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Fetch and display student information
    fetchStudentInfo(user.username);
    fetchStudentStats(user.username);
    fetchRecentActivity(user.username);
});

async function fetchStudentInfo(admissionNumber) {
    try {
        const response = await fetch(`/api/students/${admissionNumber}/info`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student information');
        }

        const data = await response.json();
        updateStudentInfo(data);
    } catch (error) {
        console.error('Error fetching student information:', error);
        alert('Error loading student information. Please try again.');
    }
}

async function fetchStudentStats(admissionNumber) {
    try {
        const response = await fetch(`/api/students/${admissionNumber}/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student statistics');
        }

        const data = await response.json();
        updateStudentStats(data);
    } catch (error) {
        console.error('Error fetching student statistics:', error);
    }
}

async function fetchRecentActivity(admissionNumber) {
    try {
        const response = await fetch(`/api/students/${admissionNumber}/activity`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recent activity');
        }

        const data = await response.json();
        updateRecentActivity(data);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
    }
}

function updateStudentInfo(data) {
    // Update student name and class
    document.getElementById('studentName').textContent = `Welcome, ${data.firstName} ${data.lastName}`;
    document.getElementById('studentClass').textContent = `Class: ${data.class} ${data.stream}`;
    
    // Update student avatar initials
    const initials = `${data.firstName[0]}${data.lastName[0]}`;
    document.getElementById('studentInitials').textContent = initials;
}

function updateStudentStats(data) {
    document.getElementById('totalSubjects').textContent = data.totalSubjects || 0;
    document.getElementById('averageGrade').textContent = `${data.averageGrade || 0}%`;
    document.getElementById('attendanceRate').textContent = `${data.attendanceRate || 0}%`;
}

function updateRecentActivity(activities) {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<p class="text-muted">No recent activity</p>';
        return;
    }

    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${formatDate(activity.timestamp)}</div>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function getActivityIcon(type) {
    const icons = {
        'grade': 'fa-star',
        'attendance': 'fa-calendar-check',
        'assignment': 'fa-tasks',
        'exam': 'fa-file-alt',
        'default': 'fa-info-circle'
    };
    return icons[type] || icons.default;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
} 