<?php
require_once 'config.php';
requireAuth();

$teacher_id = $_SESSION['user_id'];

// ==========================================
// HANDLE MATRIX READ REQUESTS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stream_id = $_GET['stream_id'] ?? 0;
    $subject_id = $_GET['subject_id'] ?? 0;

    try {
        $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
        $settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
        $term = (int)($settings['active_term'] ?? 2);
        $year = $settings['active_year'] ?? '2026';

        $stmtSession = $pdo->prepare("SELECT sa_id, total_box FROM sa_assessments WHERE stream_id = ? AND subject_id = ? AND term = ? AND academic_year = ?");
        $stmtSession->execute([$stream_id, $subject_id, $term, $year]);
        $sessionRow = $stmtSession->fetch();

        $sa_id = $sessionRow ? $sessionRow['sa_id'] : null;
        $total_box = $sessionRow ? $sessionRow['total_box'] : 10.00; // Default fallback to match database specification

        $learners = [];
        if ($sa_id) {
            $sql = "SELECT l.learner_id, l.admission_number, l.full_name, 
                           s.l1, s.g1, s.l2, s.g2, s.l3, s.g3, s.l4, s.g4, s.l5, s.g5
                    FROM learners l
                    LEFT JOIN sa_scores s ON l.learner_id = s.learner_id AND s.sa_id = ?
                    WHERE l.stream_id = ? ORDER BY l.full_name ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$sa_id, $stream_id]);
            $learners = $stmt->fetchAll();
        } else {
            $sql = "SELECT learner_id, admission_number, full_name, 
                           NULL as l1, NULL as g1, NULL as l2, NULL as g2, NULL as l3, 
                           NULL as g3, NULL as l4, NULL as g4, NULL as l5, NULL as g5
                    FROM learners WHERE stream_id = ? ORDER BY full_name ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$stream_id]);
            $learners = $stmt->fetchAll();
        }

        jsonResponse(true, "SA Matrix configuration ready", [
            'sa_id' => $sa_id ? (int)$sa_id : null,
            'total_box' => (float)$total_box,
            'learners' => $learners
        ]);

    } catch (Exception $e) {
        error_log("SA Read Error: " . $e->getMessage());
        jsonResponse(false, "API spreadsheet processing exception logged.");
    }
}

// ==========================================
// HANDLE MATRIX UPSERT BATCH COMMITS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $stream_id = $data['stream_id'] ?? null;
    $subject_id = $data['subject_id'] ?? null;
    $sa_id = $data['sa_id'] ?? null;
    $total_box = $data['total_box'] ?? 10.00;
    $records = $data['records'] ?? [];

    try {
        $pdo->beginTransaction();

        if (!$sa_id) {
            $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
            $settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
            $term = (int)($settings['active_term'] ?? 2);
            $year = $settings['active_year'] ?? '2026';

            $stmtBuildSession = $pdo->prepare("INSERT INTO sa_assessments (stream_id, subject_id, teacher_id, term, academic_year, total_box) VALUES (?, ?, ?, ?, ?, ?)");
            $stmtBuildSession->execute([$stream_id, $subject_id, $teacher_id, $term, $year, $total_box]);
            $sa_id = $pdo->lastInsertId();
        } else {
            // Update the existing assessment row's total box if the teacher changed it
            $stmtUpdateSession = $pdo->prepare("UPDATE sa_assessments SET total_box = ? WHERE sa_id = ?");
            $stmtUpdateSession->execute([$total_box, $sa_id]);
        }

        $stmtWipe = $pdo->prepare("DELETE FROM sa_scores WHERE sa_id = ?");
        $stmtWipe->execute([$sa_id]);

        $sqlInsert = "INSERT INTO sa_scores (sa_id, learner_id, l1, g1, l2, g2, l3, g3, l4, g4, l5, g5) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtInsert = $pdo->prepare($sqlInsert);

        foreach ($records as $r) {
            $stmtInsert->execute([
                $sa_id, $r['learner_id'],
                $r['l1'], $r['g1'], $r['l2'], $r['g2'], $r['l3'], $r['g3'], $r['l4'], $r['g4'], $r['l5'], $r['g5']
            ]);
        }

        $pdo->commit();
        jsonResponse(true, "SA Matrix records written cleanly.");

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("SA Post Error: " . $e->getMessage());
        jsonResponse(false, "Batch transaction failure registered on master pipe.");
    }
}
?>