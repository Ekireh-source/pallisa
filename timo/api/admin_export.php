<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    die("Unauthorized access.");
}

$action = $_GET['action'] ?? 'download';
$type = $_GET['type'] ?? '';
$stream_id = (int)($_GET['stream_id'] ?? 0);
$subject_id = (int)($_GET['subject_id'] ?? 0);

if (!$type || !$stream_id) {
    if ($action === 'preview') { jsonResponse(false, "Missing required parameters."); } 
    else { die("Invalid export parameters."); }
}

$isProject = strpos($type, 'project_') === 0;

// For projects, we don't need a subject. If it's AOI/SA, we strictly require it.
if (!$isProject && !$subject_id) {
    if ($action === 'preview') { jsonResponse(false, "Subject is required for this report type."); } 
    else { die("Subject is required for this report type."); }
}

// 1. Determine active term constraints
$stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
$settingsList = $stmtSettings->fetchAll(PDO::FETCH_ASSOC);
$settings = [];
foreach($settingsList as $row) { $settings[$row['setting_key']] = $row['setting_value']; }
$term = (int)($settings['active_term'] ?? 2);
$year = $settings['active_year'] ?? '2026';

// 2. Fetch specific names for the Official Document Title Headers
$stmtName = $pdo->prepare("SELECT CONCAT(c.class_name, ' ', s.stream_name) as str_name FROM streams s JOIN classes c ON s.class_id = c.class_id WHERE s.stream_id = ?");
$stmtName->execute([$stream_id]);
$streamName = $stmtName->fetchColumn();

$subjectName = 'N/A (Project Wide)';
if (!$isProject) {
    $stmtSub = $pdo->prepare("SELECT subject_name FROM subjects WHERE subject_id = ?");
    $stmtSub->execute([$subject_id]);
    $subjectName = $stmtSub->fetchColumn();
}

$headers = [];
$rows = [];

// ----------------------------------------------------
// THE AOI EXPORT ENGINE
// ----------------------------------------------------
if ($type === 'aoi') {
    $headers = ['Admission No.', 'Learner Name', 'Average AOI Score (%)'];
    
    $sql = "SELECT l.admission_number, l.full_name, AVG((s.score_entered / a.max_mark) * 100) as avg_score
            FROM learners l
            LEFT JOIN aoi_scores s ON l.learner_id = s.learner_id
            LEFT JOIN aoi_assessments a ON s.aoi_id = a.aoi_id AND a.term = ? AND a.academic_year = ? AND a.subject_id = ?
            WHERE l.stream_id = ?
            GROUP BY l.learner_id
            ORDER BY l.full_name ASC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$term, $year, $subject_id, $stream_id]);
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $avg = $row['avg_score'] !== null ? round((float)$row['avg_score'], 1) : '-';
        $rows[] = [$row['admission_number'], $row['full_name'], $avg];
    }
}

// ----------------------------------------------------
// THE SA GRID EXPORT ENGINE
// ----------------------------------------------------
elseif ($type === 'sa') {
    $headers = ['Admission No.', 'Learner Name', 'L1', 'G1', 'L2', 'G2', 'L3', 'G3', 'L4', 'G4', 'L5', 'G5', 'Total Accumulation', 'Final SA Rate (%)'];
    
    $sql = "SELECT l.admission_number, l.full_name, s.l1, s.g1, s.l2, s.g2, s.l3, s.g3, s.l4, s.g4, s.l5, s.g5, a.total_box
            FROM learners l
            LEFT JOIN sa_scores s ON l.learner_id = s.learner_id
            LEFT JOIN sa_assessments a ON s.sa_id = a.sa_id AND a.term = ? AND a.academic_year = ? AND a.subject_id = ?
            WHERE l.stream_id = ?
            ORDER BY l.full_name ASC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$term, $year, $subject_id, $stream_id]);
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $rawScore = ($row['l1']??0) + ($row['g1']??0) + ($row['l2']??0) + ($row['g2']??0) + ($row['l3']??0) + ($row['g3']??0) + ($row['l4']??0) + ($row['g4']??0) + ($row['l5']??0) + ($row['g5']??0);
        $totalBox = (float)($row['total_box'] ?? 0);
        $percentage = ($totalBox > 0) ? round(($rawScore / $totalBox) * 100, 1) : '-';
        
        $rows[] = [
            $row['admission_number'], $row['full_name'], 
            $row['l1'], $row['g1'], $row['l2'], $row['g2'], $row['l3'], $row['g3'], $row['l4'], $row['g4'], $row['l5'], $row['g5'], 
            $rawScore, $percentage
        ];
    }
}

// ----------------------------------------------------
// THE PROJECT EXPORT ENGINE (Subject Independent)
// ----------------------------------------------------
elseif ($isProject) {
    $compNum = (int)str_replace('project_', '', $type);
    
    $headers = ['Admission No.', 'Learner Name'];
    $maxScore = 0; $minCol = 1; $maxCol = 1;
    
    if ($compNum === 1) { $minCol=1; $maxCol=14; $maxScore=56; }
    if ($compNum === 2) { $minCol=1; $maxCol=3;  $maxScore=11; }
    if ($compNum === 3) { $minCol=1; $maxCol=6;  $maxScore=25; }
    if ($compNum === 4) { $minCol=1; $maxCol=2;  $maxScore=12; }
    
    for($i = $minCol; $i <= $maxCol; $i++) { $headers[] = "$compNum.$i"; }
    $headers[] = 'Mathematical Total';
    $headers[] = 'Final Project Percentage (%)';
    
    // Fetch Roster
    $learners = $pdo->query("SELECT learner_id, admission_number, full_name FROM learners WHERE stream_id = $stream_id ORDER BY full_name ASC")->fetchAll(PDO::FETCH_ASSOC);
    
    // Fetch all project scores for this stream, IGNORING subject_id
    $scoresStmt = $pdo->prepare("
        SELECT p.learner_id, p.sub_criteria, p.score 
        FROM project_scores p
        JOIN learners l ON p.learner_id = l.learner_id
        WHERE l.stream_id = ? AND p.term = ? AND p.academic_year = ? AND p.competency_number = ?
    ");
    $scoresStmt->execute([$stream_id, $term, $year, $compNum]);
    $scoresData = $scoresStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $scoresMap = [];
    foreach($scoresData as $r) {
        $scoresMap[$r['learner_id']][$r['sub_criteria']] = (float)$r['score'];
    }
    
    foreach($learners as $l) {
        $l_id = $l['learner_id'];
        $rowOut = [$l['admission_number'], $l['full_name']];
        $total = 0;
        
        for($i = $minCol; $i <= $maxCol; $i++) {
            $key = "$compNum.$i";
            $rawVal = $scoresMap[$l_id][$key] ?? 0;
            
            // THE SPECIFIC RULE FOR BOX 1.8
            if ($key === '1.8') {
                if ($rawVal <= 2) { $calcVal = 2; }
                elseif ($rawVal >= 3 && $rawVal <= 5) { $calcVal = 1; }
                else { $calcVal = 2; }
                $total += $calcVal;
                $rowOut[] = $rawVal; 
            } else {
                $total += $rawVal;
                $rowOut[] = $rawVal;
            }
        }
        
        $perc = ($total / $maxScore) * 100;
        $rowOut[] = $total;
        $rowOut[] = round($perc, 1);
        
        $rows[] = $rowOut;
    }
}

// ----------------------------------------------------
// RESPONSE ROUTING
// ----------------------------------------------------
if ($action === 'preview') {
    jsonResponse(true, "Data compiled", ['headers' => $headers, 'rows' => $rows]);
} else {
    // Execute the CSV Download
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=Academic_Export_' . strtoupper($type) . '_' . date('Y-m-d') . '.csv');
    $output = fopen('php://output', 'w');
    
    fputcsv($output, ["SCHOOL EXPORT REPORT"]);
    fputcsv($output, ["Stream: $streamName", "Term: $term", "Year: $year", "Subject: $subjectName"]);
    fputcsv($output, []); // Spacer
    fputcsv($output, $headers);
    foreach($rows as $r) { fputcsv($output, $r); }
    
    fclose($output);
    exit();
}
?>