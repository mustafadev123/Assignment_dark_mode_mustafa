-- Creates the PantherWell database, a users table, and some dummy data.
-- Run with: mysql -u root -p < database/pantherwell.sql

CREATE DATABASE IF NOT EXISTS pantherwell;
USE pantherwell;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
	user_id    INT AUTO_INCREMENT PRIMARY KEY,
	first_name VARCHAR(50)  NOT NULL,
	last_name  VARCHAR(50)  NOT NULL,
	email      VARCHAR(100) NOT NULL UNIQUE,
	password   VARCHAR(255) NOT NULL,
	role       ENUM('student', 'therapist', 'admin') NOT NULL DEFAULT 'student',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (first_name, last_name, email, password, role) VALUES
('Jordan',  'Lee',      'jlee12@student.gsu.edu',     'pass123', 'student'),
('Priya',   'Patel',    'ppatel4@student.gsu.edu',    'pass123', 'student'),
('Marcus',  'Johnson',  'mjohnson9@student.gsu.edu',  'pass123', 'student'),
('Sofia',   'Ramirez',  'sramirez2@student.gsu.edu',  'pass123', 'student'),
('Emily',   'Carter',   'ecarter@pantherwell.org',    'pass123', 'therapist'),
('David',   'Nguyen',   'dnguyen@pantherwell.org',    'pass123', 'therapist'),
('Admin',   'User',     'admin@pantherwell.org',      'admin123', 'admin');

SELECT * FROM users;
