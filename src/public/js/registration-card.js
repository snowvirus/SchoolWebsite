document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const registrationCard = document.getElementById('registrationCard');

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
            library: document.getElementById('libraryClearance').checked,
            accounts: document.getElementById('accountsClearance').checked,
            sports: document.getElementById('sportsClearance').checked,
            lab: document.getElementById('labClearance').checked,
            hostel: document.getElementById('hostelClearance').checked
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
} 