document.addEventListener('DOMContentLoaded', () => {
    // Initialize password visibility toggle
    AuthUtils.togglePasswordVisibility();

    // Get the reset token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        AuthUtils.showError('Invalid or expired reset link');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        return;
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');

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
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate password
        if (!validatePassword(password)) {
            AuthUtils.showError('Password must be at least 8 characters long and include numbers, special characters, and both uppercase and lowercase letters');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            AuthUtils.showError('Passwords do not match');
            return;
        }

        // Show loading state
        const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
        const originalButtonContent = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting Password...';
        submitButton.disabled = true;

        try {
            await AuthUtils.resetPassword(token, password);
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