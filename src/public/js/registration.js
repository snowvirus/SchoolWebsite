document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registrationForm');

    // Form validation
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        try {
            // Clear any existing messages
            clearMessages();

            // Gather form data
            const formData = {
                registrationNumber: document.getElementById('registrationNumber')?.value || '',
                firstName: document.getElementById('firstName')?.value || '',
                lastName: document.getElementById('lastName')?.value || '',
                dateOfBirth: document.getElementById('dateOfBirth')?.value || '',
                gender: document.getElementById('gender')?.value || '',
                class: document.getElementById('class')?.value || '',
                stream: document.getElementById('stream')?.value || '',
                parentName: document.getElementById('parentName')?.value || '',
                parentPhone: document.getElementById('parentPhone')?.value || '',
                parentEmail: document.getElementById('parentEmail')?.value || '',
                address: document.getElementById('address')?.value || ''
            };

            console.log('Form data to be sent:', formData);

            // Send data to backend
            const response = await fetch('/api/students/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Redirect to registration card page with the admission number
                window.location.href = `/registration-card.html?admissionNumber=${result.admissionNumber}`;
            } else {
                if (response.status === 409) {
                    // Duplicate registration number
                    showErrorMessage(result.message);
                    // Focus on registration number field for correction
                    document.getElementById('registrationNumber').focus();
                } else if (result.missingFields) {
                    const missingFieldsList = result.missingFields.map(field => field.field).join(', ');
                    showErrorMessage(`Please fill in all required fields: ${missingFieldsList}`);
                } else {
                    throw new Error(result.message || 'Registration failed');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            showErrorMessage(error.message || 'Registration failed. Please try again later.');
        }
    });

    // File input validation
    const photoInput = document.getElementById('photo');
    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        const fileType = file.type;
        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validImageTypes.includes(fileType)) {
            showErrorMessage('Please upload a valid image file (JPEG, PNG)');
            this.value = '';
            return;
        }

        if (file.size > maxSize) {
            showErrorMessage('File size should be less than 5MB');
            this.value = '';
            return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.createElement('img');
            preview.src = e.target.result;
            preview.style.maxWidth = '200px';
            preview.style.marginTop = '10px';
            preview.className = 'img-thumbnail';

            const previewContainer = photoInput.parentElement;
            const existingPreview = previewContainer.querySelector('img');
            if (existingPreview) {
                previewContainer.removeChild(existingPreview);
            }
            previewContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });

    // Phone number validation
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9+\-\s]/g, '');
        });
    });

    // Helper functions for showing messages
    function showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        form.parentElement.insertBefore(alertDiv, form);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    function showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        form.parentElement.insertBefore(alertDiv, form);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    function clearMessages() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }
}); 