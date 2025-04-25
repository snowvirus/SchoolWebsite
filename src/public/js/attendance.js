document.addEventListener('DOMContentLoaded', () => {
    const classSelectionForm = document.getElementById('classSelectionForm');
    const attendanceSection = document.getElementById('attendanceSection');
    const attendanceSummary = document.getElementById('attendanceSummary');
    const attendanceForm = document.getElementById('attendanceForm');
    const attendanceTableBody = document.getElementById('attendanceTableBody');

    // Event listener for class selection form
    classSelectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const classValue = document.getElementById('classSelect').value;
        const stream = document.getElementById('streamSelect').value;
        const date = document.getElementById('date').value;

        try {
            const response = await fetch(`http://localhost:3000/api/students?class=${classValue}&stream=${stream}`);
            if (!response.ok) throw new Error('Failed to fetch students');
            const students = await response.json();
            displayAttendanceTable(students);
            attendanceSection.style.display = 'block';
            attendanceSummary.style.display = 'block';
        } catch (error) {
            alert('Error loading students: ' + error.message);
        }
    });

    function displayAttendanceTable(students) {
        attendanceTableBody.innerHTML = '';
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.admissionNumber}</td>
                <td>${student.firstName} ${student.lastName}</td>
                <td>
                    <select class="form-select attendance-status" name="status_${student.admissionNumber}" required>
                        <option value="">Select Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control" name="remarks_${student.admissionNumber}">
                </td>
            `;
            attendanceTableBody.appendChild(row);
        });

        document.querySelectorAll('.attendance-status').forEach(select => {
            select.addEventListener('change', updateAttendanceSummary);
        });
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

            if (!response.ok) throw new Error('Failed to save attendance');

            alert('Attendance saved successfully!');
            classSelectionForm.reset();
            attendanceSection.style.display = 'none';
            attendanceSummary.style.display = 'none';
        } catch (error) {
            alert('Error saving attendance: ' + error.message);
        }
    });
}); 