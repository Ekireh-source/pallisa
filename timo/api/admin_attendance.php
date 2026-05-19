<?php
require_once 'config.php';
requireAuth();

if ($_SESSION['role'] !== 'admin') {
    jsonResponse(false, "Access Denied.", null, 403);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_analytics') {
        try {
            // 1. Fetch current active Term and Year
            $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
            $settingsList = $stmtSettings->fetchAll(PDO::FETCH_ASSOC);
            $settings = [];
            foreach($settingsList as $row) { $settings[$row['setting_key']] = $row['setting_value']; }
            
            $activeTerm = (int)($settings['active_term'] ?? 2);
            $activeYear = $settings['active_year'] ?? '2026';

            // 2. Fetch Learner-level Details
            $sqlDetails = "
                SELECT 
                    l.learner_id, 
                    l.full_name, 
                    l.admission_number, 
                    CONCAT(c.class_name, ' ', st.stream_name) as stream_full,
                    COUNT(r.record_id) as total_lessons,
                    SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) as present_count,
                    SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                    GROUP_CONCAT(DISTINCT sub.subject_name) as subjects_list
                FROM learners l
                JOIN streams st ON l.stream_id = st.stream_id
                JOIN classes c ON st.class_id = c.class_id
                LEFT JOIN attendance_records r ON l.learner_id = r.learner_id
                LEFT JOIN attendance_sessions s ON r.session_id = s.session_id AND s.term = ? AND s.academic_year = ?
                LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
                GROUP BY l.learner_id
                ORDER BY stream_full ASC, l.full_name ASC
            ";
            $stmtDetails = $pdo->prepare($sqlDetails);
            $stmtDetails->execute([$activeTerm, $activeYear]);
            $learnersRaw = $stmtDetails->fetchAll(PDO::FETCH_ASSOC);

            // Process Data for Frontend & KPI Aggregation
            $learners = [];
            $streams = [];
            $subjects = [];
            
            $schoolTotalLessons = 0;
            $schoolTotalPresent = 0;
            
            $streamStats = [];

            foreach ($learnersRaw as $row) {
                $total = (int)$row['total_lessons'];
                $present = (int)$row['present_count'];
                $absent = (int)$row['absent_count'];
                $rate = $total > 0 ? round(($present / $total) * 100, 1) : 100.0;

                // Aggregate for KPIs
                $schoolTotalLessons += $total;
                $schoolTotalPresent += $present;
                
                $streamName = $row['stream_full'];
                if (!isset($streamStats[$streamName])) {
                    $streamStats[$streamName] = ['total' => 0, 'present' => 0];
                }
                $streamStats[$streamName]['total'] += $total;
                $streamStats[$streamName]['present'] += $present;

                // Unique filter lists
                if (!in_array($streamName, $streams)) $streams[] = $streamName;
                if ($row['subjects_list']) {
                    $subs = explode(',', $row['subjects_list']);
                    foreach($subs as $sub) { if (!in_array($sub, $subjects)) $subjects[] = $sub; }
                }

                $learners[] = [
                    'learner_id' => $row['learner_id'],
                    'full_name' => $row['full_name'],
                    'admission_number' => $row['admission_number'],
                    'stream_full' => $streamName,
                    'total_lessons' => $total,
                    'present' => $present,
                    'absent' => $absent,
                    'attendance_rate' => $rate,
                    'subjects_list' => $row['subjects_list'] ?? ''
                ];
            }

            // Calculate KPIs
            $globalRate = $schoolTotalLessons > 0 ? round(($schoolTotalPresent / $schoolTotalLessons) * 100, 1) : 0;
            
            // Fetch raw total sessions conducted by teachers
            $stmtSess = $pdo->prepare("SELECT COUNT(*) FROM attendance_sessions WHERE term = ? AND academic_year = ?");
            $stmtSess->execute([$activeTerm, $activeYear]);
            $totalSessionLogs = (int)$stmtSess->fetchColumn();

            // Find Best and Worst Streams
            $bestStream = ''; $bestRate = -1;
            $worstStream = ''; $worstRate = 101;

            foreach ($streamStats as $name => $counts) {
                if ($counts['total'] > 0) {
                    $r = round(($counts['present'] / $counts['total']) * 100, 1);
                    if ($r > $bestRate) { $bestRate = $r; $bestStream = $name; }
                    if ($r < $worstRate) { $worstRate = $r; $worstStream = $name; }
                }
            }

            jsonResponse(true, "Analytics compiled.", [
                'term' => $activeTerm,
                'year' => $activeYear,
                'kpis' => [
                    'global_rate' => $globalRate,
                    'total_sessions' => $totalSessionLogs,
                    'best_stream' => $bestStream,
                    'best_rate' => $bestRate,
                    'worst_stream' => $worstStream,
                    'worst_rate' => $worstRate
                ],
                'filters' => [
                    'streams' => $streams,
                    'subjects' => $subjects
                ],
                'learners' => $learners
            ]);

        } catch (Exception $e) {
            jsonResponse(false, "Failed to compile attendance analytics.");
        }
    }
}
?>