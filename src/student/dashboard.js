document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard
    initDashboard();
});

async function initDashboard() {
    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        console.error('Auth token or user data not found. Redirecting to login.');
        window.location.href = '/login.html';
        return;
    }
    console.log('User authenticated, proceeding with dashboard init.');

    try {
        // Get user data from API
        const response = await fetch('/api/profile/student', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch student data');
        }

        const { student, stats } = data.data;
        updateStudentProfile(student);
        updateDashboardStats(stats);

        // Initialize event listeners
        initEventListeners();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        const welcomeSection = document.querySelector('.welcome-section h2');
        if (welcomeSection) {
            welcomeSection.textContent = 'Error loading dashboard.';
        }
        const dashboardContent = document.querySelector('.dashboard-content');
        if(dashboardContent) {
            dashboardContent.innerHTML += '<p class="text-danger text-center">Could not load dashboard data. Please try again later.</p>';
        }
    }
}

// Update student profile information
function updateStudentProfile(student) {
    // Update welcome message and username
    const welcomeText = document.querySelector('.welcome-section h2');
    const userNameSpan = document.querySelector('.user-profile .username');
    const fullName = `${student.firstName} ${student.lastName}`;
    
    if(welcomeText) {
        welcomeText.textContent = `Welcome back, ${student.firstName}!`;
    }
    if(userNameSpan) {
        userNameSpan.textContent = fullName;
    }

    // Update student information card
    document.getElementById('studentName').textContent = fullName;
    document.getElementById('admissionNumber').textContent = student.admissionNumber;
    document.getElementById('studentClass').textContent = student.class;
    document.getElementById('studentStream').textContent = student.stream;
    document.getElementById('studentGender').textContent = student.gender;
    document.getElementById('studentDOB').textContent = new Date(student.dateOfBirth).toLocaleDateString();
    document.getElementById('parentName').textContent = student.parentName;
    document.getElementById('parentPhone').textContent = student.parentPhone;
    document.getElementById('parentEmail').textContent = student.parentEmail;
    document.getElementById('studentAddress').textContent = student.address;
    document.getElementById('previousSchool').textContent = student.previousSchool;
    document.getElementById('lastGrade').textContent = student.lastGrade;
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    // Update attendance rate
    const attendanceElement = document.querySelector('[data-stat="attendance"]');
    if (attendanceElement) {
        attendanceElement.textContent = `${stats.attendanceRate}%`;
    }

    // Update pending assignments
    const assignmentsElement = document.querySelector('[data-stat="assignments"]');
    if (assignmentsElement) {
        assignmentsElement.textContent = stats.pendingAssignments || '0';
    }

    // Update borrowed books
    const booksElement = document.querySelector('[data-stat="books"]');
    if (booksElement) {
        booksElement.textContent = stats.booksBorrowed || '0';
    }
}

// Initialize event listeners
function initEventListeners() {
    // Logout Button
    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if(searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Notifications
    const notifications = document.querySelector('.notifications');
    if(notifications) {
        notifications.addEventListener('click', handleNotifications);
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    if (searchTerm.length > 2) {
        console.log('Searching for:', searchTerm);
    }
}

function handleNotifications() {
    console.log('Showing notifications');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- Remove or Comment Out Mock Data Functions and Updaters ---
/*
async function getDashboardData() { ... } // No longer called
function updateDashboardStats(stats) { ... } // No longer called
function updateRecentActivities(activities) { ... } // No longer called
function updateUpcomingEvents(events) { ... } // No longer called
*/

// Function to clear placeholder HTML data
function clearPlaceholderData() {
    console.log('Clearing placeholder dashboard data...');
    // Clear Stats (or hide the section)
    const quickStatsContainer = document.querySelector('.quick-stats');
    if (quickStatsContainer) quickStatsContainer.innerHTML = '<p class="text-muted">Statistics data not available yet.</p>'; // Or hide: quickStatsContainer.style.display = 'none';
    
    // Clear Activities
    const activityList = document.querySelector('.activity-list');
    if (activityList) activityList.innerHTML = '<p class="text-muted list-group-item border-0 px-0">No recent activities to show.</p>';

    // Clear Events
    const eventList = document.querySelector('.event-list');
    if (eventList) eventList.innerHTML = '<p class="text-muted list-group-item border-0 px-0">No upcoming events to show.</p>';
}

// --- Keep existing initEventListeners, handleSearch, etc. --- 
function initEventListeners() {
    // Logout Button
    const logoutButton = document.getElementById('logoutBtn'); // Use the correct ID from HTML
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('User logged out.');
            window.location.href = '/login.html'; // Use absolute path for login redirect
        });
    } else {
        console.error('Logout button (#logoutBtn) not found.');
    }

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if(searchInput) searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Notifications
    const notifications = document.querySelector('.notifications');
    if(notifications) notifications.addEventListener('click', handleNotifications);

    // Mobile menu toggle
    // Assuming a toggle button exists, add if needed
    // const menuToggle = document.querySelector('.menu-toggle'); 
    // if (menuToggle) { ... }
}

function handleSearch(event) {
    // ... (keep existing implementation)
     const searchTerm = event.target.value.trim();
    if (searchTerm.length > 2) {
        // In a real application, this would make an API call
        console.log('Searching for:', searchTerm);
    }
}

function handleNotifications() {
    // ... (keep existing implementation)
    console.log('Showing notifications');
}

// function toggleMobileMenu() { ... } // Keep if needed

// --- Keep utility functions (debounce, showError) ---
function debounce(func, wait) {
     // ... (keep existing implementation)
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
     // ... (keep existing implementation)
    console.error(message);
}

// --- Fetch Detailed Student Profile ---
async function fetchStudentProfile() {
    try {
        const response = await fetch('/api/profile/student', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
             // Handle auth errors specifically
             if (response.status === 401 || response.status === 403) {
                 console.error('Unauthorized or Forbidden fetching profile. Redirecting...');
                 localStorage.removeItem('token');
                 localStorage.removeItem('user');
                 window.location.href = '/login.html'; // Use absolute path
                 return; // Stop further execution
             }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const profileData = await response.json();
        
        // Update dashboard with profile data (e.g., full name)
        if (profileData.success && profileData.data) {
             console.log('Updating profile info with:', profileData.data);
             updateStudentProfile(profileData.data); // Call the update function
             // Update other elements as needed
        }

    } catch (error) {
        console.error('Error fetching student profile:', error);
        // Optionally show an error message to the user
        const welcomeSection = document.querySelector('.welcome-section h2');
        if(welcomeSection) welcomeSection.textContent = 'Could not load profile.';
    }
}

fetchStudentProfile(); // Call the function to fetch profile 