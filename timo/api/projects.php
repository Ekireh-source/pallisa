<?php
require_once 'config.php';
requireAuth();

$teacher_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stream_id = (int)($_GET['stream_id'] ?? 0);
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    $competency_number = (int)($_GET['competency_number'] ?? 1);

    try {
        // Query global terms configurations metrics parameters 
        $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
        $settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
        $term = (int)($settings['active_term'] ?? 2);
        $year = $settings['active_year'] ?? '2026';
        
        // ADMIN CONFIG LAYER: Extract comma separated permissions lists variables mapping parameters strings sets
        $rawCompString = $settings['active_competencies'] ?? '1,2,3,4';
        // Convert '1,3' string structure cleanly into an array [1, 3]
        $active_competencies_array = array_map('intval', explode(',', $rawCompString));

        // 1. Grab all learners in this stream roster lists lines blocks
        $sqlLearners = "SELECT learner_id, admission_number, full_name FROM learners WHERE stream_id = ? ORDER BY full_name ASC";
        $stmtL = $pdo->prepare($sqlLearners);
        $stmtL->execute([$stream_id]);
        $learners = $stmtL->fetchAll();

        // 2. Fetch existing score matrices lines cells maps
        $sqlScores = "SELECT learner_id, sub_criteria, score FROM project_scores 
                      WHERE subject_id = ? AND term = ? AND academic_year = ? AND competency_number = ?";
        $stmtS = $pdo->prepare($sqlScores);
        $stmtS->execute([$subject_id, $term, $year, $competency_number]);
        $scoresRows = $stmtS->fetchAll();

        $scoresMap = [];
        foreach ($scoresRows as $row) {
            $l_id = $row['learner_id'];
            $criteria = $row['sub_criteria'];
            if (!isset($scoresMap[$l_id])) {
                $scoresMap[$l_id] = [];
            }
            $scoresMap[$l_id][$criteria] = (float)$row['score'];
        }

        $processedLearners = [];
        foreach ($learners as $l) {
            $l_id = $l['learner_id'];
            $l['scores'] = isset($scoresMap[$l_id]) ? $scoresMap[$l_id] : (object)[];
            $processedLearners[] = $l;
        }

        // Pass along the filtered admin competency allowances back across the pipe
        jsonResponse(true, "Project matrix load complete", [
            'active_competencies' => $active_competencies_array,
            'learners' => $processedLearners
        ]);

    } catch (Exception $e) {
        error_log("Project Get Exception: " . $e->getMessage());
        jsonResponse(false, "API exception occurred while reading project scores matrix.");
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $subject_id = isset($data['subject_id']) ? (int)$data['subject_id'] : null;
    $competency_number = isset($data['competency_number']) ? (int)$data['competency_number'] : null;
    $records = $data['records'] ?? [];

    try {
        $pdo->beginTransaction();

        $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
        $settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
        $term = (int)($settings['active_term'] ?? 2);
        $year = $settings['active_year'] ?? '2026';

        // Secure wipe boundaries protection layer pass: safely clears cell structures matching current active competency
        if ($competency_number) {
            $stmtWipe = $pdo->prepare("DELETE FROM project_scores WHERE subject_id = ? AND term = ? AND academic_year = ? AND competency_number = ?");
            $stmtWipe->execute([$subject_id, $term, $year, $competency_number]);
        } else {
            // Fallback safety filter validation step case if bulk saving records package arrays cleanly across sets
            $stmtWipe = $pdo->prepare("DELETE FROM project_scores WHERE subject_id = ? AND term = ? AND academic_year = ?");
            $stmtWipe->execute([$subject_id, $term, $year]);
        }

        if (!empty($records)) {
            $sqlInsert = "INSERT INTO project_scores (learner_id, subject_id, term, academic_year, competency_number, sub_criteria, score) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmtInsert = $pdo->prepare($sqlInsert);

            foreach ($records as $r) {
                $stmtInsert->execute([
                    (int)$r['learner_id'],
                    $subject_id,
                    $term,
                    $year,
                    (int)$r['competency_number'],
                    sanitize($r['sub_criteria']),
                    $r['score']
                ]);
            }
        }

        $pdo->commit();
        jsonResponse(true, "Project evaluation matrix records fully written.");

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Project Post Exception: " . $e->getMessage());
        jsonResponse(false, "Batch database upsert exception logged on transaction pipe.");
    }
}
?>