const db = require('../database/initDatabase');

const studentController = {
    // Get all students
    getAllStudents: async (req, res) => {
        try {
            const [students] = await db.query('SELECT * FROM students');
            res.json(students);
        } catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({ error: 'Failed to fetch students' });
        }
    },

    // Get student by ID
    getStudentById: async (req, res) => {
        try {
            const { id } = req.params;
            const [students] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
            
            if (students.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }
            
            res.json(students[0]);
        } catch (error) {
            console.error('Error fetching student:', error);
            res.status(500).json({ error: 'Failed to fetch student' });
        }
    },

    // Create new student
    createStudent: async (req, res) => {
        try {
            const {
                registrationNumber,
                firstName,
                lastName,
                dateOfBirth,
                gender,
                class_id,
                stream_id,
                parentName,
                parentPhone,
                parentEmail,
                address
            } = req.body;

            // Check if registration number already exists
            const [existing] = await db.query(
                'SELECT registration_number FROM students WHERE registration_number = ?',
                [registrationNumber]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: 'Registration number already exists' });
            }

            // Insert new student
            const [result] = await db.query(
                `INSERT INTO students 
                (registration_number, first_name, last_name, date_of_birth, gender, class_id, stream_id,
                parent_name, parent_phone, parent_email, address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [registrationNumber, firstName, lastName, dateOfBirth, gender, class_id, stream_id,
                parentName, parentPhone, parentEmail, address]
            );

            res.status(201).json({
                id: result.insertId,
                message: 'Student created successfully'
            });
        } catch (error) {
            console.error('Error creating student:', error);
            res.status(500).json({ error: 'Failed to create student' });
        }
    },

    // Update student
    updateStudent: async (req, res) => {
        try {
            const { id } = req.params;
            const updateFields = req.body;

            // Build the update query dynamically
            const updateQuery = Object.keys(updateFields)
                .map(key => `${key} = ?`)
                .join(', ');

            const values = [...Object.values(updateFields), id];

            await db.query(
                `UPDATE students SET ${updateQuery} WHERE id = ?`,
                values
            );

            res.json({ message: 'Student updated successfully' });
        } catch (error) {
            console.error('Error updating student:', error);
            res.status(500).json({ error: 'Failed to update student' });
        }
    },

    // Delete student
    deleteStudent: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM students WHERE id = ?', [id]);
            res.json({ message: 'Student deleted successfully' });
        } catch (error) {
            console.error('Error deleting student:', error);
            res.status(500).json({ error: 'Failed to delete student' });
        }
    }
};

module.exports = studentController; 