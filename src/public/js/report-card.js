document.addEventListener('DOMContentLoaded', function () {
<<<<<<< HEAD
    const form = document.getElementById('reportCardForm');
    const reportCardDisplay = document.getElementById('reportCardDisplay');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        let registrationNumber = document.getElementById('admissionNumber').value;
        const term = document.getElementById('term').value;
        const year = document.getElementById('year').value;

        // Add 'S' prefix if not present
        if (!registrationNumber.startsWith('S')) {
            registrationNumber = 'S' + registrationNumber;
        }

        try {
            // Get the JWT token from localStorage
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('Please log in to view report cards');
            }

            // First, get student information
            const studentResponse = await fetch(`http://localhost:3001/api/students/${registrationNumber}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!studentResponse.ok) {
                throw new Error('Student not found');
            }
            const studentResult = await studentResponse.json();
            const student = studentResult.data;

            // Then, get grades for the specified term and year
            const gradesResponse = await fetch(`http://localhost:3001/api/grades/${registrationNumber}?term=${term}&year=${year}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!gradesResponse.ok) {
                throw new Error('Grades not found');
            }
            const gradesResult = await gradesResponse.json();
            const grades = gradesResult.data;

            // Update the display with student information
            document.getElementById('studentName').textContent = `${student.firstName} ${student.lastName}`;
            document.getElementById('displayAdmissionNumber').textContent = student.registrationNumber;
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

    // Function to download PDF
    window.downloadPDF = async function() {
        try {
            let registrationNumber = document.getElementById('admissionNumber').value;
            const term = document.getElementById('term').value;
            const year = document.getElementById('year').value;

            if (!registrationNumber || !term || !year) {
                throw new Error('Please fill in all required fields (Registration Number, Term, Year)');
            }

            // Add 'S' prefix if not present
            if (!registrationNumber.startsWith('S')) {
                registrationNumber = 'S' + registrationNumber;
            }

            // Get the JWT token from localStorage
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('Please log in to download report cards');
            }

            // Make the download request
            const response = await fetch(
                `http://localhost:3001/api/report-cards/${registrationNumber}/download?term=${term}&year=${year}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to download report card');
            }

            // Get the blob from the response
            const blob = await response.blob();

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-card-${registrationNumber}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error downloading report card:', error);
            alert(error.message);
        }
    };
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
=======
    const searchForm = document.getElementById('searchForm');
    const reportCard = document.getElementById('reportCard');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Clear any existing error message
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
        }
        reportCard.style.display = 'none';
    }

    // Function to fetch and display report card
    async function fetchReportCard(admissionNumber, term, year) {
        const searchButton = document.querySelector('button[type="submit"]');
        
        // Clear previous error message
        clearError();

        // Disable search button while loading
        if (searchButton) {
            searchButton.disabled = true;
            searchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        }

        try {
            console.log('Fetching report card for:', { admissionNumber, term, year });
            const response = await fetch(`/api/grades/${encodeURIComponent(admissionNumber)}?term=${term}&year=${year}`);
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                const { student, grades } = data.data;
                reportCard.style.display = 'block';
                
                // Update student info
                document.getElementById('admissionNumber').textContent = student.admissionNumber;
                document.getElementById('fullName').textContent = `${student.firstName} ${student.lastName}`;
                document.getElementById('class').textContent = student.class;
                document.getElementById('stream').textContent = student.stream;
                document.getElementById('term').textContent = `Term ${term}`;
                document.getElementById('year').textContent = year;
                document.getElementById('dateGenerated').textContent = new Date().toLocaleDateString();

                // Update grades table
                const tableBody = document.getElementById('gradesTableBody');
                tableBody.innerHTML = '';
                let totalMarks = 0;

                grades.forEach(grade => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${grade.subject_name}</td>
                        <td>${grade.marks}</td>
                        <td>${grade.grade}</td>
                        <td>${grade.remarks || '-'}</td>
                    `;
                    tableBody.appendChild(row);
                    totalMarks += grade.marks;
                });

                // Calculate and display totals
                const average = totalMarks / grades.length;
                document.getElementById('totalMarks').textContent = totalMarks;
                document.getElementById('averageMarks').textContent = average.toFixed(2);
                document.getElementById('overallGrade').textContent = calculateGrade(average);
            } else {
                showError(data.message || 'Student not found');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error loading report card. Please try again.');
        } finally {
            // Re-enable search button
            if (searchButton) {
                searchButton.disabled = false;
                searchButton.textContent = 'Search';
            }
        }
    }

    // Function to calculate grade based on marks
    function calculateGrade(average) {
        if (average >= 80) return 'A';
        if (average >= 70) return 'B';
        if (average >= 60) return 'C';
        if (average >= 50) return 'D';
        return 'F';
    }

    // Function to generate PDF
    window.generatePDF = function() {
        const element = document.getElementById('reportCard');
        
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
            filename: 'report-card.pdf',
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
                .grades-table {
                    margin-top: 15px !important;
                }
                .grades-table th {
                    background-color: #1a237e !important;
                    color: white !important;
                }
                .grades-table td {
                    padding: 8px !important;
                }
                h4 {
                    font-size: 14px !important;
                    margin-bottom: 10px !important;
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
    };

    // Check for parameters in URL when page loads
    window.addEventListener('load', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const admissionNumber = urlParams.get('admissionNumber');
        const term = urlParams.get('term');
        const year = urlParams.get('year');
        
        if (admissionNumber && term && year) {
            fetchReportCard(admissionNumber, term, year);
        }
    });

    // Search form handler
    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const admissionNumber = document.getElementById('admissionNumber').value;
            const term = document.getElementById('term').value;
            const year = document.getElementById('year').value;
            fetchReportCard(admissionNumber, term, year);
        });
    }
}); 
>>>>>>> 403b044 (Updated files, removed unused HTML/CSS/JS, added src and logs directories)
