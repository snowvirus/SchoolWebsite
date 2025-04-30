document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const registrationCard = document.getElementById('registrationCard');
<<<<<<< HEAD

    searchForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const admissionNumber = document.getElementById('admissionNumber').value;
        const year = document.getElementById('year').value;

        try {
            const response = await fetch(`http://localhost:3001/api/students/${admissionNumber}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Student not found');
            }

            const studentData = await response.json();

            // Update the registration card with student data
            document.getElementById('studentName').textContent = `${studentData.first_name} ${studentData.last_name}`;
            document.getElementById('displayAdmissionNumber').textContent = studentData.admission_number;
            document.getElementById('studentClass').textContent = studentData.class;
            document.getElementById('dateOfBirth').textContent = studentData.date_of_birth;
            document.getElementById('academicYear').textContent = year;
            document.getElementById('parentName').textContent = studentData.parent_name;
            document.getElementById('parentContact').textContent = studentData.parent_phone;
            document.getElementById('issueDate').textContent = new Date().toLocaleDateString();

            // Show the registration card
            registrationCard.style.display = 'block';

        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
});

function generatePDF() {
    // Get all the student information
    const studentInfo = {
        name: document.getElementById('studentName').textContent,
        admissionNumber: document.getElementById('displayAdmissionNumber').textContent,
        class: document.getElementById('studentClass').textContent,
        dateOfBirth: document.getElementById('dateOfBirth').textContent,
        academicYear: document.getElementById('academicYear').textContent,
        parentName: document.getElementById('parentName').textContent,
        parentContact: document.getElementById('parentContact').textContent,
        issueDate: document.getElementById('issueDate').textContent,
        clearances: {
=======
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
>>>>>>> 403b044 (Updated files, removed unused HTML/CSS/JS, added src and logs directories)
            library: document.getElementById('libraryClearance').checked,
            accounts: document.getElementById('accountsClearance').checked,
            sports: document.getElementById('sportsClearance').checked,
            lab: document.getElementById('labClearance').checked,
            hostel: document.getElementById('hostelClearance').checked
<<<<<<< HEAD
        }
    };

    // Create a new window for the PDF
    const printWindow = window.open('', '_blank');

    // Create the HTML content for the PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Registration Card</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .header { text-align: center; margin-bottom: 20px; }
                .info-section { margin-bottom: 20px; }
                .clearance-section { margin-top: 20px; }
                .clearance-item { margin-bottom: 10px; }
                .signature-section { margin-top: 50px; }
                .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>St Francis Secondary School</h2>
                <p>Kiboga District, Uganda</p>
                <h3>Registration Card</h3>
            </div>

            <div class="info-section">
                <p><strong>Student Name:</strong> ${studentInfo.name}</p>
                <p><strong>Admission Number:</strong> ${studentInfo.admissionNumber}</p>
                <p><strong>Class:</strong> ${studentInfo.class}</p>
                <p><strong>Date of Birth:</strong> ${studentInfo.dateOfBirth}</p>
                <p><strong>Academic Year:</strong> ${studentInfo.academicYear}</p>
                <p><strong>Parent/Guardian:</strong> ${studentInfo.parentName}</p>
                <p><strong>Contact Number:</strong> ${studentInfo.parentContact}</p>
                <p><strong>Date Issued:</strong> ${studentInfo.issueDate}</p>
            </div>

            <div class="clearance-section">
                <h4>Clearance Form</h4>
                <div class="clearance-item">
                    <p>Library Clearance: ${studentInfo.clearances.library ? '✓' : '✗'}</p>
                </div>
                <div class="clearance-item">
                    <p>Accounts Clearance: ${studentInfo.clearances.accounts ? '✓' : '✗'}</p>
                </div>
                <div class="clearance-item">
                    <p>Sports Department Clearance: ${studentInfo.clearances.sports ? '✓' : '✗'}</p>
                </div>
                <div class="clearance-item">
                    <p>Laboratory Clearance: ${studentInfo.clearances.lab ? '✓' : '✗'}</p>
                </div>
                <div class="clearance-item">
                    <p>Hostel Clearance: ${studentInfo.clearances.hostel ? '✓' : '✗'}</p>
                </div>
            </div>

            <div class="signature-section">
                <p>School Administrator's Signature:</p>
                <div class="signature-line"></div>
            </div>
        </body>
        </html>
    `;

    // Write the content to the new window and print
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
=======
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
>>>>>>> 403b044 (Updated files, removed unused HTML/CSS/JS, added src and logs directories)
} 