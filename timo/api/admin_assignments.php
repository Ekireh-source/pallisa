<?php
require_once 'config.php';
requireAuth();

if ($_SESSION['role'] !== 'admin') {
    jsonResponse(false, "Access Denied.", null, 403);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_all') {
        try {
            $stmtTeachers = $pdo->query("SELECT user_id, full_name FROM users WHERE role = 'teacher' ORDER BY full_name ASC");
            $teachers = $stmtTeachers->fetchAll(PDO::FETCH_ASSOC);

            // FIX: Added subject_code to the SQL query so the Export dropdown populates correctly
            $stmtSubjects = $pdo->query("SELECT subject_id, subject_name, subject_code FROM subjects ORDER BY subject_name ASC");
            $subjects = $stmtSubjects->fetchAll(PDO::FETCH_ASSOC);

            $stmtStreams = $pdo->query("
                SELECT s.stream_id, s.stream_name, c.class_name 
                FROM streams s 
                JOIN classes c ON s.class_id = c.class_id 
                ORDER BY c.class_name ASC, s.stream_name ASC
            ");
            $streams = $stmtStreams->fetchAll(PDO::FETCH_ASSOC);

            $sqlAssignments = "
                SELECT 
                    ta.assignment_id, 
                    ta.teacher_id,
                    ta.subject_id,
                    ta.stream_id,
                    u.full_name as teacher_name, 
                    sub.subject_name, 
                    sub.subject_code, 
                    st.stream_name, 
                    c.class_name 
                FROM teacher_assignments ta 
                JOIN users u ON ta.teacher_id = u.user_id 
                JOIN subjects sub ON ta.subject_id = sub.subject_id 
                JOIN streams st ON ta.stream_id = st.stream_id 
                JOIN classes c ON st.class_id = c.class_id 
                ORDER BY u.full_name ASC
            ";
            $stmtAssignments = $pdo->query($sqlAssignments);
            $assignments = $stmtAssignments->fetchAll(PDO::FETCH_ASSOC);

            jsonResponse(true, "Allocations data retrieved.", [
                'teachers' => $teachers,
                'subjects' => $subjects,
                'streams' => $streams,
                'assignments' => $assignments
            ]);

        } catch (Exception $e) {
            jsonResponse(false, "Failed to retrieve allocation data models.");
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'add_assignment') {
        $teacher_id = (int)($data['teacher_id'] ?? 0);
        $subject_id = (int)($data['subject_id'] ?? 0);
        $stream_id = (int)($data['stream_id'] ?? 0);
        
        if (!$teacher_id || !$subject_id || !$stream_id) jsonResponse(false, "Teacher, Subject, and Stream must all be selected.");

        try {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM teacher_assignments WHERE teacher_id = ? AND subject_id = ? AND stream_id = ?");
            $stmtCheck->execute([$teacher_id, $subject_id, $stream_id]);
            if ($stmtCheck->fetchColumn() > 0) jsonResponse(false, "This specific workload assignment already exists.");

            $stmt = $pdo->prepare("INSERT INTO teacher_assignments (teacher_id, stream_id, subject_id) VALUES (?, ?, ?)");
            $stmt->execute([$teacher_id, $stream_id, $subject_id]);
            jsonResponse(true, "Workload assignment linked successfully.");
        } catch (Exception $e) {
            jsonResponse(false, "Database exception: Could not create assignment.");
        }
    }

    if ($action === 'edit_assignment') {
        $assignment_id = (int)($data['assignment_id'] ?? 0);
        $teacher_id = (int)($data['teacher_id'] ?? 0);
        $subject_id = (int)($data['subject_id'] ?? 0);
        $stream_id = (int)($data['stream_id'] ?? 0);
        
        if (!$assignment_id || !$teacher_id || !$subject_id || !$stream_id) jsonResponse(false, "All fields are required.");

        try {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM teacher_assignments WHERE teacher_id = ? AND subject_id = ? AND stream_id = ? AND assignment_id != ?");
            $stmtCheck->execute([$teacher_id, $subject_id, $stream_id, $assignment_id]);
            if ($stmtCheck->fetchColumn() > 0) {
                jsonResponse(false, "This workload is already assigned exactly like this in another record.");
            }

            $stmt = $pdo->prepare("UPDATE teacher_assignments SET teacher_id = ?, subject_id = ?, stream_id = ? WHERE assignment_id = ?");
            $stmt->execute([$teacher_id, $subject_id, $stream_id, $assignment_id]);
            jsonResponse(true, "Assignment updated successfully.");
        } catch (Exception $e) {
            jsonResponse(false, "Database exception: Could not update assignment.");
        }
    }

    if ($action === 'delete_assignment') {
        $assignment_id = (int)($data['assignment_id'] ?? 0);
        if (!$assignment_id) jsonResponse(false, "Cannot identify target assignment.");

        try {
            $stmt = $pdo->prepare("DELETE FROM teacher_assignments WHERE assignment_id = ?");
            $stmt->execute([$assignment_id]);
            jsonResponse(true, "Assignment revoked successfully.");
        } catch (Exception $e) {
            jsonResponse(false, "Could not revoke assignment.");
        }
    }
}
?>