// Authentication Utility Functions

// API endpoints
const API_BASE_URL = '/api';
const AUTH_ENDPOINTS = {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/auth/reset-password`,
    verifyToken: `${API_BASE_URL}/auth/verify-token`
};

// Utility functions
const showError = (message) => {
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add to form
    const form = document.querySelector('.auth-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
};

const showSuccess = (message) => {
    // Create success element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Add to form
    const form = document.querySelector('.auth-form');
    form.insertBefore(successDiv, form.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => successDiv.remove(), 5000);
};

const togglePasswordVisibility = () => {
    const toggleIcons = document.querySelectorAll('.toggle-password');
    toggleIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });
};

// Authentication functions
const login = async (username, password, role) => {
    try {
        const response = await fetch(AUTH_ENDPOINTS.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on role
        const redirectPath = role === 'student' ? '/student/dashboard' : '/parent/dashboard';
        window.location.href = redirectPath;
    } catch (error) {
        showError(error.message);
    }
};

const register = async (userData) => {
    try {
        const response = await fetch(AUTH_ENDPOINTS.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        showSuccess('Registration successful! Please login.');
        setTimeout(() => {
            window.location.href = '/auth/login.html';
        }, 2000);
    } catch (error) {
        showError(error.message);
    }
};

const forgotPassword = async (email) => {
    try {
        const response = await fetch(AUTH_ENDPOINTS.forgotPassword, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Password reset request failed');
        }

        showSuccess('Password reset instructions sent to your email');
    } catch (error) {
        showError(error.message);
    }
};

const resetPassword = async (token, newPassword) => {
    try {
        const response = await fetch(AUTH_ENDPOINTS.resetPassword, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Password reset failed');
        }

        showSuccess('Password reset successful! Please login with your new password.');
        setTimeout(() => {
            window.location.href = '/auth/login.html';
        }, 2000);
    } catch (error) {
        showError(error.message);
    }
};

const verifyToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(AUTH_ENDPOINTS.verifyToken, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login.html';
};

// Export functions
window.AuthUtils = {
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyToken,
    logout,
    togglePasswordVisibility,
    showError,
    showSuccess
}; 