USE school_management;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS academic_records;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS streams;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS subjects;

-- Create classes table
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create streams table
CREATE TABLE streams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Create subjects table
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admissionNumber VARCHAR(20) UNIQUE NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    dateOfBirth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    class_id INT,
    stream_id INT,
    address TEXT,
    parentName VARCHAR(100),
    parentPhone VARCHAR(20),
    parentEmail VARCHAR(100),
    previousSchool VARCHAR(100),
    lastGrade VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL
);

-- Create academic_records table
CREATE TABLE academic_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,
    term VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    marks DECIMAL(5,2),
    grade VARCHAR(2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Create attendance table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert initial data for classes
INSERT INTO classes (name, description) VALUES
('Form 1', 'First year of secondary school'),
('Form 2', 'Second year of secondary school'),
('Form 3', 'Third year of secondary school'),
('Form 4', 'Fourth year of secondary school');

-- Insert initial data for streams
INSERT INTO streams (class_id, name, capacity) VALUES
(1, 'A', 40),
(1, 'B', 40),
(2, 'A', 40),
(2, 'B', 40),
(3, 'A', 40),
(3, 'B', 40),
(4, 'A', 40),
(4, 'B', 40);

-- Insert initial data for subjects
INSERT INTO subjects (name, code, description) VALUES
('Mathematics', 'MATH', 'Basic mathematics and algebra'),
('English', 'ENG', 'English language and literature'),
('Physics', 'PHY', 'Basic physics and mechanics'),
('Chemistry', 'CHEM', 'Basic chemistry and reactions'),
('Biology', 'BIO', 'Basic biology and life sciences'),
('History', 'HIST', 'World history and events'),
('Geography', 'GEO', 'Physical and human geography'),
('Computer Science', 'CS', 'Basic computer programming and applications'); 