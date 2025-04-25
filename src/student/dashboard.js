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
        window.location.href = '/login.html'; // Use absolute path for login redirect
        return; // Stop script execution
    }
    console.log('User authenticated, proceeding with dashboard init.');

    try {
        // Get user data from API
        const userData = await getUserData(token);
        updateUserProfile(userData); // Update based on fetched data

        // --- Remove Mock Data Loading for Now ---
        // const dashboardData = await getDashboardData(); 
        // if(dashboardData.stats) updateDashboardStats(dashboardData.stats); 
        // if(dashboardData.recentActivities) updateRecentActivities(dashboardData.recentActivities);
        // if(dashboardData.upcomingEvents) updateUpcomingEvents(dashboardData.upcomingEvents);
        clearPlaceholderData(); // Clear static placeholders

        // Initialize event listeners
        initEventListeners();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Display a user-friendly error message on the page
        const welcomeSection = document.querySelector('.welcome-section h2');
        if (welcomeSection) {
            welcomeSection.textContent = 'Error loading dashboard.';
        }
        const dashboardContent = document.querySelector('.dashboard-content');
        if(dashboardContent) {
            dashboardContent.innerHTML += '<p class="text-danger text-center">Could not load dashboard data. Please try again later.</p>';
        }
        // Optionally clear sensitive items and redirect
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        // window.location.href = '../public/login.html';
    }
}

// Fetch user data from API
async function getUserData(token) {
    console.log('Fetching student profile data...');
    try {
        const response = await fetch('/api/profile/student', { // Use the correct API endpoint
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // If unauthorized (e.g., token expired), redirect to login
            if (response.status === 401 || response.status === 403) {
                 console.error('Unauthorized or Forbidden fetching profile. Redirecting...');
                 localStorage.removeItem('token');
                 localStorage.removeItem('user');
                 window.location.href = '/login.html'; // Use absolute path for login redirect
                 throw new Error('Redirecting due to auth error.'); // Stop further execution
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const profileData = await response.json();

        if (profileData.success && profileData.data) {
            console.log('Profile data fetched:', profileData.data);
            return profileData.data; // Return the data object
        } else {
            console.error('API response indicates failure or missing data:', profileData.message);
            throw new Error(profileData.message || 'Failed to fetch valid profile data.');
        }

    } catch (error) {
        console.error('Error in getUserData:', error);
        // Re-throw the error to be caught by initDashboard
        throw error; 
    }
}

// Use fetched user data
function updateUserProfile(userData) {
    const welcomeText = document.querySelector('.welcome-section h2');
    const userNameSpan = document.querySelector('.user-profile .username'); // Update the span in top-bar

    // Use firstName if available, otherwise fallback to registrationNumber
    const displayName = userData.firstName || userData.registrationNumber || 'Student';
    
    if(welcomeText) {
        welcomeText.textContent = `Welcome back, ${displayName}!`;
    } else {
        console.warn('Welcome text element not found.');
    }
    if(userNameSpan) {
        userNameSpan.textContent = displayName;
    } else {
        console.warn('Username span element not found.');
    }
    // We can add more profile details here if needed
    // e.g., display class name: 
    // const classElement = document.getElementById('studentClass'); // Assuming an element with this ID exists
    // if(classElement && userData.className) classElement.textContent = userData.className;
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
             updateUserProfile(profileData.data); // Call the update function
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