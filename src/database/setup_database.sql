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

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
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

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    subjectId INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subjectId) REFERENCES subjects(id)
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

-- Insert sample student
INSERT INTO students (user_id, admissionNumber, firstName, lastName, dateOfBirth, gender, class_id, stream_id, address, parentName, parentPhone, parentEmail) VALUES
(1, '2024/001', 'John', 'Doe', '2008-01-15', 'male', 1, 1, '123 Main Street, Kiboga', 'Jane Doe', '+256 702 123456', 'jane.doe@email.com');

-- Insert sample academic record
INSERT INTO academic_records (student_id, subject_id, class_id, term, year, marks, grade, recorded_by) VALUES
(1, 1, 1, 'Term 1', 2024, 85.5, 'A', 1);

-- Insert sample attendance
INSERT INTO attendance (student_id, date, status, recorded_by) VALUES
(1, CURDATE(), 'present', 1);

-- Insert sample event
INSERT INTO events (title, description, start_date, end_date, event_type, created_by) VALUES
('School Opening Day', 'First day of the new academic year', '2024-02-01 08:00:00', '2024-02-01 16:00:00', 'academic', 1);

-- Insert sample circular
INSERT INTO circulars (title, content, target_audience, published_by) VALUES
('Welcome Back to School', 'Welcome to the new academic year. Please ensure all students are in proper school uniform.', 'all', 1);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$X7UrH5QxX5QxX5QxX5QxX.5QxX5QxX5QxX5QxX5QxX5QxX5QxX5Qx', 'admin'); 