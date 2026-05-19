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
            $stmt = $pdo->query("SELECT user_id, full_name, email FROM users WHERE role = 'teacher' ORDER BY full_name ASC");
            $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(true, "Teachers loaded.", $teachers);
        } catch (Exception $e) {
            jsonResponse(false, "Failed to retrieve faculty registry.");
        }
    }
}

// ==========================================
// HANDLE POST ACTIONS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    // REGISTER NEW TEACHER
    if ($action === 'add_teacher') {
        $name = sanitize($data['full_name'] ?? '');
        $email = sanitize($data['email'] ?? '');
        
        if (empty($name) || empty($email)) jsonResponse(false, "Name and email are required.");

        try {
            // Check for duplicate email
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
            $stmtCheck->execute([$email]);
            if ($stmtCheck->fetchColumn() > 0) {
                jsonResponse(false, "The email '$email' is already registered.");
            }

            // Securely hash the default password
            $defaultPasswordHash = password_hash('teacher123', PASSWORD_DEFAULT);

            $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'teacher')");
            $stmt->execute([$name, $email, $defaultPasswordHash]);
            jsonResponse(true, "Teacher registered successfully. They can login with 'teacher123'.");
        } catch (Exception $e) {
            jsonResponse(false, "Database exception: Could not register teacher.");
        }
    }

    // UPDATE EXISTING TEACHER
    if ($action === 'edit_teacher') {
        $id = (int)($data['user_id'] ?? 0);
        $name = sanitize($data['full_name'] ?? '');
        $email = sanitize($data['email'] ?? '');
        
        if (!$id || empty($name) || empty($email)) jsonResponse(false, "Missing data.");

        try {
            // Ensure email isn't stolen from someone else
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ? AND user_id != ?");
            $stmtCheck->execute([$email, $id]);
            if ($stmtCheck->fetchColumn() > 0) {
                jsonResponse(false, "The email '$email' belongs to another account.");
            }

            $stmt = $pdo->prepare("UPDATE users SET full_name = ?, email = ? WHERE user_id = ? AND role = 'teacher'");
            $stmt->execute([$name, $email, $id]);
            jsonResponse(true, "Profile updated successfully.");
        } catch (Exception $e) {
            jsonResponse(false, "Database exception: Could not update profile.");
        }
    }

    // DELETE TEACHER SAFELY
    if ($action === 'delete_teacher') {
        $id = (int)($data['user_id'] ?? 0);
        if (!$id) jsonResponse(false, "Cannot identify target teacher.");

        try {
            // Execute deletion
            // Note: teacher_assignments table has ON DELETE CASCADE, so allocations will wipe cleanly.
            $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = ? AND role = 'teacher'");
            $stmt->execute([$id]);
            jsonResponse(true, "Teacher access revoked permanently.");
        } catch (PDOException $e) {
            // Safe Catch: If attendance_sessions lacks ON DELETE CASCADE, it throws a 23000 FK error.
            if ($e->getCode() == '23000') {
                jsonResponse(false, "Action Blocked: This teacher has recorded class attendance. You must reassign or clear their historical data first.");
            }
            jsonResponse(false, "Could not revoke access.");
        }
    }
}
?>