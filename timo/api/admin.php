<?php
require_once 'config.php';
requireAuth();

if ($_SESSION['role'] !== 'admin') {
    jsonResponse(false, "Access denied. Administrative privileges required.", null, 403);
}

// ---------------------------------------------------------
// FAULT TOLERANCE: Auto-create the settings table if missing
// ---------------------------------------------------------
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL
    )");
} catch (Exception $e) {
    // Failsafe catch
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_dashboard') {
        
        // 1. Fetch live settings safely
        $settings = [];
        try {
            $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
            while ($row = $stmtSettings->fetch(PDO::FETCH_ASSOC)) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
        } catch (Exception $e) {}

        $activeTerm = (int)($settings['active_term'] ?? 2);
        $activeYear = $settings['active_year'] ?? '2026';

        // 2. Structural Tally (Wrapped in individual safe blocks)
        $teachersCount = 0;
        try { 
            // Checks users table first, falls back to teachers table if schema differs
            $teachersCount = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'teacher'")->fetchColumn(); 
        } catch(Exception $e) {
            try { $teachersCount = (int)$pdo->query("SELECT COUNT(*) FROM teachers")->fetchColumn(); } catch(Exception $e2) {}
        }

        $learnersCount = 0;
        try { $learnersCount = (int)$pdo->query("SELECT COUNT(*) FROM learners")->fetchColumn(); } catch(Exception $e) {}

        $streamsCount = 0;
        try { $streamsCount = (int)$pdo->query("SELECT COUNT(*) FROM streams")->fetchColumn(); } catch(Exception $e) {}

        // 3. PERFORMANCE METRIC: Global Attendance Rate
        $global_attendance = 0;
        try {
            $sqlAtt = "SELECT COUNT(r.record_id) as total_recs, SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) as present_recs 
                       FROM attendance_records r 
                       JOIN attendance_sessions s ON r.session_id = s.session_id 
                       WHERE s.term = ? AND s.academic_year = ?";
            $stmtAtt = $pdo->prepare($sqlAtt);
            $stmtAtt->execute([$activeTerm, $activeYear]);
            $attRow = $stmtAtt->fetch();
            if ($attRow && $attRow['total_recs'] > 0) {
                $global_attendance = round(($attRow['present_recs'] / $attRow['total_recs']) * 100, 1);
            }
        } catch(Exception $e) {}

        // 4. PERFORMANCE METRIC: Global Subject Achievement Average
        $global_sa = 0;
        try {
            $sqlSA = "SELECT AVG((IFNULL(l1,0)+IFNULL(l2,0)+IFNULL(l3,0)+IFNULL(l4,0)+IFNULL(l5,0)+IFNULL(g1,0)+IFNULL(g2,0)+IFNULL(g3,0)+IFNULL(g4,0)+IFNULL(g5,0)) / NULLIF(a.total_box, 0) * 100) 
                      FROM sa_scores s 
                      JOIN sa_assessments a ON s.sa_id = a.sa_id 
                      WHERE a.term = ? AND a.academic_year = ?";
            $stmtSA = $pdo->prepare($sqlSA);
            $stmtSA->execute([$activeTerm, $activeYear]);
            $saRaw = $stmtSA->fetchColumn();
            if ($saRaw !== null) {
                $global_sa = round((float)$saRaw, 1);
            }
        } catch(Exception $e) {}

        // 5. PERFORMANCE METRIC: Project Activity Log Count
        $project_logs = 0;
        try {
            $sqlProj = "SELECT COUNT(*) FROM project_scores WHERE term = ? AND academic_year = ?";
            $stmtProj = $pdo->prepare($sqlProj);
            $stmtProj->execute([$activeTerm, $activeYear]);
            $project_logs = (int)$stmtProj->fetchColumn();
        } catch(Exception $e) {}

        jsonResponse(true, "Admin dashboard compiled.", [
            'stats' => [
                'total_teachers' => $teachersCount,
                'total_learners' => $learnersCount,
                'total_streams' => $streamsCount,
                'global_attendance' => $global_attendance,
                'global_sa' => $global_sa,
                'project_logs' => $project_logs
            ],
            'settings' => $settings
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $term = $data['active_term'] ?? null;
    $year = $data['active_year'] ?? null;
    $competencies = $data['active_competencies'] ?? '1';

    if (!$term || !$year) {
        jsonResponse(false, "Term and Year parameters are required.");
    }

    try {
        $pdo->beginTransaction();

        $settingsToSave = [
            'active_term' => $term,
            'active_year' => $year,
            'active_competencies' => $competencies
        ];

        // Safe Upsert Logic: Manually check then update/insert to prevent Primary Key errors
        foreach ($settingsToSave as $key => $value) {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM system_settings WHERE setting_key = ?");
            $stmtCheck->execute([$key]);
            
            if ($stmtCheck->fetchColumn() > 0) {
                $stmtUpdate = $pdo->prepare("UPDATE system_settings SET setting_value = ? WHERE setting_key = ?");
                $stmtUpdate->execute([$value, $key]);
            } else {
                $stmtInsert = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)");
                $stmtInsert->execute([$key, $value]);
            }
        }

        $pdo->commit();
        jsonResponse(true, "System settings globally synced.");
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(false, "Database error saving settings: " . $e->getMessage());
    }
}
?>