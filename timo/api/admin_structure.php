<?php
require_once 'config.php';
requireAuth();

if ($_SESSION['role'] !== 'admin') {
    jsonResponse(false, "Access Denied.", null, 403);
}

// GET HIERARCHY
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_all') {
        try {
            $stmtClasses = $pdo->query("SELECT class_id, class_name FROM classes ORDER BY class_name ASC");
            $classes = $stmtClasses->fetchAll();

            $stmtStreams = $pdo->query("SELECT stream_id, class_id, stream_name FROM streams ORDER BY stream_name ASC");
            $allStreams = $stmtStreams->fetchAll();

            $streamsMap = [];
            foreach ($allStreams as $s) {
                $c_id = $s['class_id'];
                if (!isset($streamsMap[$c_id])) $streamsMap[$c_id] = [];
                $streamsMap[$c_id][] = $s;
            }

            $structuredData = [];
            foreach ($classes as $c) {
                $c['streams'] = $streamsMap[$c['class_id']] ?? [];
                $structuredData[] = $c;
            }
            jsonResponse(true, "Structure mapped.", $structuredData);
        } catch (Exception $e) {
            jsonResponse(false, "Failed to retrieve hierarchical structure map.");
        }
    }
}

// POST ACTIONS
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    // Create Operations
    if ($action === 'add_class') {
        $class_name = sanitize($data['class_name'] ?? '');
        if (empty($class_name)) jsonResponse(false, "Class name cannot be empty.");
        try {
            $stmt = $pdo->prepare("INSERT INTO classes (class_name) VALUES (?)");
            $stmt->execute([$class_name]);
            jsonResponse(true, "Class created successfully.");
        } catch (Exception $e) { jsonResponse(false, "Could not create class."); }
    }

    if ($action === 'add_stream') {
        $class_id = (int)($data['class_id'] ?? 0);
        $stream_name = sanitize($data['stream_name'] ?? '');
        if (!$class_id || empty($stream_name)) jsonResponse(false, "Parent class and stream name are required.");
        try {
            $stmt = $pdo->prepare("INSERT INTO streams (class_id, stream_name) VALUES (?, ?)");
            $stmt->execute([$class_id, $stream_name]);
            jsonResponse(true, "Stream attached successfully.");
        } catch (Exception $e) { jsonResponse(false, "Could not create stream."); }
    }

    // Edit Operations
    if ($action === 'edit_class') {
        $class_id = (int)($data['class_id'] ?? 0);
        $class_name = sanitize($data['class_name'] ?? '');
        if (!$class_id || empty($class_name)) jsonResponse(false, "Missing data.");
        try {
            $stmt = $pdo->prepare("UPDATE classes SET class_name = ? WHERE class_id = ?");
            $stmt->execute([$class_name, $class_id]);
            jsonResponse(true, "Class renamed successfully.");
        } catch (Exception $e) { jsonResponse(false, "Could not update class."); }
    }

    if ($action === 'edit_stream') {
        $stream_id = (int)($data['stream_id'] ?? 0);
        $stream_name = sanitize($data['stream_name'] ?? '');
        if (!$stream_id || empty($stream_name)) jsonResponse(false, "Missing data.");
        try {
            $stmt = $pdo->prepare("UPDATE streams SET stream_name = ? WHERE stream_id = ?");
            $stmt->execute([$stream_name, $stream_id]);
            jsonResponse(true, "Stream renamed successfully.");
        } catch (Exception $e) { jsonResponse(false, "Could not update stream."); }
    }

    // Delete Operations
    if ($action === 'delete_class') {
        $class_id = (int)($data['class_id'] ?? 0);
        if (!$class_id) jsonResponse(false, "System failure: Cannot identify target class.");
        try {
            $stmt = $pdo->prepare("DELETE FROM classes WHERE class_id = ?");
            $stmt->execute([$class_id]);
            jsonResponse(true, "Class and associated streams permanently deleted.");
        } catch (Exception $e) { jsonResponse(false, "Could not delete class."); }
    }

    if ($action === 'delete_stream') {
        $stream_id = (int)($data['stream_id'] ?? 0);
        if (!$stream_id) jsonResponse(false, "System failure: Cannot identify target stream.");
        try {
            $stmt = $pdo->prepare("DELETE FROM streams WHERE stream_id = ?");
            $stmt->execute([$stream_id]);
            jsonResponse(true, "Stream permanently deleted.");
        } catch (Exception $e) { jsonResponse(false, "Could not delete stream."); }
    }
}
?>