<?php
require_once 'config.php';
requireAuth();

$teacher_id = $_SESSION['user_id'];
$today = date('Y-m-d'); 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_streams') {
        try {
            $sql = "SELECT ta.stream_id, ta.subject_id, s.stream_name, sub.subject_name, sub.subject_code 
                    FROM teacher_assignments ta
                    JOIN streams s ON ta.stream_id = s.stream_id
                    JOIN subjects sub ON ta.subject_id = sub.subject_id
                    WHERE ta.teacher_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$teacher_id]);
            $streams = $stmt->fetchAll();
            jsonResponse(true, "Streams loaded", $streams);
        } catch (Exception $e) {
            jsonResponse(false, "Database error: " . $e->getMessage());
        }
    }

    if ($action === 'get_roster') {
        try {
            $stream_id = $_GET['stream_id'] ?? 0;
            $subject_id = $_GET['subject_id'] ?? 0;
            
            $stmt = $pdo->prepare("SELECT session_id FROM attendance_sessions WHERE teacher_id = ? AND stream_id = ? AND subject_id = ? AND session_date = ?");
            $stmt->execute([$teacher_id, $stream_id, $subject_id, $today]);
            $session_id = $stmt->fetchColumn();

            $is_edit = false;
            $roster = [];

            if ($session_id) {
                $is_edit = true;
                $sql = "SELECT l.learner_id, l.admission_number, l.full_name, ar.status 
                        FROM learners l 
                        LEFT JOIN attendance_records ar ON l.learner_id = ar.learner_id AND ar.session_id = ?
                        WHERE l.stream_id = ? ORDER BY l.full_name ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$session_id, $stream_id]);
                $roster = $stmt->fetchAll();
            } else {
                $sql = "SELECT learner_id, admission_number, full_name, 'present' as status 
                        FROM learners WHERE stream_id = ? ORDER BY full_name ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$stream_id]);
                $roster = $stmt->fetchAll();
            }
            
            jsonResponse(true, "Roster loaded", [
                'is_edit' => $is_edit, 
                'session_id' => $session_id, 
                'learners' => $roster
            ]);
        } catch (Exception $e) {
            jsonResponse(false, "Database error.");
        }
    }

    if ($action === 'get_student_history') {
        $learner_id = (int)($_GET['learner_id'] ?? 0);
        $subject_id = (int)($_GET['subject_id'] ?? 0);

        try {
            // Get current active term and year so history strictly applies to this term
            $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
            $settingsList = $stmtSettings->fetchAll(PDO::FETCH_ASSOC);
            $settings = [];
            foreach($settingsList as $row) { $settings[$row['setting_key']] = $row['setting_value']; }
            $term = (int)($settings['active_term'] ?? 2);
            $year = $settings['active_year'] ?? '2026';

            $stmtStream = $pdo->prepare("SELECT stream_id FROM learners WHERE learner_id = ?");
            $stmtStream->execute([$learner_id]);
            $stream_id = $stmtStream->fetchColumn();

            // Only count sessions for the active term!
            $stmtTotal = $pdo->prepare("SELECT COUNT(*) FROM attendance_sessions WHERE stream_id = ? AND subject_id = ? AND term = ? AND academic_year = ?");
            $stmtTotal->execute([$stream_id, $subject_id, $term, $year]);
            $total_classes = (int)$stmtTotal->fetchColumn();

            $stmtPresent = $pdo->prepare("SELECT COUNT(*) FROM attendance_records r 
                                          JOIN attendance_sessions s ON r.session_id = s.session_id 
                                          WHERE r.learner_id = ? AND s.subject_id = ? AND r.status = 'present' AND s.term = ? AND s.academic_year = ?");
            $stmtPresent->execute([$learner_id, $subject_id, $term, $year]);
            $attended_classes = (int)$stmtPresent->fetchColumn();

            $sqlAbsences = "SELECT s.session_date FROM attendance_records r 
                            JOIN attendance_sessions s ON r.session_id = s.session_id 
                            WHERE r.learner_id = ? AND s.subject_id = ? AND r.status = 'absent' AND s.term = ? AND s.academic_year = ?
                            ORDER BY s.session_date DESC";
            $stmtAbsences = $pdo->prepare($sqlAbsences);
            $stmtAbsences->execute([$learner_id, $subject_id, $term, $year]);
            $absence_dates = $stmtAbsences->fetchAll(PDO::FETCH_COLUMN);

            jsonResponse(true, "History analytics aggregated.", [
                'total_classes' => $total_classes,
                'attended_classes' => $attended_classes,
                'absence_dates' => $absence_dates
            ]);

        } catch (Exception $e) {
            jsonResponse(false, "Failed to compile background student aggregates metrics.");
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $stream_id = $data['stream_id'] ?? null;
    $subject_id = $data['subject_id'] ?? null;
    $session_id = $data['session_id'] ?? null;
    $records = $data['records'] ?? [];

    try {
        $pdo->beginTransaction();

        if ($session_id) {
            $stmtDelete = $pdo->prepare("DELETE FROM attendance_records WHERE session_id = ?");
            $stmtDelete->execute([$session_id]);
        } else {
            // Fetch global settings to stamp the attendance sheet with the active Term and Year
            $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
            $settingsList = $stmtSettings->fetchAll(PDO::FETCH_ASSOC);
            $settings = [];
            foreach($settingsList as $row) { $settings[$row['setting_key']] = $row['setting_value']; }
            $term = (int)($settings['active_term'] ?? 2);
            $year = $settings['active_year'] ?? '2026';

            // Now inserts the Term and Year correctly!
            $stmtSession = $pdo->prepare("INSERT INTO attendance_sessions (teacher_id, stream_id, subject_id, session_date, term, academic_year) VALUES (?, ?, ?, ?, ?, ?)");
            $stmtSession->execute([$teacher_id, $stream_id, $subject_id, $today, $term, $year]);
            $session_id = $pdo->lastInsertId();
        }

        $stmtRecord = $pdo->prepare("INSERT INTO attendance_records (session_id, learner_id, status) VALUES (?, ?, ?)");
        foreach ($records as $record) {
            $stmtRecord->execute([$session_id, $record['learner_id'], $record['status']]);
        }

        $pdo->commit();
        jsonResponse(true, "Attendance successfully saved.");
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(false, "Failed to save attendance records lines.");
    }
}
?>