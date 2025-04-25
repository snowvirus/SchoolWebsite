document.addEventListener('DOMContentLoaded', () => {
    // Initialize password visibility toggle
    AuthUtils.togglePasswordVisibility();

    // Get form elements
    const registerForm = document.getElementById('registerForm');
    const roleSelect = document.getElementById('role');
    const studentFields = document.getElementById('studentFields');
    const parentFields = document.getElementById('parentFields');
    const classSelect = document.getElementById('class');

    // Handle role change
    roleSelect.addEventListener('change', () => {
        const role = roleSelect.value;
        if (role === 'student') {
            studentFields.style.display = 'block';
            parentFields.style.display = 'none';
            // Make student fields required
            document.getElementById('registrationNumber').required = true;
            document.getElementById('class').required = true;
            // Make parent fields not required
            document.getElementById('fullName').required = false;
            document.getElementById('phone').required = false;
            document.getElementById('studentRegistrationNumber').required = false;
        } else {
            studentFields.style.display = 'none';
            parentFields.style.display = 'block';
            // Make parent fields required
            document.getElementById('fullName').required = true;
            document.getElementById('phone').required = true;
            document.getElementById('studentRegistrationNumber').required = true;
            // Make student fields not required
            document.getElementById('registrationNumber').required = false;
            document.getElementById('class').required = false;
        }
    });

    // Load classes from API
    const loadClasses = async () => {
        try {
            const response = await fetch('/api/classes');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load classes');
            }

            // Clear existing options
            classSelect.innerHTML = '<option value="">Select Class</option>';

            // Add class options
            data.forEach(classItem => {
                const option = document.createElement('option');
                option.value = classItem.id;
                option.textContent = classItem.name;
                classSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading classes:', error);
            AuthUtils.showError('Failed to load classes. Please try again later.');
        }
    };

    // Load classes on page load
    loadClasses();

    // Password validation
    const validatePassword = (password) => {
        const minLength = 8;
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);

        return password.length >= minLength && hasNumber && hasSpecialChar && hasUpperCase && hasLowerCase;
    };

    // Handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const formData = {
            role: roleSelect.value,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        // Add role-specific fields
        if (formData.role === 'student') {
            formData.registrationNumber = document.getElementById('registrationNumber').value;
            formData.classId = document.getElementById('class').value;
        } else {
            formData.fullName = document.getElementById('fullName').value;
            formData.phone = document.getElementById('phone').value;
            formData.studentRegistrationNumber = document.getElementById('studentRegistrationNumber').value;
        }

        // Validate password
        if (!validatePassword(formData.password)) {
            AuthUtils.showError('Password must be at least 8 characters long and include numbers, special characters, and both uppercase and lowercase letters');
            return;
        }

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            AuthUtils.showError('Passwords do not match');
            return;
        }

        // Show loading state
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalButtonContent = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitButton.disabled = true;

        try {
            await AuthUtils.register(formData);
        } finally {
            // Reset button state
            submitButton.innerHTML = originalButtonContent;
            submitButton.disabled = false;
        }
    });

    // Handle login link
    const loginLink = document.querySelector('.auth-footer a');
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
    });
}); 