document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();

    // Load academic data
    loadAcademicData();
});

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = '../auth/login.html';
    }
}

async function loadAcademicData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/academic/records', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load academic data');
        }

        const data = await response.json();
        updateAcademicSummary(data.summary);
        updateSubjectPerformance(data.subjects);
    } catch (error) {
        console.error('Error loading academic data:', error);
        showError('Failed to load academic data. Please try again later.');
    }
}

function updateAcademicSummary(summary) {
    // Update GPA
    document.querySelector('.summary-item .value').textContent = summary.gpa;

    // Update rank
    document.querySelectorAll('.summary-item .value')[1].textContent = `${summary.rank}/${summary.totalStudents}`;

    // Update attendance
    document.querySelectorAll('.summary-item .value')[2].textContent = `${summary.attendance}%`;
    document.querySelectorAll('.summary-item .value')[3].textContent = `${100 - summary.attendance}%`;
}

function updateSubjectPerformance(subjects) {
    const tableBody = document.getElementById('subjectTableBody');
    tableBody.innerHTML = '';

    subjects.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject.name}</td>
            <td>${subject.grade}</td>
            <td>${subject.marks}</td>
            <td>
                <span class="status-badge ${getStatusClass(subject.status)}">
                    ${subject.status}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'excellent':
            return 'status-excellent';
        case 'good':
            return 'status-good';
        case 'average':
            return 'status-average';
        case 'poor':
            return 'status-poor';
        default:
            return '';
    }
}

function showError(message) {
    // In a real application, this would show a toast notification
    console.error(message);
} 