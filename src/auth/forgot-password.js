document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    // Handle form submission
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const role = document.getElementById('role').value;

        // Basic validation
        if (!email) {
            AuthUtils.showError('Please enter your email address');
            return;
        }

        // Show loading state
        const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalButtonContent = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Reset Link...';
        submitButton.disabled = true;

        try {
            await AuthUtils.forgotPassword(email, role);
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