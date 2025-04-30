USE school_management;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admissionNumber VARCHAR(20) UNIQUE NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    dateOfBirth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    photo_path VARCHAR(255),
    class_id INT,
    stream_id INT,
    parent_id INT,
    address TEXT,
    parentName VARCHAR(100),
    parentPhone VARCHAR(20),
    parentEmail VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create streams table
CREATE TABLE IF NOT EXISTS streams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create academic_records table
CREATE TABLE IF NOT EXISTS academic_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,
    term VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    marks DECIMAL(5,2),
    grade VARCHAR(2),
    remarks TEXT,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    remarks TEXT,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    event_type ENUM('academic', 'holiday', 'meeting', 'other') NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create circulars table
CREATE TABLE IF NOT EXISTS circulars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_audience ENUM('all', 'students', 'teachers', 'parents') NOT NULL,
    published_by INT NOT NULL,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create grades table if it doesn't exist
CREATE TABLE IF NOT EXISTS grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    term INT NOT NULL,
    year INT NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    grade CHAR(1) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Insert sample subjects if they don't exist
INSERT IGNORE INTO subjects (name, code) VALUES
('Mathematics', 'MATH'),
('English', 'ENG'),
('Physics', 'PHY'),
('Chemistry', 'CHEM'),
('Biology', 'BIO'),
('History', 'HIST'),
('Geography', 'GEO'),
('Literature', 'LIT'),
('Computer Science', 'CS'),
('Agriculture', 'AGR');

-- Insert sample grades if they don't exist
INSERT IGNORE INTO grades (student_id, subject_id, term, year, marks, grade, remarks) VALUES
(1, 1, 1, 2025, 85.5, 'A', 'Excellent performance'),
(1, 2, 1, 2025, 78.0, 'B', 'Good work'),
(1, 3, 1, 2025, 82.5, 'A', 'Very good'),
(1, 4, 1, 2025, 75.0, 'B', 'Satisfactory'),
(1, 5, 1, 2025, 88.0, 'A', 'Outstanding'); 