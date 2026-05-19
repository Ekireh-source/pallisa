<?php
require_once 'config.php';
requireAuth();

$teacher_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stream_id = (int)($_GET['stream_id'] ?? 0);
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    $custom_date = $_GET['custom_date'] ?? null;

    try {
        $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
        $settings = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
        $term = (int)($settings['active_term'] ?? 2);
        $year = $settings['active_year'] ?? '2026';

        // ==========================================
        // 1. COMPUTE ATTENDANCE ANALYTICS BY TIMEFRAMES
        // ==========================================
        $timeframes = [
            'day'  => "AND s.session_date = CURRENT_DATE()",
            'week' => "AND s.session_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)",
            'term' => "" 
        ];

        // If a custom calendar request query filter parameter comes in, process it specifically
        if ($custom_date) {
            $timeframes['custom'] = "AND s.session_date = " . $pdo->quote($custom_date);
        }

        $attendance_payload = [];

        foreach ($timeframes as $key => $dateCondition) {
            $sqlAtt = "SELECT 
                        COUNT(r.record_id) as total_records,
                        SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) as total_absent,
                        COUNT(DISTINCT s.session_id) as total_sessions
                       FROM attendance_sessions s
                       LEFT JOIN attendance_records r ON s.session_id = r.session_id
                       WHERE s.stream_id = ? AND s.subject_id = ? $dateCondition";
            
            $stmtA = $pdo->prepare($sqlAtt);
            $stmtA->execute([$stream_id, $subject_id]);
            $attRes = $stmtA->fetch();

            $attendance_payload[$key] = [
                'total_records'  => (int)$attRes['total_records'],
                'total_absent'   => (int)$attRes['total_absent'],
                'total_sessions' => (int)$attRes['total_sessions']
            ];
        }

        // ==========================================
        // 2. COMPUTE AOI PERFORMANCE ANALYTICS
        // ==========================================
        $sqlAoiList = "SELECT aoi_id, aoi_name, unique_code, max_mark FROM aoi_assessments 
                       WHERE stream_id = ? AND subject_id = ? AND term = ? AND academic_year = ?";
        $stmtAoi = $pdo->prepare($sqlAoiList);
        $stmtAoi->execute([$stream_id, $subject_id, $term, $year]);
        $activities = $stmtAoi->fetchAll();

        $processed_activities = [];
        $aoi_sum_percentages = 0;
        $activities_count = count($activities);

        foreach ($activities as $act) {
            $stmtAvg = $pdo->prepare("SELECT AVG(score_entered) FROM aoi_scores WHERE aoi_id = ?");
            $stmtAvg->execute([$act['aoi_id']]);
            $class_avg_raw = $stmtAvg->fetchColumn();

            $class_avg_percentage = 0;
            if ($class_avg_raw !== null && $act['max_mark'] > 0) {
                $class_avg_percentage = round(((float)$class_avg_raw / (float)$act['max_mark']) * 100, 1);
            }

            $aoi_sum_percentages += $class_avg_percentage;
            $act['class_average'] = $class_avg_percentage;
            $processed_activities[] = $act;
        }

        $overall_aoi_average = $activities_count > 0 ? round($aoi_sum_percentages / $activities_count, 1) : 0.0;

        // ==========================================
        // 3. COMPUTE SA PERFORMANCE ANALYTICS
        // ==========================================
        $stmtSaRow = $pdo->prepare("SELECT sa_id, total_box FROM sa_assessments WHERE stream_id = ? AND subject_id = ? AND term = ? AND academic_year = ?");
        $stmtSaRow->execute([$stream_id, $subject_id, $term, $year]);
        $saRow = $stmtSaRow->fetch();

        $sa_percentage_agg = 0.0;

        if ($saRow) {
            $sa_id = $saRow['sa_id'];
            $total_box = (float)$saRow['total_box'];

            $sqlSaAvg = "SELECT 
                            AVG(IFNULL(l1,0)+IFNULL(l2,0)+IFNULL(l3,0)+IFNULL(l4,0)+IFNULL(l5,0)+IFNULL(g1,0)+IFNULL(g2,0)+IFNULL(g3,0)+IFNULL(g4,0)+IFNULL(g5,0)) as flat_sum
                         FROM sa_scores WHERE sa_id = ?";
            $stmtSaAvg = $pdo->prepare($sqlSaAvg);
            $stmtSaAvg->execute([$sa_id]);
            $saAvgRes = $stmtSaAvg->fetch();

            if ($saAvgRes) {
                $flat_sum_avg = (float)$saAvgRes['flat_sum'];
                if ($total_box > 0) {
                    $sa_percentage_agg = round(($flat_sum_avg / $total_box) * 100, 1);
                }
            }
        }

        jsonResponse(true, "Analytical report prepared successfully.", [
            'meta' => ['term' => $term, 'year' => $year],
            'attendance' => $attendance_payload,
            'aoi' => [
                'activities_count' => $activities_count,
                'overall_class_average' => $overall_aoi_average,
                'activities' => $processed_activities
            ],
            'sa' => [
                'overall_percentage_average' => $sa_percentage_agg
            ]
        ]);

    } catch (Exception $e) {
        error_log("Analytics Engine Failure: " . $e->getMessage());
        jsonResponse(false, "Master metrics compile pipeline exception logged.");
    }
}
?>