-- Creates the PantherWell database, a users table, and some dummy data.
-- Run with: mysql -u root -p < database/pantherwell.sql

CREATE DATABASE IF NOT EXISTS pantherwell;
USE pantherwell;

DROP TABLE IF EXISTS users;

-- passwords are never stored as plain text: password holds a pbkdf2 (sha512)
-- hash and salt holds the random salt that was used to make it
CREATE TABLE users (
	user_id    INT AUTO_INCREMENT PRIMARY KEY,
	username   VARCHAR(50)  NOT NULL UNIQUE,
	first_name VARCHAR(50),
	last_name  VARCHAR(50),
	email      VARCHAR(100) NOT NULL UNIQUE,
	password   CHAR(128)    NOT NULL,
	salt       CHAR(32)     NOT NULL,
	role       ENUM('student', 'therapist', 'admin') NOT NULL DEFAULT 'student',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- dummy users, the password for all of them is pass123 (admin123 for admin)
INSERT INTO users (username, first_name, last_name, email, password, salt, role) VALUES
('jlee12', 'Jordan', 'Lee', 'jlee12@student.gsu.edu', 'ad0793a8b9b24046ff61706592cc9c57b33d102018466cd38ebc40f577b724156f2f6a5c601ffccf0c7e9f0c96e718d8ac2ebe25175e161f28412640849515da', '4b3495502961f742d39b30ffbf6c1cfa', 'student'),
('ppatel4', 'Priya', 'Patel', 'ppatel4@student.gsu.edu', 'dad887a179eae7b6b74321f1bea53afb691c0af830f01d98a4619a5fc54f6de610e66ee7fdae0958ebc0b79acce4b544d27d5523023c858e8de8472fc0237324', '4778ba0e1aac775b43e21ad1c4b24f61', 'student'),
('mjohnson9', 'Marcus', 'Johnson', 'mjohnson9@student.gsu.edu', 'a8422d8b8a65a3509f9c401a0f09b6f1b046d0c789d79c8854613f964b9e041bfe3f069ee3abc6be9c7d8830f5afda93776bfc565324599d2c30c9d402653651', '9bf4861c77e0035c1032852c6c267b0e', 'student'),
('sramirez2', 'Sofia', 'Ramirez', 'sramirez2@student.gsu.edu', '78519a869185624724308445b7a1ceeddfc95098ee8ab137b9db53cc92d4ea15dbeecd333c94d22f62608a929dee507d918ba8a4af2928cf9b4a3bef31173fc4', 'e3465f9de72bbadedc1822de39644203', 'student'),
('ecarter', 'Emily', 'Carter', 'ecarter@pantherwell.org', 'f1f60f39adde507da8e19f0a2fae86a8e46512c1efbf2fca5eb4be66e048c7781fa284dec4d8c95ade0ae29c06c2b94b4f1f0782e1d7623cd9e36fecbc8c0b21', '742328cdffd5b1f613a64562c86aeaa8', 'therapist'),
('dnguyen', 'David', 'Nguyen', 'dnguyen@pantherwell.org', 'ccb1e8c9d46503f6764190bcb38070b2430d8639fe093f51ba5b796e220e0661bb35434df37bbe587babf61afa9f40824672e844d8e34dc967d04ad22953dcce', '8a4a9eb6798eeefbb5b9342ea651d729', 'therapist'),
('admin', 'Admin', 'User', 'admin@pantherwell.org', '448563e61af31213258b6afa5fe29308d247ef211963752b85a7f1ecf923c3e57bf2a3979673a9a439561f092603c8287dc6f47119a607358a80e63d690c42ff', '27b4468fa12f5f0d4d069712d914ebf1', 'admin');

SELECT user_id, username, email, role FROM users;
