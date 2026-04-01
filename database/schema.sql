-- =====================================================
-- EXAMSHIELD — Complete Database Schema
-- MySQL 8.0+
-- Run this file to create all tables
-- =====================================================

CREATE DATABASE IF NOT EXISTS examshield;
USE examshield;

-- ── USERS TABLE ──────────────────────────────────────
-- Stores both students and admins
CREATE TABLE IF NOT EXISTS users (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  department    VARCHAR(100) DEFAULT NULL,          -- student's department
  avatar_url    VARCHAR(255) DEFAULT NULL,
  is_active     TINYINT(1)  NOT NULL DEFAULT 1,
  reset_token   VARCHAR(255) DEFAULT NULL,
  reset_expires DATETIME     DEFAULT NULL,
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);

-- ── EXAMS TABLE ──────────────────────────────────────
-- Exam details configured by admin
CREATE TABLE IF NOT EXISTS exams (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  subject       VARCHAR(100) DEFAULT NULL,
  description   TEXT         DEFAULT NULL,
  duration      INT          NOT NULL,               -- in minutes
  total_marks   INT          NOT NULL,
  pass_marks    INT          DEFAULT NULL,            -- auto-set to 60% if null
  is_active     TINYINT(1)  NOT NULL DEFAULT 1,
  randomize_q   TINYINT(1)  NOT NULL DEFAULT 1,      -- randomize questions?
  created_by    INT          NOT NULL,               -- FK to users (admin)
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_active (is_active)
);

-- ── QUESTIONS TABLE ───────────────────────────────────
-- MCQ questions linked to exams
CREATE TABLE IF NOT EXISTS questions (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  exam_id        INT          NOT NULL,
  question_text  TEXT         NOT NULL,
  option_a       VARCHAR(500) NOT NULL,
  option_b       VARCHAR(500) NOT NULL,
  option_c       VARCHAR(500) NOT NULL,
  option_d       VARCHAR(500) NOT NULL,
  correct_answer ENUM('A','B','C','D') NOT NULL,
  marks          INT          NOT NULL DEFAULT 1,
  difficulty     ENUM('easy','medium','hard') DEFAULT 'medium',
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  INDEX idx_exam (exam_id)
);

-- ── ATTEMPTS TABLE ────────────────────────────────────
-- Tracks each student's exam session
CREATE TABLE IF NOT EXISTS attempts (
  id              INT       AUTO_INCREMENT PRIMARY KEY,
  user_id         INT       NOT NULL,
  exam_id         INT       NOT NULL,
  started_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at    TIMESTAMP DEFAULT NULL,
  is_submitted    TINYINT(1) NOT NULL DEFAULT 0,
  answers         JSON      DEFAULT NULL,              -- { "questionId": "A", ... }
  cheat_count     INT       NOT NULL DEFAULT 0,        -- tab-switch violations
  is_flagged      TINYINT(1) NOT NULL DEFAULT 0,       -- flagged for cheating
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  UNIQUE KEY uq_attempt (user_id, exam_id),
  INDEX idx_user (user_id),
  INDEX idx_exam (exam_id)
);

-- ── RESULTS TABLE ─────────────────────────────────────
-- Final scores after submission
CREATE TABLE IF NOT EXISTS results (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  attempt_id  INT       NOT NULL UNIQUE,
  user_id     INT       NOT NULL,
  exam_id     INT       NOT NULL,
  score       INT       NOT NULL DEFAULT 0,
  percentage  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  correct     INT       NOT NULL DEFAULT 0,
  wrong       INT       NOT NULL DEFAULT 0,
  skipped     INT       NOT NULL DEFAULT 0,
  `rank`      INT       DEFAULT NULL,                -- rank among all students for this exam
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (exam_id)    REFERENCES exams(id)    ON DELETE CASCADE,
  INDEX idx_user    (user_id),
  INDEX idx_exam    (exam_id),
  INDEX idx_score   (score DESC),
  INDEX idx_percent (percentage DESC)
);

-- =====================================================
-- SAMPLE DATA — For testing/demo
-- =====================================================

-- Sample Admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@examshield.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewoeWn7TxhkW/FGe',
   'admin');

-- Sample Students (password: student123)
INSERT IGNORE INTO users (name, email, password_hash, role, department) VALUES
  ('Rahul Sharma',   'rahul@student.com',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewoeWn7TxhkW/FGe', 'student', 'Computer Science'),
  ('Priya Singh',    'priya@student.com',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewoeWn7TxhkW/FGe', 'student', 'Information Technology'),
  ('Amit Kumar',     'amit@student.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewoeWn7TxhkW/FGe', 'student', 'Electronics'),
  ('Neha Gupta',     'neha@student.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewoeWn7TxhkW/FGe', 'student', 'Computer Science'),
  ('Rohit Verma',    'rohit@student.com',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewoeWn7TxhkW/FGe', 'student', 'Mechanical');

-- Sample Exams
INSERT IGNORE INTO exams (title, subject, description, duration, total_marks, pass_marks, created_by) VALUES
  ('Data Structures & Algorithms',    'Computer Science', 'Final exam covering DSA concepts', 60, 100, 60, 1),
  ('Database Management Systems',     'Computer Science', 'SQL and DBMS concepts',            45, 50,  30, 1),
  ('Operating Systems',               'Computer Science', 'OS fundamentals and concepts',     30, 40,  24, 1),
  ('Web Development Fundamentals',    'IT',               'HTML, CSS, JavaScript basics',     45, 100, 60, 1);

-- Sample Questions for Exam 1 (Data Structures)
INSERT IGNORE INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty) VALUES
  (1, 'What is the time complexity of Binary Search?', 'O(n)', 'O(log n)', 'O(n²)', 'O(1)', 'B', 'easy'),
  (1, 'Which data structure uses LIFO principle?',     'Queue', 'Stack', 'Array', 'Linked List', 'B', 'easy'),
  (1, 'What is the worst case time complexity of QuickSort?', 'O(n log n)', 'O(n²)', 'O(n)', 'O(log n)', 'B', 'medium'),
  (1, 'Which traversal visits nodes in Left-Root-Right order?', 'Preorder', 'Postorder', 'Inorder', 'Level order', 'C', 'medium'),
  (1, 'What is a Hash Table collision?', 'Two keys hashing to different values', 'Two different keys hashing to same index', 'Key not found in table', 'Table is full', 'B', 'medium'),
  (1, 'Which sorting algorithm has best average-case performance?', 'Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort', 'C', 'medium'),
  (1, 'What is a Binary Search Tree property?', 'Left > Root', 'Left < Root < Right', 'Right < Root', 'All nodes equal', 'B', 'easy'),
  (1, 'DFS uses which data structure internally?', 'Queue', 'Stack', 'Heap', 'Array', 'B', 'medium'),
  (1, 'What is the space complexity of Merge Sort?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'C', 'hard'),
  (1, 'Which algorithm is used in Dijkstra shortest path?', 'DFS', 'BFS', 'Greedy', 'Dynamic Programming', 'C', 'hard');

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all students:
-- SELECT id, name, email, department FROM users WHERE role='student';

-- Get exam leaderboard:
-- SELECT u.name, r.score, r.percentage, r.rank
-- FROM results r JOIN users u ON u.id = r.user_id
-- WHERE r.exam_id = 1 ORDER BY r.score DESC;

-- Get student's exam history:
-- SELECT e.title, r.score, r.percentage, r.rank, r.created_at
-- FROM results r JOIN exams e ON e.id = r.exam_id
-- WHERE r.user_id = 2;

-- Get pass rate per exam:
-- SELECT e.title,
--   COUNT(*) AS total_attempts,
--   SUM(CASE WHEN r.percentage >= 60 THEN 1 ELSE 0 END) AS passed,
--   ROUND(AVG(r.percentage), 1) AS avg_percentage
-- FROM results r JOIN exams e ON e.id = r.exam_id
-- GROUP BY r.exam_id;
