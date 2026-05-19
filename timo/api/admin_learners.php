<?php
require_once 'config.php';
requireAuth();

if ($_SESSION['role'] !== 'admin') {
    jsonResponse(false, "Access Denied.", null, 403);
}

// ==========================================
// HANDLE READ TRANSFERS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_all') {
        try {
            // Fetch streams properly joined to class names for accurate identification
            $stmtStreams = $pdo->query("
                SELECT s.stream_id, s.stream_name, c.class_name 
                FROM streams s 
                JOIN classes c ON s.class_id = c.class_id 
                ORDER BY c.class_name ASC, s.stream_name ASC
            ");
            $streams = $stmtStreams->fetchAll(PDO::FETCH_ASSOC);

            // Fetch active learners 
            $stmtLearners = $pdo->query("
                SELECT l.learner_id, l.admission_number, l.full_name, l.stream_id, s.stream_name, c.class_name 
                FROM learners l 
                JOIN streams s ON l.stream_id = s.stream_id 
                JOIN classes c ON s.class_id = c.class_id 
                ORDER BY l.full_name ASC
            ");
            $learners = $stmtLearners->fetchAll(PDO::FETCH_ASSOC);

            jsonResponse(true, "Registry loaded.", [
                'streams' => $streams,
                'learners' => $learners
            ]);
        } catch (Exception $e) {
            jsonResponse(false, "Failed to retrieve learner registry.");
        }
    }
}

// ==========================================
// HANDLE POST ACTIONS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    // SINGLE CREATE
    if ($action === 'add_learner') {
        $name = sanitize($data['full_name'] ?? '');
        $lin = sanitize($data['admission_number'] ?? '');
        $stream_id = (int)($data['stream_id'] ?? 0);
        
        if (empty($name) || empty($lin) || !$stream_id) jsonResponse(false, "All fields required.");

        try {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM learners WHERE admission_number = ?");
            $stmtCheck->execute([$lin]);
            if ($stmtCheck->fetchColumn() > 0) jsonResponse(false, "LIN '$lin' already exists.");

            $stmt = $pdo->prepare("INSERT INTO learners (stream_id, admission_number, full_name) VALUES (?, ?, ?)");
            $stmt->execute([$stream_id, $lin, $name]);
            jsonResponse(true, "Learner registered successfully.");
        } catch (Exception $e) { jsonResponse(false, "Could not register learner."); }
    }

    // SINGLE EDIT
    if ($action === 'edit_learner') {
        $id = (int)($data['learner_id'] ?? 0);
        $name = sanitize($data['full_name'] ?? '');
        $lin = sanitize($data['admission_number'] ?? '');
        $stream_id = (int)($data['stream_id'] ?? 0);
        
        if (!$id || empty($name) || empty($lin) || !$stream_id) jsonResponse(false, "All fields required.");

        try {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM learners WHERE admission_number = ? AND learner_id != ?");
            $stmtCheck->execute([$lin, $id]);
            if ($stmtCheck->fetchColumn() > 0) jsonResponse(false, "LIN '$lin' belongs to another learner.");

            $stmt = $pdo->prepare("UPDATE learners SET stream_id = ?, admission_number = ?, full_name = ? WHERE learner_id = ?");
            $stmt->execute([$stream_id, $lin, $name, $id]);
            jsonResponse(true, "Profile updated successfully.");
        } catch (Exception $e) { jsonResponse(false, "Could not update profile."); }
    }

    // SINGLE DELETE
    if ($action === 'delete_learner') {
        $id = (int)($data['learner_id'] ?? 0);
        if (!$id) jsonResponse(false, "Cannot identify learner.");
        try {
            // Will automatically purge scores because of ON DELETE CASCADE
            $stmt = $pdo->prepare("DELETE FROM learners WHERE learner_id = ?");
            $stmt->execute([$id]);
            jsonResponse(true, "Learner and records purged safely.");
        } catch (Exception $e) { jsonResponse(false, "Could not delete learner."); }
    }

    // BULK IMPORT
    if ($action === 'bulk_import') {
        $learnersArray = $data['learners'] ?? [];
        if (empty($learnersArray)) jsonResponse(false, "No valid data received.");

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO learners (stream_id, admission_number, full_name) VALUES (?, ?, ?)");
            
            $inserted = 0;
            foreach ($learnersArray as $l) {
                // Failsafe in backend: we skip duplicates explicitly here just in case frontend missed it
                $stmtCheck = $pdo->prepare("SELECT learner_id FROM learners WHERE admission_number = ?");
                $stmtCheck->execute([$l['admission_number']]);
                if ($stmtCheck->fetchColumn()) continue;

                $stmt->execute([$l['stream_id'], $l['admission_number'], $l['full_name']]);
                $inserted++;
            }
            
            $pdo->commit();
            jsonResponse(true, "Bulk import completed. Successfully registered $inserted new learners.");
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(false, "Database crash during bulk operation. Changes reverted.");
        }
    }
}
?>