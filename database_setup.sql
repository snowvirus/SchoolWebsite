-- Database Setup Script
-- This script creates all necessary tables and populates them with sample data

-- Create database (if not exists)
CREATE DATABASE
IF NOT EXISTS school_management;
USE school_management;

-- Create admin_users table
CREATE TABLE
IF NOT EXISTS admin_users
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR
(50) NOT NULL UNIQUE,
    password VARCHAR
(255) NOT NULL,
    full_name VARCHAR
(100) NOT NULL,
    email VARCHAR
(100) NOT NULL UNIQUE,
    role ENUM
('admin', 'teacher') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create classes table
CREATE TABLE
IF NOT EXISTS classes
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR
(50) NOT NULL,
    grade_level VARCHAR
(20) NOT NULL,
    teacher_id INT,
    capacity INT NOT NULL,
    FOREIGN KEY
(teacher_id) REFERENCES admin_users
(id)
);

-- Create students table
CREATE TABLE
IF NOT EXISTS students
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR
(20) NOT NULL UNIQUE,
    first_name VARCHAR
(50) NOT NULL,
    last_name VARCHAR
(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM
('M', 'F') NOT NULL,
    class_id INT,
    parent_name VARCHAR
(100) NOT NULL,
    parent_phone VARCHAR
(20) NOT NULL,
    parent_email VARCHAR
(100),
    address TEXT NOT NULL,
    enrollment_date DATE NOT NULL,
    FOREIGN KEY
(class_id) REFERENCES classes
(id)
);

-- Create subjects table
CREATE TABLE
IF NOT EXISTS subjects
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR
(50) NOT NULL,
    code VARCHAR
(10) NOT NULL UNIQUE,
    description TEXT
);

-- Create teacher_subjects table
CREATE TABLE
IF NOT EXISTS teacher_subjects
(
    teacher_id INT,
    subject_id INT,
    PRIMARY KEY
(teacher_id, subject_id),
    FOREIGN KEY
(teacher_id) REFERENCES admin_users
(id),
    FOREIGN KEY
(subject_id) REFERENCES subjects
(id)
);

-- Create grades table
CREATE TABLE
IF NOT EXISTS grades
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    term INT NOT NULL,
    year INT NOT NULL,
    marks DECIMAL
(5,2) NOT NULL,
    grade CHAR
(1) NOT NULL,
    remarks TEXT,
    FOREIGN KEY
(student_id) REFERENCES students
(id),
    FOREIGN KEY
(subject_id) REFERENCES subjects
(id)
);

-- Create attendance table
CREATE TABLE
IF NOT EXISTS attendance
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    date DATE NOT NULL,
    status ENUM
('present', 'absent', 'late') NOT NULL,
    remarks TEXT,
    FOREIGN KEY
(student_id) REFERENCES students
(id)
);

-- Create circulars table
CREATE TABLE
IF NOT EXISTS circulars
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR
(255) NOT NULL,
    description TEXT,
    file_path VARCHAR
(255) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(uploaded_by) REFERENCES admin_users
(id)
);

-- Create calendar_events table
CREATE TABLE
IF NOT EXISTS calendar_events
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR
(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(created_by) REFERENCES admin_users
(id)
);

-- Insert sample data

-- 1. Insert admin users (including teachers)
INSERT INTO admin_users
    (username, password, full_name, email, role)
VALUES
    -- Admin users
    ('admin1', '$2b$10$xxxxxxxxxxx', 'John Administrator', 'john.admin@school.com', 'admin'),
    ('admin2', '$2b$10$xxxxxxxxxxx', 'Sarah Manager', 'sarah.manager@school.com', 'admin'),
    -- Teachers
    ('teacher1', '$2b$10$xxxxxxxxxxx', 'David Smith', 'david.smith@school.com', 'teacher'),
    ('teacher2', '$2b$10$xxxxxxxxxxx', 'Emily Johnson', 'emily.johnson@school.com', 'teacher'),
    ('teacher3', '$2b$10$xxxxxxxxxxx', 'Michael Brown', 'michael.brown@school.com', 'teacher'),
    ('teacher4', '$2b$10$xxxxxxxxxxx', 'Jessica Wilson', 'jessica.wilson@school.com', 'teacher'),
    ('teacher5', '$2b$10$xxxxxxxxxxx', 'Robert Davis', 'robert.davis@school.com', 'teacher'),
    ('teacher6', '$2b$10$xxxxxxxxxxx', 'Patricia Moore', 'patricia.moore@school.com', 'teacher'),
    ('teacher7', '$2b$10$xxxxxxxxxxx', 'James Taylor', 'james.taylor@school.com', 'teacher'),
    ('teacher8', '$2b$10$xxxxxxxxxxx', 'Linda Anderson', 'linda.anderson@school.com', 'teacher'),
    ('teacher9', '$2b$10$xxxxxxxxxxx', 'William Martin', 'william.martin@school.com', 'teacher'),
    ('teacher10', '$2b$10$xxxxxxxxxxx', 'Elizabeth Thomas', 'elizabeth.thomas@school.com', 'teacher');

-- 2. Insert classes
INSERT INTO classes
    (name, grade_level, teacher_id, capacity)
VALUES
    ('Form 1', 'Form 1', 3, 30),
    ('Form 2', 'Form 1', 4, 30),
    ('Form 3', 'Form 2', 5, 30),
    ('Form 4', 'Form 2', 6, 30),
    ('Form 5', 'Form 3', 7, 30),
    ('Form 6', 'Form 3', 8, 30);

-- 3. Insert subjects
INSERT INTO subjects
    (name, code, description)
VALUES
    ('Mathematics', 'MATH101', 'Basic mathematics including algebra and geometry'),
    ('English', 'ENG101', 'English language and literature'),
    ('Science', 'SCI101', 'General science including physics, chemistry, and biology'),
    ('History', 'HIST101', 'World and local history'),
    ('Geography', 'GEO101', 'Physical and human geography'),
    ('Computer Studies', 'COMP101', 'Basic computer skills and programming'),
    ('Physical Education', 'PE101', 'Sports and physical fitness');

-- 4. Insert teacher_subjects
INSERT INTO teacher_subjects
    (teacher_id, subject_id)
VALUES
    (3, 1),
    (3, 2),
    -- Teacher 1 teaches Math and English
    (4, 3),
    (4, 4),
    -- Teacher 2 teaches Science and History
    (5, 5),
    (5, 6),
    -- Teacher 3 teaches Geography and Computer Studies
    (6, 1),
    (6, 3),
    -- Teacher 4 teaches Math and Science
    (7, 2),
    (7, 4),
    -- Teacher 5 teaches English and History
    (8, 5),
    (8, 7),
    -- Teacher 6 teaches Geography and PE
    (9, 6),
    (9, 7),
    -- Teacher 7 teaches Computer Studies and PE
    (10, 1),
    (10, 3);
-- Teacher 8 teaches Math and Science

-- 5. Insert students (20 students)
INSERT INTO students
    (registration_number, first_name, last_name, date_of_birth, gender, class_id, parent_name, parent_phone, parent_email, address, enrollment_date)
VALUES
    -- Form 1A Students
    ('S2024001', 'John', 'Doe', '2010-03-15', 'M', 1, 'James Doe', '+256701234567', 'james.doe@email.com', 'Kampala, Uganda', '2024-01-15'),
    ('S2024002', 'Jane', 'Smith', '2010-05-20', 'F', 1, 'Mary Smith', '+256702234567', 'mary.smith@email.com', 'Entebbe, Uganda', '2024-01-15'),
    ('S2024003', 'Peter', 'Johnson', '2010-07-10', 'M', 1, 'Paul Johnson', '+256703234567', 'paul.johnson@email.com', 'Jinja, Uganda', '2024-01-15'),
    -- Form 1B Students
    ('S2024004', 'Sarah', 'Williams', '2010-04-25', 'F', 2, 'Michael Williams', '+256704234567', 'michael.williams@email.com', 'Kampala, Uganda', '2024-01-15'),
    ('S2024005', 'David', 'Brown', '2010-06-30', 'M', 2, 'Robert Brown', '+256705234567', 'robert.brown@email.com', 'Mukono, Uganda', '2024-01-15'),
    ('S2024006', 'Emma', 'Davis', '2010-08-15', 'F', 2, 'Patricia Davis', '+256706234567', 'patricia.davis@email.com', 'Wakiso, Uganda', '2024-01-15'),
    -- Form 2A Students
    ('S2024007', 'Michael', 'Wilson', '2009-03-20', 'M', 3, 'George Wilson', '+256707234567', 'george.wilson@email.com', 'Kampala, Uganda', '2023-01-15'),
    ('S2024008', 'Lisa', 'Anderson', '2009-05-25', 'F', 3, 'Susan Anderson', '+256708234567', 'susan.anderson@email.com', 'Entebbe, Uganda', '2023-01-15'),
    ('S2024009', 'James', 'Taylor', '2009-07-15', 'M', 3, 'William Taylor', '+256709234567', 'william.taylor@email.com', 'Jinja, Uganda', '2023-01-15'),
    -- Form 2B Students
    ('S2024010', 'Emily', 'Thomas', '2009-04-30', 'F', 4, 'Elizabeth Thomas', '+256710234567', 'elizabeth.thomas@email.com', 'Kampala, Uganda', '2023-01-15'),
    ('S2024011', 'Robert', 'Moore', '2009-06-05', 'M', 4, 'Charles Moore', '+256711234567', 'charles.moore@email.com', 'Mukono, Uganda', '2023-01-15'),
    ('S2024012', 'Sophie', 'Jackson', '2009-08-20', 'F', 4, 'Margaret Jackson', '+256712234567', 'margaret.jackson@email.com', 'Wakiso, Uganda', '2023-01-15'),
    -- Form 3A Students
    ('S2024013', 'Daniel', 'White', '2008-03-25', 'M', 5, 'Joseph White', '+256713234567', 'joseph.white@email.com', 'Kampala, Uganda', '2022-01-15'),
    ('S2024014', 'Olivia', 'Harris', '2008-05-30', 'F', 5, 'Dorothy Harris', '+256714234567', 'dorothy.harris@email.com', 'Entebbe, Uganda', '2022-01-15'),
    ('S2024015', 'William', 'Martin', '2008-07-20', 'M', 5, 'Richard Martin', '+256715234567', 'richard.martin@email.com', 'Jinja, Uganda', '2022-01-15'),
    -- Form 3B Students
    ('S2024016', 'Sophia', 'Thompson', '2008-04-05', 'F', 6, 'Barbara Thompson', '+256716234567', 'barbara.thompson@email.com', 'Kampala, Uganda', '2022-01-15'),
    ('S2024017', 'Thomas', 'Garcia', '2008-06-10', 'M', 6, 'Christopher Garcia', '+256717234567', 'christopher.garcia@email.com', 'Mukono, Uganda', '2022-01-15'),
    ('S2024018', 'Isabella', 'Martinez', '2008-08-25', 'F', 6, 'Jennifer Martinez', '+256718234567', 'jennifer.martinez@email.com', 'Wakiso, Uganda', '2022-01-15'),
    ('S2024019', 'Alexander', 'Robinson', '2008-09-15', 'M', 6, 'Kenneth Robinson', '+256719234567', 'kenneth.robinson@email.com', 'Kampala, Uganda', '2022-01-15'),
    ('S2024020', 'Victoria', 'Clark', '2008-10-20', 'F', 6, 'Michelle Clark', '+256720234567', 'michelle.clark@email.com', 'Entebbe, Uganda', '2022-01-15');

-- 6. Insert some sample grades
INSERT INTO grades
    (student_id, subject_id, term, year, marks, grade, remarks)
VALUES
    -- Sample grades for first three students in Form 1A
    (1, 1, 1, 2024, 85, 'A', 'Excellent performance in mathematics'),
    (1, 2, 1, 2024, 78, 'B', 'Good understanding of English'),
    (1, 3, 1, 2024, 82, 'A', 'Strong grasp of scientific concepts'),
    (2, 1, 1, 2024, 90, 'A', 'Outstanding mathematical skills'),
    (2, 2, 1, 2024, 88, 'A', 'Excellent communication skills'),
    (2, 3, 1, 2024, 85, 'A', 'Very good understanding of science'),
    (3, 1, 1, 2024, 75, 'B', 'Good effort in mathematics'),
    (3, 2, 1, 2024, 80, 'A', 'Strong English language skills'),
    (3, 3, 1, 2024, 77, 'B', 'Good scientific understanding');

-- 7. Insert some sample attendance records
INSERT INTO attendance
    (student_id, date, status, remarks)
VALUES
    (1, '2024-02-01', 'present', NULL),
    (2, '2024-02-01', 'present', NULL),
    (3, '2024-02-01', 'absent', 'Sick leave'),
    (4, '2024-02-01', 'present', NULL),
    (5, '2024-02-01', 'late', 'Arrived 30 minutes late');

-- 8. Insert sample calendar events
INSERT INTO calendar_events
    (title, description, date, created_by)
VALUES
    ('Parent-Teacher Meeting', 'Term 1 parent-teacher consultation day', '2024-03-15', 1),
    ('Sports Day', 'Annual school sports competition', '2024-04-20', 1),
    ('End of Term Exams', 'Term 1 final examinations', '2024-04-10', 1);

-- 9. Insert sample circulars
INSERT INTO circulars
    (title, description, file_path, uploaded_by)
VALUES
    ('Term 1 Calendar', 'Important dates for Term 1', '/uploads/circulars/term1_calendar.pdf', 1),
    ('Fee Structure 2024', 'School fees structure for 2024', '/uploads/circulars/fees_2024.pdf', 1),
    ('School Uniform Policy', 'Updated school uniform guidelines', '/uploads/circulars/uniform_policy.pdf', 1); 