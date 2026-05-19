<?php
require_once 'config.php';
requireAuth();

$teacher_id = $_SESSION['user_id'];

// ==========================================
// HANDLE GET REQUESTS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    // 1. Fetch AOIs with dynamic completion statuses
    if ($action === 'get_aois') {
        try {
            $stream_id = $_GET['stream_id'] ?? 0;
            $subject_id = $_GET['subject_id'] ?? 0;
            
            // Fixed typo here: changed fetchCount() to fetchColumn()
            $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM learners WHERE stream_id = ?");
            $stmtCount->execute([$stream_id]);
            $total_learners = (int)$stmtCount->fetchColumn();

            $sql = "SELECT a.*, 
                    (SELECT COUNT(*) FROM aoi_scores WHERE aoi_id = a.aoi_id) as scores_entered
                    FROM aoi_assessments a 
                    WHERE a.stream_id = ? AND a.subject_id = ? 
                    ORDER BY a.aoi_id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$stream_id, $subject_id]);
            $aois = $stmt->fetchAll();
            
            $processed_aois = [];
            foreach ($aois as $aoi) {
                $entered = (int)$aoi['scores_entered'];
                if ($entered === 0) {
                    $status = 'empty';
                } elseif ($entered < $total_learners) {
                    $status = 'partial';
                } else {
                    $status = 'completed';
                }
                $aoi['status'] = $status;
                $aoi['total_learners'] = $total_learners;
                $processed_aois[] = $aoi;
            }
            jsonResponse(true, "AOIs loaded", $processed_aois);
        } catch (Exception $e) {
            jsonResponse(false, "Database error: " . $e->getMessage());
        }
    }

    // 2. Fetch Learners AND their existing scores for this specific AOI
    if ($action === 'get_roster') {
        try {
            $stream_id = $_GET['stream_id'] ?? 0;
            $aoi_id = $_GET['aoi_id'] ?? 0;
            
            $sql = "SELECT l.learner_id, l.admission_number, l.full_name, s.score_entered 
                    FROM learners l 
                    LEFT JOIN aoi_scores s ON l.learner_id = s.learner_id AND s.aoi_id = ?
                    WHERE l.stream_id = ? ORDER BY l.full_name ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$aoi_id, $stream_id]);
            $roster = $stmt->fetchAll();
            
            jsonResponse(true, "Roster loaded", $roster);
        } catch (Exception $e) {
            jsonResponse(false, "Database error: " . $e->getMessage());
        }
    }
}

// ==========================================
// HANDLE POST REQUESTS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $action = $data['action'] ?? '';

    // Create a new Activity of Integration
    if ($action === 'create_aoi') {
        try {
            $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
            $settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
            
            $term = (int)($settings['active_term'] ?? 1);
            $year = (int)($settings['active_year'] ?? date('Y'));

            $sql = "INSERT INTO aoi_assessments (stream_id, subject_id, teacher_id, term, academic_year, aoi_name, unique_code, max_mark) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['stream_id'], $data['subject_id'], $teacher_id, 
                $term, $year, 
                sanitize($data['aoi_name']), sanitize($data['unique_code']), $data['max_mark']
            ]);
            jsonResponse(true, "AOI Created");
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                jsonResponse(false, "That Unique Code already exists.");
            }
            jsonResponse(false, "Database error.");
        }
    }

    // Adjust Max Marks
    if ($action === 'update_max_mark') {
        $aoi_id = $data['aoi_id'] ?? null;
        $max_mark = $data['max_mark'] ?? null;

        if (!$aoi_id || !$max_mark || $max_mark <= 0) {
            jsonResponse(false, "Invalid parameters provided.");
        }

        try {
            $stmt = $pdo->prepare("UPDATE aoi_assessments SET max_mark = ? WHERE aoi_id = ?");
            $stmt->execute([$max_mark, $aoi_id]);
            jsonResponse(true, "Max mark updated successfully.");
        } catch (Exception $e) {
            jsonResponse(false, "Failed to update max mark database field.");
        }
    }

    // Save Scores
    if ($action === 'save_scores') {
        $aoi_id = $data['aoi_id'] ?? null;
        $records = $data['records'] ?? [];

        if (!$aoi_id) jsonResponse(false, "Missing AOI ID");

        try {
            $pdo->beginTransaction();

            $stmtDelete = $pdo->prepare("DELETE FROM aoi_scores WHERE aoi_id = ?");
            $stmtDelete->execute([$aoi_id]);

            if (!empty($records)) {
                $stmtInsert = $pdo->prepare("INSERT INTO aoi_scores (aoi_id, learner_id, score_entered) VALUES (?, ?, ?)");
                foreach ($records as $record) {
                    $stmtInsert->execute([$aoi_id, $record['learner_id'], $record['score']]);
                }
            }

            $pdo->commit();
            jsonResponse(true, "Scores saved successfully.");
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(false, "Failed to save scores.");
        }
    }
}
?>