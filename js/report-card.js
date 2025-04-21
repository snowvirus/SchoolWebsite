document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('reportCardForm');
    const reportCardDisplay = document.getElementById('reportCardDisplay');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const admissionNumber = document.getElementById('admissionNumber').value;
        const term = document.getElementById('term').value;
        const year = document.getElementById('year').value;

        try {
            // First, get student information
            const studentResponse = await fetch(`http://localhost:3001/api/students/${admissionNumber}`);
            if (!studentResponse.ok) {
                throw new Error('Student not found');
            }
            const student = await studentResponse.json();

            // Then, get grades for the specified term and year
            const gradesResponse = await fetch(`http://localhost:3001/api/grades/${admissionNumber}?term=${term}&year=${year}`);
            if (!gradesResponse.ok) {
                throw new Error('Grades not found');
            }
            const grades = await gradesResponse.json();

            // Update the display with student information
            document.getElementById('studentName').textContent = `${student.first_name} ${student.last_name}`;
            document.getElementById('displayAdmissionNumber').textContent = student.admission_number;
            document.getElementById('studentClass').textContent = student.class;
            document.getElementById('displayTerm').textContent = `Term ${term}`;
            document.getElementById('displayYear').textContent = year;
            document.getElementById('issueDate').textContent = new Date().toLocaleDateString();

            // Update the grades table
            const gradesTableBody = document.getElementById('gradesTableBody');
            gradesTableBody.innerHTML = '';

            let totalMarks = 0;
            let subjectCount = 0;

            grades.forEach(grade => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${grade.subject_name}</td>
                    <td>${grade.marks}</td>
                    <td>${grade.grade}</td>
                    <td>${grade.remarks || '-'}</td>
                `;
                gradesTableBody.appendChild(row);

                totalMarks += grade.marks;
                subjectCount++;
            });

            // Calculate and display summary
            const averageMarks = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(2) : 0;
            document.getElementById('totalMarks').textContent = totalMarks;
            document.getElementById('averageGrade').textContent = calculateGrade(averageMarks);

            // Show the report card
            reportCardDisplay.style.display = 'block';

        } catch (error) {
            console.error('Error:', error);
            alert('Error fetching report card: ' + error.message);
        }
    });

    // Helper function to calculate grade based on marks
    function calculateGrade(marks) {
        if (marks >= 80) return 'A';
        if (marks >= 70) return 'B';
        if (marks >= 60) return 'C';
        if (marks >= 50) return 'D';
        return 'F';
    }

    // Add downloadPDF function
    async function downloadPDF() {
        try {
            console.log('Download PDF button clicked');

            const admissionNumber = document.getElementById('admissionNumber').value;
            const term = document.getElementById('term').value;
            const year = document.getElementById('year').value;

            console.log('Form values:', { admissionNumber, term, year });

            if (!admissionNumber || !term || !year) {
                throw new Error('Please fill in all required fields (Admission Number, Term, Year)');
            }

            // Get the JWT token from localStorage
            const token = localStorage.getItem('adminToken');
            console.log('Token exists:', !!token);

            if (!token) {
                throw new Error('Please log in to download report cards');
            }

            console.log('Making download request...');
            // Make the download request
            const response = await fetch(`http://localhost:3001/api/report-cards/${admissionNumber}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to download report card: ${response.status} ${response.statusText}`);
            }

            // Get the blob from the response
            const blob = await response.blob();
            console.log('Blob received:', blob);

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-card-${admissionNumber}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error in downloadPDF:', error);
            alert('Error downloading report card: ' + error.message);
            throw error; // Re-throw the error to see it in the console
        }
    }
});

function generatePDF() {
    // Get all the student information
    const studentInfo = {
        name: document.getElementById('studentName').textContent,
        admissionNumber: document.getElementById('displayAdmissionNumber').textContent,
        class: document.getElementById('studentClass').textContent,
        term: document.getElementById('displayTerm').textContent,
        year: document.getElementById('displayYear').textContent,
        issueDate: document.getElementById('issueDate').textContent,
        averageMarks: document.getElementById('totalMarks').textContent
    };

    // Get grades data
    const grades = [];
    const rows = document.querySelectorAll('#gradesTableBody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        grades.push({
            subject: cells[0].textContent,
            marks: cells[1].textContent,
            grade: cells[2].textContent,
            remarks: cells[3].textContent
        });
    });

    // Create a new window for the PDF
    const printWindow = window.open('', '_blank');

    // Create the HTML content for the PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report Card</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .header { text-align: center; margin-bottom: 20px; }
                .info-section { margin-bottom: 20px; }
                .grades-section { margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary { margin-top: 20px; }
                .signature-section { margin-top: 50px; }
                .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>St Francis Secondary School</h2>
                <p>Kiboga District, Uganda</p>
                <h3>Report Card</h3>
            </div>

            <div class="info-section">
                <p><strong>Student Name:</strong> ${studentInfo.name}</p>
                <p><strong>Admission Number:</strong> ${studentInfo.admissionNumber}</p>
                <p><strong>Class:</strong> ${studentInfo.class}</p>
                <p><strong>Term:</strong> ${studentInfo.term}</p>
                <p><strong>Year:</strong> ${studentInfo.year}</p>
                <p><strong>Date Issued:</strong> ${studentInfo.issueDate}</p>
            </div>

            <div class="grades-section">
                <h4>Academic Performance</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grades.map(grade => `
                            <tr>
                                <td>${grade.subject}</td>
                                <td>${grade.marks}</td>
                                <td>${grade.grade}</td>
                                <td>${grade.remarks}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="summary">
                <p><strong>Average Marks:</strong> ${studentInfo.averageMarks}</p>
            </div>

            <div class="signature-section">
                <p>Class Teacher's Signature:</p>
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