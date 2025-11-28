# School Management System

A comprehensive school management system with features for students, teachers, and administrators.

## Project Structure

```
src/
├── public/                 # Publicly accessible files
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   ├── images/            # Images and assets
│   └── uploads/           # File uploads
├── auth/                  # Authentication related files
│   ├── login.html         # Login page
│   └── register.html      # Registration page
├── student/               # Student portal
│   ├── dashboard.html     # Student dashboard
│   ├── academic.html      # Academic records
│   ├── attendance.html    # Attendance records
│   └── assignments.html   # Assignments
├── admin/                 # Admin portal
│   ├── dashboard.html     # Admin dashboard
│   ├── students.html      # Student management
│   └── teachers.html      # Teacher management
├── shared/                # Shared resources
│   ├── styles/           # Shared stylesheets
│   └── utils/            # Shared utilities
├── database/              # Database related files
│   └── initDatabase.js   # Database initialization
├── routes/                # API routes
├── controllers/           # Route controllers
├── models/                # Database models
├── middleware/            # Express middleware
└── config/                # Configuration files
```

## Setup Instructions

1. **Prerequisites**
   - Node.js (v14 or higher)
   - MySQL (v8.0 or higher)
   - npm or yarn

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]

   # Install dependencies
   npm install

   # Create .env file
   cp .env.example .env
   ```

3. **Database Setup**
   ```bash
   # Start MySQL server
   sudo service mysql start

   # Create database and tables
   node src/database/initDatabase.js
   ```

4. **Running the Application**
   ```bash
   # Start the server
   npm start or nom run dev

   # The application will be available at
   http://localhost:3001/0/2
   ```

## Access Points

1. **Public Pages**
   - Homepage: `http://localhost:3001`
   - Registration: `http://localhost:3001/registration.html`
   - Contact: `http://localhost:3001/contact.html`

2. **Student Portal**
   - Login: `http://localhost:3001/src/auth/login.html`
   - Dashboard: `http://localhost:3001/src/student/dashboard.html`
   - Academic Records: `http://localhost:3001/src/student/academic.html`
   - Attendance: `http://localhost:3001/src/student/attendance.html`

3. **Admin Portal**
   - Login: `http://localhost:3001/admin-login.html`
   - Dashboard: `http://localhost:3001/admin.html`
   - Student Management: `http://localhost:3001/src/admin/students.html`
   - Teacher Management: `http://localhost:3001/src/admin/teachers.html`

## Default Credentials

1. **Admin**
   - Username: `admin`
   - Password: `admin123`

2. **Student**
   - Register at: `http://localhost:3001/registration.html`
   - Use registered credentials to login

## Features

1. **Student Features**
   - View academic records
   - Check attendance
   - Submit assignments
   - View report cards
   - Access library resources

2. **Admin Features**
   - Manage students
   - Manage teachers
   - Track attendance
   - Generate reports
   - Manage academic records

3. **Teacher Features**
   - Record attendance
   - Submit grades
   - Manage assignments
   - View class lists

## API Documentation

The system provides RESTful APIs for various operations. All API endpoints are prefixed with `/api/`.

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Student Management
- GET `/api/students` - List all students
- POST `/api/students` - Register new student
- GET `/api/students/:id` - Get student details
- PUT `/api/students/:id` - Update student details

### Academic Records
- GET `/api/grades/:studentId` - Get student grades
- POST `/api/grades` - Submit grades
- GET `/api/attendance/:studentId` - Get attendance records

## Troubleshooting

1. **Database Connection Issues**
   - Verify MySQL is running
   - Check database credentials in .env
   - Ensure database and tables are created

2. **Authentication Issues**
   - Clear browser cache and cookies
   - Verify credentials
   - Check server logs for errors

3. **File Upload Issues**
   - Check uploads directory permissions
   - Verify file size limits
   - Check file type restrictions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
