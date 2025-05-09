document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const registrationCard = document.getElementById('registrationCard');
    const errorMessageDiv = document.getElementById('errorMessage');
    let currentAdmissionNumber = null;

    // Clear any existing error message when starting a new search
    function clearError() {
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
            errorMessageDiv.textContent = '';
        }
    }

    // Display error message
    function showError(message) {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.style.display = 'block';
        } else {
            const newErrorDiv = document.createElement('div');
            newErrorDiv.id = 'errorMessage';
            newErrorDiv.className = 'alert alert-danger mt-3';
            newErrorDiv.textContent = message;
            document.querySelector('.search-section').appendChild(newErrorDiv);
        }
        registrationCard.style.display = 'none';
    }

    // Function to fetch and display student data
    async function fetchStudentData(admissionNumber) {
        const errorDiv = document.getElementById('errorMessage');
        const registrationCard = document.getElementById('registrationCard');
        const searchButton = document.querySelector('button[type="submit"]');

        // Clear previous error message
        errorDiv.style.display = 'none';

        // Disable search button while loading
        if (searchButton) {
            searchButton.disabled = true;
            searchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        }

        try {
            console.log('Fetching registration card for:', admissionNumber);
            const response = await fetch(`/api/students/${encodeURIComponent(admissionNumber)}/registration-card`);
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                const { student } = data.data;
                currentAdmissionNumber = student.admissionNumber;
                registrationCard.style.display = 'block';
                
                // Update student info
                document.getElementById('displayAdmissionNumber').textContent = student.admissionNumber;
                document.getElementById('fullName').textContent = `${student.firstName} ${student.lastName}`;
                document.getElementById('dateOfBirth').textContent = new Date(student.dateOfBirth).toLocaleDateString();
                document.getElementById('gender').textContent = student.gender;
                document.getElementById('studentClass').textContent = student.class;
                document.getElementById('stream').textContent = student.stream;
                document.getElementById('parentName').textContent = student.parentName;
                document.getElementById('parentPhone').textContent = student.parentPhone;
                document.getElementById('parentEmail').textContent = student.parentEmail;
                document.getElementById('address').textContent = student.address;
                document.getElementById('previousSchool').textContent = student.previousSchool;
                document.getElementById('lastGrade').textContent = student.lastGrade;

                // Update clearance checkboxes
                if (student.clearance) {
                    document.getElementById('libraryClearance').checked = student.clearance.library || false;
                    document.getElementById('accountsClearance').checked = student.clearance.accounts || false;
                    document.getElementById('sportsClearance').checked = student.clearance.sports || false;
                    document.getElementById('labClearance').checked = student.clearance.lab || false;
                    document.getElementById('hostelClearance').checked = student.clearance.hostel || false;
                }

                // Hide the search section since we have the data
                const searchSection = document.querySelector('.search-section');
                if (searchSection) {
                    searchSection.style.display = 'none';
                }
            } else {
                showError(data.message || 'Student not found');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error loading student details. Please try again.');
        } finally {
            // Re-enable search button
            if (searchButton) {
                searchButton.disabled = false;
                searchButton.textContent = 'Search';
            }
        }
    }

    // Function to save clearance status
    window.saveClearance = async function() {
        if (!currentAdmissionNumber) {
            showError('No student selected');
            return;
        }

        const clearanceData = {
            library: document.getElementById('libraryClearance').checked,
            accounts: document.getElementById('accountsClearance').checked,
            sports: document.getElementById('sportsClearance').checked,
            lab: document.getElementById('labClearance').checked,
            hostel: document.getElementById('hostelClearance').checked
        };

        try {
            const response = await fetch(`/api/students/${encodeURIComponent(currentAdmissionNumber)}/clearance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clearanceData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Clearance status saved successfully');
            } else {
                throw new Error(data.message || 'Failed to save clearance status');
            }
        } catch (error) {
            console.error('Error saving clearance:', error);
            alert('Error saving clearance status. Please try again.');
        }
    };

    // Check for admission number in URL when page loads
    window.addEventListener('load', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const admissionNumber = urlParams.get('admissionNumber');
        
        if (admissionNumber) {
            fetchStudentData(admissionNumber);
        }
    });

    // Search form handler
    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const admissionNumber = document.getElementById('admissionNumber').value;
            fetchStudentData(admissionNumber);
        });
    }
});

function generatePDF() {
    const element = document.getElementById('registrationCard');
    
    // Hide elements we don't want in the PDF
    const searchSection = document.querySelector('.search-section');
    const printButton = document.querySelector('.print-button');
    const navbar = document.querySelector('.navbar');
    const footer = document.querySelector('.footer');
    
    if (searchSection) searchSection.style.display = 'none';
    if (printButton) printButton.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // Configure the PDF options
    const opt = {
        margin: [0.5, 0.5],
        filename: 'registration-card.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            dpi: 192,
            scrollY: 0
        },
        jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait'
        },
        pagebreak: { mode: 'avoid-all' }
    };

    // Add temporary PDF-specific styles
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            .card {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .card-header {
                padding: 15px !important;
            }
            .student-info {
                padding: 10px 20px !important;
            }
            .info-row {
                margin-bottom: 8px !important;
                padding-bottom: 5px !important;
                font-size: 12px !important;
            }
            .info-label {
                min-width: 150px !important;
            }
            .clearance-section {
                margin-top: 15px !important;
                padding-top: 10px !important;
            }
            .clearance-item {
                margin-bottom: 5px !important;
                padding: 5px !important;
                font-size: 12px !important;
            }
            h4 {
                font-size: 14px !important;
                margin-bottom: 10px !important;
            }
            .registration-header {
                padding: 20px 0 !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Restore elements after PDF generation
        if (searchSection) searchSection.style.display = 'block';
        if (printButton) printButton.style.display = 'block';
        if (navbar) navbar.style.display = 'block';
        if (footer) footer.style.display = 'block';
        
        // Remove temporary styles
        document.head.removeChild(style);
    }).catch(error => {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
        
        // Restore elements in case of error
        if (searchSection) searchSection.style.display = 'block';
        if (printButton) printButton.style.display = 'block';
        if (navbar) navbar.style.display = 'block';
        if (footer) footer.style.display = 'block';
        
        // Remove temporary styles
        document.head.removeChild(style);
    });
} 