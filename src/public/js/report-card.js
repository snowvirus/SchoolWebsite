document.addEventListener('DOMContentLoaded', function () {
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
