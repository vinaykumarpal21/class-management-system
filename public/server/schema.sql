-- ============================================================
--  Sagar Classes  |  MySQL 8 / MariaDB 10.4+ schema + seed data
--  Run:  mysql -u root -p < server/schema.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS sagar_classes
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sagar_classes;

CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  class_name VARCHAR(30)  NOT NULL,
  photo_url  VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_students_name (name),
  KEY idx_students_class (class_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS staff (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  department VARCHAR(80)  NOT NULL,
  photo_url  VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_staff_name (name),
  KEY idx_staff_dept (department)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS toppers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  rank_label VARCHAR(10)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  class_name VARCHAR(40)  NOT NULL,
  score      VARCHAR(10)  NOT NULL,
  message    VARCHAR(255) NULL,
  photo_url  VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_toppers_class (class_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(120) NOT NULL,
  category    VARCHAR(50)  NOT NULL,
  description VARCHAR(500) NOT NULL,
  image_url   VARCHAR(500) NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notices (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  message    VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- One attendance row per person per day (re-submitting the same day updates the status).
CREATE TABLE IF NOT EXISTS student_attendance (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  standard     VARCHAR(10)  NOT NULL,
  att_date     DATE NOT NULL,
  status       ENUM('Present','Absent') NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_day (student_name, standard, att_date),
  KEY idx_student_att_date (att_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  staff_name VARCHAR(100) NOT NULL,
  department VARCHAR(80)  NOT NULL,
  att_date   DATE NOT NULL,
  status     ENUM('Present','Absent') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_day (staff_name, department, att_date),
  KEY idx_staff_att_date (att_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seed data (copied from the current static pages).
-- The admin login is NOT created here: server.js creates it on first
-- start from ADMIN_USER / ADMIN_PASSWORD in .env (stored bcrypt-hashed).
-- Only seeds into empty tables, so re-running this file is safe.
-- ------------------------------------------------------------

INSERT INTO students (photo_url, phone, name, class_name)
SELECT * FROM (
  SELECT 'https://i.pravatar.cc/100?img=11', '+91 98111 22331', 'Aarav Sharma', 'Class 10'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=47', '+91 98222 33442', 'Priya Mehta', 'Class 10'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=15', '+91 98333 44553', 'Rohan Patil', 'Class 9'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=48', '+91 98444 55664', 'Sneha Joshi', 'Class 12'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=12', '+91 98555 66775', 'Aryan Gupta', 'Class 8'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=33', '+91 98666 78886', 'Ishaan Verma', 'Class 11'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM students);

INSERT INTO staff (photo_url, phone, name, department)
SELECT * FROM (
  SELECT 'https://i.pravatar.cc/100?img=57', '+91 99111 00111', 'Sagar Sir', 'Mathematics'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=44', '+91 99222 00222', 'Pooja Ma''am', 'Science'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=44', '+91 99333 00333', 'Pratibha Ma''am', 'Science'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=44', '+91 99444 00444', 'Pranjal Ma''am', 'Science'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=44', '+91 99555 00555', 'Poorva Ma''am', 'Science'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=44', '+91 99666 00666', 'Sanvi Ma''am', 'Science'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=44', '+91 99777 00777', 'Prachi Ma''am', 'Science'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=59', '+91 99888 00888', 'Rahul Sir', 'English'
  UNION ALL SELECT 'https://i.pravatar.cc/100?img=49', '+91 99999 00999', 'Anita Ma''am', 'Social Science'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM staff);

INSERT INTO toppers (rank_label, name, class_name, score, message, photo_url)
SELECT * FROM (
  SELECT '1st', 'Aarav Sharma', 'Class 10', '95%', 'Outstanding achievement in Class 10 Board Exams! 🎉', 'https://i.pravatar.cc/100?img=11'
  UNION ALL SELECT '2nd', 'Priya Mehta', 'Class 10', '93%', 'Amazing performance and continuous hard work! 🎉', 'https://i.pravatar.cc/100?img=47'
  UNION ALL SELECT '3rd', 'Priya Mehta', 'Class 10', '83%', 'Amazing performance and continuous hard work! 🎉', 'https://i.pravatar.cc/100?img=47'
  UNION ALL SELECT '4th', 'vijay Mehta', 'Class 10', '73%', 'Amazing performance and continuous hard work! 🎉', 'https://i.pravatar.cc/100?img=47'
  UNION ALL SELECT '1st', 'Sneha Joshi', 'Class 12 (Science)', '97%', 'Brilliant science stream topper result! 🎉', 'https://i.pravatar.cc/100?img=48'
  UNION ALL SELECT '2nd', 'Sneha Joshi', 'Class 12 (Science)', '90%', 'Brilliant science stream topper result! 🎉', 'https://i.pravatar.cc/100?img=48'
  UNION ALL SELECT '3rd', 'Ishaan Verma', 'Class 12 (Science)', '87%', 'Exceptional excellence in Physics, Chemistry & Math! 🎉', 'https://i.pravatar.cc/100?img=33'
  UNION ALL SELECT '1st', 'Rohan Kapoor', 'Class 12 (Commerce)', '94%', 'Topped the commerce stream with exceptional acumen! 🎉', 'https://i.pravatar.cc/100?img=52'
  UNION ALL SELECT '2nd', 'Ananya Sen', 'Class 12 (Commerce)', '90%', 'Outstanding results in Accounts & Economics! 🎉', 'https://i.pravatar.cc/100?img=32'
  UNION ALL SELECT '3rd', 'Rohan Kapoor', 'Class 12 (Commerce)', '84%', 'Topped the commerce stream with exceptional acumen! 🎉', 'https://i.pravatar.cc/100?img=52'
  UNION ALL SELECT '4th', 'Rohan Kapoor', 'Class 12 (Commerce)', '74%', 'Topped the commerce stream with exceptional acumen! 🎉', 'https://i.pravatar.cc/100?img=52'
  UNION ALL SELECT '5th', 'Rohan Kapoor', 'Class 12 (Commerce)', '64%', 'Topped the commerce stream with exceptional acumen! 🎉', 'https://i.pravatar.cc/100?img=52'
  UNION ALL SELECT '6th', 'Rohan Kapoor', 'Class 12 (Commerce)', '54%', 'Topped the commerce stream with exceptional acumen! 🎉', 'https://i.pravatar.cc/100?img=52'
  UNION ALL SELECT '7st', 'Rohan Kapoor', 'Class 12 (Commerce)', '50%', 'Topped the commerce stream with exceptional acumen! 🎉', 'https://i.pravatar.cc/100?img=52'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM toppers);

INSERT INTO events (image_url, title, category, description)
SELECT * FROM (
  SELECT 'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=900&q=85', 'Annual Picnic', 'Picnic', 'A fun-filled educational picnic with games, teamwork and memorable activities.'
  UNION ALL SELECT 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85', 'Diwali Celebration', 'Festival', 'A vibrant celebration with rangoli, cultural activities and festive learning.'
  UNION ALL SELECT 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=85', 'Science Exhibition', 'Academic', 'Students present creative experiments, working models and science projects.'
  UNION ALL SELECT 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85', 'Sports Day', 'Sports', 'Track, field and team activities that encourage fitness, discipline and sportsmanship.'
  UNION ALL SELECT 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=85', 'Annual Day', 'Cultural', 'A celebration of student talent through performances, awards and cultural programmes.'
  UNION ALL SELECT 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=85', 'Parent-Teacher Meeting', 'PTM', 'A constructive interaction between parents and teachers to review student progress.'
  UNION ALL SELECT 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=85', 'Independence Day', 'National Day', 'Patriotic activities, student performances and a special assembly celebrating India.'
  UNION ALL SELECT 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=85', 'Republic Day', 'National Day', 'A meaningful school celebration with speeches, performances and civic learning.'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM events);

INSERT INTO notices (message, sort_order)
SELECT * FROM (
  SELECT '🎓 Admissions open for 2026-27 academic year! Enroll now.', '1'
  UNION ALL SELECT '📝 Unit Test scheduled for Class 10 on 1st September 2026.', '2'
  UNION ALL SELECT '🏆 Congratulations to all Board toppers of 2025-26 batch!', '3'
  UNION ALL SELECT '📅 Parent-Teacher Meeting on 10th September 2026 at 10:00 AM.', '4'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM notices);
