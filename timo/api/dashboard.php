<?php
require_once 'config.php';
requireAuth();

$teacher_id = $_SESSION['user_id'];

try {
    // 1. Fetch Global Active Term and Year from System Settings
    $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
    $settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $active_term = $settings['active_term'] ?? '1';
    $active_year = $settings['active_year'] ?? date('Y');

    // 2. Count streams assigned to this teacher
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT stream_id) FROM teacher_assignments WHERE teacher_id = ?");
    $stmt->execute([$teacher_id]);
    $classes_assigned = $stmt->fetchColumn();

    // 3. Create initials from full name
    $name_parts = explode(' ', $_SESSION['full_name']);
    $initials = strtoupper(substr($name_parts[0], 0, 1));
    if (isset($name_parts[1])) {
        $initials .= strtoupper(substr($name_parts[1], 0, 1));
    }

    // Pass the real active term metadata back to the frontend app
    jsonResponse(true, "Dashboard data loaded.", [
        "teacher_name" => $_SESSION['full_name'],
        "initials" => $initials,
        "classes_today" => $classes_assigned,
        "active_term" => "Term " . $active_term,
        "active_year" => $active_year
    ]);

} catch (PDOException $e) {
    error_log("Dashboard API Error: " . $e->getMessage());
    jsonResponse(false, "Failed to load dashboard data.", null, 500);
}
?>