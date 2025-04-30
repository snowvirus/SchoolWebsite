document.addEventListener('DOMContentLoaded', () => {
    const classSelectionForm = document.getElementById('classSelectionForm');
    const attendanceSection = document.getElementById('attendanceSection');
    const attendanceSummary = document.getElementById('attendanceSummary');
    const attendanceForm = document.getElementById('attendanceForm');
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    const submitButton = classSelectionForm.querySelector('button[type="submit"]');

    // Set max date to today
    const dateInput = document.getElementById('date');
    dateInput.max = new Date().toISOString().split('T')[0];

    // Event listener for class selection form
    classSelectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const classValue = document.getElementById('classSelect').value;
        const stream = document.getElementById('streamSelect').value;
        const date = document.getElementById('date').value;

        // Validate date
        if (new Date(date) > new Date()) {
            alert('Cannot select a future date');
            return;
        }

        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

        try {
            // First check if attendance already exists for this date
            const checkResponse = await fetch(`http://localhost:3001/api/attendance/check?date=${date}&class=${classValue}&stream=${stream}`);
            const checkData = await checkResponse.json();

            if (checkData.exists) {
                if (!confirm('Attendance for this date already exists. Do you want to view/edit it?')) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Load Students';
                    return;
                }
            }

            // Fetch students
            const response = await fetch(`http://localhost:3001/api/students?class=${classValue}&stream=${stream}`);
            if (!response.ok) throw new Error('Failed to fetch students');
            
            const students = await response.json();
            
            if (students.length === 0) {
                throw new Error('No students found in this class and stream');
            }

            // If attendance exists, fetch it
            let existingAttendance = [];
            if (checkData.exists) {
                const attendanceResponse = await fetch(`http://localhost:3001/api/attendance?date=${date}&class=${classValue}&stream=${stream}`);
                if (attendanceResponse.ok) {
                    existingAttendance = await attendanceResponse.json();
                }
            }

            displayAttendanceTable(students, existingAttendance);
            attendanceSection.style.display = 'block';
            attendanceSummary.style.display = 'block';
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            // Reset loading state
            submitButton.disabled = false;
            submitButton.textContent = 'Load Students';
        }
    });

    function displayAttendanceTable(students, existingAttendance = []) {
        attendanceTableBody.innerHTML = '';
        students.forEach(student => {
            const existingRecord = existingAttendance.find(a => a.admissionNumber === student.admissionNumber);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.admissionNumber}</td>
                <td>${student.firstName} ${student.lastName}</td>
                <td>
                    <select class="form-select attendance-status" name="status_${student.admissionNumber}" required>
                        <option value="">Select Status</option>
                        <option value="present" ${existingRecord?.status === 'present' ? 'selected' : ''}>Present</option>
                        <option value="absent" ${existingRecord?.status === 'absent' ? 'selected' : ''}>Absent</option>
                        <option value="late" ${existingRecord?.status === 'late' ? 'selected' : ''}>Late</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control" name="remarks_${student.admissionNumber}" 
                           value="${existingRecord?.remarks || ''}" placeholder="Enter remarks">
                </td>
            `;
            attendanceTableBody.appendChild(row);
        });

        document.querySelectorAll('.attendance-status').forEach(select => {
            select.addEventListener('change', updateAttendanceSummary);
        });

        // Update summary with initial values
        updateAttendanceSummary();
    }

    function updateAttendanceSummary() {
        const statuses = document.querySelectorAll('.attendance-status');
        let present = 0, absent = 0, late = 0, total = 0;

        statuses.forEach(select => {
            if (select.value) {
                total++;
                if (select.value === 'present') present++;
                else if (select.value === 'absent') absent++;
                else if (select.value === 'late') late++;
            }
        });

        document.getElementById('presentCount').textContent = present;
        document.getElementById('absentCount').textContent = absent;
        document.getElementById('lateCount').textContent = late;
        document.getElementById('totalCount').textContent = total;
    }

    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = attendanceForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

        const attendanceData = {
            date: document.getElementById('date').value,
            class: document.getElementById('classSelect').value,
            stream: document.getElementById('streamSelect').value,
            attendance: []
        };

        document.querySelectorAll('#attendanceTableBody tr').forEach(row => {
            const admissionNumber = row.cells[0].textContent;
            const status = row.querySelector('.attendance-status').value;
            const remarks = row.querySelector('input[type="text"]').value;

            if (status) {
                attendanceData.attendance.push({ admissionNumber, status, remarks });
            }
        });

        try {
            const response = await fetch('http://localhost:3001/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attendanceData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save attendance');
            }

            alert('Attendance saved successfully!');
            classSelectionForm.reset();
            attendanceSection.style.display = 'none';
            attendanceSummary.style.display = 'none';
        } catch (error) {
            alert('Error saving attendance: ' + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Attendance';
        }
    });
}); 