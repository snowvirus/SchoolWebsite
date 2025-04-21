-- Add grades for Term 1, 2024
INSERT INTO grades
    (student_id, subject_id, term, year, marks, grade, remarks)
VALUES
    -- James Brown (S001) - Form 1
    (1, 1, 1, 2024, 85, 'A', 'Excellent performance'),
    (1, 2, 1, 2024, 78, 'B', 'Good work'),
    (1, 3, 1, 2024, 82, 'A', 'Very good'),
    (1, 4, 1, 2024, 75, 'B', 'Good effort'),
    (1, 5, 1, 2024, 80, 'A', 'Excellent'),

    -- Sarah Davis (S002) - Form 1
    (2, 1, 1, 2024, 90, 'A', 'Outstanding'),
    (2, 2, 1, 2024, 85, 'A', 'Excellent'),
    (2, 3, 1, 2024, 88, 'A', 'Very good'),
    (2, 4, 1, 2024, 82, 'A', 'Excellent'),
    (2, 5, 1, 2024, 85, 'A', 'Outstanding'),

    -- Michael Wilson (S003) - Form 2
    (3, 1, 1, 2024, 75, 'B', 'Good work'),
    (3, 2, 1, 2024, 70, 'B', 'Good effort'),
    (3, 3, 1, 2024, 65, 'C', 'Satisfactory'),
    (3, 4, 1, 2024, 72, 'B', 'Good'),
    (3, 5, 1, 2024, 68, 'C', 'Satisfactory'),

    -- Francis Bazzenkya (S004) - Form 3
    (4, 1, 1, 2024, 60, 'C', 'Satisfactory'),
    (4, 2, 1, 2024, 55, 'D', 'Needs improvement'),
    (4, 3, 1, 2024, 65, 'C', 'Satisfactory'),
    (4, 4, 1, 2024, 58, 'D', 'Needs improvement'),
    (4, 5, 1, 2024, 62, 'C', 'Satisfactory'); 