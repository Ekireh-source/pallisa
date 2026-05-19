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
            $stmt = $pdo->query("SELECT subject_id, subject_name, subject_code FROM subjects ORDER BY subject_name ASC");
            $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(true, "Subjects loaded.", $subjects);
        } catch (Exception $e) {
            jsonResponse(false, "Failed to retrieve subjects registry.");
        }
    }
}

// ==========================================
// HANDLE POST ACTIONS (Creates, Edits, Deletes)
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'add_subject') {
        $name = sanitize($data['subject_name'] ?? '');
        $code = sanitize($data['subject_code'] ?? '');
        
        if (empty($name) || empty($code)) jsonResponse(false, "Name and code are required.");

        try {
            // Check for duplicate subject code
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM subjects WHERE subject_code = ?");
            $stmtCheck->execute([$code]);
            if ($stmtCheck->fetchColumn() > 0) {
                jsonResponse(false, "Subject code '$code' is already in use.");
            }

            $stmt = $pdo->prepare("INSERT INTO subjects (subject_name, subject_code) VALUES (?, ?)");
            $stmt->execute([$name, $code]);
            jsonResponse(true, "Subject registered successfully.");
        } catch (Exception $e) {
            jsonResponse(false, "Database exception: Could not create subject.");
        }
    }

    if ($action === 'edit_subject') {
        $id = (int)($data['subject_id'] ?? 0);
        $name = sanitize($data['subject_name'] ?? '');
        $code = sanitize($data['subject_code'] ?? '');
        
        if (!$id || empty($name) || empty($code)) jsonResponse(false, "Missing data.");

        try {
            // Ensure the new code isn't being used by a DIFFERENT subject
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM subjects WHERE subject_code = ? AND subject_id != ?");
            $stmtCheck->execute([$code, $id]);
            if ($stmtCheck->fetchColumn() > 0) {
                jsonResponse(false, "Subject code '$code' belongs to another subject.");
            }

            $stmt = $pdo->prepare("UPDATE subjects SET subject_name = ?, subject_code = ? WHERE subject_id = ?");
            $stmt->execute([$name, $code, $id]);
            jsonResponse(true, "Subject updated successfully.");
        } catch (Exception $e) {
            jsonResponse(false, "Database exception: Could not update subject.");
        }
    }

    if ($action === 'delete_subject') {
        $id = (int)($data['subject_id'] ?? 0);
        if (!$id) jsonResponse(false, "Cannot identify target subject.");

        try {
            // Note: If a subject has existing assessment rows without ON DELETE CASCADE, 
            // the database will throw a foreign key constraint violation. This acts as a natural safeguard.
            $stmt = $pdo->prepare("DELETE FROM subjects WHERE subject_id = ?");
            $stmt->execute([$id]);
            jsonResponse(true, "Subject permanently deleted.");
        } catch (PDOException $e) {
            // Catch Foreign Key Constraint errors beautifully
            if ($e->getCode() == '23000') {
                jsonResponse(false, "Cannot delete: This subject has existing scores, assessments, or assignments tied to it.");
            }
            jsonResponse(false, "Could not delete subject.");
        }
    }
}
?>