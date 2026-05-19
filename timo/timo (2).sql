-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 18, 2026 at 08:09 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `timo`
--

-- --------------------------------------------------------

--
-- Table structure for table `aoi_assessments`
--

CREATE TABLE `aoi_assessments` (
  `aoi_id` int(11) NOT NULL,
  `stream_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `term` int(11) NOT NULL,
  `academic_year` year(4) NOT NULL,
  `aoi_name` varchar(100) NOT NULL,
  `unique_code` varchar(50) NOT NULL,
  `max_mark` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `aoi_assessments`
--

INSERT INTO `aoi_assessments` (`aoi_id`, `stream_id`, `subject_id`, `teacher_id`, `term`, `academic_year`, `aoi_name`, `unique_code`, `max_mark`) VALUES
(1, 1, 1, 2, 2, '2026', 'atoms', 'AOI-L866-75', 56.00),
(2, 1, 1, 2, 2, '2026', 'energy', 'AOI-2026-T2-SUB-DSCA9U', 69.00),
(3, 1, 1, 2, 2, '2026', 'programming', 'AOI-2026-T2-PHY-U83LS6', 60.00);

-- --------------------------------------------------------

--
-- Table structure for table `aoi_scores`
--

CREATE TABLE `aoi_scores` (
  `score_id` int(11) NOT NULL,
  `aoi_id` int(11) NOT NULL,
  `learner_id` int(11) NOT NULL,
  `score_entered` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `aoi_scores`
--

INSERT INTO `aoi_scores` (`score_id`, `aoi_id`, `learner_id`, `score_entered`) VALUES
(19, 2, 2, 55.00),
(20, 2, 1, 45.00),
(21, 2, 3, 45.00),
(22, 2, 4, 45.00),
(23, 2, 5, 45.00),
(24, 1, 2, 34.00),
(25, 1, 1, 46.00),
(26, 1, 3, 33.50),
(27, 1, 4, 34.00),
(28, 1, 5, 12.00),
(32, 3, 2, 45.00),
(33, 3, 1, 52.00),
(34, 3, 3, 56.00),
(35, 3, 4, 20.00),
(36, 3, 5, 40.00);

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `record_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `learner_id` int(11) NOT NULL,
  `status` enum('present','absent') DEFAULT 'present'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance_records`
--

INSERT INTO `attendance_records` (`record_id`, `session_id`, `learner_id`, `status`) VALUES
(6, 2, 2, 'absent'),
(7, 2, 1, 'present'),
(8, 2, 3, 'absent'),
(9, 2, 4, 'present'),
(10, 2, 5, 'absent'),
(11, 3, 2, 'present'),
(12, 3, 1, 'present'),
(13, 3, 3, 'present'),
(14, 3, 4, 'present'),
(15, 3, 5, 'absent'),
(51, 1, 2, 'present'),
(52, 1, 1, 'absent'),
(53, 1, 3, 'absent'),
(54, 1, 4, 'absent'),
(55, 1, 5, 'present'),
(61, 4, 2, 'absent'),
(62, 4, 1, 'absent'),
(63, 4, 3, 'present'),
(64, 4, 4, 'absent'),
(65, 4, 5, 'absent');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_sessions`
--

CREATE TABLE `attendance_sessions` (
  `session_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `stream_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `term` int(11) NOT NULL DEFAULT 2,
  `academic_year` year(4) NOT NULL DEFAULT 2026,
  `session_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance_sessions`
--

INSERT INTO `attendance_sessions` (`session_id`, `teacher_id`, `stream_id`, `subject_id`, `term`, `academic_year`, `session_date`) VALUES
(1, 2, 1, 1, 2, '2026', '2026-05-17'),
(2, 2, 1, 1, 2, '2026', '2026-05-17'),
(3, 2, 1, 1, 2, '2026', '2026-05-17'),
(4, 2, 1, 1, 2, '2026', '2026-05-18');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL,
  `class_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `class_name`) VALUES
(1, 'Senior 3'),
(2, 'Senior 4'),
(8, 'senior 5'),
(9, 'S1'),
(10, 'senior 6');

-- --------------------------------------------------------

--
-- Table structure for table `learners`
--

CREATE TABLE `learners` (
  `learner_id` int(11) NOT NULL,
  `stream_id` int(11) NOT NULL,
  `admission_number` varchar(50) NOT NULL,
  `full_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `learners`
--

INSERT INTO `learners` (`learner_id`, `stream_id`, `admission_number`, `full_name`) VALUES
(1, 2, 'U001', 'Kato Paul'),
(2, 5, 'U002', 'Babirye Sarah'),
(3, 1, 'U003', 'Mukasa Peter'),
(4, 1, 'U004', 'Nalubega Grace'),
(5, 2, 'U005', 'Okelo James');

-- --------------------------------------------------------

--
-- Table structure for table `project_scores`
--

CREATE TABLE `project_scores` (
  `score_id` int(11) NOT NULL,
  `learner_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `term` int(11) NOT NULL,
  `academic_year` year(4) NOT NULL,
  `competency_number` int(11) NOT NULL,
  `sub_criteria` varchar(10) NOT NULL,
  `score` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_scores`
--

INSERT INTO `project_scores` (`score_id`, `learner_id`, `subject_id`, `term`, `academic_year`, `competency_number`, `sub_criteria`, `score`) VALUES
(19, 2, 1, 2, '2026', 1, '1.1', 1.00),
(20, 2, 1, 2, '2026', 1, '1.2', 2.00),
(21, 2, 1, 2, '2026', 1, '1.3', 4.00),
(22, 2, 1, 2, '2026', 1, '1.4', 4.00),
(23, 2, 1, 2, '2026', 1, '1.5', 5.00),
(24, 2, 1, 2, '2026', 1, '1.6', 5.00),
(25, 2, 1, 2, '2026', 1, '1.7', 5.00),
(26, 2, 1, 2, '2026', 1, '1.8', 4.00),
(27, 2, 1, 2, '2026', 1, '1.9', 4.00),
(28, 2, 1, 2, '2026', 1, '1.10', 5.00),
(29, 2, 1, 2, '2026', 1, '1.11', 6.00),
(30, 2, 1, 2, '2026', 1, '1.12', 7.00),
(31, 2, 1, 2, '2026', 1, '1.13', 4.00),
(32, 2, 1, 2, '2026', 1, '1.14', 5.00);

-- --------------------------------------------------------

--
-- Table structure for table `sa_assessments`
--

CREATE TABLE `sa_assessments` (
  `sa_id` int(11) NOT NULL,
  `stream_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `term` int(11) NOT NULL,
  `academic_year` year(4) NOT NULL,
  `total_box` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sa_assessments`
--

INSERT INTO `sa_assessments` (`sa_id`, `stream_id`, `subject_id`, `teacher_id`, `term`, `academic_year`, `total_box`) VALUES
(1, 1, 1, 2, 2, '2026', 54.00);

-- --------------------------------------------------------

--
-- Table structure for table `sa_scores`
--

CREATE TABLE `sa_scores` (
  `score_id` int(11) NOT NULL,
  `sa_id` int(11) NOT NULL,
  `learner_id` int(11) NOT NULL,
  `l1` decimal(5,2) DEFAULT 0.00,
  `g1` decimal(5,2) DEFAULT 0.00,
  `l2` decimal(5,2) DEFAULT 0.00,
  `g2` decimal(5,2) DEFAULT 0.00,
  `l3` decimal(5,2) DEFAULT 0.00,
  `g3` decimal(5,2) DEFAULT 0.00,
  `l4` decimal(5,2) DEFAULT 0.00,
  `g4` decimal(5,2) DEFAULT 0.00,
  `l5` decimal(5,2) DEFAULT 0.00,
  `g5` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sa_scores`
--

INSERT INTO `sa_scores` (`score_id`, `sa_id`, `learner_id`, `l1`, `g1`, `l2`, `g2`, `l3`, `g3`, `l4`, `g4`, `l5`, `g5`) VALUES
(26, 1, 2, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00),
(27, 1, 1, 4.00, 4.00, 4.00, 6.00, 4.00, 5.00, 5.00, 6.00, 5.00, 6.00),
(28, 1, 3, 4.00, 5.00, 5.00, 2.00, 5.00, 6.00, 7.00, 6.00, 8.00, 6.00),
(29, 1, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 1, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `streams`
--

CREATE TABLE `streams` (
  `stream_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `stream_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `streams`
--

INSERT INTO `streams` (`stream_id`, `class_id`, `stream_name`) VALUES
(1, 1, 'S3 A'),
(2, 1, 'S3 C'),
(3, 2, 'S4 Blu'),
(5, 1, 's3 c'),
(6, 8, 'A'),
(7, 9, 'A'),
(8, 10, 'ARTS');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `subject_code` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `subject_name`, `subject_code`) VALUES
(1, 'Physics', 'PHY'),
(2, 'Mathematic', 'MTC'),
(3, 'Chemistry', 'CHE'),
(5, 'ict', 'ICT'),
(6, 'biology', 'BIO');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`) VALUES
(1, 'active_term', '2'),
(2, 'active_year', '2026'),
(3, 'active_competencies', '1,2,4');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_assignments`
--

CREATE TABLE `teacher_assignments` (
  `assignment_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `stream_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teacher_assignments`
--

INSERT INTO `teacher_assignments` (`assignment_id`, `teacher_id`, `stream_id`, `subject_id`) VALUES
(1, 2, 1, 1),
(2, 2, 3, 1),
(3, 3, 1, 3),
(4, 2, 1, 2),
(5, 4, 7, 5),
(6, 2, 2, 3),
(7, 3, 7, 6);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','teacher') DEFAULT 'teacher',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'System Administrator', 'super@school.com', '$2y$10$u9BdvSTwU8zc0.jSzCt6vuSYOTHnyjTelHKWXVCNmLUBx4JtMkccG', 'admin', '2026-05-17 07:11:37'),
(2, 'Joram Bwambale', 'teacher@school.com', '$2y$10$u9BdvSTwU8zc0.jSzCt6vuSYOTHnyjTelHKWXVCNmLUBx4JtMkccG', 'teacher', '2026-05-17 07:11:37'),
(3, 'Jane Smith', 'jane@school.com', '$2y$10$u9BdvSTwU8zc0.jSzCt6vuSYOTHnyjTelHKWXVCNmLUBx4JtMkccG', 'teacher', '2026-05-17 07:11:37'),
(4, 'timothy kiyingi', 'timo@entebbe', '$2y$10$8vnCz/3/NFfZtADNc3vLgeSA68aKeQumyYrqe924fIJ7teC6MIvGa', 'teacher', '2026-05-17 13:19:27');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `aoi_assessments`
--
ALTER TABLE `aoi_assessments`
  ADD PRIMARY KEY (`aoi_id`),
  ADD UNIQUE KEY `unique_code` (`unique_code`),
  ADD KEY `stream_id` (`stream_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `aoi_scores`
--
ALTER TABLE `aoi_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD KEY `aoi_id` (`aoi_id`),
  ADD KEY `learner_id` (`learner_id`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`record_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `learner_id` (`learner_id`);

--
-- Indexes for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `stream_id` (`stream_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`);

--
-- Indexes for table `learners`
--
ALTER TABLE `learners`
  ADD PRIMARY KEY (`learner_id`),
  ADD UNIQUE KEY `admission_number` (`admission_number`),
  ADD KEY `stream_id` (`stream_id`);

--
-- Indexes for table `project_scores`
--
ALTER TABLE `project_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD KEY `learner_id` (`learner_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `sa_assessments`
--
ALTER TABLE `sa_assessments`
  ADD PRIMARY KEY (`sa_id`),
  ADD KEY `stream_id` (`stream_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `sa_scores`
--
ALTER TABLE `sa_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD KEY `sa_id` (`sa_id`),
  ADD KEY `learner_id` (`learner_id`);

--
-- Indexes for table `streams`
--
ALTER TABLE `streams`
  ADD PRIMARY KEY (`stream_id`),
  ADD KEY `class_id` (`class_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD UNIQUE KEY `subject_code` (`subject_code`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `stream_id` (`stream_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `aoi_assessments`
--
ALTER TABLE `aoi_assessments`
  MODIFY `aoi_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `aoi_scores`
--
ALTER TABLE `aoi_scores`
  MODIFY `score_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `record_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `learners`
--
ALTER TABLE `learners`
  MODIFY `learner_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `project_scores`
--
ALTER TABLE `project_scores`
  MODIFY `score_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `sa_assessments`
--
ALTER TABLE `sa_assessments`
  MODIFY `sa_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sa_scores`
--
ALTER TABLE `sa_scores`
  MODIFY `score_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `streams`
--
ALTER TABLE `streams`
  MODIFY `stream_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `aoi_assessments`
--
ALTER TABLE `aoi_assessments`
  ADD CONSTRAINT `aoi_assessments_ibfk_1` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`stream_id`),
  ADD CONSTRAINT `aoi_assessments_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`);

--
-- Constraints for table `aoi_scores`
--
ALTER TABLE `aoi_scores`
  ADD CONSTRAINT `aoi_scores_ibfk_1` FOREIGN KEY (`aoi_id`) REFERENCES `aoi_assessments` (`aoi_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `aoi_scores_ibfk_2` FOREIGN KEY (`learner_id`) REFERENCES `learners` (`learner_id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `attendance_records_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`session_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_records_ibfk_2` FOREIGN KEY (`learner_id`) REFERENCES `learners` (`learner_id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD CONSTRAINT `attendance_sessions_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `attendance_sessions_ibfk_2` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`stream_id`),
  ADD CONSTRAINT `attendance_sessions_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`);

--
-- Constraints for table `learners`
--
ALTER TABLE `learners`
  ADD CONSTRAINT `learners_ibfk_1` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`stream_id`);

--
-- Constraints for table `project_scores`
--
ALTER TABLE `project_scores`
  ADD CONSTRAINT `project_scores_ibfk_1` FOREIGN KEY (`learner_id`) REFERENCES `learners` (`learner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_scores_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `sa_assessments`
--
ALTER TABLE `sa_assessments`
  ADD CONSTRAINT `sa_assessments_ibfk_1` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`stream_id`),
  ADD CONSTRAINT `sa_assessments_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`);

--
-- Constraints for table `sa_scores`
--
ALTER TABLE `sa_scores`
  ADD CONSTRAINT `sa_scores_ibfk_1` FOREIGN KEY (`sa_id`) REFERENCES `sa_assessments` (`sa_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sa_scores_ibfk_2` FOREIGN KEY (`learner_id`) REFERENCES `learners` (`learner_id`) ON DELETE CASCADE;

--
-- Constraints for table `streams`
--
ALTER TABLE `streams`
  ADD CONSTRAINT `streams_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  ADD CONSTRAINT `teacher_assignments_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacher_assignments_ibfk_2` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`stream_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacher_assignments_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
